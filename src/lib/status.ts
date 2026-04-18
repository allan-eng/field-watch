/**
 * Field status logic
 * --------------------
 * A field's status is *computed* from its data (never stored), so it's always
 * accurate.
 *
 *   Completed  → current_stage === 'harvested'
 *   At Risk    → not completed AND any of:
 *                  - no update logged in the last 7 days, OR
 *                  - stage is 'overdue' relative to planting date:
 *                      * still 'planted'  after  30 days
 *                      * still 'growing'  after  90 days
 *                      * still 'ready'    after 120 days
 *   Active     → otherwise
 */

export type FieldStage = "planted" | "growing" | "ready" | "harvested";
export type FieldStatus = "active" | "at_risk" | "completed";

export const STAGE_LABEL: Record<FieldStage, string> = {
  planted: "Planted",
  growing: "Growing",
  ready: "Ready",
  harvested: "Harvested",
};

export const STATUS_LABEL: Record<FieldStatus, string> = {
  active: "Active",
  at_risk: "At Risk",
  completed: "Completed",
};

const STALE_DAYS = 7;
const STAGE_MAX_DAYS: Record<FieldStage, number> = {
  planted: 30,
  growing: 90,
  ready: 120,
  harvested: Infinity,
};

const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export function computeStatus(field: {
  current_stage: FieldStage;
  planting_date: string;
  last_update_at: string;
}): FieldStatus {
  if (field.current_stage === "harvested") return "completed";

  const now = new Date();
  const lastUpdate = new Date(field.last_update_at);
  const planted = new Date(field.planting_date);

  const stale = daysBetween(lastUpdate, now) >= STALE_DAYS;
  const overdue =
    daysBetween(planted, now) > STAGE_MAX_DAYS[field.current_stage];

  return stale || overdue ? "at_risk" : "active";
}

export function nextStage(stage: FieldStage): FieldStage | null {
  const order: FieldStage[] = ["planted", "growing", "ready", "harvested"];
  const i = order.indexOf(stage);
  return i < order.length - 1 ? order[i + 1] : null;
}
