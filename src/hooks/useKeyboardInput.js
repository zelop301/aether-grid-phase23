import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { playUi, unlockAudio } from '../audio/audioEngine.js'

const keyMap = {
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'backward', ArrowDown: 'backward',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
}

function combatEnabled(store) {
  return store.gameMode === 'combat'
    || (store.gameMode === 'story' && store.storyStage === 2)
    || (store.gameMode === 'vertical' && store.verticalStage === 1)
}

export function useKeyboardInput() {
  useEffect(() => {
    const updateKey = (event, active) => {
      const store = useGameStore.getState()
      const action = keyMap[event.code]
      if (active && event.repeat && ['KeyQ', 'Tab', 'Space', 'KeyF', 'KeyE', 'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI'].includes(event.code)) return
      if (active && event.code === 'Escape') {
        event.preventDefault()
        if (store.status === 'mission_complete' || store.status === 'game_over') return store.returnToProtocolSelect()
        if (['showcase', 'credits', 'capture'].includes(store.systemPanel)) { store.closeReleasePanel(); playUi('cancel'); return }
        if (store.systemPanel === 'settings') { store.closeSettings(); playUi('cancel'); return }
        if (store.systemPanel === 'photo') { store.exitPhotoMode(); playUi('cancel'); return }
        if (store.systemPanel === 'pause') { store.resumeGame(); playUi('confirm'); return }
        if (store.status === 'running') { store.togglePause(); playUi('cancel'); return }
      }
      if (active && event.code === 'KeyP' && store.gameMode) {
        event.preventDefault()
        if (store.systemPanel === 'photo') store.exitPhotoMode()
        else if (store.status === 'running' || store.systemPanel === 'pause') store.enterPhotoMode()
        playUi('confirm')
        return
      }
      if (active && event.code === 'KeyM') { store.togglePreference('muted'); return }
      if (active && event.code === 'KeyT' && store.gameMode === 'race' && store.status === 'running') {
        event.preventDefault()
        store.toggleAutopilot()
        playUi('confirm')
        return
      }
      if (event.code === 'KeyQ' && store.status === 'running' && combatEnabled(store)) {
        event.preventDefault()
        store.setBlockHeld(active)
        if (active) playUi('confirm')
        return
      }
      if (active && event.code === 'Tab' && store.status === 'running' && combatEnabled(store)) {
        event.preventDefault()
        store.toggleLockOn()
        playUi('confirm')
        return
      }
      if (event.code === 'Enter' && active && store.status === 'ready' && !store.systemPanel) {
        unlockAudio(); store.unlockAudio(); store.startProtocol('vertical'); return
      }
      if (active && (store.status === 'mission_complete' || store.status === 'game_over')) {
        if (event.code === 'KeyR' || event.code === 'Enter') store.restartMission()
        return
      }
      if (store.systemPanel || store.status === 'paused') return
      if (active && store.status === 'running' && ['story', 'vertical'].includes(store.gameMode)) {
        if (store.storyModal === 'hack' && /^Digit[1-4]$/.test(event.code)) { event.preventDefault(); store.submitHackNode(Number(event.code.slice(-1))); return }
        if ((store.storyModal === 'transmission' || store.storyModal === 'log') && event.code === 'Enter') { event.preventDefault(); store.interactWithStory(); return }
        if (!store.storyModal && event.code === 'KeyE' && combatEnabled(store)) { event.preventDefault(); store.performCombatContextAction(); return }
        if (!store.storyModal && event.code === 'KeyE') { event.preventDefault(); store.interactWithStory(); return }
      }
      if (active && store.status === 'running') {
        if (event.code === 'Digit1') store.setQuality('low')
        if (event.code === 'Digit2') store.setQuality('medium')
        if (event.code === 'Digit3') store.setQuality('high')
        const canFight = combatEnabled(store)
        if (canFight && event.code === 'KeyF') { event.preventDefault(); store.requestAttack(); return }
        if (canFight && event.code === 'Space') { event.preventDefault(); store.requestCombatAction('dodge'); return }
        if (canFight && event.code === 'KeyE') { event.preventDefault(); store.performCombatContextAction(); return }
        if (canFight && event.code === 'KeyJ') { event.preventDefault(); store.requestCombatAction('light'); return }
        if (canFight && event.code === 'KeyK') { event.preventDefault(); store.requestCombatAction('heavy'); return }
        if (canFight && event.code === 'KeyL') { event.preventDefault(); store.requestCombatAction('rapid'); return }
        if (canFight && event.code === 'KeyU') { event.preventDefault(); store.requestCombatAction('slam'); return }
        if (canFight && event.code === 'KeyI') { event.preventDefault(); store.requestCombatAction('nova'); return }
        if ((store.gameMode === 'race' || (store.gameMode === 'vertical' && store.verticalMounted)) && event.code === 'Space') { event.preventDefault(); store.setInput('drift', active); return }
      }
      if (!active && (store.gameMode === 'race' || (store.gameMode === 'vertical' && store.verticalMounted)) && event.code === 'Space') { event.preventDefault(); store.setInput('drift', false); return }
      if (!action || store.status !== 'running' || store.storyModal) return
      event.preventDefault(); store.setInput(action, active)
    }
    const keyDown = (event) => updateKey(event, true)
    const keyUp = (event) => updateKey(event, false)
    const pointerDown = (event) => {
      if (![0, 2].includes(event.button)) return
      if (event.target instanceof Element && event.target.closest('button')) return
      const store = useGameStore.getState()
      if (store.systemPanel || store.status !== 'running' || !combatEnabled(store)) return
      event.preventDefault()
      if (event.button === 0) store.requestCombatAction('light')
      if (event.button === 2) store.requestCombatAction('heavy')
    }
    const contextMenu = (event) => {
      const store = useGameStore.getState()
      if (combatEnabled(store) && store.status === 'running') event.preventDefault()
    }
    const wheel = (event) => {
      const store = useGameStore.getState()
      if (!combatEnabled(store) || store.status !== 'running' || !store.lockOnTargetId) return
      event.preventDefault()
      store.cycleLockOn(event.deltaY >= 0 ? 1 : -1)
    }
    window.addEventListener('keydown', keyDown, { passive: false })
    window.addEventListener('keyup', keyUp, { passive: false })
    window.addEventListener('pointerdown', pointerDown, { passive: false })
    window.addEventListener('contextmenu', contextMenu)
    window.addEventListener('wheel', wheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('contextmenu', contextMenu)
      window.removeEventListener('wheel', wheel)
    }
  }, [])
}
