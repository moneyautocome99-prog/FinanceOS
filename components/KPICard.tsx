interface KPICardProps {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | "neutral"
  highlight?: boolean
  badge?: { text: string; color: "amber" | "rose" | "emerald" }
}

export function KPICard({ label, value, sub, trend, highlight, badge }: KPICardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-400" :
    trend === "down" ? "text-rose-400" :
    "text-zinc-400"

  return (
    <div className={`
      rounded-lg border p-4 flex flex-col gap-2
      ${highlight ? "bg-zinc-800 border-zinc-600" : "bg-zinc-900 border-zinc-800"}
    `}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">{label}</span>
        {badge && (
          <span className={`
            text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded
            ${badge.color === "amber" ? "bg-amber-500/10 text-amber-400" : ""}
            ${badge.color === "rose" ? "bg-rose-500/10 text-rose-400" : ""}
            ${badge.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : ""}
          `}>
            {badge.text}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold tabular ${trendColor || "text-zinc-100"} leading-none`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}
