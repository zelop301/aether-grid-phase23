import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'

export default function CinematicLayer() {
  const scanlines = useGameStore((state) => state.scanlines)
  const vignette = useGameStore((state) => state.vignette)
  const filmGrain = useGameStore((state) => state.filmGrain)
  const systemPanel = useGameStore((state) => state.systemPanel)
  const notification = useGameStore((state) => state.notification)
  const notificationSerial = useGameStore((state) => state.notificationSerial)
  const clearNotification = useGameStore((state) => state.clearNotification)
  const gameMode = useGameStore((state) => state.gameMode)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const [stageCard, setStageCard] = useState(null)
  useEffect(() => {
    if (gameMode !== 'vertical') {
      setStageCard(null)
      return undefined
    }
    const cards = [
      ['01', 'INFILTRATE', 'REACH RELAY ALPHA'],
      ['02', 'BREAK THE WARDEN LINE', 'READ THE TELEGRAPHS'],
      ['03', 'EXTRACT', 'FOUR GATES // NO SECOND ATTEMPT'],
      ['04', 'SLICE VERIFIED', 'MISSION SYSTEMS COHERENT'],
    ]
    setStageCard(cards[verticalStage] || null)
    const timer = window.setTimeout(() => setStageCard(null), 1900)
    return () => window.clearTimeout(timer)
  }, [gameMode, verticalStage])

  useEffect(() => {
    if (!notification) return undefined
    const timer = window.setTimeout(clearNotification, 2200)
    return () => window.clearTimeout(timer)
  }, [clearNotification, notification, notificationSerial])
  return (
    <div className={`cinematic-layer ${systemPanel === 'photo' ? 'cinematic-layer--photo' : ''}`} aria-hidden="true">
      {scanlines && <div className="cinematic-scanlines" />}
      {filmGrain && <div className="cinematic-grain" />}
      {vignette && <div className="cinematic-vignette" />}
      {systemPanel === 'photo' && <><div className="cinematic-bar cinematic-bar--top" /><div className="cinematic-bar cinematic-bar--bottom" /></>}
      {stageCard && <div className="vertical-stage-card"><span>{stageCard[0]}</span><div><strong>{stageCard[1]}</strong><small>{stageCard[2]}</small></div></div>}
      {notification && <div key={notificationSerial} className="system-toast">{notification}</div>}
    </div>
  )
}
