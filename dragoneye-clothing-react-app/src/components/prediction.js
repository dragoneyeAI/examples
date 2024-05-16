import "./prediction.css";
import { LabelGroup, Label, DataBlock } from "./display";

function TaxonPrediction({ prediction }) {
  const { id, score, displayName, children } = prediction;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 16,
      }}
    >
      <LabelGroup>
        <Label label="ID" value={id} />
        <Label label="Name" value={displayName} />
        {score ? <Label label="Score" value={score.toFixed(2)} /> : null}
      </LabelGroup>
      {children.length > 0 ? (
        <>
          <p style={{ alignSelf: "center" }}>→</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {children.map((child) => (
              <TaxonPrediction prediction={child} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CategoryPrediction({ prediction }) {
  return (
    <DataBlock>
      <TaxonPrediction prediction={prediction} />
    </DataBlock>
  );
}

function TraitTypePrediction({ prediction }) {
  const { id, displayName, taxons } = prediction;

  return (
    <DataBlock>
      <LabelGroup>
        <Label label="ID" value={id} />
        <Label label="Name" value={displayName} />
      </LabelGroup>
      {taxons.length > 0 ? (
        <>
          <p style={{ alignSelf: "center" }}>→</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            {taxons.map((taxon) => (
              <TaxonPrediction prediction={taxon} />
            ))}
          </div>
        </>
      ) : null}
    </DataBlock>
  );
}

function NormalizedBbox({ normalizedBbox }) {
  return (
    <DataBlock>
      <LabelGroup>
        <Label
          label="X"
          value={`${normalizedBbox[0].toFixed(2)} ↔ ${normalizedBbox[2].toFixed(
            2
          )}`}
        />
        <Label
          label="Y"
          value={`${normalizedBbox[1].toFixed(2)} ↔ ${normalizedBbox[3].toFixed(
            2
          )}`}
        />
      </LabelGroup>
    </DataBlock>
  );
}

export function PredictionResult({ prediction }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 16,
        justifyItems: "start",
        backgroundColor: "#f0f0f0",
        color: "#555",
        borderRadius: 12,
        fontSize: 20,
        padding: 12,
        marginTop: 12,
      }}
    >
      <p className="label" style={{ justifySelf: "end" }}>
        Normalized Bbox:
      </p>
      <NormalizedBbox normalizedBbox={prediction.normalizedBbox} />
      <p className="label" style={{ justifySelf: "end" }}>
        Category:{" "}
      </p>
      <CategoryPrediction prediction={prediction.category} />
      <p className="label" style={{ justifySelf: "end" }}>
        Traits:
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          justifyItems: "start",
        }}
      >
        {prediction.traits.map((trait) => (
          <TraitTypePrediction prediction={trait} />
        ))}
      </div>
    </div>
  );
}
