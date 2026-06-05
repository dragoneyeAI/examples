import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen } from "../../components/Screen";
import { useDexHeader } from "../../components/DexHeaderContext";
import { AttributedImage } from "../../components/AttributedImage";
import { TypeBadge } from "../../components/TypeBadge";
import { DiscoveryBurst } from "../../components/DiscoveryBurst";
import { checkHealth } from "../../api/health";
import { useStore } from "../../store/StoreProvider";
import { PLANTS } from "../../data/plants";
import { themeFor } from "../../data/typeTheme";
import { scanPhoto, ScanError } from "../../scan/dragoneyeClient";
import {
  mapPredictionToPlant,
  type PlantMatch,
} from "../../scan/mapPredictionToPlant";
import "./Scan.css";

// "checking" → liveness probe in flight. "ok" → Function up + key set.
// "setup" → Function up but DRAGONEYE_API_KEY missing. "down" → unreachable.
type HealthState = "checking" | "ok" | "setup" | "down";

// The scan lifecycle. We keep the captured photo's object URL around for the
// preview in every non-idle phase.
type Phase =
  | { kind: "idle" }
  | { kind: "scanning"; preview: string }
  | { kind: "result"; preview: string; match: PlantMatch; isNew: boolean }
  | { kind: "nomatch"; preview: string }
  | { kind: "error"; preview: string; message: string };

export function Scan() {
  useDexHeader({ title: "Scan", subtitle: "Identify a plant with your camera" });

  const store = useStore();
  const [health, setHealth] = useState<HealthState>("checking");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [burst, setBurst] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Liveness + configuration probe on open: tells us whether to even offer the
  // camera, or to show the "setup needed" prompt (see /api/health).
  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.status !== "ok") setHealth("down");
        else setHealth(res.dragoneyeConfigured ? "ok" : "setup");
      })
      .catch((err) => {
        if (!controller.signal.aborted) setHealth("down");
        void err;
      });
    return () => controller.abort();
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  // Tidy up the in-flight request and the object URL when leaving the screen.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      revokePreview();
    },
    [revokePreview],
  );

  const openCamera = useCallback(() => fileInputRef.current?.click(), []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so picking the same file again still fires onChange.
      e.target.value = "";
      if (!file) return;

      abortRef.current?.abort();
      revokePreview();
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;

      const controller = new AbortController();
      abortRef.current = controller;
      setPhase({ kind: "scanning", preview });

      try {
        const result = await scanPhoto(file, controller.signal);
        if (controller.signal.aborted) return;

        const match = mapPredictionToPlant(result, PLANTS);
        if (!match) {
          setPhase({ kind: "nomatch", preview });
          return;
        }

        const { isNew } = await store.discover(match.plant.id, "scan", {
          confidence: match.confidence,
          rawPrediction: {
            matchedOn: match.matchedOn,
            score: match.confidence,
            bbox: match.bbox,
          },
        });
        if (controller.signal.aborted) return;

        setPhase({ kind: "result", preview, match, isNew });
        if (isNew) setBurst(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ScanError && err.kind === "not_configured") {
          setHealth("setup");
          setPhase({ kind: "idle" });
          revokePreview();
          return;
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setPhase({ kind: "error", preview, message });
      }
    },
    [revokePreview, store],
  );

  const preview = phase.kind === "idle" ? null : phase.preview;
  const scanning = phase.kind === "scanning";

  return (
    <Screen>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFile}
      />

      <div className="scan__frame">
        <div className="scan__reticle">
          <span className="scan__corner scan__corner--tl" />
          <span className="scan__corner scan__corner--tr" />
          <span className="scan__corner scan__corner--bl" />
          <span className="scan__corner scan__corner--br" />
          {preview ? (
            <img className="scan__shot" src={preview} alt="Captured plant" />
          ) : (
            <span className="scan__leaf" aria-hidden>
              🌿
            </span>
          )}
          {scanning && (
            <>
              <div className="scan__sweep" />
              <div className="scan__scanning-label">Identifying…</div>
            </>
          )}
        </div>
      </div>

      <div className="scan__soon">
        <div className="scan__pills">
          <span className={`scan__health scan__health--${health}`}>
            API:{" "}
            {health === "checking"
              ? "…"
              : health === "ok"
                ? "ready"
                : health === "setup"
                  ? "setup needed"
                  : "down"}
          </span>
        </div>

        {/* --- Result: a plant was identified --- */}
        {phase.kind === "result" && (
          <ResultCard match={phase.match} onScanAgain={openCamera} />
        )}

        {/* --- No confident match --- */}
        {phase.kind === "nomatch" && (
          <>
            <h2 className="scan__title">Hmm, not sure 🤔</h2>
            <p className="scan__copy">
              We couldn’t confidently match that to a Plantdex species. Try
              getting closer, filling the frame with one plant, and using good
              light.
            </p>
            <button className="scan__btn scan__btn--go" onClick={openCamera}>
              📷 Try again
            </button>
          </>
        )}

        {/* --- Error --- */}
        {phase.kind === "error" && (
          <>
            <h2 className="scan__title">Scan failed</h2>
            <p className="scan__copy">{phase.message}</p>
            <button className="scan__btn scan__btn--go" onClick={openCamera}>
              📷 Try again
            </button>
          </>
        )}

        {/* --- Scanning --- */}
        {phase.kind === "scanning" && (
          <>
            <h2 className="scan__title">Identifying…</h2>
            <p className="scan__copy">
              Sending your photo to the Plantdex model and matching the most
              prominent plant in frame.
            </p>
          </>
        )}

        {/* --- Idle: setup needed --- */}
        {phase.kind === "idle" && health === "setup" && (
          <>
            <h2 className="scan__title">Setup needed</h2>
            <p className="scan__copy">
              The scan service is running but has no Dragoneye API key. Add{" "}
              <code>DRAGONEYE_API_KEY</code> to <code>.dev.vars</code> (local) or
              the Cloudflare Pages dashboard (production), then reload.
            </p>
          </>
        )}

        {/* --- Idle: backend down --- */}
        {phase.kind === "idle" && health === "down" && (
          <>
            <h2 className="scan__title">Scan offline</h2>
            <p className="scan__copy">
              Can’t reach the scan service. Run <code>pnpm pages:dev</code> to
              serve the Pages Functions locally, or check your connection.
            </p>
          </>
        )}

        {/* --- Idle: ready (or still checking) --- */}
        {phase.kind === "idle" && (health === "ok" || health === "checking") && (
          <>
            <h2 className="scan__title">Point, shoot, discover</h2>
            <p className="scan__copy">
              Snap a photo of any plant and Plantdex will identify it — then add
              it to your collection automatically.
            </p>
            <ul className="scan__how">
              <li>📷 Capture a plant with your camera</li>
              <li>🧠 Our model predicts the species</li>
              <li>✨ It’s saved to your dex as a discovery</li>
            </ul>
            <button
              className="scan__btn scan__btn--go"
              onClick={openCamera}
              disabled={health === "checking"}
            >
              📷 Open camera
            </button>
          </>
        )}
      </div>

      <DiscoveryBurst show={burst} onDone={() => setBurst(false)} />
    </Screen>
  );
}

