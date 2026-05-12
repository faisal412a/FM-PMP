import { rows, run } from "./db";

export function refreshPaymentStatuses(projectId?: number) {
  const scope = projectId ? "where project_id = ?" : "";
  const params = projectId ? [projectId] : [];
  const payments = rows<{ id: number; payment_amount: number; paid_amount: number; due_date: string | null }>(
    `select id, payment_amount, paid_amount, due_date from payment_terms ${scope}`,
    params
  );

  const today = new Date().toISOString().slice(0, 10);
  payments.forEach((payment) => {
    const balance = Math.max(0, Number(payment.payment_amount) - Number(payment.paid_amount || 0));
    let status = "Pending";
    if (balance <= 0) status = "Paid";
    else if (Number(payment.paid_amount || 0) > 0) status = "Partially Paid";
    if (balance > 0 && payment.due_date && payment.due_date < today) status = "Overdue";
    run("update payment_terms set balance_amount = ?, status = ? where id = ?", [balance, status, payment.id]);
  });
}

export function refreshPhaseDelays(projectId?: number) {
  const scope = projectId ? "where project_id = ?" : "";
  const params = projectId ? [projectId] : [];
  const phases = rows<{ id: number; planned_completion_date: string | null; status: string }>(
    `select id, planned_completion_date, status from project_phases ${scope}`,
    params
  );
  const today = new Date();

  phases.forEach((phase) => {
    let delay = 0;
    let status = phase.status;
    if (phase.planned_completion_date && phase.status !== "Completed") {
      delay = Math.max(0, Math.ceil((today.getTime() - new Date(phase.planned_completion_date).getTime()) / 86400000));
      if (delay > 0) status = "Delayed";
    }
    run("update project_phases set delay_days = ?, status = ? where id = ?", [delay, status, phase.id]);
  });
}

export function projectSummary(projectId: number) {
  refreshPaymentStatuses(projectId);
  refreshPhaseDelays(projectId);
  const payments = rows<{ payment_amount: number; paid_amount: number; balance_amount: number; status: string }>(
    "select payment_amount, paid_amount, balance_amount, status from payment_terms where project_id = ?",
    [projectId]
  );
  const phases = rows<{ completion_percentage: number; status: string; delay_days: number }>(
    "select completion_percentage, status, delay_days from project_phases where project_id = ?",
    [projectId]
  );
  const planned = payments.reduce((sum, item) => sum + Number(item.payment_amount || 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
  const balance = payments.reduce((sum, item) => sum + Number(item.balance_amount || 0), 0);
  const overdue = payments
    .filter((item) => item.status === "Overdue")
    .reduce((sum, item) => sum + Number(item.balance_amount || 0), 0);
  const progress = phases.length
    ? phases.reduce((sum, item) => sum + Number(item.completion_percentage || 0), 0) / phases.length
    : 0;

  return {
    planned,
    paid,
    balance,
    overdue,
    paymentCompletion: planned ? (paid / planned) * 100 : 0,
    progress,
    delayedPhases: phases.filter((item) => item.status === "Delayed").length,
    completedPhases: phases.filter((item) => item.status === "Completed").length,
    pendingPhases: phases.filter((item) => item.status !== "Completed").length,
    delayDays: phases.reduce((sum, item) => Math.max(sum, Number(item.delay_days || 0)), 0)
  };
}
