import { useMemo, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Screen } from "../../components/Screen";
import { DexHeader } from "../../components/DexHeader";
import { PlantCard } from "../../components/PlantCard";
import { PLANTS, ALL_TYPES } from "../../data/plants";
import { TYPE_THEME } from "../../data/typeTheme";
import { useStore } from "../../store/StoreProvider";
import type { PlantType } from "../../types/plant";
import "./DexGrid.css";

export function DexGrid() {
  const { isDiscovered, discoveredCount } = useStore();
  const [activeType, setActiveType] = useState<PlantType | null>(null);

  const plants = useMemo(
    () =>
      activeType ? PLANTS.filter((p) => p.types.includes(activeType)) : PLANTS,
    [activeType],
  );

  return (
    <Screen>
      <DexHeader
        title="Plantdex"
        subtitle={`${discoveredCount} / ${PLANTS.length} discovered`}
      />

      <div className="dex-filters" role="tablist" aria-label="Filter by type">
        <button
          className={"chip" + (activeType === null ? " chip--on" : "")}
          onClick={() => setActiveType(null)}
        >
          All
        </button>
        {ALL_TYPES.map((t) => {
          const theme = TYPE_THEME[t];
          const on = activeType === t;
          return (
            <button
              key={t}
              className={"chip" + (on ? " chip--on" : "")}
              onClick={() => setActiveType(on ? null : t)}
              style={
                on
                  ? {
                      background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
                      color: "#04240f",
                    }
                  : undefined
              }
            >
              <span aria-hidden>{theme.glyph}</span> {theme.label}
            </button>
          );
        })}
      </div>

      <LayoutGroup>
        <motion.div layout className="dex-grid">
          {plants.map((p, i) => (
            <PlantCard
              key={p.id}
              plant={p}
              discovered={isDiscovered(p.id)}
              index={i}
            />
          ))}
        </motion.div>
      </LayoutGroup>
    </Screen>
  );
}
