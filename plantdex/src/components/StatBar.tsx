import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./StatBar.css";

interface Props {
  label: string;
  value: number; // 0–100
  accent: string;
  index?: number;
}

/** A Pokédex stat bar: label, numeric value, and a fill that springs from
 *  0 → value on mount (staggered by index). Color shifts subtly low→high. */
export function StatBar({ label, value, accent, index = 0 }: Props) {
  const reduced = usePrefersReducedMotion();
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="stat-bar">
      <span className="stat-bar__label">{label}</span>
      <div className="stat-bar__track">
        <motion.div
          className="stat-bar__fill"
          style={{ background: accent }}
          initial={reduced ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                  delay: 0.12 + index * 0.07,
                }
          }
        />
      </div>
      <span className="stat-bar__value">{pct}</span>
    </div>
  );
}
