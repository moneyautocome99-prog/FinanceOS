"use client"

import { useState } from "react"
import { Plus, AlertTriangle } from "lucide-react"
import { Liability, LiabilityType, fmtCurrency } from "@/lib/data"
import { useLiabilities, useReceivables } from "@/lib/store"

export default function LiabilitiesPage() {
  const { liabilities, setLiabilities } = useLiabilities()
  const { receivables } = useReceivables()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: "", type: "loan" as LiabilityType,
    principal: "", outstanding: "", interestRate: "", monthlyPayment: "",
  })

  const totalOutstanding = liabilities.reduce((s, l) => s + l.outstanding, 0)
  const totalMonthly = liabilities.reduce((s, l) => s + l.monthlyPayment, 0)
  const loanTotal = liabilities.filter(l => l.type === "loan").reduce((s, l) => s + l.outstanding, 0)
  const marginTotal = liabilities.filter(l => l.type === "margin").reduce((s, l) => s + l.outstanding, 0)
  const totalReceivable = receivables.reduce((s, r) => s + r.outstanding, 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.outstanding) return
    setLiabilities([...liabilities, {
      id: `l${Date.now()}`,
      name: form.name,
      type: form.type,
      principal: Number(form.principal),
      outstanding: Number(form.outstanding),
      interestRate: Number(form.interestRate),
      monthlyPayment: Number(form.monthlyPayment),
    }])
    setForm({ name: "", type: "loan", principal: "", outstanding: "", interestRate: "", monthlyPayment: "" })
    setShowAdd(false)
  }

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Liabilities</h1>
          <p className="text-xs text-zinc-500 mt-1">{liabilities.length} items · Total {fmtCurrency(totalOutstanding)}</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
        >
          <Plus size={13} /> Add Liability
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total Outstanding</p>
          <p className="text-lg font-bold tabular text-rose-400 mt-1">{fmtCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Loans</p>
          <p className="text-lg font-bold tabular text-zinc-300 mt-1">{fmtCurrency(loanTotal)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Margin</p>
          <div className="flex items-center gap-1.5 mt-1">
            {marginTotal > 0 && <AlertTriangle size={13} className="text-amber-400" />}
            <p className="text-lg font-bold tabular text-amber-400">{fmtCurrency(marginTotal)}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Monthly Repayment</p>
          <p className="text-lg font-bold tabular text-zinc-300 mt-1">{fmtCurrency(totalMonthly)}</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-5 grid grid-cols-6 gap-3 items-end">
          {[
            { key: "name", label: "Name", placeholder: "Home Loan", type: "text" },
            { key: "type", label: "Type", placeholder: "", type: "select" },
            { key: "principal", label: "Principal", placeholder: "450000", type: "number" },
            { key: "outstanding", label: "Outstanding", placeholder: "388000", type: "number" },
            { key: "interestRate", label: "Interest %", placeholder: "3.85", type: "number" },
            { key: "monthlyPayment", label: "Monthly", placeholder: "2340", type: "number" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
              {type === "select" ? (
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as LiabilityType }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="loan">Loan</option>
                  <option value="margin">Margin</option>
                </select>
              ) : (
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600 tabular"
                />
              )}
            </div>
          ))}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded transition-colors col-span-6">
            Save Liability
          </button>
        </form>
      )}

      {/* Liabilities Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Name", "Type", "Principal", "Outstanding", "Interest Rate", "Monthly Payment", "Progress"].map(h => (
                <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium ${h === "Name" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liabilities.map(l => {
              const paidOff = l.principal > 0 ? ((l.principal - l.outstanding) / l.principal) * 100 : 0
              return (
                <tr key={l.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-4 text-zinc-200">{l.name}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${l.type === "margin" ? "text-amber-400 bg-amber-500/10" : "text-blue-400 bg-blue-500/10"}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular text-zinc-400">
                    {l.principal > 0 ? fmtCurrency(l.principal) : "—"}
                  </td>
                  <td className="px-4 py-4 text-right tabular font-medium text-rose-400">{fmtCurrency(l.outstanding)}</td>
                  <td className="px-4 py-4 text-right tabular text-zinc-300">{l.interestRate.toFixed(2)}%</td>
                  <td className="px-4 py-4 text-right tabular text-zinc-400">
                    {l.monthlyPayment > 0 ? fmtCurrency(l.monthlyPayment) : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {l.principal > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(paidOff, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-500 tabular w-9 text-right">{paidOff.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">Revolving</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-700 bg-zinc-800/20">
              <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500" colSpan={3}>Total</td>
              <td className="px-4 py-3 text-right tabular font-semibold text-rose-400">{fmtCurrency(totalOutstanding)}</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right tabular font-semibold text-zinc-300">{fmtCurrency(totalMonthly)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Money Owed to Me */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Money Owed to Me</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{receivables.length} people · {fmtCurrency(totalReceivable)} outstanding</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Person", "Date Lent", "Original", "Outstanding", "Collected", "Status"].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium ${h === "Person" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receivables.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-600">No loans given — use "Loan Out" in Add Transaction</td>
                </tr>
              )}
              {receivables.map(r => {
                const collected = r.amount - r.outstanding
                const pct = r.amount > 0 ? (collected / r.amount) * 100 : 0
                const isFullyPaid = r.outstanding === 0
                return (
                  <tr key={r.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-4 text-zinc-200 font-medium">{r.name}</td>
                    <td className="px-4 py-4 text-right tabular text-zinc-400">{r.date}</td>
                    <td className="px-4 py-4 text-right tabular text-zinc-400">{fmtCurrency(r.amount)}</td>
                    <td className={`px-4 py-4 text-right tabular font-medium ${isFullyPaid ? "text-emerald-400" : "text-orange-400"}`}>
                      {fmtCurrency(r.outstanding)}
                    </td>
                    <td className="px-4 py-4 text-right tabular text-zinc-400">{fmtCurrency(collected)}</td>
                    <td className="px-4 py-4 text-right">
                      {isFullyPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10">Paid</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-zinc-500 tabular w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {receivables.length > 0 && (
              <tfoot>
                <tr className="border-t border-zinc-700 bg-zinc-800/20">
                  <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right tabular font-semibold text-orange-400">{fmtCurrency(totalReceivable)}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold text-zinc-400">
                    {fmtCurrency(receivables.reduce((s, r) => s + (r.amount - r.outstanding), 0))}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
