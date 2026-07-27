import { RIVAL_BLUEPRINTS } from './raceConfig.js'
import RivalCycle from './RivalCycle.jsx'

export default function RaceRivals({ trailSegments }) {
  return (
    <group>
      {RIVAL_BLUEPRINTS.map((rival) => (
        <RivalCycle key={rival.id} blueprint={rival} trailSegments={trailSegments} />
      ))}
    </group>
  )
}
