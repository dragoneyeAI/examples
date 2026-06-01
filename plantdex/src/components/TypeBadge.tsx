import type { PlantType } from "../types/plant";
import { TYPE_THEME } from "../data/typeTheme";
import "./TypeBadge.css";

export function TypeBadge({
  type,
  size = "md",
}: {
  type: PlantType;
  size?: "sm" | "md";
}) {
  const theme = TYPE_THEME[type];
  return (
    <span
      className={`type-badge type-badge--${size}`}
      style={{
        background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
      }}
    >
      <span className="type-badge__glyph" aria-hidden>
        {theme.glyph}
      </span>
      {theme.label}
    </span>
  );
}
