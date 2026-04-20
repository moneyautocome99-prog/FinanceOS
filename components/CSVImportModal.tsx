"use client"

import { useState, useRef } from "react"
import { X, Upload, ChevronRight, Check, AlertCircle } from "lucide-react"
import { Account, Transaction, EXPENSE_CATEGORIES } from "@/lib/data"

interface CSVImportModalProps {
  accounts: Account[]
  onClose: () => void
  onImport: (txs: Array<Omit<Transaction, "id" | "accountName">>) => void
}

type Step = "upload" | "map" | "confirm"

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const parse = (line: string) =>
    line.split(",").map(v => v.trim().replace(/^"|"$/g, "").trim())
  return { headers: parse(lines[0]), rows: lines.slice(1).map(parse) }
}

function guessColumn(headers: string[], keywords: string[]): number {
  const lower = headers.map(h => h.toLowerCase())
  for (const kw of keywords) {
    const i = lower.findIndex(h => h.includes(kw))
    if (i !== -1) return i
  }
  return -1
}

function guessCategory(description: string): string {
  const d = description.toLowerCase()
  if (d.includes("grab") || d.includes("petrol") || d.includes("parking") || d.includes("toll")) return "Transport"
  if (d.includes("restaurant") || d.includes("cafe") || d.includes("food") || d.includes("kfc") || d.includes("mcd") || d.includes("makan")) return "Food & Dining"
  if (d.includes("shopee") || d.includes("lazada") || d.includes("amazon")) return "Other Expense"
  if (d.includes("netflix") || d.includes("spotify") || d.includes("gym") || d.includes("cinema")) return "Entertainment"
  if (d.includes("pharmacy") || d.includes("hospital") || d.includes("clinic") || d.includes("guardian")) return "Healthcare"
  if (d.includes("tesco") || d.includes("jaya") || d.includes("mydin") || d.includes("aeon") || d.includes("market")) return "Food & Dining"
  return "Other Expense"
}

