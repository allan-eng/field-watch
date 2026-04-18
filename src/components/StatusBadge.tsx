import { cn } from "@/lib/utils";
import { FieldStatus, STATUS_LABEL } from "@/lib/status";

const styles: Record<FieldStatus, string> = {
  active: "bg-status-active/10 text-status-active border-status-active/30",
  at_risk: "bg-status-risk/15 text-status-risk border-status-risk/40",
  completed: "bg-status-completed/10 text-status-completed border-status-completed/30",
};

export function StatusBadge({ status, className }: { status: FieldStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
