export const PIPELINE_STAGES = [
  { id: 'pre_approval', label: 'Pre-approval', description: 'Get pre-approved for a mortgage to know your budget.' },
  { id: 'offer_submitted', label: 'Offer Submitted', description: 'Your offer has been submitted to the seller.' },
  { id: 'offer_accepted', label: 'Offer Accepted', description: 'The seller has accepted your offer.' },
  { id: 'inspection_booked', label: 'Inspection Booked', description: 'Schedule and complete the home inspection.' },
  { id: 'appraisal', label: 'Appraisal', description: 'Property appraisal ordered and completed.' },
  { id: 'lender_selection', label: 'Lender Selection', description: 'Choose your mortgage lender.' },
  { id: 'loan_processing', label: 'Loan Processing', description: 'Loan is being processed by your lender.' },
  { id: 'clear_to_close', label: 'Clear to Close', description: 'Lender has cleared you to close.' },
  { id: 'closing', label: 'Closing', description: 'Sign documents and get the keys.' },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]['id'];

export function getStageIndex(stageId: string): number {
  const i = PIPELINE_STAGES.findIndex((s) => s.id === stageId);
  return i >= 0 ? i : 0;
}

export function getStageStatus(
  stageId: string,
  currentStage: string,
  stageCompletedAt: Record<string, string>
): 'pending' | 'active' | 'complete' {
  const currentIdx = getStageIndex(currentStage);
  const thisIdx = getStageIndex(stageId);
  if (stageCompletedAt[stageId]) return 'complete';
  if (thisIdx < currentIdx) return 'complete';
  if (thisIdx === currentIdx) return 'active';
  return 'pending';
}

export function getCtaForStage(stageId: string, propertyId?: string): { label: string; href: string } | null {
  const q = propertyId ? `?propertyId=${propertyId}` : '';
  switch (stageId) {
    case 'pre_approval':
      return { label: 'Get pre-approved', href: '/preapproval' };
    case 'offer_submitted':
      return { label: 'View offer', href: '/offers' };
    case 'offer_accepted':
      return null;
    case 'inspection_booked':
      return { label: 'Book inspection', href: `/dashboard/inspections${q}` };
    case 'appraisal':
      return null;
    case 'lender_selection':
      return { label: 'Select lender', href: `/dashboard/lenders${q}` };
    case 'loan_processing':
      return null;
    case 'clear_to_close':
      return null;
    case 'closing':
      return null;
    default:
      return null;
  }
}
