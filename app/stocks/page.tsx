"use client"

import { useState } from "react"
import { Plus, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react"
import { StockHolding, fmtCurrency } from "@/lib/data"
import { useAppData } from "@/lib/store"

export default function StocksPage() {
  const { stocks, addStock, updateStockPrice, loading } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Loading…</div>
  const [editPrice, setEditPrice] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ticker: "", name: "", shares: "", avgCost: "", currentPrice: "", annualDividend: "" })

  const totalMarketValue = stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0)
  const totalCost = stocks.reduce((s, st) => s + st.shares * st.avgCost, 0)
  const totalPnl = totalMarketValue - totalCost
  const totalAnnualDiv = stocks.reduce((s, st) => s + st.shares * st.annualDividend, 0)

  function startEdit(stock: StockHolding) {
    setEditingId(stock.id)
    setEditPrice(stock.currentPrice.toString())
  }

  async function saveEdit(id: string) {
    await updateStockPrice(id, Number(editPrice))
    setEditingId(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ticker || !form.shares) return
    await addStock({
      ticker: form.ticker.toUpperCase(),
      name: form.name,
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      currentPrice: Number(form.currentPrice),
      annualDividend: Number(form.annualDividend),
    })
    setForm({ ticker: "", name: "", shares: "", avgCost: "", currentPrice: "", annualDividend: "" })
    setShowAdd(false)
  }

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Stock Holdings</h1>
          <p className="text-xs text-zinc-500 mt-1">{stocks.length} positions · Click price to update</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
        >
          <Plus size={13} /> Add Position
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Market Value</p>
          <p className="text-lg font-bold tabular text-zinc-100 mt-1">{fmtCurrency(totalMarketValue)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total Cost</p>
          <p className="text-lg font-bold tabular text-zinc-400 mt-1">{fmtCurrency(totalCost)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Unrealised P&L</p>
          <div className="flex items-center gap-1.5 mt-1">
            {totalPnl >= 0
              ? <TrendingUp size={14} className="text-emerald-400" />
              : <TrendingDown size={14} className="text-rose-400" />
            }
            <p className={`text-lg font-bold tabular ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalPnl >= 0 ? "+" : ""}{fmtCurrency(Math.abs(totalPnl))}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {totalCost > 0 ? ((totalPnl / totalCost) * 100).toFixed(2) : "0.00"}%
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Annual Dividend</p>
          <p className="text-lg font-bold tabular text-emerald-400 mt-1">{fmtCurrency(totalAnnualDiv)}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Yield: {totalMarketValue > 0 ? ((totalAnnualDiv / totalMarketValue) * 100).toFixed(2) : "0.00"}%
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-5 grid grid-cols-6 gap-3 items-end">
          {[
            { key: "ticker", label: "Ticker", placeholder: "PBBANK" },
            { key: "name", label: "Name", placeholder: "Public Bank" },
            { key: "shares", label: "Shares", placeholder: "1000" },
            { key: "avgCost", label: "Avg Cost", placeholder: "3.92" },
            { key: "currentPrice", label: "Current Price", placeholder: "4.10" },
            { key: "annualDividend", label: "Annual Div", placeholder: "0.18" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
              <input
                type={key === "ticker" || key === "name" ? "text" : "number"}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                step="0.001"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600 tabular"
              />
            </div>
          ))}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded transition-colors col-span-6">
            Add Position
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Ticker", "Name", "Shares", "Avg Cost", "Current Price", "Market Value", "P&L (MYR)", "P&L %", "Annual Div"].map(h => (
                <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium ${h === "Ticker" || h === "Name" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              const mv = stock.shares * stock.currentPrice
              const cost = stock.shares * stock.avgCost
              const pnl = mv - cost
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
              const annualDiv = stock.shares * stock.annualDividend
              return (
                <tr key={stock.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-100 font-semibold">{stock.ticker}</td>
                  <td className="px-4 py-3 text-zinc-400">{stock.name}</td>
                  <td className="px-4 py-3 text-right tabular text-zinc-300">{stock.shares.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular text-zinc-400">{stock.avgCost.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right tabular">
                    {editingId === stock.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          step="0.001"
                          autoFocus
                          className="w-20 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-100 outline-none tabular text-right"
                        />
                        <button onClick={() => saveEdit(stock.id)} className="text-emerald-400 hover:text-emerald-300"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-300"><X size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(stock)}
                        className="group flex items-center gap-1 ml-auto text-zinc-200 hover:text-zinc-100"
                      >
                        {stock.currentPrice.toFixed(3)}
                        <Edit2 size={10} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular text-zinc-200 font-medium">{fmtCurrency(mv)}</td>
                  <td className={`px-4 py-3 text-right tabular font-medium ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {pnl >= 0 ? "+" : ""}{fmtCurrency(Math.abs(pnl))}
                  </td>
                  <td className={`px-4 py-3 text-right tabular font-medium ${pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular text-zinc-400">{fmtCurrency(annualDiv)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
