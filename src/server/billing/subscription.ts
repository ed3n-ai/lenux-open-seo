import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AUTUMN_PAID_PLAN_FEATURE_ID } from "@/shared/billing";
import { autumn } from "@/server/billing/autumn";
import { isSuperAdminContext } from "@/server/auth/access-control";
import { AppError } from "@/server/lib/errors";

export type BillingCustomerContext = Pick<
  EnsuredUserContext,
  "organizationId" | "userEmail" | "userId"
> & {
  isSuperAdmin?: boolean;
  projectId?: string;
};

export async function getOrCreateOrganizationCustomer(
  context: BillingCustomerContext,
) {
  const customer = await autumn.customers.getOrCreate({
    customerId: context.organizationId,
    email: context.userEmail,
  });

  if (!customer.id) {
    throw new AppError("INTERNAL_ERROR", "Failed to resolve billing customer");
  }

  return {
    ...customer,
    id: customer.id,
  };
}

export async function customerHasPaidPlan(customerId: string) {
  const result = await autumn.check({
    customerId,
    featureId: AUTUMN_PAID_PLAN_FEATURE_ID,
  });

  return result.allowed;
}

export function customerBypassesBilling(context: BillingCustomerContext) {
  return isSuperAdminContext(context);
}
