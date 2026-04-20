"use client"

import { useState } from "react"
import { Plus, Building2, Wallet, TrendingUp, CreditCard } from "lucide-react"
import { Account, AccountType, fmtCurrency } from "@/lib/data"
import { useAppData } from "@/lib/store"

const TYPE_ICON: Record<AccountType, React.ReactNode> = {
  bank: <Building2 size={14} />,
  cash: <Wallet size={14} />,
  investment: <TrendingUp size={14} />,
  credit_card: <CreditCard size={14} />,
}

const TYPE_COLOR: Record<AccountType, string> = {
  bank: "text-blue-400 bg-blue-500/10",
  cash: "text-amber-400 bg-amber-500/10",
  investment: "text-violet-400 bg-violet-500/10",
  credit_card: "text-rose-400 bg-rose-500/10",
}

const TYPE_LABEL: Record<AccountType, string> = {
  bank: "Bank Accounts",
  cash: "Cash Accounts",
  investment: "Investment Accounts",
  credit_card: "Credit Cards",
}

export default function AccountsPage() {
  const { accounts, addAccount, loading } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", type: "bank" as AccountType, balance: "" })

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Loading…</div>

  const groups: AccountType[] = ["bank", "cash", "investment", "credit_card"]

  const grandTotal = accounts
    .filter(a => a.type !== "credit_card")
    .reduce((s, a) => s + a.balance, 0)

  const ccDebt = accounts
    .filter(a => a.type === "credit_card")
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  function groupTotal(type: AccountType) {
    return accounts.filter(a => a.type === type).reduce((s, a) => s + a.balance, 0)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.balance) return
    const balance = form.type === "credit_card"
      ? -Math.abs(Number(form.balance))
      : Number(form.balance)
    await addAccount({ name: form.name, type: form.type, balance, currency: "MYR" })
    setForm({ name: "", type: "bank", balance: "" })
    setShowForm(false)
  }

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Accounts</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {accounts.length} accounts · Assets {fmtCurrency(grandTotal)}
            {ccDebt > 0 && <span className="text-rose-400"> · CC owed {fmtCurrency(ccDebt)}</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
        >
          <Plus size={13} /> Add Account
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-5 grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Account name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
            >
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              {form.type === "credit_card" ? "Outstanding (MYR)" : "Balance (MYR)"}
            </label>
            <input
              type="number"
              value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600 tabular"
            />
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded transition-colors">
            Save
          </button>
        </form>
      )}

      {/* Groups */}
      <div className="space-y-5">
        {groups.map(type => {
          const group = accounts.filter(a => a.type === type)
          if (group.length === 0) return null
          const isCreditCard = type === "credit_card"
          const subtotal = groupTotal(type)

          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded ${TYPE_COLOR[type]}`}>{TYPE_ICON[type]}</span>
                  <span className="text-xs font-medium text-zinc-300">{TYPE_LABEL[type]}</span>
                </div>
                <span className={`text-xs tabular ${isCreditCard ? "text-rose-400" : "text-zinc-400"}`}>
                  {isCreditCard ? `${fmtCurrency(Math.abs(subtotal))} owed` : fmtCurrency(subtotal)}
                </span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Account</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Currency</th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                        {isCreditCard ? "Outstanding" : "Balance"}
                      </th>
                      {!isCreditCard && (
                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Share</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {group.map(account => (
                      <tr key={account.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-200">{account.name}</td>
                        <td className="px-4 py-3 text-zinc-500">{account.currency}</td>
                        <td className={`px-4 py-3 text-right tabular font-medium ${isCreditCard ? "text-rose-400" : "text-zinc-100"}`}>
                          {isCreditCard
                            ? fmtCurrency(Math.abs(account.balance))
                            : fmtCurrency(account.balance)
                          }
                        </td>
                        {!isCreditCard && (
                          <td className="px-4 py-3 text-right text-zinc-500">
                            {grandTotal > 0 ? ((account.balance / grandTotal) * 100).toFixed(1) : "0.0"}%
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-zinc-800/20">
                      <td className="px-4 py-2 text-zinc-500 text-[10px] uppercase tracking-widest" colSpan={2}>Subtotal</td>
                      <td className={`px-4 py-2 text-right tabular font-semibold ${isCreditCard ? "text-rose-400" : "text-zinc-200"}`}>
                        {isCreditCard ? fmtCurrency(Math.abs(subtotal)) : fmtCurrency(subtotal)}
                      </td>
                      {!isCreditCard && (
                        <td className="px-4 py-2 text-right text-zinc-500 text-[10px]">
                          {grandTotal > 0 ? ((subtotal / grandTotal) * 100).toFixed(1) : "0.0"}%
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CC pay hint */}
              {isCreditCard && (
                <p className="text-[11px] text-zinc-600 mt-1.5">
                  To pay off a card: use <span className="text-zinc-500">Transactions → Add → Transfer</span> from your bank account to the card.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
