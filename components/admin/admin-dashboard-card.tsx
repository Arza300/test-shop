import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminDashboardCardProps = {
  title: string;
  description: string;
  href?: string;
  stat?: string;
  statClassName?: string;
  disabled?: boolean;
  badge?: string;
};

export function AdminDashboardCard({
  title,
  description,
  href,
  stat,
  statClassName,
  disabled,
  badge,
}: AdminDashboardCardProps) {
  const inner = (
    <>
      {badge && (
        <span className="mb-2 inline-block rounded-full border border-zinc-600/80 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {badge}
        </span>
      )}
      {stat && (
        <p className={cn("mb-2 text-3xl font-black tabular-nums tracking-tight sm:text-4xl", statClassName ?? "text-cyan-400")}>
          {stat}
        </p>
      )}
      <h3 className="text-base font-bold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
    </>
  );

  const shell =
    "flex min-h-[160px] flex-col rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-5 shadow-sm transition-colors sm:min-h-[170px]";

  if (disabled || !href) {
    return (
      <div
        className={cn(shell, "cursor-not-allowed opacity-60")}
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        shell,
        "hover:border-cyan-500/30 hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60"
      )}
    >
      {inner}
    </Link>
  );
}
