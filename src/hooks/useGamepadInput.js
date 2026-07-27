import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore.js'

const DEAD_ZONE = 0.24

function pressed(button) {
  return Boolean(button?.pressed || (button?.value ?? 0) > 0.55)
}

function combatEnabled(state) {
  return state.gameMode === 'combat'
    || (state.gameMode === 'story' && state.storyStage === 2)
    || (state.gameMode === 'vertical' && state.verticalStage === 1)
}

export function useGamepadInput() {
  useEffect(() => {
    let frame = 0
    let lastTick = 0
    const previousButtons = new Array(18).fill(false)
    const previousInput = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      drift: false,
    }

    const setInputIfChanged = (state, key, value) => {
      if (previousInput[key] === value) return
      previousInput[key] = value
      state.setInput(key, value)
    }

    const edge = (buttons, index) => {
      const value = pressed(buttons[index])
      const activated = value && !previousButtons[index]
      previousButtons[index] = value
      return activated
    }

    const releaseMovement = () => {
      const state = useGameStore.getState()
      for (const key of Object.keys(previousInput)) {
        if (previousInput[key]) state.setInput(key, false)
        previousInput[key] = false
      }
      if (state.blockHeld) state.setBlockHeld(false)
    }

    const releaseAll = () => {
      releaseMovement()
      previousButtons.fill(false)
    }

    const update = (now) => {
      frame = requestAnimationFrame(update)
      if (now - lastTick < 16) return
      lastTick = now

      const gamepads = navigator.getGamepads?.() || []
      const pad = Array.from(gamepads).find(Boolean)
      if (!pad) {
        releaseAll()
        return
      }

      const state = useGameStore.getState()
      if (state.status !== 'running' || state.systemPanel) {
        releaseAll()
        return
      }

      const x = Math.abs(pad.axes[0] || 0) > DEAD_ZONE ? pad.axes[0] : 0
      const y = Math.abs(pad.axes[1] || 0) > DEAD_ZONE ? pad.axes[1] : 0
      const buttons = pad.buttons || []
      const active = Math.abs(x) > 0 || Math.abs(y) > 0 || buttons.some((button) => pressed(button))
      if (active && state.inputDevice !== 'gamepad') state.setInputDevice('gamepad')

      if (state.storyModal) {
        releaseMovement()
        if (state.storyModal === 'transmission' || state.storyModal === 'log') {
          const confirmA = edge(buttons, 0)
          const confirmB = edge(buttons, 1)
          if (confirmA || confirmB) state.interactWithStory()
        } else if (state.storyModal === 'hack') {
          if (edge(buttons, 0)) state.submitHackNode(1)
          if (edge(buttons, 1)) state.submitHackNode(2)
          if (edge(buttons, 2)) state.submitHackNode(3)
          if (edge(buttons, 3)) state.submitHackNode(4)
        } else if (state.storyModal === 'choice') {
          if (edge(buttons, 2)) state.chooseStoryEnding('stabilize')
          if (edge(buttons, 3)) state.chooseStoryEnding('liberate')
        }
        if (edge(buttons, 9)) state.togglePause()
        return
      }
      const vehicle = state.gameMode === 'race' || (state.gameMode === 'vertical' && state.verticalMounted)
      const fight = combatEnabled(state)

      if (vehicle) {
        const throttle = pressed(buttons[7]) || y < -DEAD_ZONE
        const brake = pressed(buttons[6]) || y > DEAD_ZONE
        setInputIfChanged(state, 'forward', throttle)
        setInputIfChanged(state, 'backward', brake)
        setInputIfChanged(state, 'left', x < -DEAD_ZONE)
        setInputIfChanged(state, 'right', x > DEAD_ZONE)
        setInputIfChanged(state, 'sprint', pressed(buttons[5]))
        setInputIfChanged(state, 'drift', pressed(buttons[0]))

        if (edge(buttons, 3) && state.gameMode === 'race') state.toggleAutopilot()
        if (edge(buttons, 9)) state.togglePause()
        return
      }

      setInputIfChanged(state, 'forward', y < -DEAD_ZONE)
      setInputIfChanged(state, 'backward', y > DEAD_ZONE)
      setInputIfChanged(state, 'left', x < -DEAD_ZONE)
      setInputIfChanged(state, 'right', x > DEAD_ZONE)
      setInputIfChanged(state, 'sprint', pressed(buttons[10]))
      setInputIfChanged(state, 'drift', false)

      const guard = fight && pressed(buttons[4])
      if (guard !== state.blockHeld) state.setBlockHeld(guard)

      if (fight) {
        if (edge(buttons, 2)) state.requestCombatAction('light')
        if (edge(buttons, 3)) state.requestCombatAction('heavy')
        if (edge(buttons, 0)) state.requestCombatAction('dodge')
        if (edge(buttons, 5)) state.requestAttack()
        if (edge(buttons, 11)) state.toggleLockOn()
        if (edge(buttons, 14)) state.requestCombatAction('rapid')
        if (edge(buttons, 13)) state.requestCombatAction('slam')
        if (edge(buttons, 15)) state.requestCombatAction('nova')
        if (edge(buttons, 1)) {
          if (!state.performCombatContextAction() && ['story', 'vertical'].includes(state.gameMode)) state.interactWithStory()
        }
      } else {
        const interactA = edge(buttons, 0)
        const interactB = edge(buttons, 1)
        if ((interactA || interactB) && state.nearbyTerminal) state.interactWithStory()
      }

      if (edge(buttons, 9)) state.togglePause()
    }

    const connected = () => useGameStore.getState().setInputDevice('gamepad')
    const disconnected = () => releaseAll()
    window.addEventListener('gamepadconnected', connected)
    window.addEventListener('gamepaddisconnected', disconnected)
    frame = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(frame)
      releaseAll()
      window.removeEventListener('gamepadconnected', connected)
      window.removeEventListener('gamepaddisconnected', disconnected)
    }
  }, [])
}
