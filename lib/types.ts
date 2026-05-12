export type RoleName = "Admin" | "Data Entry" | "Project Finance" | "Management";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: RoleName;
};

export type ProjectStatus = "In Progress" | "Completed" | "On Hold" | "Delayed" | "Cancelled";
export type PaymentStatus = "Pending" | "Partially Paid" | "Paid" | "Overdue";
export type PhaseStatus = "Not Started" | "In Progress" | "Completed" | "Delayed" | "On Hold";
