import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { computeStatus, FieldStage, FieldStatus, nextStage, STAGE_LABEL } from "@/lib/status";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { StageBadge } from "@/components/StageBadge";
import { ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  current_stage: FieldStage;
  planting_date: string;
  last_update_at: string;
  location: string | null;
  size_hectares: number | null;
  assigned_agent_id: string | null;
}
interface Update {
  id: string;
  field_id: string;
  author_id: string;
  stage: FieldStage | null;
  note: string | null;
  created_at: string;
}

const noteSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  stage: z.string().optional(),
}).refine(v => (v.note && v.note.length > 0) || (v.stage && v.stage !== "none"), {
  message: "Add a note or change the stage",
});

export default function FieldDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [field, setField] = useState<Field | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: f } = await supabase.from("fields").select("*").eq("id", id).maybeSingle();
    setField(f as Field | null);
    if (f?.assigned_agent_id) {
      const { data: p } = await supabase
        .from("profiles").select("full_name, email").eq("id", f.assigned_agent_id).maybeSingle();
      setAgentName(p?.full_name || p?.email || null);
    }
    const { data: u } = await supabase
      .from("field_updates").select("*").eq("field_id", id).order("created_at", { ascending: false });
    setUpdates((u ?? []) as Update[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const canPostUpdate =
    field && user && (role === "admin" || field.assigned_agent_id === user.id);

  const handlePostUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!field || !user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = noteSchema.safeParse({
      note: (fd.get("note") as string) ?? "",
      stage: (fd.get("stage") as string) ?? "none",
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const stageVal = parsed.data.stage && parsed.data.stage !== "none"
      ? (parsed.data.stage as FieldStage) : null;
    const { error } = await supabase.from("field_updates").insert({
      field_id: field.id,
      author_id: user.id,
      stage: stageVal,
      note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Update posted");
    (e.target as HTMLFormElement).reset();
    load();
  };

  if (loading) return <AppLayout><div className="text-muted-foreground">Loading…</div></AppLayout>;
  if (!field) return <AppLayout><div className="text-muted-foreground">Field not found.</div></AppLayout>;

  const status = computeStatus(field) as FieldStatus;
  const suggested = nextStage(field.current_stage);

  return (
    <AppLayout>
      <Link to="/fields" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to fields
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold mb-1">{field.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StageBadge stage={field.current_stage} />
            <StatusBadge status={status} />
            <span className="text-sm text-muted-foreground">{field.crop_type}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 bg-gradient-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Calendar className="h-3.5 w-3.5" /> Planted</div>
          <div className="font-medium">{new Date(field.planting_date).toLocaleDateString()}</div>
        </Card>
        <Card className="p-4 bg-gradient-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><MapPin className="h-3.5 w-3.5" /> Location</div>
          <div className="font-medium">{field.location || "—"} {field.size_hectares ? `· ${field.size_hectares} ha` : ""}</div>
        </Card>
        <Card className="p-4 bg-gradient-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><User className="h-3.5 w-3.5" /> Assigned agent</div>
          <div className="font-medium">{agentName || "Unassigned"}</div>
        </Card>
      </div>

      {canPostUpdate && (
        <Card className="p-5 mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">Post update</h2>
          <form onSubmit={handlePostUpdate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="stage">Change stage {suggested && <span className="text-xs text-muted-foreground">(suggested: {STAGE_LABEL[suggested]})</span>}</Label>
              <Select name="stage" defaultValue="none">
                <SelectTrigger id="stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Keep current ({STAGE_LABEL[field.current_stage]}) —</SelectItem>
                  <SelectItem value="planted">Planted</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Notes / observations</Label>
              <Textarea id="note" name="note" rows={3} maxLength={1000} placeholder="Soil moisture, pest sightings, growth, weather…" />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? "Posting…" : "Post update"}</Button>
          </form>
        </Card>
      )}

      <h2 className="font-display text-lg font-semibold mb-3">Activity timeline</h2>
      {updates.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No updates yet.</Card>
      ) : (
        <ol className="space-y-3">
          {updates.map((u) => (
            <li key={u.id}>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleString()}
                  </div>
                  {u.stage && <StageBadge stage={u.stage} />}
                </div>
                {u.note && <p className="text-sm whitespace-pre-wrap">{u.note}</p>}
                {!u.note && u.stage && <p className="text-sm text-muted-foreground italic">Stage updated to {STAGE_LABEL[u.stage]}</p>}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </AppLayout>
  );
}
