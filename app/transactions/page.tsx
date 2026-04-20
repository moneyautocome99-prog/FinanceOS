"use client"

import { useState, useMemo } from "react"
import { Plus, Upload, Search, ChevronDown, Link } from "lucide-react"
import {
  mockTransactions,
  mockAccounts,
  Transaction,
  ALL_CATEGORIES,
} from "@/lib/data"
import { TransactionForm } from "@/components/TransactionForm"
import { CSVImportModal } from "@/components/CSVImportModal"
import { useLiabilities, useReceivables } from "@/lib/store"

const TYPE_COLORS: Record<string, string> = {
  income: "text-emerald-400 bg-emerald-500/10",
  expense: "text-rose-400 bg-rose-500/10",
  transfer: "text-blue-400 bg-blue-500/10",
  investment: "text-violet-400 bg-violet-500/10",
  loan_repayment: "text-amber-400 bg-amber-500/10",
  loan_out: "text-orange-400 bg-orange-500/10",
  loan_collection: "text-teal-400 bg-teal-500/10",
}

export default function TransactionsPage() {
  const { liabilities, payLiability } = useLiabilities()
  const { receivables, collectReceivable, setReceivables } = useReceivables()
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [showForm, setShowForm] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterAccount, setFilterAccount] = useState("")
  const [filterType, setFilterType] = useState("")

  const filtered = useMemo(() => {
    return transactions
      .filter(tx => {
        if (search && !tx.category.toLowerCase().includes(search.toLowerCase()) && !tx.notes.toLowerCase().includes(search.toLowerCase())) return false
        if (filterCategory && tx.category !== filterCategory) return false
        if (filterAccount && tx.accountId !== filterAccount) return false
        if (filterType && tx.type !== filterType) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, search, filterCategory, filterAccount, filterType])

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0)

  function handleSave(txs: Array<Omit<Transaction, "id" | "accountName">>, liabilityId?: string, receivableId?: string) {
    const now = Date.now()
    setTransactions(prev => [
      ...txs.map((tx, i) => ({
        ...tx,
        id: `t${now + i}`,
        accountName: mockAccounts.find(a => a.id === tx.accountId)?.name ?? "",
      })),
      ...prev,
    ])
    if (liabilityId && txs[0]) {
      payLiability(liabilityId, Math.abs(txs[0].amount))
    }
    if (receivableId && txs[0]) {
      if (receivableId.startsWith("__new__:")) {
        const [, name, amtStr] = receivableId.split(":")
        const amt = Number(amtStr)
        setReceivables([...receivables, {
          id: `r${now}`,
          name,
          amount: amt,
          outstanding: amt,
          date: txs[0].date,
          notes: txs[0].notes,
        }])
      } else {
        collectReceivable(receivableId, Math.abs(txs[0].amount))
      }
    }
  }

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Transactions</h1>
          <p className="text-xs text-zinc-500 mt-1">{filtered.length} records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            <Upload size={13} /> Import CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors font-medium"
          >
            <Plus size={13} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Income</p>
          <p className="text-lg font-bold tabular text-emerald-400 mt-1">+{totalIncome.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Expense</p>
          <p className="text-lg font-bold tabular text-rose-400 mt-1">-{totalExpense.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Net</p>
          <p className={`text-lg font-bold tabular mt-1 ${totalIncome - totalExpense >= 0 ? "text-zinc-100" : "text-rose-400"}`}>
            {totalIncome - totalExpense >= 0 ? "+" : ""}{(totalIncome - totalExpense).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
          />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-7 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
            <option value="investment">Investment</option>
            <option value="loan_repayment">Loan Repayment</option>
            <option value="loan_out">Loan Out</option>
            <option value="loan_collection">Collect Loan</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-7 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="">All Accounts</option>
            {mockAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-7 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Account</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Tags</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Notes</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-600">No transactions this month</td>
              </tr>
            )}
            {filtered.map(tx => (
              <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-400 tabular">{tx.date}</td>
                <td className="px-4 py-3 text-zinc-300">{tx.accountName}</td>
                <td className="px-4 py-3 text-zinc-200">{tx.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${TYPE_COLORS[tx.type] ?? "text-zinc-400 bg-zinc-800"}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {tx.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="text-zinc-500 truncate block">{tx.notes}</span>
                  {tx.linkedLiabilityName && (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                      <Link size={9} /> {tx.linkedLiabilityName}
                    </span>
                  )}
                  {tx.linkedReceivableName && (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[10px]">
                      <Link size={9} /> {tx.linkedReceivableName}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right tabular font-medium ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TransactionForm
          accounts={mockAccounts}
          liabilities={liabilities}
          receivables={receivables}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {showCSV && (
        <CSVImportModal
          accounts={mockAccounts}
          onClose={() => setShowCSV(false)}
          onImport={handleSave}
        />
      )}
    </div>
  )
}
