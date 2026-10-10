import type { BusinessRecord } from "./ports";
export class BusinessError extends Error {
  constructor(
    public readonly code:
      "BUSINESS_FORBIDDEN" | "BUSINESS_CONFLICT" | "MEMBER_UNAVAILABLE",
  ) {
    super(code);
  }
}
export function permissions(record: BusinessRecord) {
  const owner = record.role === "owner" && record.membershipStatus === "active";
  return {
    ...record,
    canManage: owner,
    canHostEvents: owner && record.status === "approved",
    canAccept: record.membershipStatus === "invited",
  };
}
