import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen } from "../../components/Screen";
import { useDexHeader } from "../../components/DexHeaderContext";
import { StatBar } from "../../components/StatBar";
import { TypeBadge } from "../../components/TypeBadge";
import { AttributedImage } from "../../components/AttributedImage";
import { DiscoveryBurst } from "../../components/DiscoveryBurst";
import { getPlant } from "../../data/plants";
import { themeFor } from "../../data/typeTheme";
import { useStore } from "../../store/StoreProvider";
import { STAT_KEYS, STAT_LABELS, type Habitat } from "../../types/plant";
import "./PlantDetail.css";

const HABITAT_LABEL: Record<Habitat, string> = {
  indoor: "🪟 Indoors / windowsills",
  street: "🏙️ NYC street trees",
  park: "🌳 NYC parks & gardens",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = id ? getPlant(id) : undefined;
  const { isDiscovered, discover, undiscover, setLastViewed } = useStore();
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (plant) setLastViewed(plant.id);
  }, [plant, setLastViewed]);

  // The fixed deck is always-on chrome, so show the plant here (this screen had
  // no header before). Called before the early return to keep hook order stable.
  useDexHeader({
    title: plant?.commonName ?? "Plantdex",
    subtitle: plant?.latinName,
  });

  if (!plant) {
    return (
      <Screen>
        <p className="detail-missing">
          That plant isn’t in the dex. <Link to="/dex">Back to Plantdex →</Link>
        </p>
      </Screen>
    );
  }

  const theme = themeFor(plant.types);
  const caught = isDiscovered(plant.id);

  const onToggle = async () => {
    if (caught) {
      await undiscover(plant.id);
    } else {
      const { isNew } = await discover(plant.id, "manual");
      if (isNew) setBurst(true);
    }
  };

  return (
    <Screen className="detail">
      <DiscoveryBurst show={burst} onDone={() => setBurst(false)} />

      <button className="detail__back" onClick={() => navigate(-1)}>
        ‹ Back
      </button>

      <div
        className="detail__hero"
        style={{
          background: `linear-gradient(160deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
        }}
      >
        <motion.div
          className="detail__hero-img"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <AttributedImage image={plant.image} alt={plant.commonName} full showCredit />
        </motion.div>
        <span className="detail__dex">
          #{String(plant.dexNumber).padStart(3, "0")}
        </span>
      </div>

      <div className="detail__titles">
        <h1 className="detail__name">{plant.commonName}</h1>
        <p className="detail__latin">
          {plant.latinName}
          {plant.family ? ` · ${plant.family}` : ""}
        </p>
        <div className="detail__types">
          {plant.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </div>

      <button
        className={"detail__catch" + (caught ? " detail__catch--on" : "")}
        onClick={onToggle}
        style={
          caught
            ? ({ background: theme.color, "--accent": theme.color } as React.CSSProperties)
            : undefined
        }
      >
        <span className="detail__ball" aria-hidden />
        {caught ? "Registered" : "Register in dex"}
      </button>

      <p className="detail__flavor">{plant.flavorText}</p>

      <section className="detail__card">
        <h2 className="detail__h2">Stats</h2>
        {STAT_KEYS.map((key, i) => (
          <StatBar
            key={key}
            label={STAT_LABELS[key]}
            value={plant.stats[key]}
            accent={theme.color}
            index={i}
          />
        ))}
      </section>

      <section className="detail__card">
        <h2 className="detail__h2">Care</h2>
        <div className="detail__chips">
          <span className="pill">☀️ {plant.care.light}</span>
          <span className="pill">💧 {plant.care.watering}</span>
          {plant.care.humidity && <span className="pill">💨 {plant.care.humidity} humidity</span>}
          {plant.care.temperatureC && (
            <span className="pill">
              🌡️ {plant.care.temperatureC[0]}–{plant.care.temperatureC[1]}°C
            </span>
          )}
          {plant.care.petSafe !== undefined && (
            <span className="pill">
              {plant.care.petSafe ? "🐾 Pet-safe" : "⚠️ Toxic to pets"}
            </span>
          )}
        </div>
      </section>

      <section className="detail__card">
        <h2 className="detail__h2">Where to find it</h2>
        <div className="detail__chips">
          {plant.habitat.map((h) => (
            <span key={h} className="pill">{HABITAT_LABEL[h]}</span>
          ))}
        </div>
        {plant.bloomMonths && plant.bloomMonths.length > 0 && (
          <p className="detail__bloom">
            🌷 Blooms: {plant.bloomMonths.map((m) => MONTHS[m - 1]).join(", ")}
          </p>
        )}
      </section>
    </Screen>
  );
}
