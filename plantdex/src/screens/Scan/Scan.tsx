import { useEffect, useState } from "react";
import { Screen } from "../../components/Screen";
import { useDexHeader } from "../../components/DexHeaderContext";
import { checkHealth } from "../../api/health";
import "./Scan.css";

// Scaffolding for the upcoming scanning feature. Once live, it will identify
// the most prominent matching plant in the photo, surface it to the user, and
// let them add it to their Plantdex as a discovery.
// We should detect based on the most prominent (largest) plant that you can see above a certain confidence
type HealthState = "checking" | "ok" | "down";

export function Scan() {
  useDexHeader({ title: "Scan", subtitle: "Identify a plant with your camera" });

  // Buried liveness check for the Pages Function backend that will power the
  // future photo scan. Lives here because this tab is where the scan call will
  // eventually run; the pill below makes the client→Function path verifiable.
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((res) => setHealth(res.status === "ok" ? "ok" : "down"))
      .catch((err) => {
        if (!controller.signal.aborted) setHealth("down");
        void err;
      });
    return () => controller.abort();
  }, []);

  return (
    <Screen>
      <div className="scan__frame">
        <div className="scan__reticle">
          <span className="scan__corner scan__corner--tl" />
          <span className="scan__corner scan__corner--tr" />
          <span className="scan__corner scan__corner--bl" />
          <span className="scan__corner scan__corner--br" />
          <div className="scan__sweep" />
          <span className="scan__leaf" aria-hidden>🌿</span>
        </div>
      </div>

      <div className="scan__soon">
        <div className="scan__pills">
          <span className="pill">Coming soon</span>
          <span className={`scan__health scan__health--${health}`}>
            API: {health === "checking" ? "…" : health}
          </span>
        </div>
        <h2 className="scan__title">Point, shoot, discover</h2>
        <p className="scan__copy">
          Soon you’ll be able to snap a photo of any plant and Plantdex will
          identify it for you — automatically adding it to your collection.
        </p>
        <ul className="scan__how">
          <li>📷 Capture a plant with your camera</li>
          <li>🧠 Our model predicts the species</li>
          <li>✨ It’s saved to your dex as a discovery</li>
        </ul>
        <button className="scan__btn" disabled>
          📷 Open camera (coming soon)
        </button>
      </div>
    </Screen>
  );
}
