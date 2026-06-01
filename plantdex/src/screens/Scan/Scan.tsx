import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen } from "../../components/Screen";
import { DexHeader } from "../../components/DexHeader";
import { AttributedImage } from "../../components/AttributedImage";
import { DiscoveryBurst } from "../../components/DiscoveryBurst";
import { useStore } from "../../store/StoreProvider";
import { themeFor } from "../../data/typeTheme";
import { predictPlantFromFile, type ScanResult } from "../../scan/dragoneyeClient";
import { checkHealth } from "../../api/health";
import "./Scan.css";

type Status = "idle" | "identifying" | "result" | "nomatch" | "error";

export function Scan() {
  const { isDiscovered, discover } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [burst, setBurst] = useState(false);
  // null while we ask the server (via /api/health) whether scanning is available
  // — i.e. whether DRAGONEYE_API_KEY is set. Drives the "setup needed" prompt.
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((h) => setConfigured(h.scan.configured))
      .catch(() => {
        if (!controller.signal.aborted) setConfigured(false);
      });
    return () => controller.abort();
  }, []);

  // Revoke the captured-photo object URL when it changes / on unmount.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStatus("identifying");
    setResult(null);

    try {
      const scan = await predictPlantFromFile(file);
      setResult(scan);
      setStatus(scan.match ? "result" : "nomatch");
    } catch (err) {
      console.error("[scan] prediction failed:", err);
      setErrorMsg(
        navigator.onLine
          ? "Something went wrong identifying that photo. Please try again."
          : "You’re offline — scanning needs a connection. Reconnect and try again.",
      );
      setStatus("error");
    }
  };

  const onAdd = async () => {
    if (!result?.match) return;
    const { plant, confidence } = result.match;
    const { isNew } = await discover(plant.id, "scan", {
      confidence,
      rawPrediction: { matchedOn: result.match.matchedOn, topGuesses: result.topGuesses },
    });
    if (isNew) setBurst(true);
  };

  return (
    <Screen>
      <DexHeader title="Scan" subtitle="Identify a plant with your camera" />
      <DiscoveryBurst show={burst} onDone={() => setBurst(false)} />

      {/* Capture surface: live reticle, or the captured photo once taken. */}
      <div className="scan__frame">
        <div className="scan__reticle">
          <span className="scan__corner scan__corner--tl" />
          <span className="scan__corner scan__corner--tr" />
          <span className="scan__corner scan__corner--bl" />
          <span className="scan__corner scan__corner--br" />
          {photoUrl ? (
            <>
              <img className="scan__photo" src={photoUrl} alt="Your photo" />
              {status === "identifying" && <div className="scan__sweep" />}
            </>
          ) : (
            <>
              <div className="scan__sweep" />
              <span className="scan__leaf" aria-hidden>🌿</span>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFile}
      />

      {configured === null ? (
        <div className="scan__panel">
          <h2 className="scan__title scan__title--pulse">Warming up…</h2>
          <p className="scan__copy">Checking that scanning is available.</p>
        </div>
      ) : !configured ? (
        <div className="scan__panel">
          <span className="pill">Setup needed</span>
          <h2 className="scan__title">Scanning isn’t configured</h2>
          <p className="scan__copy">
            Scans run through this site’s <code>/api/scan</code> function, which needs a{" "}
            <code>DRAGONEYE_API_KEY</code> set on the server — a Cloudflare Pages
            environment variable in production, or <code>plantdex/.dev.vars</code> for local{" "}
            <code>pnpm pages:dev</code>. Create a key at{" "}
            <a href="https://playground.dragoneye.ai/account" target="_blank" rel="noreferrer">
              playground.dragoneye.ai
            </a>.
          </p>
        </div>
      ) : status === "idle" ? (
        <div className="scan__panel">
          <h2 className="scan__title">Point, shoot, discover</h2>
          <p className="scan__copy">
            Snap a photo of any plant and Plantdex will identify the species and add
            it to your collection.
          </p>
          <button className="scan__btn scan__btn--go" onClick={onPick}>
            📷 Take a photo
          </button>
        </div>
      ) : status === "identifying" ? (
        <div className="scan__panel">
          <h2 className="scan__title scan__title--pulse">Identifying…</h2>
          <p className="scan__copy">Matching your photo against the Plantdex.</p>
        </div>
      ) : status === "result" && result?.match ? (
        <ResultCard
          result={result}
          alreadyHave={isDiscovered(result.match.plant.id)}
          onAdd={onAdd}
          onAgain={reset}
        />
      ) : status === "nomatch" ? (
        <div className="scan__panel">
          <span className="pill">No match</span>
          <h2 className="scan__title">Hmm, not sure about that one</h2>
          <p className="scan__copy">
            That plant isn’t in the Plantdex yet, or the photo was tricky. Try a
            clearer, closer shot of the leaves or flowers.
          </p>
          {result && result.topGuesses.length > 0 && (
            <p className="scan__guesses">
              Closest guesses:{" "}
              {result.topGuesses
                .map((g) => `${g.name} (${Math.round(g.score * 100)}%)`)
                .join(", ")}
            </p>
          )}
          <button className="scan__btn scan__btn--go" onClick={reset}>
            ↺ Scan again
          </button>
        </div>
      ) : (
        <div className="scan__panel">
          <span className="pill">Error</span>
          <h2 className="scan__title">Couldn’t scan that</h2>
          <p className="scan__copy">{errorMsg}</p>
          <button className="scan__btn scan__btn--go" onClick={reset}>
            ↺ Try again
          </button>
        </div>
      )}
    </Screen>
  );
}

function ResultCard({
  result,
  alreadyHave,
  onAdd,
  onAgain,
}: {
  result: ScanResult;
  alreadyHave: boolean;
  onAdd: () => void;
  onAgain: () => void;
}) {
  const { plant, confidence } = result.match!;
  const theme = themeFor(plant.types);
  const pct = Math.round(confidence * 100);

  return (
    <motion.div
      className="scan__result"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        className="scan__result-hero"
        style={{
          background: `linear-gradient(160deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
        }}
      >
        <AttributedImage image={plant.image} alt={plant.commonName} className="scan__result-img" />
      </div>

      <span className="pill">It’s a match · {pct}% sure</span>
      <h2 className="scan__title">{plant.commonName}</h2>
      <p className="scan__latin">{plant.latinName}</p>

      {alreadyHave ? (
        <div className="scan__already">✓ Already in your dex</div>
      ) : (
        <button
          className="scan__btn scan__btn--go"
          style={{ background: theme.color }}
          onClick={onAdd}
        >
          + Add to your dex
        </button>
      )}

      <div className="scan__result-actions">
        <Link className="scan__link" to={`/plant/${plant.id}`}>
          View details →
        </Link>
        <button className="scan__link scan__link--btn" onClick={onAgain}>
          ↺ Scan again
        </button>
      </div>
    </motion.div>
  );
}
