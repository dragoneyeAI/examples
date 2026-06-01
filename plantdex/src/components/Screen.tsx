import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Standard animated screen wrapper: a clean fade/slide on route change,
 *  plus the safe-area-aware .screen padding. */
export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      className={"screen" + (className ? " " + className : "")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