/** The "identified!" panel: hero image, name, confidence, types, and actions. */
function ResultCard({
  match,
  onScanAgain,
}: {
  match: PlantMatch;
  onScanAgain: () => void;
}) {
  const { plant, confidence } = match;
  const theme = themeFor(plant.types);
  const pct = Math.round(confidence * 100);

  return (
    <motion.div
      className="scan-result"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      style={{ "--accent": theme.color } as React.CSSProperties}
    >
      <div className="scan-result__badge">Identified ✓</div>
      <Link to={`/plant/${plant.id}`} className="scan-result__media">
        <AttributedImage image={plant.image} alt={plant.commonName} />
      </Link>
      <div className="scan-result__name">{plant.commonName}</div>
      <div className="scan-result__latin">{plant.latinName}</div>

      <div className="scan-result__types">
        {plant.types.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </div>

      <div className="scan-result__confidence">
        <div className="scan-result__bar">
          <span style={{ width: `${pct}%`, background: theme.color }} />
        </div>
        <span className="scan-result__pct">{pct}% match</span>
      </div>

      <div className="scan-result__actions">
        <Link to={`/plant/${plant.id}`} className="scan__btn scan__btn--ghost">
          View in Dex
        </Link>
        <button className="scan__btn scan__btn--go" onClick={onScanAgain}>
          📷 Scan another
        </button>
      </div>
    </motion.div>
  );
}
