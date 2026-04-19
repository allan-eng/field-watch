import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 px-5 py-5 shadow-soft backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary/70">CropTrack</p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
