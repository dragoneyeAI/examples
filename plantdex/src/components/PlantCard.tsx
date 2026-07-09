import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Plant } from "../types/plant";
import { themeFor } from "../data/typeTheme";
import { AttributedImage } from "./AttributedImage";
import "./PlantCard.css";

interface Props {
  plant: Plant;
  discovered: boolean;
  /** index within the visible list, for staggered entrance */
  index?: number;
}

export function PlantCard({ plant, discovered, index = 0 }: Props) {
  const theme = themeFor(plant.types);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.025, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.95 }}
      className={"plant-card" + (discovered ? " plant-card--caught" : "")}
      style={
        {
          "--accent": theme.color,
          "--accent-soft": theme.soft,
          borderColor: discovered ? theme.color : "transparent",
        } as React.CSSProperties
      }
    >
      <Link to={`/plant/${plant.id}`} className="plant-card__link">
        <div className="plant-card__media">
          <AttributedImage
            image={plant.image}
            alt={plant.commonName}
            className={discovered ? "" : "plant-card__media--undiscovered"}
          />
          <span className="plant-card__dex">
            {`#${String(plant.dexNumber).padStart(3, "0")}`}
          </span>
          {discovered && (
            <span
              className="plant-card__caught"
              style={{ background: theme.color }}
              title="In your collection"
            >
              ✓
            </span>
          )}
          <span className="plant-card__glyph" aria-hidden>
            {theme.glyph}
          </span>
        </div>
        <div className="plant-card__body">
          <div className="plant-card__name">{plant.commonName}</div>
          <div className="plant-card__latin">{plant.latinName}</div>
        </div>
      </Link>
    </motion.div>
  );
}
