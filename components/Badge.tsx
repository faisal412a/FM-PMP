export default function Badge({ status }: { status: string }) {
  const label =
    status === "Pending" ? "Due" :
    status === "Partially Paid" ? "Partial Paid" :
    status === "Overdue" ? "Delayed" : status;
  const color =
    status === "Completed" || status === "Paid" ? "green" :
    status === "In Progress" || status === "Partial Paid" || status === "Partially Paid" ? "blue" :
    status === "Delayed" || status === "Overdue" || status === "Cancelled" ? "red" :
    status === "On Hold" || status === "Pending" || status === "Due" ? "yellow" : "gray";
  return <span className={`badge ${color}`}>{label}</span>;
}
