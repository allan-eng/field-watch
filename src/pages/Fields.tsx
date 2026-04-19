import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { computeStatus, FieldStage, FieldStatus } from "@/lib/status";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { StageBadge } from "@/components/StageBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wheat } from "lucide-react";
import { toast } from "sonner";

interface Row {
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

interface Profile { id: string; full_name: string | null; email: string | null }

const fieldSchema = z.object({
  name: z.string().trim().min(2).max(80),
  crop_type: z.string().trim().min(2).max(60),
  planting_date: z.string().min(1),
  size_hectares: z.string().optional(),
  location: z.string().max(120).optional(),
  assigned_agent_id: z.string().optional(),
});

export default function Fields() {
  const { role, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  /** Radix Select does not submit with FormData — track assignment in state. */
  const [assignAgentId, setAssignAgentId] = useState<string>("none");

  const load = async () => {
    const { data } = await supabase
      .from("fields")
      .select("*")
      .order("last_update_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  const loadAgents = async () => {
    // get agent user_ids then their profiles
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "agent");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setAgents([]); return; }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    setAgents((profs ?? []) as Profile[]);
  };

  useEffect(() => {
    load();
    if (role === "admin") loadAgents();
  }, [role]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = fieldSchema.safeParse({
      name: fd.get("name"),
      crop_type: fd.get("crop_type"),
      planting_date: fd.get("planting_date"),
      size_hectares: fd.get("size_hectares"),
      location: fd.get("location"),
      assigned_agent_id: assignAgentId,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const v = parsed.data;
    const { error } = await supabase.from("fields").insert({
      name: v.name,
      crop_type: v.crop_type,
      planting_date: v.planting_date,
      size_hectares: v.size_hectares ? Number(v.size_hectares) : null,
      location: v.location || null,
      assigned_agent_id: v.assigned_agent_id && v.assigned_agent_id !== "none" ? v.assigned_agent_id : null,
      created_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Field created");
    setOpen(false);
    load();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Fields"
        subtitle={role === "admin" ? "Manage, assign, and review every field from one place." : "A streamlined list of fields assigned to you."}
        actions={role === "admin" && (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setAssignAgentId("none");
            }}
          >
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> New field</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create field</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="North Plot" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crop_type">Crop type</Label>
                    <Input id="crop_type" name="crop_type" required placeholder="Maize" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planting_date">Planting date</Label>
                    <Input id="planting_date" name="planting_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size_hectares">Size (ha)</Label>
                    <Input id="size_hectares" name="size_hectares" type="number" step="0.1" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Assign to agent</Label>
                    <Select value={assignAgentId} onValueChange={setAssignAgentId}>
                      <SelectTrigger><SelectValue placeholder="Assign agent" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create field</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      {loading ? (
        <FieldsSkeleton />
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center">
          <Wheat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {role === "admin" ? "No fields yet. Create your first field to get started." : "No fields assigned to you yet."}
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((f) => {
            const status = computeStatus(f) as FieldStatus;
            return (
              <Link key={f.id} to={`/fields/${f.id}`}>
                <Card className="p-5 bg-gradient-card shadow-soft hover:shadow-elevated transition-shadow h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display text-lg font-semibold">{f.name}</div>
                      <div className="text-sm text-muted-foreground">{f.crop_type}</div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StageBadge stage={f.current_stage} />
                    {f.size_hectares && (
                      <span className="text-xs text-muted-foreground">{f.size_hectares} ha</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    Planted {new Date(f.planting_date).toLocaleDateString()} · Last update {new Date(f.last_update_at).toLocaleDateString()}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

function FieldsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-full bg-gradient-card p-5 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mb-5 flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="border-t pt-3">
            <Skeleton className="h-3.5 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
