import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'
import { BlackguardAsset } from '../assets/ImportedAssets.jsx'

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

function dampAngle(current, target, smoothing, delta) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * (1 - Math.exp(-smoothing * delta))
}

const ROLE_CONFIG = {
  striker: { color: '#ff405c', speed: 2.75, range: 2.75, damage: 12, cooldown: 1.35, chase: 30, telegraph: 0.48 },
  disc_guard: { color: '#ffb05c', speed: 1.8, range: 13.5, damage: 9, cooldown: 1.95, chase: 34, ranged: true, telegraph: 0.78 },
  defender: { color: '#a36cff', speed: 1.3, range: 3.15, damage: 17, cooldown: 2.05, chase: 25, telegraph: 0.72, unblockable: true },
  hunter: { color: '#ff7d38', speed: 2.55, range: 2.65, damage: 15, cooldown: 1.45, chase: 36, flank: true, telegraph: 0.38 },
  commander: { color: '#f4ee72', speed: 1.72, range: 11.5, damage: 16, cooldown: 1.72, chase: 40, ranged: true, commander: true, telegraph: 0.72 },
}

export default function EnemyUnit({ id, shadows }) {
  const enemy = useGameStore((state) => state.enemies.find((item) => item.id === id))
  const lockedTargetId = useGameStore((state) => state.lockOnTargetId)
  const bossPhase = useGameStore((state) => state.bossPhase)
  const root = useRef()
  const body = useRef()
  const leftWeapon = useRef()
  const rightWeapon = useRef()
  const eye = useRef()
  const aura = useRef()
  const attackRing = useRef()
  const attackMaterial = useRef()
  const observedHitSerial = useRef(0)
  const observedStaggerSerial = useRef(0)
  const observedResetNonce = useRef(0)
  const wasActive = useRef(false)
  const hitTimer = useRef(0)
  const staggerTimer = useRef(0)
  const deathTimer = useRef(0)
  const attackTimer = useRef(0.8 + Math.random())
  const telegraphTimer = useRef(0)
  const telegraphDuration = useRef(0.5)
  const pendingAttack = useRef(false)
  const pendingUnblockable = useRef(false)
  const attackCount = useRef(0)
  const [attackWarning, setAttackWarning] = useState(null)
  const positionUpdateTimer = useRef(0)
  const player = useRef(new THREE.Vector3())
  const targetDirection = useRef(new THREE.Vector3())
  const movementDirection = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())
  const corePush = useRef(new THREE.Vector3())
  const separation = useRef(new THREE.Vector3())
  const neighborOffset = useRef(new THREE.Vector3())
  const orbitSign = useRef([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2 === 0 ? 1 : -1)

  useFrame(({ clock }, delta) => {
    if (!root.current || !enemy) return
    const state = useGameStore.getState()
    const combatActive = state.gameMode === 'combat'
      || (state.gameMode === 'story' && state.storyStage === 2)
      || (state.gameMode === 'vertical' && state.verticalStage === 1)

    if (!combatActive || enemy.active === false) {
      root.current.visible = false
      wasActive.current = false
      if (pendingAttack.current) state.releaseAttackToken(id)
      pendingAttack.current = false
      pendingUnblockable.current = false
      setAttackWarning(null)
      return
    }

    if (!wasActive.current || observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      root.current.position.fromArray(enemy.spawnPosition)
      root.current.scale.setScalar(1)
      root.current.visible = true
      velocity.current.set(0, 0, 0)
      deathTimer.current = 0
      hitTimer.current = 0
      staggerTimer.current = 0
      pendingAttack.current = false
      pendingUnblockable.current = false
      attackCount.current = 0
      setAttackWarning(null)
      attackTimer.current = 0.65 + Math.random() * 0.8
      wasActive.current = true
    }

    if (observedHitSerial.current !== enemy.hitSerial) {
      observedHitSerial.current = enemy.hitSerial
      hitTimer.current = 0.24
      pendingAttack.current = false
      pendingUnblockable.current = false
      telegraphTimer.current = 0
      setAttackWarning(null)
      state.releaseAttackToken(id)
    }
    if (observedStaggerSerial.current !== enemy.staggerSerial) {
      observedStaggerSerial.current = enemy.staggerSerial
      staggerTimer.current = Math.max(staggerTimer.current, Math.max(0.25, ((enemy.staggerUntil || 0) - performance.now()) / 1000))
      pendingAttack.current = false
      pendingUnblockable.current = false
      setAttackWarning(null)
      state.releaseAttackToken(id)
    }

    hitTimer.current = Math.max(0, hitTimer.current - delta)
    staggerTimer.current = Math.max(0, staggerTimer.current - delta)

    if (!enemy.alive) {
      state.releaseAttackToken(id)
      deathTimer.current += delta
      root.current.rotation.y += delta * 6
      root.current.position.y += delta * 0.7
      root.current.scale.setScalar(Math.max(0.001, 1 - deathTimer.current * 2.05))
      if (deathTimer.current > 0.52) root.current.visible = false
      return
    }

    const baseConfig = ROLE_CONFIG[enemy.type] || ROLE_CONFIG.striker
    const bossPhase = state.bossPhase || 1
    const config = enemy.type === 'commander'
      ? {
          ...baseConfig,
          ...(bossPhase === 2
            ? { speed: 2.2, range: 6.4, damage: 19, cooldown: 1.32, telegraph: 0.58, ranged: false, flank: true, telegraphColor: '#ffd45e' }
            : bossPhase === 3
              ? { speed: 2.85, range: 3.55, damage: 23, cooldown: 1.02, telegraph: 0.44, ranged: false, flank: true, telegraphColor: '#ff355b' }
              : { telegraphColor: '#f4ee72' }),
        }
      : baseConfig
    const difficultySpeed = state.difficulty === 'explorer' ? 0.88 : state.difficulty === 'master' ? 1.12 : 1
    const difficultyTelegraph = state.difficulty === 'explorer' ? 1.32 : state.difficulty === 'master' ? 0.78 : 1
    const difficultyCooldown = state.difficulty === 'explorer' ? 1.18 : state.difficulty === 'master' ? 0.84 : 1
    const tactic = state.squadTactic || 'probe'
    const tacticSpeed = tactic === 'hunt' || tactic === 'overdrive' ? 1.16 : tactic === 'assault' ? 1.1 : tactic === 'suppress' && enemy.type === 'disc_guard' ? 0.92 : 1
    const time = clock.getElapsedTime()
    const attackProgress = pendingAttack.current
      ? THREE.MathUtils.clamp(1 - telegraphTimer.current / Math.max(0.001, telegraphDuration.current), 0, 1)
      : 0
    const stunned = staggerTimer.current > 0 || performance.now() < (enemy.staggerUntil || 0)
    const movingSpeed = Math.hypot(velocity.current.x, velocity.current.z)

    root.current.position.y = enemy.spawnPosition[1] + Math.sin(time * 2 + id.length) * 0.035
    if (body.current) {
      const recoil = hitTimer.current > 0 ? Math.sin((hitTimer.current / 0.24) * Math.PI) : 0
      body.current.position.y = damp(body.current.position.y, movingSpeed > 0.4 ? Math.abs(Math.sin(time * 7)) * 0.035 : 0, 9, delta)
      body.current.position.z = damp(body.current.position.z, -recoil * 0.12 + attackProgress * 0.08, 11, delta)
      body.current.rotation.x = damp(body.current.rotation.x, stunned ? 0.28 : pendingAttack.current ? -0.18 * attackProgress : movingSpeed > 0.5 ? -0.06 : 0, 10, delta)
      body.current.rotation.z = damp(body.current.rotation.z, stunned ? Math.sin(time * 18) * 0.12 : 0, 9, delta)
    }
    if (leftWeapon.current) {
      leftWeapon.current.rotation.x = damp(leftWeapon.current.rotation.x, pendingAttack.current ? -1.15 * attackProgress : -0.2, 11, delta)
      leftWeapon.current.rotation.z = damp(leftWeapon.current.rotation.z, config.ranged ? -0.45 : 0.28, 10, delta)
    }
    if (rightWeapon.current) {
      const strike = pendingAttack.current ? (config.ranged ? -1.1 : -1.75 * attackProgress) : -0.18
      rightWeapon.current.rotation.x = damp(rightWeapon.current.rotation.x, strike, 12, delta)
      rightWeapon.current.rotation.z = damp(rightWeapon.current.rotation.z, config.ranged ? 0.45 : -0.28, 10, delta)
    }
    if (aura.current) {
      aura.current.rotation.z += delta * (config.commander ? 1.8 : 0.7)
      const phasePulse = enemy.type === 'commander' ? 1 + (bossPhase - 1) * 0.08 : 1
      aura.current.scale.setScalar(config.commander ? phasePulse + Math.sin(time * (3 + bossPhase)) * 0.05 : 1)
    }
    if (eye.current) {
      eye.current.material.emissiveIntensity = hitTimer.current > 0 ? 8 : stunned ? 2.5 : pendingAttack.current ? 6.5 : 3.6
      eye.current.material.emissive.set(hitTimer.current > 0 ? '#ffffff' : config.color)
    }

    if (state.status !== 'running' || state.storyModal || performance.now() < state.hitStopUntil) return

    player.current.fromArray(state.playerPosition)
    targetDirection.current.copy(player.current).sub(root.current.position)
    targetDirection.current.y = 0
    const distance = targetDirection.current.length()
    if (distance > 0.001) targetDirection.current.normalize()

    movementDirection.current.copy(targetDirection.current)
    const tangentX = -targetDirection.current.z * orbitSign.current
    const tangentZ = targetDirection.current.x * orbitSign.current
    if (tactic === 'surround' && !config.ranged && distance < 16) {
      movementDirection.current.set(tangentX, 0, tangentZ).addScaledVector(targetDirection.current, 0.18).normalize()
    } else if (tactic === 'suppress') {
      if (enemy.type === 'disc_guard' || config.ranged) {
        if (distance < 9) movementDirection.current.multiplyScalar(-1)
        else if (distance < 14.5) movementDirection.current.set(tangentX, 0, tangentZ)
      } else if (enemy.type === 'hunter') {
        movementDirection.current.set(tangentX, 0, tangentZ).addScaledVector(targetDirection.current, 0.2).normalize()
      } else {
        movementDirection.current.copy(targetDirection.current)
      }
    } else if (tactic === 'hunt' || tactic === 'assault' || tactic === 'overdrive') {
      movementDirection.current.copy(targetDirection.current)
      if (enemy.type === 'hunter') movementDirection.current.add(new THREE.Vector3(tangentX, 0, tangentZ).multiplyScalar(0.18)).normalize()
    } else if (config.ranged) {
      if (distance < 7.4) movementDirection.current.multiplyScalar(-1)
      else if (distance < 12.2) movementDirection.current.set(tangentX, 0, tangentZ)
    } else if (config.flank && distance < 14) {
      movementDirection.current.set(tangentX, 0, tangentZ)
        .addScaledVector(targetDirection.current, 0.28)
        .normalize()
    } else if (!state.attackTokens.includes(id) && distance < config.range + 2.4) {
      movementDirection.current.set(tangentX, 0, tangentZ)
    }

    separation.current.set(0, 0, 0)
    for (const other of state.enemies) {
      if (!other.alive || other.active === false || other.id === id) continue
      neighborOffset.current.set(root.current.position.x - other.position[0], 0, root.current.position.z - other.position[2])
      const distanceSq = neighborOffset.current.lengthSq()
      if (distanceSq > 0.001 && distanceSq < 10.2) {
        const neighborDistance = Math.sqrt(distanceSq)
        separation.current.addScaledVector(neighborOffset.current.normalize(), (3.2 - neighborDistance) / 3.2)
      }
    }
    if (separation.current.lengthSq() > 0.001) movementDirection.current.addScaledVector(separation.current, 1.08).normalize()

    const commanderAlive = state.enemies.some((item) => item.alive && item.type === 'commander' && item.id !== id)
    const formationBoost = commanderAlive ? 1.08 : 1
    const shouldMove = !stunned && distance < config.chase && !pendingAttack.current
      && (config.ranged ? distance < 7.4 || distance > 12.2 : distance > config.range - 0.25 || !state.attackTokens.includes(id))
    if (shouldMove) {
      velocity.current.x = damp(velocity.current.x, movementDirection.current.x * config.speed * formationBoost * difficultySpeed * tacticSpeed, 4.5, delta)
      velocity.current.z = damp(velocity.current.z, movementDirection.current.z * config.speed * formationBoost * difficultySpeed * tacticSpeed, 4.5, delta)
    } else {
      velocity.current.x = damp(velocity.current.x, 0, stunned ? 12 : 6.5, delta)
      velocity.current.z = damp(velocity.current.z, 0, stunned ? 12 : 6.5, delta)
    }

    root.current.position.x += velocity.current.x * delta
    root.current.position.z += velocity.current.z * delta

    const coreRadius = Math.hypot(root.current.position.x, root.current.position.z)
    if (coreRadius < 5.2) {
      corePush.current.set(root.current.position.x || 1, 0, root.current.position.z).normalize()
      root.current.position.addScaledVector(corePush.current, (5.2 - coreRadius) * 0.25)
    }

    if (distance > 0.1) {
      const targetRotation = Math.atan2(targetDirection.current.x, targetDirection.current.z)
      root.current.rotation.y = dampAngle(root.current.rotation.y, targetRotation, pendingAttack.current ? 10 : 6.5, delta)
    }

    if (!stunned) attackTimer.current -= delta
    if (!pendingAttack.current && !stunned && distance < config.range && attackTimer.current <= 0) {
      if (state.acquireAttackToken(id)) {
        pendingAttack.current = true
        attackCount.current += 1
        pendingUnblockable.current = Boolean(config.unblockable || (enemy.type === 'commander' && bossPhase === 3 && attackCount.current % 3 === 0))
        telegraphDuration.current = config.telegraph * difficultyTelegraph
        telegraphTimer.current = telegraphDuration.current
        setAttackWarning(pendingUnblockable.current ? 'DODGE' : config.telegraph <= 0.5 ? 'PARRY' : 'BLOCK / PARRY')
        if (attackRing.current) attackRing.current.scale.setScalar(config.ranged ? 1.35 : enemy.type === 'commander' ? 1.55 : 1.15)
      } else {
        attackTimer.current = 0.18 + Math.random() * 0.18
      }
    }

    if (pendingAttack.current) {
      telegraphTimer.current -= delta
      if (attackMaterial.current) {
        attackMaterial.current.opacity = 0.18 + attackProgress * 0.5 + Math.abs(Math.sin(time * 15)) * 0.12
        attackMaterial.current.color.set(pendingUnblockable.current ? '#ff2448' : config.telegraphColor || config.color)
      }
      if (enemy.type === 'commander' && bossPhase >= 2 && attackProgress > 0.52 && distance > 1.8) {
        root.current.position.addScaledVector(targetDirection.current, delta * (bossPhase === 3 ? 5.4 : 3.6))
      }
      if (telegraphTimer.current <= 0) {
        pendingAttack.current = false
        setAttackWarning(null)
        player.current.fromArray(state.playerPosition)
        const liveDistance = root.current.position.distanceTo(player.current)
        if (liveDistance < config.range + (config.ranged ? 2 : 0.65)) {
          const result = state.damagePlayer(config.damage, id, { unblockable: pendingUnblockable.current })
          if (result) {
            const variant = result === 'parried' ? 'cyan' : 'orange'
            state.spawnHitEffect([player.current.x, 1.25, player.current.z], variant)
          }
        } else {
          state.releaseAttackToken(id)
        }
        pendingUnblockable.current = false
        attackTimer.current = config.cooldown * difficultyCooldown * (commanderAlive ? 0.88 : 1) * (tactic === 'hunt' || tactic === 'overdrive' ? 0.84 : tactic === 'suppress' ? 0.94 : 1)
      }
    } else if (attackMaterial.current) {
      attackMaterial.current.opacity = damp(attackMaterial.current.opacity, 0, 9, delta)
    }

    if (attackRing.current) {
      const targetScale = pendingAttack.current ? (enemy.type === 'commander' ? 1.28 + bossPhase * 0.08 : 1) : 0.72
      const scale = damp(attackRing.current.scale.x, targetScale, 8, delta)
      attackRing.current.scale.setScalar(scale)
    }

    positionUpdateTimer.current += delta
    if (positionUpdateTimer.current > 0.12) {
      state.updateEnemyPosition(id, [root.current.position.x, enemy.spawnPosition[1], root.current.position.z])
      positionUpdateTimer.current = 0
    }
  })

  if (!enemy) return null
  const config = ROLE_CONFIG[enemy.type] || ROLE_CONFIG.striker
  const hpPercent = (enemy.hp / enemy.maxHp) * 100
  const accent = config.color
  const locked = lockedTargetId === id
  const showTag = locked || enemy.hp < enemy.maxHp || enemy.type === 'commander'

  return (
    <group ref={root} position={enemy.spawnPosition}>
      <group ref={body} position={[0, 0.02, 0]}>
        <BlackguardAsset shadows={shadows} accent={accent} hunter={enemy.type === 'hunter' || enemy.type === 'commander'} />
        <group ref={leftWeapon} position={[-0.34, 1.58, 0.12]}>
          <mesh position={[0, -0.34, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.56, 4, 7]} />
            <meshStandardMaterial color="#091015" emissive={accent} emissiveIntensity={0.7} metalness={0.72} roughness={0.25} />
          </mesh>
        </group>
        <group ref={rightWeapon} position={[0.34, 1.58, 0.12]}>
          <mesh position={[0, -0.34, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.56, 4, 7]} />
            <meshStandardMaterial color="#091015" emissive={accent} emissiveIntensity={1.1} metalness={0.72} roughness={0.25} />
          </mesh>
        </group>
      </group>

      <mesh ref={eye} position={[0, 1.62, 0.42]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={accent} emissiveIntensity={3.6} toneMapped={false} />
      </mesh>

      {(enemy.type === 'hunter' || enemy.type === 'commander') && (
        <mesh ref={aura} position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.76, 0.035, 6, 22]} />
          <meshBasicMaterial color={accent} transparent opacity={enemy.type === 'commander' ? 0.55 : 0.28} toneMapped={false} />
        </mesh>
      )}

      <mesh ref={attackRing} position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.82, 24]} />
        <meshBasicMaterial ref={attackMaterial} color={config.unblockable ? '#ff2448' : accent} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
      </mesh>

      {attackWarning && (
        <Html position={[0, 2.9, 0]} center distanceFactor={12} className="enemy-warning-wrapper">
          <div className={`enemy-warning ${attackWarning === 'DODGE' ? 'enemy-warning--danger' : ''}`}>
            {attackWarning}
          </div>
        </Html>
      )}

      {enemy.type === 'commander' && (
        <Html position={[0, 2.66, 0]} center distanceFactor={13} className="enemy-phase-wrapper">
          <div className={`enemy-phase enemy-phase--${bossPhase}`}>PHASE {bossPhase}</div>
        </Html>
      )}

      {locked && (
        <mesh position={[0, 2.25, 0]} rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.14, 0.2, 4]} />
          <meshBasicMaterial color="#7af7ff" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showTag && (
        <Html position={[0, 2.42, 0]} center distanceFactor={13} className="enemy-tag-wrapper">
          <div className={`enemy-tag enemy-tag--compact enemy-tag--${enemy.type} ${locked ? 'enemy-tag--locked' : ''}`}>
            <span>{enemy.label || enemy.type.toUpperCase()}</span>
            <div className="enemy-health-track">
              <div className="enemy-health-fill" style={{ width: `${hpPercent}%`, background: accent }} />
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
