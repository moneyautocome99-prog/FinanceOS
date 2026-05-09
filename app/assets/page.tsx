"use client"

import { useState } from "react"
import { Plus, TrendingUp, TrendingDown, Home, Car, Briefcase, Gem, Package, Pencil, Trash2, X, Check } from "lucide-react"
import { PhysicalAsset, AssetType, fmtCurrency } from "@/lib/data"
import { useAppData } from "@/lib/store"

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  property:    <Home size={14} />,
  vehicle:     <Car size={14} />,
  business:    <Briefcase size={14} />,
  collectible: <Gem size={14} />,
  other:       <Package size={14} />,
}

const TYPE_COLOR: Record<AssetType, string> = {
  property:    "text-emerald-400 bg-emerald-500/10",
  vehicle:     "text-blue-400 bg-blue-500/10",
  business:    "text-violet-400 bg-violet-500/10",
  collectible: "text-amber-400 bg-amber-500/10",
  other:       "text-zinc-400 bg-zinc-500/10",
}

const ASSET_TYPES: AssetType[] = ["property", "vehicle", "business", "collectible", "other"]

const emptyForm = {
  name: "", type: "property" as AssetType,
  currentValue: "", acquisitionCost: "", acquiredDate: "", notes: "",
}

function assetToForm(a: PhysicalAsset) {
  return {
    name: a.name, type: a.type,
    currentValue: String(a.currentValue),
    acquisitionCost: String(a.acquisitionCost),
    acquiredDate: a.acquiredDate,
    notes: a.notes,
  }
}

