"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fmtCurrency, Transaction } from "@/lib/data"
import { useAppData } from "@/lib/store"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function buildAnnualData(year: number, transactions: Transaction[]) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return MONTH_NAMES.map((label, idx) => {
    const monthNum = idx + 1
    const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`
    const isFuture = year > currentYear || (year === currentYear && monthNum > currentMonth)
    const isCurrent = year === currentYear && monthNum === currentMonth

    if (isFuture) return { label, income: null, expense: null, net: null, savingsRate: null, isCurrent, isFuture }

    const txns = transactions.filter(t => t.date.startsWith(monthKey))
    const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = txns.filter(t => t.type === "expense" || t.type === "investment").reduce((s, t) => s + Math.abs(t.amount), 0)
    const net = income - expense
    const savingsRate = income > 0 ? (net / income) * 100 : null
    return { label, income, expense, net, savingsRate, isCurrent, isFuture }
  })
}

export default function AnnualPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const { transactions, loading } = useAppData()

  const rows = useMemo(() => buildAnnualData(year, transactions), [year, transactions])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Loading…</div>

  const active = rows.filter(r => !r.isFuture && r.income !== null)
  const ytdIncome = active.reduce((s, r) => s + (r.income ?? 0), 0)
  const ytdExpense = active.reduce((s, r) => s + (r.expense ?? 0), 0)
  const ytdNet = ytdIncome - ytdExpense
  const ytdSavingsRate = ytdIncome > 0 ? (ytdNet / ytdIncome) * 100 : 0

  // Running net (cumulative)
  let running = 0
  const rowsWithRunning = rows.map(r => {
    if (!r.isFuture && r.net !== null) running += r.net
    return { ...r, running: r.isFuture ? null : running }
  })

  return (
    <div className="p-8 max-w-[1000px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Annual Overview</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{year}</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-zinc-300 px-4 tabular">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= now.getFullYear()}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* YTD KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">YTD Income</p>
          <p className="text-xl font-bold tabular text-emerald-400 mt-1">{fmtCurrency(ytdIncome)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">YTD Expense</p>
          <p className="text-xl font-bold tabular text-rose-400 mt-1">{fmtCurrency(ytdExpense)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">YTD Net Savings</p>
          <p className={`text-xl font-bold tabular mt-1 ${ytdNet >= 0 ? "text-zinc-100" : "text-rose-400"}`}>
            {ytdNet >= 0 ? "+" : ""}{fmtCurrency(ytdNet)}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Savings Rate</p>
          <p className={`text-xl font-bold tabular mt-1 ${ytdSavingsRate >= 20 ? "text-emerald-400" : ytdSavingsRate >= 10 ? "text-amber-400" : "text-rose-400"}`}>
            {ytdSavingsRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">target ≥ 20%</p>
        </div>
      </div>

      {/* Month-by-month table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Month</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Income</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Expense</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Net</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Savings Rate</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Running Total</th>
              <th className="px-5 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {rowsWithRunning.map((r) => (
              <tr
                key={r.label}
                className={`border-b border-zinc-800/50 last:border-0 transition-colors ${
                  r.isCurrent ? "bg-zinc-800/40" : r.isFuture ? "opacity-30" : "hover:bg-zinc-800/20"
                }`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${r.isCurrent ? "text-zinc-100" : "text-zinc-300"}`}>{r.label}</span>
                    {r.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">Current</span>
                    )}
                    {r.isFuture && (
                      <span className="text-zinc-600 text-[10px]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right tabular text-emerald-400">
                  {r.income !== null ? `+${fmtCurrency(r.income)}` : "—"}
                </td>
                <td className="px-5 py-3.5 text-right tabular text-rose-400">
                  {r.expense !== null ? `-${fmtCurrency(r.expense)}` : "—"}
                </td>
                <td className={`px-5 py-3.5 text-right tabular font-medium ${
                  r.net === null ? "text-zinc-600"
                  : r.net >= 0 ? "text-zinc-100" : "text-rose-400"
                }`}>
                  {r.net !== null ? `${r.net >= 0 ? "+" : ""}${fmtCurrency(r.net)}` : "—"}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {r.savingsRate !== null ? (
                    <span className={`tabular font-medium ${
                      r.savingsRate >= 20 ? "text-emerald-400"
                      : r.savingsRate >= 10 ? "text-amber-400"
                      : "text-rose-400"
                    }`}>
                      {r.savingsRate.toFixed(1)}%
                    </span>
                  ) : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-5 py-3.5 text-right tabular text-zinc-400">
                  {r.running !== null ? `${r.running >= 0 ? "+" : ""}${fmtCurrency(r.running)}` : "—"}
                </td>
                <td className="px-5 py-3.5">
                  {r.income !== null && !r.isFuture && (
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      {r.income > 0 && (
                        <div
                          className={`h-full rounded-full transition-all ${(r.savingsRate ?? 0) >= 20 ? "bg-emerald-500" : (r.savingsRate ?? 0) >= 10 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.min(Math.max(r.savingsRate ?? 0, 0), 100)}%` }}
                        />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-700 bg-zinc-800/20">
              <td className="px-5 py-3 text-[10px] uppercase tracking-widest text-zinc-500">Full Year Total</td>
              <td className="px-5 py-3 text-right tabular font-semibold text-emerald-400">+{fmtCurrency(ytdIncome)}</td>
              <td className="px-5 py-3 text-right tabular font-semibold text-rose-400">-{fmtCurrency(ytdExpense)}</td>
              <td className={`px-5 py-3 text-right tabular font-semibold ${ytdNet >= 0 ? "text-zinc-100" : "text-rose-400"}`}>
                {ytdNet >= 0 ? "+" : ""}{fmtCurrency(ytdNet)}
              </td>
              <td className={`px-5 py-3 text-right tabular font-semibold ${ytdSavingsRate >= 20 ? "text-emerald-400" : ytdSavingsRate >= 10 ? "text-amber-400" : "text-rose-400"}`}>
                {ytdSavingsRate.toFixed(1)}%
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
