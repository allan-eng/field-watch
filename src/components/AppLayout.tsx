import { ReactNode } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sprout, LayoutDashboard, Wheat, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, role, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 flex-col bg-sidebar text-sidebar-foreground p-4 gap-1">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-4">
          <Sprout className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display text-xl font-semibold">CropTrack</span>
        </Link>
        <NavLink to="/dashboard" className={linkCls}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </NavLink>
        <NavLink to="/fields" className={linkCls}>
          <Wheat className="h-4 w-4" /> Fields
        </NavLink>
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
            <div className="font-medium text-sidebar-foreground truncate">{user.email}</div>
            <div className="capitalize">{role === "admin" ? "Coordinator" : "Field Agent"}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-10 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-sidebar-primary" />
          <span className="font-display font-semibold">CropTrack</span>
        </Link>
        <div className="flex items-center gap-2">
          <NavLink to="/fields" className={({isActive}) => cn("text-sm px-2 py-1 rounded", isActive && "bg-sidebar-accent")}>Fields</NavLink>
          <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-sidebar-foreground"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 max-w-6xl">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
