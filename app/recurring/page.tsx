"use client"

import { useState } from "react"
import { Plus, RefreshCw, Check, X } from "lucide-react"
import { mockAccounts, INCOME_CATEGORIES, EXPENSE_CATEGORIES, TransactionType, fmtCurrency } from "@/lib/data"
import { useRecurring } from "@/lib/store"

const TYPE_COLORS: Record<string, string> = {
  income: "text-emerald-400 bg-emerald-500/10",
  expense: "text-rose-400 bg-rose-500/10",
  loan_repayment: "text-amber-400 bg-amber-500/10",
}

const ALL_CATS = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function RecurringPage() {
  const { recurring, setRecurring } = useRecurring()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: "", type: "expense" as TransactionType, accountId: mockAccounts[0]?.id ?? "",
    category: "", amount: "", dayOfMonth: "1", notes: "", tags: "",
  })

  const totalMonthlyOut = recurring
    .filter(r => r.active && r.type !== "income")
    .reduce((s, r) => s + r.amount, 0)
  const totalMonthlyIn = recurring
    .filter(r => r.active && r.type === "income")
    .reduce((s, r) => s + r.amount, 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.amount || !form.category) return
    setRecurring([...recurring, {
      id: `rec${Date.now()}`,
      name: form.name,
      type: form.type,
      accountId: form.accountId,
      category: form.category,
      amount: Math.abs(Number(form.amount)),
      dayOfMonth: Number(form.dayOfMonth),
      notes: form.notes,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      active: true,
    }])
    setForm({ name: "", type: "expense", accountId: mockAccounts[0]?.id ?? "", category: "", amount: "", dayOfMonth: "1", notes: "", tags: "" })
    setShowAdd(false)
  }

  function toggleActive(id: string) {
    setRecurring(recurring.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  function remove(id: string) {
    setRecurring(recurring.filter(r => r.id !== id))
  }

  // Sort by day of month
  const sorted = [...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Recurring Transactions</h1>
          <p className="text-xs text-zinc-500 mt-1">{recurring.filter(r => r.active).length} active · repeats every month</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
        >
          <Plus size={13} /> Add Recurring
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Monthly Income</p>
          <p className="text-lg font-bold tabular text-emerald-400 mt-1">+{fmtCurrency(totalMonthlyIn)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Monthly Committed</p>
          <p className="text-lg font-bold tabular text-rose-400 mt-1">-{fmtCurrency(totalMonthlyOut)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Net Fixed Cash Flow</p>
          <p className={`text-lg font-bold tabular mt-1 ${totalMonthlyIn - totalMonthlyOut >= 0 ? "text-zinc-100" : "text-rose-400"}`}>
            {totalMonthlyIn - totalMonthlyOut >= 0 ? "+" : ""}{fmtCurrency(totalMonthlyIn - totalMonthlyOut)}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Netflix, Rent, Salary…" className="field-input" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TransactionType, category: "" }))}
                className="field-input">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="loan_repayment">Loan Repayment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="field-input" required>
                <option value="">Select…</option>
                {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Account</label>
              <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                className="field-input">
                {mockAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Amount (MYR)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" min="0" step="0.01" className="field-input tabular" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Day of Month</label>
              <select value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))}
                className="field-input">
                {DAYS.map(d => <option key={d} value={d}>{ordinal(d)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Tags</label>
              <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="fixed, passive" className="field-input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded transition-colors">
              Save
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-zinc-500 hover:text-zinc-300 px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Account</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Day</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Amount</th>
              <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-zinc-600">No recurring transactions yet</td></tr>
            )}
            {sorted.map(r => (
              <tr key={r.id} className={`border-b border-zinc-800/50 last:border-0 transition-colors ${r.active ? "hover:bg-zinc-800/30" : "opacity-40"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={11} className="text-zinc-600 shrink-0" />
                    <span className="text-zinc-200 font-medium">{r.name}</span>
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 ml-[19px]">
                      {r.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">{t}</span>)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${TYPE_COLORS[r.type] ?? "text-zinc-400 bg-zinc-800"}`}>
                    {r.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{mockAccounts.find(a => a.id === r.accountId)?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular text-zinc-400">{ordinal(r.dayOfMonth)}</td>
                <td className={`px-4 py-3 text-right tabular font-medium ${r.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                  {r.type === "income" ? "+" : "-"}{fmtCurrency(r.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(r.id)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${r.active ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.active ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(r.id)} className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <X size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-700 bg-zinc-800/20">
              <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500" colSpan={4}>Monthly total (active)</td>
              <td className="px-4 py-3 text-right tabular text-zinc-300 font-semibold">
                <span className="text-emerald-400">+{fmtCurrency(totalMonthlyIn)}</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-rose-400">-{fmtCurrency(totalMonthlyOut)}</span>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`
        .field-input { display: block; width: 100%; background: #18181b; border: 1px solid #3f3f46; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #e4e4e7; outline: none; }
        .field-input:focus { border-color: #52525b; }
        .field-input option { background: #18181b; }
      `}</style>
    </div>
  )
}
