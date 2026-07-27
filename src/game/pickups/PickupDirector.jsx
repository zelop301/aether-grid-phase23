import { PICKUP_IDS, useGameStore } from '../../store/useGameStore.js'
import RepairNode from './RepairNode.jsx'

export default function PickupDirector() {
  const gameMode = useGameStore((state) => state.gameMode)
  const storyStage = useGameStore((state) => state.storyStage)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const visible = gameMode === 'combat' || (gameMode === 'story' && storyStage === 2) || (gameMode === 'vertical' && verticalStage === 1)

  if (!visible) return null

  return (
    <group>
      {PICKUP_IDS.map((id) => (
        <RepairNode key={id} id={id} />
      ))}
    </group>
  )
}
