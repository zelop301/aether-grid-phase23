import { ENEMY_IDS } from '../../store/useGameStore.js'
import EnemyUnit from './EnemyUnit.jsx'

export default function EnemyDirector({ shadows }) {
  return (
    <group>
      {ENEMY_IDS.map((id) => (
        <EnemyUnit key={id} id={id} shadows={shadows} />
      ))}
    </group>
  )
}