export default function AssetsPage() {
  const { physicalAssets: assets, addPhysicalAsset, updatePhysicalAsset, deletePhysicalAsset, loading } = useAppData()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Loading…</div>

  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0)
  const totalCost  = assets.reduce((s, a) => s + a.acquisitionCost, 0)
  const totalGain  = totalValue - totalCost

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.currentValue) return
    await addPhysicalAsset({
      name: form.name, type: form.type,
      currentValue: Number(form.currentValue),
      acquisitionCost: Number(form.acquisitionCost) || 0,
      acquiredDate: form.acquiredDate, notes: form.notes,
    })
    setForm(emptyForm)
    setShowAdd(false)
  }

  function startEdit(asset: PhysicalAsset) {
    setEditingId(asset.id)
    setEditForm(assetToForm(asset))
  }

  async function saveEdit(id: string) {
    if (!editForm.name || !editForm.currentValue) return
    await updatePhysicalAsset(id, {
      name: editForm.name, type: editForm.type,
      currentValue: Number(editForm.currentValue),
      acquisitionCost: Number(editForm.acquisitionCost) || 0,
      acquiredDate: editForm.acquiredDate, notes: editForm.notes,
    })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deletePhysicalAsset(id)
    setDeletingId(null)
  }

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-500"

  return (
    <div className="p-8 max-w-[1000px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Physical Assets</h1>
          <p className="text-xs text-zinc-500 mt-1">{assets.length} assets · Total value {fmtCurrency(totalValue)}</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
        >
          <Plus size={13} /> Add Asset
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Current Value</p>
          <p className="text-lg font-bold tabular text-zinc-100 mt-1">{fmtCurrency(totalValue)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Acquisition Cost</p>
          <p className="text-lg font-bold tabular text-zinc-400 mt-1">{fmtCurrency(totalCost)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Unrealised Gain</p>
          <div className="flex items-center gap-1.5 mt-1">
            {totalGain >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
            <p className={`text-lg font-bold tabular ${totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalGain >= 0 ? "+" : ""}{fmtCurrency(Math.abs(totalGain))}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : "0.0"}%
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Puchong Condominium" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))} className={inputCls}>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Current Value (MYR)</label>
              <input type="number" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} placeholder="520000" className={`${inputCls} tabular`} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Acquisition Cost (MYR)</label>
              <input type="number" value={form.acquisitionCost} onChange={e => setForm(f => ({ ...f, acquisitionCost: e.target.value }))} placeholder="450000" className={`${inputCls} tabular`} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Date Acquired</label>
              <input type="date" value={form.acquiredDate} onChange={e => setForm(f => ({ ...f, acquiredDate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Notes</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional description" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded transition-colors">Save Asset</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm) }} className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Asset</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Acquired</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Cost</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Current Value</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Gain / Loss</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">%</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-600">No assets yet — add your first</td></tr>
            )}
            {assets.map(asset => {
              const gain = asset.currentValue - asset.acquisitionCost
              const gainPct = asset.acquisitionCost > 0 ? (gain / asset.acquisitionCost) * 100 : 0
              const isEditing = editingId === asset.id
              const isDeleting = deletingId === asset.id

              if (isEditing) {
                return (
                  <tr key={asset.id} className="border-b border-zinc-800/50 bg-zinc-800/40">
                    <td className="px-3 py-2" colSpan={8}>
                      <div className="grid grid-cols-6 gap-2 items-end">
                        <div className="col-span-2">
                          <label className="block text-[10px] text-zinc-500 mb-1">Name</label>
                          <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Type</label>
                          <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as AssetType }))} className={inputCls}>
                            {ASSET_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Current Value</label>
                          <input type="number" value={editForm.currentValue} onChange={e => setEditForm(f => ({ ...f, currentValue: e.target.value }))} className={`${inputCls} tabular`} />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Acq. Cost</label>
                          <input type="number" value={editForm.acquisitionCost} onChange={e => setEditForm(f => ({ ...f, acquisitionCost: e.target.value }))} className={`${inputCls} tabular`} />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(asset.id)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-[11px] transition-colors">
                            <Check size={11} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="flex items-center justify-center px-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 py-1.5 rounded transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={asset.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-4 py-4">
                    <p className="text-zinc-200 font-medium">{asset.name}</p>
                    {asset.notes && <p className="text-[11px] text-zinc-600 mt-0.5">{asset.notes}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded text-[10px] font-medium capitalize ${TYPE_COLOR[asset.type]}`}>
                      {TYPE_ICON[asset.type]}{asset.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-500">{asset.acquiredDate || "—"}</td>
                  <td className="px-4 py-4 text-right tabular text-zinc-400">{asset.acquisitionCost > 0 ? fmtCurrency(asset.acquisitionCost) : "—"}</td>
                  <td className="px-4 py-4 text-right tabular font-medium text-zinc-100">{fmtCurrency(asset.currentValue)}</td>
                  <td className={`px-4 py-4 text-right tabular font-medium ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {asset.acquisitionCost > 0 ? `${gain >= 0 ? "+" : ""}${fmtCurrency(Math.abs(gain))}` : "—"}
                  </td>
                  <td className={`px-4 py-4 text-right tabular font-medium ${gainPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {asset.acquisitionCost > 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-4">
                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(asset.id)} className="text-rose-400 hover:text-rose-300 text-[10px] font-medium transition-colors">Delete</button>
                        <button onClick={() => setDeletingId(null)} className="text-zinc-600 hover:text-zinc-400 text-[10px] transition-colors ml-1">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => startEdit(asset)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeletingId(asset.id)} className="text-zinc-500 hover:text-rose-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {assets.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-800/20">
                <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500" colSpan={3}>Total</td>
                <td className="px-4 py-3 text-right tabular text-zinc-400">{fmtCurrency(totalCost)}</td>
                <td className="px-4 py-3 text-right tabular font-semibold text-zinc-100">{fmtCurrency(totalValue)}</td>
                <td className={`px-4 py-3 text-right tabular font-semibold ${totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalGain >= 0 ? "+" : ""}{fmtCurrency(Math.abs(totalGain))}
                </td>
                <td className={`px-4 py-3 text-right tabular font-semibold ${totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalCost > 0 ? `${((totalGain / totalCost) * 100).toFixed(1)}%` : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
