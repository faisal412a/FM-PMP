export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function pct(value: number | null | undefined) {
  return `${Math.round(Number(value || 0))}%`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}
