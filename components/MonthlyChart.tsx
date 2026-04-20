"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { mockMonthlyData } from "@/lib/data"

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0
  const expense = payload.find((p: any) => p.dataKey === "expense")?.value ?? 0
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-xs space-y-1.5 shadow-xl">
      <p className="text-zinc-300 font-medium mb-2">{label}</p>
      <div className="flex items-center justify-between gap-6">
        <span className="text-zinc-500">Income</span>
        <span className="text-emerald-400 tabular font-medium">+{income.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-zinc-500">Expense</span>
        <span className="text-rose-400 tabular font-medium">-{expense.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between gap-6 border-t border-zinc-700 pt-1.5 mt-1">
        <span className="text-zinc-400">Net</span>
        <span className={`tabular font-semibold ${income - expense >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {income - expense >= 0 ? "+" : ""}{(income - expense).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export function MonthlyChart() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Monthly Cash Flow</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Income</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />Expense</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={mockMonthlyData} barGap={4} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="income" radius={[3, 3, 0, 0]}>
            {mockMonthlyData.map((entry, i) => (
              <Cell key={i} fill={entry.current ? "#10b981" : "#10b98166"} />
            ))}
          </Bar>
          <Bar dataKey="expense" radius={[3, 3, 0, 0]}>
            {mockMonthlyData.map((entry, i) => (
              <Cell key={i} fill={entry.current ? "#f43f5e" : "#f43f5e66"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
