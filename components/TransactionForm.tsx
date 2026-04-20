"use client"

import { useState } from "react"
import { X, ArrowRight, Link, UserPlus } from "lucide-react"
import {
  Transaction,
  Account,
  Liability,
  Receivable,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TransactionType,
} from "@/lib/data"

interface TransactionFormProps {
  accounts: Account[]
  liabilities: Liability[]
  receivables: Receivable[]
  onClose: () => void
  onSave: (txs: Array<Omit<Transaction, "id" | "accountName">>, liabilityId?: string, receivableId?: string) => void
}

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  investment: "Investment",
  loan_repayment: "Loan Repayment",
  loan_out: "Loan Out",
  loan_collection: "Collect Loan",
}

export function TransactionForm({ accounts, liabilities, receivables, onClose, onSave }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "")
  const [linkedLiabilityId, setLinkedLiabilityId] = useState(liabilities[0]?.id ?? "")
  const [linkedReceivableId, setLinkedReceivableId] = useState(receivables[0]?.id ?? "")
  const [newPersonName, setNewPersonName] = useState("")
  const [isNewPerson, setIsNewPerson] = useState(false)
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState("")

  const isTransfer = type === "transfer"
  const isLoanRepayment = type === "loan_repayment"
  const isLoanOut = type === "loan_out"
  const isLoanCollection = type === "loan_collection"
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const selectedLiability = liabilities.find(l => l.id === linkedLiabilityId)
  const selectedReceivable = receivables.find(r => r.id === linkedReceivableId)
  const personName = isNewPerson ? newPersonName : selectedReceivable?.name ?? ""

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId) return

    const tagList = tags.split(",").map(t => t.trim()).filter(Boolean)
    const amt = Math.abs(Number(amount))

    if (isTransfer) {
      if (accountId === toAccountId) return
      onSave([
        {
          date, accountId,
          category: "Transfer Out", tags: tagList,
          amount: -amt, type: "transfer",
          notes: notes || `Transfer to ${accounts.find(a => a.id === toAccountId)?.name}`,
        },
        {
          date, accountId: toAccountId,
          category: "Transfer In", tags: tagList,
          amount: amt, type: "transfer",
          notes: notes || `Transfer from ${accounts.find(a => a.id === accountId)?.name}`,
        },
      ])
    } else if (isLoanRepayment) {
      if (!linkedLiabilityId) return
      onSave([{
        date, accountId,
        category: "Loan Repayment", tags: tagList,
        amount: -amt, type: "loan_repayment",
        notes: notes || `Repayment — ${selectedLiability?.name}`,
        linkedLiabilityId,
        linkedLiabilityName: selectedLiability?.name,
      }], linkedLiabilityId)
    } else if (isLoanOut) {
      const name = isNewPerson ? newPersonName.trim() : selectedReceivable?.name ?? ""
      if (!name) return
      onSave([{
        date, accountId,
        category: "Loan Given", tags: tagList,
        amount: -amt, type: "loan_out",
        notes: notes || `Loan to ${name}`,
        linkedReceivableId: isNewPerson ? undefined : linkedReceivableId,
        linkedReceivableName: name,
      }], undefined, isNewPerson ? `__new__:${name}:${amt}` : linkedReceivableId)
    } else if (isLoanCollection) {
      if (!linkedReceivableId || isNewPerson) return
      onSave([{
        date, accountId,
        category: "Loan Received", tags: tagList,
        amount: amt, type: "loan_collection",
        notes: notes || `Collection from ${selectedReceivable?.name}`,
        linkedReceivableId,
        linkedReceivableName: selectedReceivable?.name,
      }], undefined, linkedReceivableId)
    } else {
      if (!category) return
      onSave([{
        date, accountId, category, tags: tagList,
        amount: type === "income" ? amt : -amt,
        type, notes,
      }])
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-screen w-[420px] bg-zinc-950 border-l border-zinc-800 z-30 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Add Transaction</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type */}
          <div>
            <label className="field-label">Type</label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {(["income", "expense", "transfer", "investment", "loan_repayment", "loan_out", "loan_collection"] as TransactionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`
                    px-3 py-1.5 rounded text-xs font-medium transition-colors
                    ${type === t
                      ? t === "income"          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : t === "expense"       ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : t === "transfer"      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                        : t === "loan_repayment"  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : t === "loan_out"        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                        : t === "loan_collection" ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                        : "bg-zinc-700 text-zinc-200 border border-zinc-600"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700"
                    }
                  `}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="field-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field-input" />
          </div>

          {/* Transfer */}
          {isTransfer ? (
            <div>
              <label className="field-label">Transfer Between Accounts</label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">From</p>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="field-input">
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} disabled={a.id === toAccountId}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 shrink-0"><ArrowRight size={16} className="text-blue-400" /></div>
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">To</p>
                  <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="field-input">
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} disabled={a.id === accountId}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {accountId === toAccountId && (
                <p className="text-[11px] text-rose-400 mt-1.5">From and To accounts must be different</p>
              )}
              {accountId !== toAccountId && amount && (
                <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{accounts.find(a => a.id === accountId)?.name}</span>
                    <span className="text-rose-400 tabular">-{Number(amount).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{accounts.find(a => a.id === toAccountId)?.name}</span>
                    <span className="text-emerald-400 tabular">+{Number(amount).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>

          ) : isLoanRepayment ? (
            <div className="space-y-4">
              <div>
                <label className="field-label">Pay From Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="field-input">
                  {accounts.filter(a => a.type !== "credit_card").map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Link to Loan</label>
                <select value={linkedLiabilityId} onChange={e => setLinkedLiabilityId(e.target.value)} className="field-input">
                  {liabilities.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.outstanding.toLocaleString("en-MY", { style: "currency", currency: "MYR" })} outstanding
                    </option>
                  ))}
                </select>
              </div>
              {selectedLiability && amount && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                    <Link size={11} /> Linked to {selectedLiability.name}
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Current outstanding</span>
                    <span className="tabular">{selectedLiability.outstanding.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>After repayment</span>
                    <span className="tabular text-emerald-400">
                      {Math.max(0, selectedLiability.outstanding - Math.abs(Number(amount))).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

          ) : isLoanOut ? (
            /* Loan Out to friend */
            <div className="space-y-4">
              <div>
                <label className="field-label">From Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="field-input">
                  {accounts.filter(a => a.type !== "credit_card").map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Lend To</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setIsNewPerson(false)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${!isNewPerson ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}>
                    Existing
                  </button>
                  <button type="button" onClick={() => setIsNewPerson(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${isNewPerson ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}>
                    <UserPlus size={11} /> New Person
                  </button>
                </div>
                {isNewPerson ? (
                  <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)}
                    placeholder="Friend's name" className="field-input" />
                ) : (
                  <select value={linkedReceivableId} onChange={e => setLinkedReceivableId(e.target.value)} className="field-input">
                    {receivables.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.outstanding.toLocaleString("en-MY", { style: "currency", currency: "MYR" })} owed
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {personName && amount && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-md px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-orange-400 font-medium">
                    <Link size={11} /> {personName} will owe you {Number(amount).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    {!isNewPerson && selectedReceivable && (
                      <span className="text-zinc-500 font-normal ml-1">
                        (total: {(selectedReceivable.outstanding + Number(amount)).toLocaleString("en-MY", { minimumFractionDigits: 2 })})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

          ) : isLoanCollection ? (
            /* Collect back from friend */
            <div className="space-y-4">
              <div>
                <label className="field-label">Receive Into Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="field-input">
                  {accounts.filter(a => a.type !== "credit_card").map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Collecting From</label>
                <select value={linkedReceivableId} onChange={e => setLinkedReceivableId(e.target.value)} className="field-input">
                  {receivables.filter(r => r.outstanding > 0).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.outstanding.toLocaleString("en-MY", { style: "currency", currency: "MYR" })} owed
                    </option>
                  ))}
                </select>
              </div>
              {selectedReceivable && amount && (
                <div className="bg-teal-500/5 border border-teal-500/20 rounded-md px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-teal-400 font-medium mb-1">
                    <Link size={11} /> Collecting from {selectedReceivable.name}
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Currently owed</span>
                    <span className="tabular">{selectedReceivable.outstanding.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>After collection</span>
                    <span className="tabular text-teal-400">
                      {Math.max(0, selectedReceivable.outstanding - Math.abs(Number(amount))).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* Normal: single account + category */
            <div className="space-y-4">
              <div>
                <label className="field-label">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="field-input">
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.type === "credit_card" ? " (CC)" : ""}
                    </option>
                  ))}
                </select>
                {accounts.find(a => a.id === accountId)?.type === "credit_card" && type === "expense" && (
                  <p className="text-[11px] text-rose-400/80 mt-1.5">Charging to credit card — increases outstanding balance.</p>
                )}
              </div>
              <div>
                <label className="field-label">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="field-input">
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="field-label">Amount (MYR)</label>
            <input
              type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="0" step="0.01"
              className="field-input tabular"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="field-label">Tags <span className="text-zinc-600">(comma separated)</span></label>
            <input
              type="text" value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="passive, fixed, freelance"
              className="field-input"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Notes</label>
            <input
              type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={
                isLoanOut ? "Auto-filled from person name"
                : isLoanCollection ? "Auto-filled from person name"
                : isLoanRepayment ? "Auto-filled from loan name"
                : isTransfer ? "Auto-filled from account names"
                : "Optional description"
              }
              className="field-input"
            />
          </div>

          <button
            type="submit"
            disabled={
              (isTransfer && accountId === toAccountId) ||
              (isLoanRepayment && !linkedLiabilityId) ||
              (isLoanOut && isNewPerson && !newPersonName.trim()) ||
              (isLoanOut && !isNewPerson && !linkedReceivableId && receivables.length > 0) ||
              (isLoanCollection && !linkedReceivableId)
            }
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-md transition-colors mt-2"
          >
            {isTransfer ? "Save Transfer (2 entries)"
              : isLoanRepayment ? "Save Repayment + Update Loan"
              : isLoanOut ? "Record Loan Out"
              : isLoanCollection ? "Record Collection + Update Balance"
              : "Save Transaction"}
          </button>
        </form>
      </div>

      <style>{`
        .field-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 6px; font-weight: 500; }
        .field-input { display: block; width: 100%; background: #18181b; border: 1px solid #3f3f46; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #e4e4e7; outline: none; transition: border-color 0.15s; }
        .field-input:focus { border-color: #52525b; }
        .field-input option { background: #18181b; }
      `}</style>
    </>
  )
}
