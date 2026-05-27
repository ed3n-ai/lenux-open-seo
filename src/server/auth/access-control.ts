import { env } from "cloudflare:workers";

function parseEmailList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(/[,\n;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSuperAdminEmail(userEmail: string) {
  return parseEmailList(env.SUPER_ADMIN_EMAILS).has(
    userEmail.trim().toLowerCase(),
  );
}

export function isSuperAdminContext(context: {
  isSuperAdmin?: boolean;
  userEmail: string;
}) {
  return context.isSuperAdmin === true || isSuperAdminEmail(context.userEmail);
}

export function isAllowedUserEmail(userEmail: string) {
  const allowedEmails = parseEmailList(env.ALLOWED_USER_EMAILS);
  return (
    allowedEmails.size === 0 || allowedEmails.has(userEmail.trim().toLowerCase())
  );
}
