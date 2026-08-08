/** Minimal fixed-screen crosshair — center of the viewport. */
export function Crosshair() {
  return (
    <div className="crosshair" aria-hidden>
      <span className="crosshair-h" />
      <span className="crosshair-v" />
      <span className="crosshair-dot" />
    </div>
  )
}
