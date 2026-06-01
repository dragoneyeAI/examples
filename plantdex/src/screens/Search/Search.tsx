import { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Screen } from "../../components/Screen";
import { useDexHeader } from "../../components/DexHeaderContext";
import { PlantCard } from "../../components/PlantCard";
import { useSearch, EMPTY_FILTERS, type SearchFilters } from "../../hooks/useSearch";
import { useStore } from "../../store/StoreProvider";
import { ALL_TYPES, ALL_HABITATS } from "../../data/plants";
import { TYPE_THEME } from "../../data/typeTheme";
import type { PlantType, Habitat } from "../../types/plant";
import "./Search.css";

const HABITAT_LABEL: Record<Habitat, string> = {
  indoor: "🪟 Indoor",
  street: "🏙️ Street",
  park: "🌳 Park",
};

export function Search() {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const results = useSearch(filters);
  const { isDiscovered } = useStore();

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const toggleType = (t: PlantType) =>
    setFilters((f) => ({ ...f, types: toggle(f.types, t) }));
  const toggleHabitat = (h: Habitat) =>
    setFilters((f) => ({ ...f, habitats: toggle(f.habitats, h) }));

  const active =
    filters.query ||
    filters.types.length ||
    filters.habitats.length ||
    filters.petSafeOnly;

  useDexHeader({ title: "Search", subtitle: `${results.length} matches` });

  return (
    <Screen>
      <div className="search__box">
        <span aria-hidden>🔍</span>
        <input
          className="search__input"
          type="search"
          inputMode="search"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="Name, latin name, family…"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
        />
        {!!active && (
          <button
            className="search__clear"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Clear
          </button>
        )}
      </div>

      <div className="search__filters">
        {ALL_TYPES.map((t) => {
          const on = filters.types.includes(t);
          const theme = TYPE_THEME[t];
          return (
            <button
              key={t}
              className={"chip" + (on ? " chip--on" : "")}
              onClick={() => toggleType(t)}
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

      <div className="search__filters">
        {ALL_HABITATS.map((h) => (
          <button
            key={h}
            className={"chip" + (filters.habitats.includes(h) ? " chip--on" : "")}
            onClick={() => toggleHabitat(h)}
          >
            {HABITAT_LABEL[h]}
          </button>
        ))}
        <button
          className={"chip" + (filters.petSafeOnly ? " chip--on" : "")}
          onClick={() => setFilters((f) => ({ ...f, petSafeOnly: !f.petSafeOnly }))}
        >
          🐾 Pet-safe
        </button>
      </div>

      {results.length === 0 ? (
        <p className="search__empty">No plants match those filters 🌱</p>
      ) : (
        <LayoutGroup>
          <motion.div layout className="dex-grid">
            {results.map((p, i) => (
              <PlantCard
                key={p.id}
                plant={p}
                discovered={isDiscovered(p.id)}
                index={i}
              />
            ))}
          </motion.div>
        </LayoutGroup>
      )}
    </Screen>
  );
}
