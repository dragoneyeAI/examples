import "./display.css";

export function Label({ label, value }) {
  return (
    <div style={{ display: "contents" }}>
      <p style={{ fontWeight: "bold" }}>{`${label}:`}</p>
      <p>{value}</p>
    </div>
  );
}

export function LabelGroup({ children }) {
  return (
    <div className="labelGroupWrapper">
      <div className="labelGroup">{children}</div>
    </div>
  );
}

export function DataBlock({ children }) {
  return <div className="dataBlock">{children}</div>;
}
