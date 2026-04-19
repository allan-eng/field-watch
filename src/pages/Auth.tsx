import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  role: z.enum(["admin", "agent"]),
});
const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  /** Radix RadioGroup does not submit with FormData — keep role in state. */
  const [signUpRole, setSignUpRole] = useState<"admin" | "agent">("agent");

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      password: fd.get("password"),
      role: signUpRole,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.full_name, role: parsed.data.role },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created!");
    navigate("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(60_30%_97%_/_0.18),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(32_80%_55%_/_0.16),transparent_32%)]" />
        <div className="relative flex items-center gap-2">
          <Sprout className="h-7 w-7" />
          <span className="font-display text-2xl font-semibold">CropTrack</span>
        </div>
        <div className="relative max-w-lg">
          <div className="mb-5 inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground/85">
            Field monitoring made simple
          </div>
          <h1 className="mb-4 font-display text-5xl leading-tight">
            Watch your fields<br/>grow with clarity.
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Coordinate agents, track stages, spot risks early — across every field, every season.
          </p>
        </div>
        <div className="relative flex items-center justify-between gap-6 text-sm text-primary-foreground/65">
          <span>© CropTrack — growing season ’26</span>
          <span className="hidden rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs sm:inline-flex">
            Coordinator + Agent workflows
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 text-primary">
            <Sprout className="h-6 w-6" />
            <span className="font-display text-xl font-semibold">CropTrack</span>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/75 p-4 shadow-elevated backdrop-blur-xl sm:p-6">
            <div className="mb-6 space-y-2 px-1">
              <h2 className="font-display text-3xl font-semibold">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to monitor field progress, coordinate updates, and keep your team aligned.
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-muted/80 p-1">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 rounded-2xl bg-background/55 p-1">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 rounded-2xl bg-background/55 p-1">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="full_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" name="password" type="password" minLength={8} required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <RadioGroup
                    value={signUpRole}
                    onValueChange={(v) => setSignUpRole(v as "admin" | "agent")}
                    className="grid grid-cols-2 gap-2"
                  >
                    <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="agent" /> Field Agent
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="admin" /> Coordinator
                    </label>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
