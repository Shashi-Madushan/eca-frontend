import type React from "react";

import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function DashboardPageShell({
  className,
  children,
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-6 lg:space-y-7", className)}>{children}</div>;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: DashboardPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_42%),linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/45">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-black/60 sm:text-[15px]">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-black/8 bg-white/88 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-black/45">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">{value}</div>
      {helper ? <div className="mt-2 text-sm text-black/55">{helper}</div> : null}
    </div>
  );
}

export function SurfacePanel({
  className,
  children,
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SurfaceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/6 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-black">{title}</h2>
        {description ? <p className="text-sm text-black/55">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function ToolbarRow({
  className,
  children,
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-black/6 bg-black/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-black/[0.03] text-black/45">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-black/55">{description}</p>
    </div>
  );
}

export function SoftBadge({
  children,
  className,
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/8 bg-black/[0.035] px-3 py-1 text-xs font-medium text-black/70",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
