export interface RemovalDocumentMember {
  id?: number | string | null;
  member_status?: string | null;
  approved_at?: string | null;
  approved_by?: number | string | null;
}

export interface RemovalDocumentContext {
  enrollmentStatus?: string | null;
  enrollmentApprovedAt?: string | null;
  renewalMembersAdded?: Array<number | string> | null;
}

export function requiresRemovalDocument(
  member: RemovalDocumentMember | null | undefined,
  context: RemovalDocumentContext = {},
): boolean {
  if (!member) {
    return false;
  }

  if (isRenewalAddedMember(member, context) && !isProvinceApproved(member)) {
    return false;
  }

  if (isProvinceApproved(member)) {
    return true;
  }

  if (member.member_status) {
    return false;
  }

  return ['approved', 'active', 'expired', 'pending_payment'].includes(String(context.enrollmentStatus || ''))
    || Boolean(context.enrollmentApprovedAt);
}

function isProvinceApproved(member: RemovalDocumentMember): boolean {
  return member.member_status === 'approved'
    || Boolean(member.approved_at)
    || Boolean(member.approved_by);
}

function isRenewalAddedMember(
  member: RemovalDocumentMember,
  context: RemovalDocumentContext,
): boolean {
  if (member.id === undefined || member.id === null || !context.renewalMembersAdded?.length) {
    return false;
  }

  const memberId = Number(member.id);
  return context.renewalMembersAdded.some(id => Number(id) === memberId);
}
