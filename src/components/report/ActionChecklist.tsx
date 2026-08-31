import React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface ActionItem {
  actionId?: string;
  actionTitle: string;
  actionDetail: string;
  whyItMayHelp?: string;
}

interface ActionChecklistProps {
  actions: ActionItem[];
}

export function ActionChecklist({ actions }: ActionChecklistProps) {
  return (
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <div
          key={action.actionId || idx}
          className="rounded-2xl border border-cream-dark bg-milk p-4.5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h4 className="text-[15.5px] font-bold text-cocoa">
                {action.actionTitle}
              </h4>
              <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa-soft">
                {action.actionDetail}
              </p>
              {action.whyItMayHelp && (
                <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-cream/70 px-3 py-2 text-[12.5px] text-cocoa-soft">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                  <span>{action.whyItMayHelp}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
