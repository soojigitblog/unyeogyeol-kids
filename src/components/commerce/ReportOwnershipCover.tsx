interface ReportOwnershipCoverProps {
  childName: string;
  caregiverRoleLabel: string;
  concernLabel: string;
  createdAt: string;
  productTitle?: string;
}

export function ReportOwnershipCover({
  childName,
  caregiverRoleLabel,
  concernLabel,
  createdAt,
  productTitle = "우리 아이 × 나 관계 사용설명서",
}: ReportOwnershipCoverProps) {
  const dateLabel = createdAt.slice(0, 10).replace(/-/g, ".");

  return (
    <div className="rounded-3xl border border-coral-tint bg-gradient-to-b from-cream via-milk to-sage-tint/30 p-6 shadow-sm">
      <p className="text-[12px] font-bold tracking-wider text-coral-deep">내 관계 사용설명서</p>
      <p className="mt-3 text-[22px] font-bold leading-snug text-cocoa">
        {caregiverRoleLabel} × {childName}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-cocoa-soft">{productTitle}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-medium">
        <span className="rounded-lg bg-milk px-2.5 py-1 text-cocoa">고민: {concernLabel}</span>
        <span className="rounded-lg bg-milk px-2.5 py-1 text-cocoa">생성: {dateLabel}</span>
      </div>
    </div>
  );
}
