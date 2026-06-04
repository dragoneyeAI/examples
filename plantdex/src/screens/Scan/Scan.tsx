import { useEffect, useRef, useState } from "react";
import { Screen } from "../../components/Screen";
import { PlantCard } from "../../components/PlantCard";
import { DiscoveryBurst } from "../../components/DiscoveryBurst";
import { useDexHeader } from "../../components/DexHeaderContext";
import { useStore } from "../../store/StoreProvider";
import { checkHealth } from "../../api/health";
import { scanPhoto } from "../../scan/dragoneyeClient";
import { mapPredictionToPlant, type PlantMatch } from "../../scan/mapPredictionToPlant";
import { PLANTS } from "../../data/plants";
import "./Scan.css";

// The live scan flow: capture a photo → POST it to the `/api/scan` Pages
// Function (which holds the Dragoneye key and runs the prediction) → map the
// result to a dex entry → save it as a discovery. This is the only screen that
// touches the network.

// "checking" → "down" cover the Function being unreachable; "setup" means the
// Function answered but the server-side DRAGONEYE_API_KEY isn't configured.
type Backend = "checking" | "ready" | "setup" | "down";

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "matched"; match: PlantMatch; isNew: boolean }
  | { kind: "nomatch" }
  | { kind: "error"; message: string };