export function CSVImportModal({ accounts, onClose, onImport }: CSVImportModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [fileName, setFileName] = useState("")
  const [colDate, setColDate] = useState(-1)
  const [colDesc, setColDesc] = useState(-1)
  const [colAmount, setColAmount] = useState(-1)
  const [accountId, setAccountId] = useState(() => {
    const cc = accounts.find(a => a.type === "credit_card")
    return cc?.id ?? accounts[0]?.id ?? ""
  })
  const [parseError, setParseError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // Build preview rows applying column mapping
  const previewRows = rows.slice(0, 5).map(row => ({
    date: colDate >= 0 ? row[colDate] : "",
    desc: colDesc >= 0 ? row[colDesc] : "",
    amount: colAmount >= 0 ? row[colAmount] : "",
  }))

  // Build final transactions
  const importRows = rows
    .map(row => {
      const rawAmount = colAmount >= 0 ? row[colAmount] : ""
      const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""))
      const desc = colDesc >= 0 ? row[colDesc] : ""
      const date = colDate >= 0 ? row[colDate] : ""
      if (isNaN(amount) || !date) return null
      return {
        date,
        accountId,
        category: guessCategory(desc),
        tags: ["csv-import"],
        amount: -Math.abs(amount),
        type: "expense" as const,
        notes: desc,
      }
    })
    .filter(Boolean) as Array<Omit<Transaction, "id" | "accountName">>

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError("")
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      if (!h.length) {
        setParseError("Could not parse CSV. Make sure the file has headers in the first row.")
        return
      }
      setHeaders(h)
      setRows(r)
      setColDate(guessColumn(h, ["date", "transaction date", "trans date", "posting date", "value date"]))
      setColDesc(guessColumn(h, ["description", "details", "narrative", "merchant", "payee", "particulars", "remark"]))
      setColAmount(guessColumn(h, ["amount", "debit", "transaction amount", "credit", "dr"]))
      setStep("map")
    }
    reader.readAsText(file)
  }

  function handleConfirm() {
    onImport(importRows)
    onClose()
  }

  const canProceed = colDate >= 0 && colAmount >= 0

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-20 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-[680px] shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Import CSV Statement</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {(["upload", "map", "confirm"] as Step[]).map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${step === s ? "text-emerald-400" : "text-zinc-600"}`}>
                      {i + 1}. {s}
                    </span>
                    {i < 2 && <ChevronRight size={10} className="text-zinc-700" />}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <div>
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center cursor-pointer hover:border-zinc-500 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={24} className="text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-300">Click to upload CSV</p>
                  <p className="text-xs text-zinc-600 mt-1">Bank or credit card statement in CSV format</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                {parseError && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
                    <AlertCircle size={13} /> {parseError}
                  </div>
                )}
                <div className="mt-5 text-xs text-zinc-600 space-y-1">
                  <p className="font-medium text-zinc-500">Supported formats</p>
                  <p>· Any CSV with headers — date, description, amount columns will be auto-detected</p>
                  <p>· Maybank, CIMB, RHB, Hong Leong, AmBank statements work out of the box</p>
                </div>
              </div>
            )}

            {/* Step 2: Map columns */}
            {step === "map" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{fileName}</span>
                  <span className="text-zinc-600">{rows.length} rows detected</span>
                </div>

                {/* Column mapping */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Date column", value: colDate, set: setColDate, required: true },
                    { label: "Description column", value: colDesc, set: setColDesc, required: false },
                    { label: "Amount column", value: colAmount, set: setColAmount, required: true },
                  ].map(({ label, value, set, required }) => (
                    <div key={label}>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                        {label} {required && <span className="text-rose-400">*</span>}
                      </label>
                      <select
                        value={value}
                        onChange={e => set(Number(e.target.value))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                      >
                        <option value={-1}>— not mapped —</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Account */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Import to account</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.type === "credit_card" ? " (CC)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview */}
                {previewRows.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Preview (first 5 rows)</p>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left px-3 py-2 text-zinc-600">Date</th>
                            <th className="text-left px-3 py-2 text-zinc-600">Description</th>
                            <th className="text-right px-3 py-2 text-zinc-600">Amount</th>
                            <th className="text-left px-3 py-2 text-zinc-600">Category (guessed)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((r, i) => (
                            <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                              <td className="px-3 py-2 text-zinc-400 tabular">{r.date || "—"}</td>
                              <td className="px-3 py-2 text-zinc-300 max-w-[200px] truncate">{r.desc || "—"}</td>
                              <td className="px-3 py-2 text-right tabular text-rose-400">{r.amount || "—"}</td>
                              <td className="px-3 py-2 text-zinc-500">{r.desc ? guessCategory(r.desc) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Ready to import <strong>{importRows.length}</strong> transactions into{" "}
                    <strong>{accounts.find(a => a.id === accountId)?.name}</strong>.
                    Categories were auto-guessed — you can edit them after import.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-900">
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-3 py-2 text-zinc-600">Date</th>
                        <th className="text-left px-3 py-2 text-zinc-600">Description</th>
                        <th className="text-left px-3 py-2 text-zinc-600">Category</th>
                        <th className="text-right px-3 py-2 text-zinc-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((tx, i) => (
                        <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                          <td className="px-3 py-2 text-zinc-400 tabular">{tx.date}</td>
                          <td className="px-3 py-2 text-zinc-300 max-w-[200px] truncate">{tx.notes}</td>
                          <td className="px-3 py-2 text-zinc-500">{tx.category}</td>
                          <td className="px-3 py-2 text-right tabular text-rose-400">
                            {tx.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-zinc-800 flex justify-between gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <div className="flex gap-2">
              {step === "map" && (
                <button
                  onClick={() => setStep("upload")}
                  className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors"
                >
                  Back
                </button>
              )}
              {step === "confirm" && (
                <button
                  onClick={() => setStep("map")}
                  className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors"
                >
                  Back
                </button>
              )}
              {step === "map" && (
                <button
                  disabled={!canProceed}
                  onClick={() => setStep("confirm")}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
                >
                  Preview Import →
                </button>
              )}
              {step === "confirm" && (
                <button
                  disabled={importRows.length === 0}
                  onClick={handleConfirm}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
                >
                  Import {importRows.length} Transactions
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
