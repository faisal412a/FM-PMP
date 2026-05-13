import type { RoleName } from "./types";

const permissions: Record<RoleName, string[]> = {
  Admin: ["*"],
  "Data Entry": ["project:read", "project:write", "progress:write", "document:write", "supplier:read", "report:read"],
  "Project Finance": ["project:read", "payment:write", "document:write", "supplier:read", "finance:read", "report:read"],
  Management: ["report:read", "project:read", "supplier:read", "finance:read"]
};

export function can(role: RoleName, action: string) {
  return permissions[role]?.includes("*") || permissions[role]?.includes(action);
}

export function navForRole(role: RoleName) {
  const items = [
    { href: "/", label: "Dashboard", roles: ["Admin", "Data Entry", "Project Finance", "Management"] },
    { href: "/projects", label: "Projects", roles: ["Admin", "Data Entry", "Project Finance", "Management"] },
    { href: "/suppliers", label: "Suppliers", roles: ["Admin", "Data Entry", "Project Finance", "Management"] },
    { href: "/reports", label: "Reports", roles: ["Admin", "Project Finance", "Management", "Data Entry"] },
    { href: "/users", label: "Users", roles: ["Admin"] }
  ];

  return items.filter((item) => item.roles.includes(role));
}
