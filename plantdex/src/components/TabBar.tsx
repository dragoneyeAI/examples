import { NavLink } from "react-router-dom";
import "./TabBar.css";

type Tab = {
  to: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
  end?: boolean;
};

const stroke = (active: boolean) => (active ? "currentColor" : "currentColor");

const TABS: Tab[] = [
  {
    to: "/",
    label: "Home",
    end: true,
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path
          d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.18 : 0}
        />
      </svg>
    ),
  },
  {
    to: "/dex",
    label: "Dex",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <rect
          x="3.5"
          y="3.5"
          width="7"
          height="7"
          rx="1.5"
          stroke={stroke(a)}
          strokeWidth="1.8"
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.18 : 0}
        />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke={stroke(a)} strokeWidth="1.8" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke={stroke(a)} strokeWidth="1.8" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke={stroke(a)} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    to: "/search",
    label: "Search",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <circle cx="11" cy="11" r="6.5" stroke={stroke(a)} strokeWidth="1.8" />
        <path d="m16 16 4.5 4.5" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/scan",
    label: "Scan",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path
          d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3" stroke={stroke(a)} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    to: "/collection",
    label: "Collection",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path
          d="M12 3.5c2.5 3 6.5 3.8 6.5 8.5A6.5 6.5 0 0 1 12 18.5 6.5 6.5 0 0 1 5.5 12C5.5 7.3 9.5 6.5 12 3.5Z"
          stroke={stroke(a)}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.18 : 0}
        />
      </svg>
    ),
  },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => "tab" + (isActive ? " tab--active" : "")}
        >
          {({ isActive }) => (
            <>
              <span className="tab__icon">{t.icon(isActive)}</span>
              <span className="tab__label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
