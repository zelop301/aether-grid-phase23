import React from 'react'

export default class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message || 'The render core stopped unexpectedly.' }
  }

  componentDidCatch(error, info) {
    console.error('Game render failure', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="game-error-panel glass-panel" role="alert">
        <span>SAFE RECOVERY MODE</span>
        <h1>THE RENDER CORE STOPPED</h1>
        <p>{this.state.message}</p>
        <button type="button" onClick={() => window.location.reload()}>RELOAD GAME</button>
        <button type="button" onClick={() => { try { localStorage.removeItem('aether-grid-settings-v3') } catch {} window.location.reload() }}>RESET DISPLAY SETTINGS</button>
        <button type="button" onClick={() => { try { localStorage.removeItem('aether-grid-checkpoint-v3') } catch {} window.location.reload() }}>CLEAR CHECKPOINT & RELOAD</button>
      </section>
    )
  }
}
