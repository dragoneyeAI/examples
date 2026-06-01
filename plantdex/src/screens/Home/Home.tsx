import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen } from "../../components/Screen";
import { DexHeader } from "../../components/DexHeader";
import { AttributedImage } from "../../components/AttributedImage";
import { TypeBadge } from "../../components/TypeBadge";
import { plantOfTheDay, bloomingIn, getPlant, PLANTS } from "../../data/plants";
import { themeFor } from "../../data/typeTheme";
import { useStore } from "../../store/StoreProvider";
import "./Home.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function Home() {
  const { meta, discoveredCount, isDiscovered } = useStore();

  // Stable per-day values computed once on mount.
  const { potd, month, blooming, lastViewed } = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const m = now.getMonth() + 1;
    return {
      potd: plantOfTheDay(key),
      month: m,
      blooming: bloomingIn(m).slice(0, 12),
      lastViewed: meta.lastViewedPlantId
        ? getPlant(meta.lastViewedPlantId)
        : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.lastViewedPlantId]);

  const potdTheme = themeFor(potd.types);

  return (
    <Screen>
      <DexHeader
        title="Plantdex"
        subtitle={`${discoveredCount} of ${PLANTS.length} discovered`}
        right={
          <div className="home__streak" title="Daily streak">
            🔥 <strong>{meta.streakCount || 1}</strong>
          </div>
        }
      />

      {/* Plant of the Day */}
      <Link to={`/plant/${potd.id}`} className="home__potd-link">
        <motion.div
          className="home__potd"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: `linear-gradient(160deg, ${potdTheme.gradient[0]}, ${potdTheme.gradient[1]})`,
          }}
        >
          <div className="home__potd-media">
            <AttributedImage image={potd.image} alt={potd.commonName} />
          </div>
          <div className="home__potd-body">
            <span className="eyebrow">🌟 Plant of the day</span>
            <h2 className="home__potd-name">{potd.commonName}</h2>
            <p className="home__potd-latin">{potd.latinName}</p>
            <div className="home__potd-types">
              {potd.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
              {isDiscovered(potd.id) && <span className="home__seen">✓ Seen</span>}
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Quick resume */}
      {lastViewed && lastViewed.id !== potd.id && (
        <Link to={`/plant/${lastViewed.id}`} className="home__resume">
          <div className="home__resume-img">
            <AttributedImage image={lastViewed.image} alt={lastViewed.commonName} />
          </div>
          <div className="home__resume-text">
            <span className="eyebrow">↩ Continue</span>
            <strong>{lastViewed.commonName}</strong>
          </div>
          <span className="home__resume-arrow">›</span>
        </Link>
      )}

      {/* Seasonal NYC highlight */}
      {blooming.length > 0 && (
        <section className="home__season">
          <h3 className="home__section-title">
            🌷 Blooming in NYC · {MONTH_NAMES[month - 1]}
          </h3>
          <div className="home__season-scroll">
            {blooming.map((p) => (
              <Link key={p.id} to={`/plant/${p.id}`} className="home__season-card">
                <div className="home__season-img">
                  <AttributedImage image={p.image} alt={p.commonName} />
                </div>
                <span className="home__season-name">{p.commonName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="home__cta-row">
        <Link to="/dex" className="home__cta">
          📖 Browse the Dex
        </Link>
        <Link to="/scan" className="home__cta home__cta--alt">
          📷 Scan a plant
        </Link>
      </div>
    </Screen>
  );
}
