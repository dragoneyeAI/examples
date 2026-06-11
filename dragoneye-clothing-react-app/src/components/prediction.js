import "./prediction.css";
import { LabelGroup, Label, DataBlock } from "./display";

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

function CategoryPrediction({ category }) {
  return (
    <DataBlock>
      <LabelGroup>
        <Label label="ID" value={category.category_id} />
        <Label label="Name" value={category.name} />
        <Label label="Score" value={category.score.toFixed(2)} />
      </LabelGroup>
    </DataBlock>
  );
}

function AttributePrediction({ attribute }) {
  // For an image, an attribute holds a single chosen option with one score.
  const score = attribute.score;
  return (
    <DataBlock>
      <LabelGroup>
        <Label label="Attribute" value={attribute.attribute_name} />
        <Label label="Value" value={attribute.option_name} />
        {score != null ? <Label label="Score" value={score.toFixed(2)} /> : null}
      </LabelGroup>
    </DataBlock>
  );
}

export function PredictionResult({ object }) {
  // The server returns one detected object per detection. Each object carries its
  // bbox observation, its categories, and each category's predicted attributes.
  const bbox = object.bbox_observation?.normalized_bbox;

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
      {bbox ? (
        <>
          <p className="label" style={{ justifySelf: "end" }}>
            Normalized Bbox:
          </p>
          <NormalizedBbox normalizedBbox={bbox} />
        </>
      ) : null}

      {object.categories.map((category) => (
        <PerCategory key={category.category_id} category={category} />
      ))}
    </div>
  );
}

function PerCategory({ category }) {
  return (
    <>
      <p className="label" style={{ justifySelf: "end" }}>
        Category:{" "}
      </p>
      <CategoryPrediction category={category} />
      <p className="label" style={{ justifySelf: "end" }}>
        Attributes:
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          justifyItems: "start",
        }}
      >
        {category.attributes.map((attribute) => (
          <AttributePrediction
            key={attribute.attribute_id}
            attribute={attribute}
          />
        ))}
      </div>
    </>
  );
}
