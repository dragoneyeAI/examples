import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./DiscoveryBurst.css";

const PARTICLES = ["🌿", "🍃", "✨", "🌱", "🌸", "💚"];
// fixed spray angles (no Math.random — keeps it deterministic & SSR-safe)
const COUNT = 14;

interface Props {
  show: boolean;
  onDone: () => void;
}

/** A celebratory leaf/sparkle burst + "NEW!" stamp when a plant is first
 *  discovered. Best-effort haptic on supporting devices. */
export function DiscoveryBurst({ show, onDone }: Props) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!show) return;
    if (navigator.vibrate) navigator.vibrate([10, 40, 18]);
    const t = setTimeout(onDone, reduced ? 900 : 1500);
    return () => clearTimeout(t);
  }, [show, onDone, reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="burst"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          <motion.div
            className="burst__stamp"
            initial={{ scale: 0.2, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
          >
            NEW!
          </motion.div>

          {!reduced &&
            Array.from({ length: COUNT }).map((_, i) => {
              const angle = (i / COUNT) * Math.PI * 2;
              const dist = 120 + (i % 3) * 36;
              return (
                <motion.span
                  key={i}
                  className="burst__particle"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 1.2,
                    rotate: (i % 2 ? 1 : -1) * 180,
                  }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                >
                  {PARTICLES[i % PARTICLES.length]}
                </motion.span>
              );
            })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