export function Scan() {
  useDexHeader({ title: "Scan", subtitle: "Identify a plant with your camera" });

  const { discover } = useStore();
  const [backend, setBackend] = useState<Backend>("checking");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the latest scan so a stale in-flight request can't clobber a newer one.
  const scanIdRef = useRef(0);

  // Liveness + configuration probe for the Pages Function backend.
  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.status !== "ok") setBackend("down");
        else setBackend(res.dragoneyeConfigured ? "ready" : "setup");
      })
      .catch((err) => {
        if (!controller.signal.aborted) setBackend("down");
        void err;
      });
    return () => controller.abort();
  }, []);

  // Revoke the last preview object URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(file: File) {
    const scanId = ++scanIdRef.current;
    const nextPreview = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextPreview;
    });
    setPhase({ kind: "scanning" });

    try {
      const result = await scanPhoto(file);
      if (scanId !== scanIdRef.current) return; // superseded by a newer scan

      const match = mapPredictionToPlant(result, PLANTS);
      if (!match) {
        setPhase({ kind: "nomatch" });
        return;
      }

      const { isNew } = await discover(match.plant.id, "scan", {
        confidence: match.confidence,
        rawPrediction: result,
      });
      if (scanId !== scanIdRef.current) return;

      setPhase({ kind: "matched", match, isNew });
      if (isNew) setShowBurst(true);
    } catch (err) {
      if (scanId !== scanIdRef.current) return;
      const message =
        err instanceof Error ? err.message : "Something went wrong while scanning.";
      setPhase({ kind: "error", message });
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function reset() {
    scanIdRef.current++;
    setPhase({ kind: "idle" });
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const openCamera = () => fileInputRef.current?.click();
  const scanning = phase.kind === "scanning";
  const canScan = backend === "ready";

  return (
    <Screen>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="scan__file"
        onChange={onInputChange}
      />

      <div className="scan__frame">
        <div className={"scan__reticle" + (scanning ? " scan__reticle--busy" : "")}>
          <span className="scan__corner scan__corner--tl" />
          <span className="scan__corner scan__corner--tr" />
          <span className="scan__corner scan__corner--bl" />
          <span className="scan__corner scan__corner--br" />
          {preview ? (
            <img className="scan__shot" src={preview} alt="Captured plant" />
          ) : (
            <span className="scan__leaf" aria-hidden>🌿</span>
          )}
          {scanning && <div className="scan__sweep" />}
        </div>
      </div>

      {phase.kind === "matched" ? (
        <ResultView match={phase.match} isNew={phase.isNew} onAgain={reset} />
      ) : phase.kind === "nomatch" ? (
        <NoMatchView onAgain={reset} />
      ) : phase.kind === "error" ? (
        <ErrorView message={phase.message} onAgain={reset} />
      ) : (
        <IdleView
          backend={backend}
          scanning={scanning}
          canScan={canScan}
          onOpenCamera={openCamera}
        />
      )}

      <DiscoveryBurst show={showBurst} onDone={() => setShowBurst(false)} />
    </Screen>
  );
}

function HealthPill({ backend }: { backend: Backend }) {
  const label =
    backend === "checking"
      ? "…"
      : backend === "ready"
        ? "ready"
        : backend === "setup"
          ? "setup needed"
          : "down";
  const mod = backend === "ready" ? "ok" : backend === "checking" ? "checking" : "down";
  return <span className={`scan__health scan__health--${mod}`}>API: {label}</span>;
}

function IdleView({
  backend,
  scanning,
  canScan,
  onOpenCamera,
}: {
  backend: Backend;
  scanning: boolean;
  canScan: boolean;
  onOpenCamera: () => void;
}) {
  return (
    <div className="scan__soon">
      <div className="scan__pills">
        <span className="pill">{scanning ? "Identifying…" : "Live"}</span>
        <HealthPill backend={backend} />
      </div>
      <h2 className="scan__title">Point, shoot, discover</h2>
      <p className="scan__copy">
        Snap a photo of any plant and Plantdex will identify the species and add
        it to your collection.
      </p>

      {backend === "setup" ? (
        <div className="scan__notice">
          <strong>Scanning isn’t set up yet.</strong> Set <code>DRAGONEYE_API_KEY</code>{" "}
          on the server (a Cloudflare Pages env var, or <code>.dev.vars</code> for{" "}
          <code>pnpm pages:dev</code>) to enable it.
        </div>
      ) : backend === "down" ? (
        <div className="scan__notice">
          <strong>Backend unreachable.</strong> The scan API only runs under{" "}
          <code>pnpm pages:dev</code> or on Cloudflare Pages — not plain{" "}
          <code>pnpm dev</code>.
        </div>
      ) : (
        <ul className="scan__how">
          <li>📷 Capture a plant with your camera</li>
          <li>🧠 Our model predicts the species</li>
          <li>✨ It’s saved to your dex as a discovery</li>
        </ul>
      )}

      <button className="scan__btn" onClick={onOpenCamera} disabled={!canScan || scanning}>
        {scanning ? "Identifying…" : "📷 Open camera"}
      </button>
    </div>
  );
}

function ResultView({
  match,
  isNew,
  onAgain,
}: {
  match: PlantMatch;
  isNew: boolean;
  onAgain: () => void;
}) {
  const pct = Math.round(match.confidence * 100);
  return (
    <div className="scan__result">
      <div className="scan__pills">
        <span className="pill">{isNew ? "New discovery!" : "Already in your dex"}</span>
        <span className="scan__health scan__health--ok">{pct}% match</span>
      </div>
      <h2 className="scan__title">It’s a {match.plant.commonName}!</h2>
      <div className="scan__match-card">
        <PlantCard plant={match.plant} discovered />
      </div>
      <p className="scan__copy scan__matched-on">Matched on “{match.matchedOn}”</p>
      <button className="scan__btn scan__btn--primary" onClick={onAgain}>
        📷 Scan another
      </button>
    </div>
  );
}

function NoMatchView({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="scan__result">
      <div className="scan__pills">
        <span className="pill">No match</span>
      </div>
      <h2 className="scan__title">Hmm, no plant found</h2>
      <p className="scan__copy">
        We couldn’t confidently match that photo to a Plantdex species. Try
        getting closer, filling the frame with leaves or flowers, and good light.
      </p>
      <button className="scan__btn scan__btn--primary" onClick={onAgain}>
        📷 Try again
      </button>
    </div>
  );
}

function ErrorView({ message, onAgain }: { message: string; onAgain: () => void }) {
  return (
    <div className="scan__result">
      <div className="scan__pills">
        <span className="scan__health scan__health--down">Scan failed</span>
      </div>
      <h2 className="scan__title">Something went wrong</h2>
      <p className="scan__copy scan__error">{message}</p>
      <button className="scan__btn scan__btn--primary" onClick={onAgain}>
        Try again
      </button>
    </div>
  );
}
