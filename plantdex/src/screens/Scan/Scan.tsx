import { Screen } from "../../components/Screen";
import { DexHeader } from "../../components/DexHeader";
import "./Scan.css";

export function Scan() {
  return (
    <Screen>
      <DexHeader title="Scan" subtitle="Identify a plant with your camera" />

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
        <span className="pill">Coming soon</span>
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
