import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { computeStatus, FieldStage, FieldStatus, STATUS_LABEL } from "@/lib/status";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { StageBadge } from "@/components/StageBadge";
import { Wheat, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

interface Row {
  id: string;
  name: string;
  crop_type: string;
  current_stage: FieldStage;
  planting_date: string;
  last_update_at: string;
  assigned_agent_id: string | null;
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("fields")
        .select("id, name, crop_type, current_stage, planting_date, last_update_at, assigned_agent_id")
        .order("last_update_at", { ascending: false });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const withStatus = rows.map((r) => ({ ...r, status: computeStatus(r) as FieldStatus }));
  const counts: Record<FieldStatus, number> = {
    active: withStatus.filter((r) => r.status === "active").length,
    at_risk: withStatus.filter((r) => r.status === "at_risk").length,
    completed: withStatus.filter((r) => r.status === "completed").length,
  };
  const recent = withStatus.slice(0, 6);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold mb-1">
          {role === "admin" ? "Coordinator dashboard" : "Your fields"}
        </h1>
        <p className="text-muted-foreground">
          {role === "admin"
            ? "All fields across your team — at a glance."
            : "Fields assigned to you this season."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Wheat className="h-5 w-5" />} label="Total fields" value={rows.length} accent="bg-primary/10 text-primary" />
        <StatCard icon={<Activity className="h-5 w-5" />} label={STATUS_LABEL.active} value={counts.active} accent="bg-status-active/10 text-status-active" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label={STATUS_LABEL.at_risk} value={counts.at_risk} accent="bg-status-risk/15 text-status-risk" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label={STATUS_LABEL.completed} value={counts.completed} accent="bg-status-completed/10 text-status-completed" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <button onClick={() => navigate("/fields")} className="text-sm text-primary hover:underline">
            View all fields →
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <Wheat className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {role === "admin" ? "No fields yet — create one to get started." : "No fields assigned yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {recent.map((f) => (
              <li
                key={f.id}
                onClick={() => navigate(`/fields/${f.id}`)}
                className="px-5 py-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
              >
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {f.crop_type} · last update {new Date(f.last_update_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StageBadge stage={f.current_stage} />
                  <StatusBadge status={f.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <Card className="p-4 bg-gradient-card shadow-soft">
      <div className={`inline-flex p-2 rounded-md ${accent} mb-3`}>{icon}</div>
      <div className="font-display text-3xl font-semibold leading-none">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}
