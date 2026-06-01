import "./DexHeader.css";

/** The signature Pokédex top: a glossy pulsing "lens" + title + optional
 *  right-side slot (e.g. collection counter). */
export function DexHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="dex-header">
      <div className="dex-header__lens" aria-hidden>
        <span className="dex-header__lens-glint" />
      </div>
      <div className="dex-header__dots" aria-hidden>
        <i style={{ background: "#ff5b5b" }} />
        <i style={{ background: "#ffd35c" }} />
        <i style={{ background: "#5bd97a" }} />
      </div>
      <div className="dex-header__titles">
        <h1 className="dex-header__title">{title}</h1>
        {subtitle && <p className="dex-header__subtitle">{subtitle}</p>}
      </div>
      {right && <div className="dex-header__right">{right}</div>}
    </header>
  );
}
