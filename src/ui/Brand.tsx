export function Brand() {
  return (
    <a href="#explore" aria-label="Wokstar home" className="shrink-0 rounded-sm">
      <span className="brand-wordmark">
        <img src="/wokstar.png" alt="Wokstar" width="2000" height="2000" />
      </span>
    </a>
  )
}

export function BrandArt() {
  return (
    <div className="brand-art shrink-0" aria-hidden="true">
      <img src="/wokstar.png" alt="" width="2000" height="2000" />
    </div>
  )
}
