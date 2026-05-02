export function SimulationControls({
  onPlay,
  onPause,
  onNext,
  onReset,
  isPlaying,
  canStep,
  disabled,
}) {
  return (
    <div className="glass-card-solid flex items-center gap-2 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-[var(--os-text-dim)] mr-1">controls</span>
      <button
        type="button"
        disabled={disabled || isPlaying}
        onClick={onPlay}
        className="os-btn"
        title="Play"
      >
        ▶ Play
      </button>
      <button
        type="button"
        disabled={disabled || !isPlaying}
        onClick={onPause}
        className="os-btn"
        title="Pause"
      >
        ⏸ Pause
      </button>
      <button
        type="button"
        disabled={disabled || !canStep || isPlaying}
        onClick={onNext}
        className="os-btn"
        title="Next Step"
      >
        ⏭ Next
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onReset}
        className="os-btn os-btn-danger"
        title="Reset"
      >
        ↺ Reset
      </button>
    </div>
  )
}
