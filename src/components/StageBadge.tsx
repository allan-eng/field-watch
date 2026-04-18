import { cn } from "@/lib/utils";
import { FieldStage, STAGE_LABEL } from "@/lib/status";

const styles: Record<FieldStage, string> = {
  planted: "bg-stage-planted/15 text-stage-planted",
  growing: "bg-stage-growing/15 text-stage-growing",
  ready: "bg-stage-ready/20 text-foreground",
  harvested: "bg-stage-harvested/15 text-stage-harvested",
};

export function StageBadge({ stage, className }: { stage: FieldStage; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", styles[stage], className)}>
      {STAGE_LABEL[stage]}
    </span>
  );
}
