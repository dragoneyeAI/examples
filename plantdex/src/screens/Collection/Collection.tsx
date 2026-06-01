import { motion } from "framer-motion";
import { Screen } from "../../components/Screen";
import { DexHeader } from "../../components/DexHeader";
import { ProgressRing } from "../../components/ProgressRing";
import { PlantCard } from "../../components/PlantCard";
import { useDiscoveries } from "../../hooks/useDiscoveries";
import { PLANTS, ALL_TYPES } from "../../data/plants";
import { TYPE_THEME } from "../../data/typeTheme";
import "./Collection.css";

export function Collection() {
  const { completion, discoveredCount, total, recent, isDiscovered, clearAll } =
    useDiscoveries();

  const pct = Math.round(completion * 100);

  // per-type completion
  const byType = ALL_TYPES.map((t) => {
    const all = PLANTS.filter((p) => p.types.includes(t));
    const seen = all.filter((p) => isDiscovered(p.id)).length;
    return { type: t, seen, total: all.length };
  });

  return (
    <Screen>
      <DexHeader title="Collection" subtitle="Your Plantdex progress" />

      <div className="coll__ring-wrap">
        <ProgressRing progress={completion}>
          <motion.div
            className="coll__pct"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <strong>{pct}%</strong>
            <span>
              {discoveredCount} / {total}
            </span>
          </motion.div>
        </ProgressRing>
        <p className="coll__tagline">
          {pct === 100
            ? "🏆 Plantdex complete — botanist supreme!"
            : pct === 0
              ? "Tap “Mark as seen” on a plant to start your collection."
              : "Keep exploring NYC to fill your dex!"}
        </p>
      </div>

      <section className="coll__card">
        <h2 className="coll__h2">By type</h2>
        {byType.map(({ type, seen, total }) => {
          const theme = TYPE_THEME[type];
          return (
            <div key={type} className="coll__type-row">
              <span className="coll__type-label">
                <span aria-hidden>{theme.glyph}</span> {theme.label}
              </span>
              <div className="coll__type-track">
                <motion.div
                  className="coll__type-fill"
                  style={{ background: theme.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${total ? (seen / total) * 100 : 0}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <span className="coll__type-count">
                {seen}/{total}
              </span>
            </div>
          );
        })}
      </section>

      {recent.length > 0 && (
        <section className="coll__card">
          <h2 className="coll__h2">Recently discovered</h2>
          <div className="dex-grid">
            {recent.slice(0, 6).map((p, i) => (
              <PlantCard key={p.id} plant={p} discovered index={i} />
            ))}
          </div>
        </section>
      )}

      {discoveredCount > 0 && (
        <button
          className="coll__reset"
          onClick={() => {
            if (confirm("Reset your whole collection? This can’t be undone."))
              void clearAll();
          }}
        >
          Reset collection
        </button>
      )}
    </Screen>
  );
}
