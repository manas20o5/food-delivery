export const STEPS = ["PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

export const LABEL = {
  PLACED: "Order placed",
  ACCEPTED: "Restaurant accepted",
  PREPARING: "Being prepared",
  READY: "Ready for pickup",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function Badge({ status }) {
  return <span className={`badge ${status}`}>{LABEL[status]}</span>;
}

// Vertical timeline; steps up to the current status are filled in
export function Timeline({ status }) {
  if (status === "CANCELLED") return <p className="muted">This order was cancelled.</p>;
  const at = STEPS.indexOf(status);
  return (
    <ol className="timeline">
      {STEPS.map((s, i) => (
        <li key={s} className={i < at ? "done" : i === at ? "now" : ""}>{LABEL[s]}</li>
      ))}
    </ol>
  );
}
