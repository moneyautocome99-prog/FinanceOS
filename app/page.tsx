"use client"

import { useState, useMemo } from "react"
import { ChevronRight } from "lucide-react"
import { KPICard } from "@/components/KPICard"
import { MonthlyChart } from "@/components/MonthlyChart"
import { SpendingBreakdown } from "@/components/SpendingBreakdown"
import {
  getTotalAssets,
  getTotalLiabilities,
  getCreditCardDebt,
  getNetWorth,
  getLeverageRatio,
  getMonthlyCashFlow,
  getSpendingBreakdown,
  fmtCurrency,
} from "@/lib/data"
import { useAppData } from "@/lib/store"

function toMonthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`
}

function monthOptions() {
  const opts: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    let m = now.getMonth() + 1 - i
    let y = now.getFullYear()
    while (m <= 0) { m += 12; y -= 1 }
    const value = toMonthKey(y, m)
    const label = new Date(y, m - 1).toLocaleDateString("en-MY", { month: "short", year: "numeric" })
    opts.push({ label, value })
  }
  return opts
}

export default function Dashboard() {
  const { accounts, transactions, stocks, physicalAssets, liabilities, loading } = useAppData()
  const now = new Date()
  const currentMonthKey = toMonthKey(now.getFullYear(), now.getMonth() + 1)
  const [fromMonth, setFromMonth] = useState(currentMonthKey)
  const [toMonth, setToMonth] = useState(currentMonthKey)
  const [filterAccount, setFilterAccount] = useState("")
  const [filterType, setFilterType] = useState("")

  const options = useMemo(() => monthOptions(), [])

  const filteredTxnsForMemo = useMemo(
    () => transactions
      .filter(t => t.date >= fromMonth && t.date <= toMonth + "-31")
      .filter(t => !filterAccount || t.accountId === filterAccount)
      .filter(t => !filterType || t.type === filterType),
    [transactions, fromMonth, toMonth, filterAccount, filterType]
  )

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Loading…</div>

  function resetFilters() { setFilterAccount(""); setFilterType("") }

  const filteredTxns = filteredTxnsForMemo

  const hasActiveFilter = !!(filterAccount || filterType)
  const isRange = fromMonth !== toMonth

  const totalAssets = getTotalAssets(accounts, stocks, physicalAssets)
  const totalLiabilities = getTotalLiabilities(accounts, liabilities)
  const ccDebt = getCreditCardDebt(accounts)
  const netWorth = getNetWorth(accounts, stocks, liabilities, physicalAssets)
  const leverage = getLeverageRatio(accounts, stocks, liabilities, physicalAssets)
  const { income, expense, net } = getMonthlyCashFlow(filteredTxns)
  const spendingBreakdown = getSpendingBreakdown(filteredTxns)

  const leveragePct = (leverage * 100).toFixed(1)
  const isHighLeverage = leverage > 0.6

  const recentTxns = [...filteredTxns]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  const fromLabel = options.find(o => o.value === fromMonth)?.label ?? fromMonth
  const toLabel = options.find(o => o.value === toMonth)?.label ?? toMonth
  const periodLabel = isRange ? `${fromLabel} – ${toLabel}` : fromLabel

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Account filter */}
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-7 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="">All Accounts</option>
            {accounts.filter(a => a.type !== "credit_card").map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Type filter pills */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {(["", "income", "expense", "investment"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterType === t
                    ? t === "income"     ? "bg-emerald-500/20 text-emerald-400"
                    : t === "expense"    ? "bg-rose-500/20 text-rose-400"
                    : t === "investment" ? "bg-violet-500/20 text-violet-400"
                    : "bg-zinc-700 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Reset */}
          {hasActiveFilter && (
            <button onClick={resetFilters} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors px-1">
              Reset
            </button>
          )}

          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <select
              value={fromMonth}
              onChange={e => {
                const v = e.target.value
                setFromMonth(v)
                if (v > toMonth) setToMonth(v)
              }}
              className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
            >
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronRight size={12} className="text-zinc-600 shrink-0" />
            <select
              value={toMonth}
              onChange={e => {
                const v = e.target.value
                setToMonth(v)
                if (v < fromMonth) setFromMonth(v)
              }}
              className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
            >
              {options.filter(o => o.value >= fromMonth).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          label="This Month Cash Flow"
          value={fmtCurrency(net)}
          sub={`Income ${fmtCurrency(income)} · Expense ${fmtCurrency(expense)}`}
          trend={net >= 0 ? "up" : "down"}
          highlight
        />
        <KPICard
          label="Net Worth"
          value={fmtCurrency(netWorth)}
          sub="Assets − Liabilities"
          trend="neutral"
        />
        <KPICard
          label="Leverage Ratio"
          value={`${leveragePct}%`}
          sub="Liabilities / Assets"
          trend={isHighLeverage ? "down" : "neutral"}
          badge={isHighLeverage ? { text: "High Leverage", color: "amber" } : undefined}
        />
        <KPICard
          label="Total Assets"
          value={fmtCurrency(totalAssets)}
          sub={`Liabilities: ${fmtCurrency(totalLiabilities)}`}
          trend="neutral"
        />
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-[1fr_360px] gap-4">
        <MonthlyChart />

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-200">Recent Transactions</h2>
            <a href="/transactions" className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
              View all →
            </a>
          </div>
          <div className="space-y-1">
            {recentTxns.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 truncate">{tx.category}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{tx.date}</p>
                </div>
                <span className={`text-xs tabular font-medium ml-3 shrink-0 ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending breakdown */}
      <div className="mt-4">
        <SpendingBreakdown breakdown={spendingBreakdown} totalExpense={expense} />
      </div>

      {/* Account + Asset summary */}
      <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">Asset Overview</h2>
        <div className="grid grid-cols-5 gap-3">
          {(["bank", "cash", "investment"] as const).map(type => {
            const typeAccounts = accounts.filter(a => a.type === type)
            const total = typeAccounts.reduce((s, a) => s + a.balance, 0)
            return (
              <div key={type} className="bg-zinc-800/50 rounded-md p-3">
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">{type}</p>
                <p className="text-lg font-bold tabular text-zinc-100">{fmtCurrency(total)}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{typeAccounts.length} account{typeAccounts.length !== 1 ? "s" : ""}</p>
              </div>
            )
          })}
          <div className="bg-zinc-800/50 rounded-md p-3">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Physical</p>
            <p className="text-lg font-bold tabular text-zinc-100">
              {fmtCurrency(physicalAssets.reduce((s, a) => s + a.currentValue, 0))}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">{physicalAssets.length} asset{physicalAssets.length !== 1 ? "s" : ""}</p>
          </div>
          {ccDebt > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-3">
              <p className="text-[11px] uppercase tracking-widest text-rose-500/70 mb-2">CC Owed</p>
              <p className="text-lg font-bold tabular text-rose-400">{fmtCurrency(ccDebt)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{accounts.filter(a => a.type === "credit_card").length} card{accounts.filter(a => a.type === "credit_card").length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
