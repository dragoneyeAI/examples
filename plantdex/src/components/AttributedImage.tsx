import { useState } from "react";
import type { PlantImage } from "../types/plant";
import "./AttributedImage.css";

interface Props {
  image: PlantImage;
  alt: string;
  /** Show the small license/author caption (detail view). */
  showCredit?: boolean;
  /** Use the full-res url instead of the thumb. */
  full?: boolean;
  className?: string;
}

/** Lazy plant image with a shimmer placeholder, fade-in, and a graceful
 *  fallback if the remote Wikimedia URL fails. Credit caption is opt-in. */
export function AttributedImage({
  image,
  alt,
  showCredit,
  full,
  className,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const src = full ? image.url : image.thumbUrl;

  return (
    <figure className={"attr-img" + (className ? " " + className : "")}>
      {!loaded && !errored && <div className="attr-img__shimmer shimmer" />}
      {errored ? (
        <div className="attr-img__fallback" aria-label={alt}>
          🌱
        </div>
      ) : (
        <img
          className={"attr-img__img" + (loaded ? " is-loaded" : "")}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
      {showCredit && (
        <figcaption className="attr-img__credit">
          {image.attribution.author ? `${image.attribution.author} · ` : ""}
          {image.attribution.sourceUrl ? (
            <a
              href={image.attribution.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {image.attribution.license}
            </a>
          ) : (
            image.attribution.license
          )}{" "}
          · via Wikimedia Commons
        </figcaption>
      )}
    </figure>
  );
}
