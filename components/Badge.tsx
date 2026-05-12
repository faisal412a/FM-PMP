export default function Badge({ status }: { status: string }) {
  const color =
    status === "Completed" || status === "Paid" ? "green" :
    status === "In Progress" || status === "Partially Paid" ? "blue" :
    status === "Delayed" || status === "Overdue" || status === "Cancelled" ? "red" :
    status === "On Hold" || status === "Pending" ? "yellow" : "gray";
  return <span className={`badge ${color}`}>{status}</span>;
}
