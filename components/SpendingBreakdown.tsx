"use client"

import { GroupBreakdown, SPENDING_GROUP_META, SpendingGroup, fmtCurrency } from "@/lib/data"

interface SpendingBreakdownProps {
  breakdown: GroupBreakdown[]
  totalExpense: number
}

export function SpendingBreakdown({ breakdown, totalExpense }: SpendingBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-xs text-zinc-600 text-center py-6">No expenses this month</p>
      </div>
    )
  }

  const groups: SpendingGroup[] = ["Fixed", "Growth", "Lifestyle", "Transfer"]
  const ordered = groups.map(g => breakdown.find(b => b.group === g)).filter(Boolean) as GroupBreakdown[]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-200">Spending Breakdown</h2>
        <span className="text-xs tabular text-zinc-500">{fmtCurrency(totalExpense)} total</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-5">
        {ordered.map(g => (
          <div
            key={g.group}
            className={`${SPENDING_GROUP_META[g.group].bar} transition-all`}
            style={{ width: `${g.pct}%` }}
            title={`${g.group}: ${g.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-4 gap-3">
        {ordered.map(g => {
          const meta = SPENDING_GROUP_META[g.group]
          return (
            <div key={g.group} className="space-y-2">
              {/* Group header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-sm ${meta.dot}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-widest ${meta.color}`}>
                    {g.group}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-600">{g.pct.toFixed(0)}%</span>
              </div>

              <p className={`text-base font-bold tabular ${meta.color}`}>
                {fmtCurrency(g.total)}
              </p>

              {/* Category rows */}
              <div className="space-y-1 pt-1 border-t border-zinc-800">
                {g.categories.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Mini bar */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meta.bar} opacity-60 rounded-full`}
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{cat.name}</p>
                    </div>
                    <p className="text-[11px] tabular text-zinc-400 shrink-0">
                      {fmtCurrency(cat.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
