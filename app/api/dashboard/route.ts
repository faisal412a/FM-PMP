import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { rows } from "@/lib/db";
import { refreshPaymentStatuses, refreshPhaseDelays } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  const auth = requireUser(request, "project:read");
  if ("error" in auth) return auth.error;
  refreshPaymentStatuses();
  refreshPhaseDelays();

  const projects = rows<any>("select * from projects order by created_at desc");
  const payments = rows<any>("select payment_terms.*, projects.name as project_name from payment_terms join projects on projects.id = payment_terms.project_id");
  const evaluations = rows<any>("select projects.supplier_name, avg(average_rating) as rating from supplier_evaluations join projects on projects.id = supplier_evaluations.project_id group by projects.supplier_name");
  const monthly = rows<any>("select substr(start_date, 1, 7) as month, sum(project_value) as value from projects group by substr(start_date, 1, 7) order by month");

  const cards = {
    totalProjects: projects.length,
    inProgress: projects.filter((p) => p.status === "In Progress").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    delayed: projects.filter((p) => p.status === "Delayed").length,
    onHold: projects.filter((p) => p.status === "On Hold").length,
    totalValue: projects.reduce((sum, p) => sum + Number(p.project_value || 0), 0),
    totalPaid: payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0),
    totalBalance: payments.reduce((sum, p) => sum + Number(p.balance_amount || 0), 0),
    totalOverdue: payments.filter((p) => p.status === "Overdue").reduce((sum, p) => sum + Number(p.balance_amount || 0), 0),
    upcoming30: upcomingAmount(payments, 30),
    upcoming90: upcomingAmount(payments, 90)
  };

  return json({
    cards,
    statusChart: ["In Progress", "Completed", "Delayed", "On Hold", "Cancelled"].map((status) => ({
      name: status,
      value: projects.filter((p) => p.status === status).length
    })),
    monthly,
    paymentsChart: [
      { name: "Planned", value: payments.reduce((sum, p) => sum + Number(p.payment_amount || 0), 0) },
      { name: "Paid", value: cards.totalPaid },
      { name: "Balance", value: cards.totalBalance }
    ],
    supplierRatings: evaluations,
    delayedProjects: projects.filter((p) => p.status === "Delayed"),
    upcomingPayments: payments
      .filter((p) => p.status !== "Paid")
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
      .slice(0, 8)
  });
}

function upcomingAmount(payments: any[], days: number) {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + days);
  return payments
    .filter((payment) => payment.status !== "Paid" && payment.due_date)
    .filter((payment) => {
      const due = new Date(payment.due_date);
      return due >= today && due <= end;
    })
    .reduce((sum, payment) => sum + Number(payment.balance_amount || 0), 0);
}
