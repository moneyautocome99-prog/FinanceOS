"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Account, Transaction, StockHolding, PhysicalAsset,
  Liability, Receivable, RecurringTransaction,
} from "./data"

// ── Types ────────────────────────────────────────────────────────────────────

interface AppCtx {
  // Data
  accounts: Account[]
  transactions: Transaction[]
  stocks: StockHolding[]
  physicalAssets: PhysicalAsset[]
  liabilities: Liability[]
  receivables: Receivable[]
  recurring: RecurringTransaction[]
  loading: boolean

  // Accounts
  addAccount: (a: Omit<Account, "id">) => Promise<void>

  // Transactions
  addTransactions: (txs: Array<Omit<Transaction, "id" | "accountName">>, liabilityId?: string, receivableId?: string, newPersonName?: string, newPersonAmount?: number) => Promise<void>

  // Stocks
  addStock: (s: Omit<StockHolding, "id">) => Promise<void>
  updateStockPrice: (id: string, price: number) => Promise<void>

  // Physical assets
  addPhysicalAsset: (a: Omit<PhysicalAsset, "id">) => Promise<void>

  // Liabilities
  addLiability: (l: Omit<Liability, "id">) => Promise<void>
  payLiability: (id: string, amount: number) => Promise<void>

  // Receivables
  addReceivable: (r: Omit<Receivable, "id">) => Promise<void>
  collectReceivable: (id: string, amount: number) => Promise<void>

  // Recurring
  addRecurring: (r: Omit<RecurringTransaction, "id">) => Promise<void>
  toggleRecurring: (id: string) => Promise<void>
  removeRecurring: (id: string) => Promise<void>
}

const AppContext = createContext<AppCtx | null>(null)

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID() }

function toAccount(row: Record<string, unknown>): Account {
  return { id: row.id as string, name: row.name as string, type: row.type as Account["type"], balance: Number(row.balance), currency: row.currency as string }
}

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    date: row.date as string,
    accountId: row.account_id as string,
    accountName: row.account_name as string,
    category: row.category as string,
    tags: (row.tags as string[]) ?? [],
    amount: Number(row.amount),
    type: row.type as Transaction["type"],
    notes: (row.notes as string) ?? "",
    linkedLiabilityId: (row.linked_liability_id as string) ?? undefined,
    linkedLiabilityName: (row.linked_liability_name as string) ?? undefined,
    linkedReceivableId: (row.linked_receivable_id as string) ?? undefined,
    linkedReceivableName: (row.linked_receivable_name as string) ?? undefined,
  }
}

function toStock(row: Record<string, unknown>): StockHolding {
  return { id: row.id as string, ticker: row.ticker as string, name: row.name as string, shares: Number(row.shares), avgCost: Number(row.avg_cost), currentPrice: Number(row.current_price), annualDividend: Number(row.annual_dividend) }
}

function toPhysicalAsset(row: Record<string, unknown>): PhysicalAsset {
  return { id: row.id as string, name: row.name as string, type: row.type as PhysicalAsset["type"], currentValue: Number(row.current_value), acquisitionCost: Number(row.acquisition_cost), acquiredDate: row.acquired_date as string, notes: (row.notes as string) ?? "" }
}

function toLiability(row: Record<string, unknown>): Liability {
  return { id: row.id as string, name: row.name as string, type: row.type as Liability["type"], principal: Number(row.principal), outstanding: Number(row.outstanding), interestRate: Number(row.interest_rate), monthlyPayment: Number(row.monthly_payment) }
}

function toReceivable(row: Record<string, unknown>): Receivable {
  return { id: row.id as string, name: row.name as string, amount: Number(row.amount), outstanding: Number(row.outstanding), date: row.date as string, notes: (row.notes as string) ?? "" }
}

function toRecurring(row: Record<string, unknown>): RecurringTransaction {
  return { id: row.id as string, name: row.name as string, type: row.type as RecurringTransaction["type"], accountId: row.account_id as string, category: row.category as string, amount: Number(row.amount), dayOfMonth: Number(row.day_of_month), notes: (row.notes as string) ?? "", tags: (row.tags as string[]) ?? [], active: row.active as boolean }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stocks, setStocks] = useState<StockHolding[]>([])
  const [physicalAssets, setPhysicalAssets] = useState<PhysicalAsset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)

  // ── Load all data on mount ──────────────────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from("accounts").select("*").order("created_at"),
      sb.from("transactions").select("*").order("date", { ascending: false }),
      sb.from("stocks").select("*").order("created_at"),
      sb.from("physical_assets").select("*").order("created_at"),
      sb.from("liabilities").select("*").order("created_at"),
      sb.from("receivables").select("*").order("created_at"),
      sb.from("recurring_transactions").select("*").order("day_of_month"),
    ]).then(([a, t, s, pa, l, r, rec]) => {
      setAccounts((a.data ?? []).map(toAccount))
      setTransactions((t.data ?? []).map(toTransaction))
      setStocks((s.data ?? []).map(toStock))
      setPhysicalAssets((pa.data ?? []).map(toPhysicalAsset))
      setLiabilities((l.data ?? []).map(toLiability))
      setReceivables((r.data ?? []).map(toReceivable))
      setRecurring((rec.data ?? []).map(toRecurring))
      setLoading(false)
    })
  }, [])

  // ── Accounts ────────────────────────────────────────────────────────────
  const addAccount = useCallback(async (a: Omit<Account, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, name: a.name, type: a.type, balance: a.balance, currency: a.currency }
    await sb.from("accounts").insert(row)
    setAccounts(prev => [...prev, toAccount(row)])
  }, [])

  // ── Transactions ────────────────────────────────────────────────────────
  const addTransactions = useCallback(async (
    txs: Array<Omit<Transaction, "id" | "accountName">>,
    liabilityId?: string,
    receivableId?: string,
    newPersonName?: string,
    newPersonAmount?: number,
  ) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const now = Date.now()

    // Build transaction rows
    const rows = txs.map((tx, i) => {
      const acct = accounts.find(a => a.id === tx.accountId)
      return {
        id: `t${now + i}`,
        user_id: user!.id,
        date: tx.date,
        account_id: tx.accountId,
        account_name: acct?.name ?? "",
        category: tx.category,
        tags: tx.tags,
        amount: tx.amount,
        type: tx.type,
        notes: tx.notes ?? "",
        linked_liability_id: tx.linkedLiabilityId ?? null,
        linked_liability_name: tx.linkedLiabilityName ?? null,
        linked_receivable_id: tx.linkedReceivableId ?? null,
        linked_receivable_name: tx.linkedReceivableName ?? null,
      }
    })
    await sb.from("transactions").insert(rows)
    setTransactions(prev => [...rows.map(toTransaction), ...prev])

    // Update account balance
    for (const tx of txs) {
      const acct = accounts.find(a => a.id === tx.accountId)
      if (acct) {
        const newBal = acct.balance + tx.amount
        await sb.from("accounts").update({ balance: newBal }).eq("id", tx.accountId)
        setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: newBal } : a))
      }
    }

    // Update liability outstanding
    if (liabilityId) {
      const repayAmount = Math.abs(txs[0].amount)
      const liability = liabilities.find(l => l.id === liabilityId)
      if (liability) {
        const newOutstanding = Math.max(0, liability.outstanding - repayAmount)
        await sb.from("liabilities").update({ outstanding: newOutstanding }).eq("id", liabilityId)
        setLiabilities(prev => prev.map(l => l.id === liabilityId ? { ...l, outstanding: newOutstanding } : l))
      }
    }

    // Handle receivable
    if (receivableId) {
      if (newPersonName && newPersonAmount) {
        // Create new receivable
        const newRec = { id: `r${now}`, user_id: user!.id, name: newPersonName, amount: newPersonAmount, outstanding: newPersonAmount, date: txs[0].date, notes: "" }
        await sb.from("receivables").insert(newRec)
        setReceivables(prev => [...prev, toReceivable(newRec)])
      } else {
        // Collect from existing
        const amount = Math.abs(txs[0].amount)
        const rec = receivables.find(r => r.id === receivableId)
        if (rec) {
          const newOutstanding = Math.max(0, rec.outstanding - amount)
          await sb.from("receivables").update({ outstanding: newOutstanding }).eq("id", receivableId)
          setReceivables(prev => prev.map(r => r.id === receivableId ? { ...r, outstanding: newOutstanding } : r))
        }
      }
    }
  }, [accounts, liabilities, receivables])

  // ── Stocks ──────────────────────────────────────────────────────────────
  const addStock = useCallback(async (s: Omit<StockHolding, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, ticker: s.ticker, name: s.name, shares: s.shares, avg_cost: s.avgCost, current_price: s.currentPrice, annual_dividend: s.annualDividend }
    await sb.from("stocks").insert(row)
    setStocks(prev => [...prev, toStock(row)])
  }, [])

  const updateStockPrice = useCallback(async (id: string, price: number) => {
    const sb = createClient()
    await sb.from("stocks").update({ current_price: price }).eq("id", id)
    setStocks(prev => prev.map(s => s.id === id ? { ...s, currentPrice: price } : s))
  }, [])

  // ── Physical assets ─────────────────────────────────────────────────────
  const addPhysicalAsset = useCallback(async (a: Omit<PhysicalAsset, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, name: a.name, type: a.type, current_value: a.currentValue, acquisition_cost: a.acquisitionCost, acquired_date: a.acquiredDate, notes: a.notes }
    await sb.from("physical_assets").insert(row)
    setPhysicalAssets(prev => [...prev, toPhysicalAsset(row)])
  }, [])

  // ── Liabilities ─────────────────────────────────────────────────────────
  const addLiability = useCallback(async (l: Omit<Liability, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, name: l.name, type: l.type, principal: l.principal, outstanding: l.outstanding, interest_rate: l.interestRate, monthly_payment: l.monthlyPayment }
    await sb.from("liabilities").insert(row)
    setLiabilities(prev => [...prev, toLiability(row)])
  }, [])

  const payLiability = useCallback(async (id: string, amount: number) => {
    const sb = createClient()
    const liability = liabilities.find(l => l.id === id)
    if (!liability) return
    const newOutstanding = Math.max(0, liability.outstanding - amount)
    await sb.from("liabilities").update({ outstanding: newOutstanding }).eq("id", id)
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, outstanding: newOutstanding } : l))
  }, [liabilities])

  // ── Receivables ─────────────────────────────────────────────────────────
  const addReceivable = useCallback(async (r: Omit<Receivable, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, name: r.name, amount: r.amount, outstanding: r.outstanding, date: r.date, notes: r.notes }
    await sb.from("receivables").insert(row)
    setReceivables(prev => [...prev, toReceivable(row)])
  }, [])

  const collectReceivable = useCallback(async (id: string, amount: number) => {
    const sb = createClient()
    const rec = receivables.find(r => r.id === id)
    if (!rec) return
    const newOutstanding = Math.max(0, rec.outstanding - amount)
    await sb.from("receivables").update({ outstanding: newOutstanding }).eq("id", id)
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, outstanding: newOutstanding } : r))
  }, [receivables])

  // ── Recurring ───────────────────────────────────────────────────────────
  const addRecurring = useCallback(async (r: Omit<RecurringTransaction, "id">) => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const row = { id: uid(), user_id: user!.id, name: r.name, type: r.type, account_id: r.accountId, category: r.category, amount: r.amount, day_of_month: r.dayOfMonth, notes: r.notes, tags: r.tags, active: r.active }
    await sb.from("recurring_transactions").insert(row)
    setRecurring(prev => [...prev, toRecurring(row)])
  }, [])

  const toggleRecurring = useCallback(async (id: string) => {
    const sb = createClient()
    const rec = recurring.find(r => r.id === id)
    if (!rec) return
    await sb.from("recurring_transactions").update({ active: !rec.active }).eq("id", id)
    setRecurring(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }, [recurring])

  const removeRecurring = useCallback(async (id: string) => {
    const sb = createClient()
    await sb.from("recurring_transactions").delete().eq("id", id)
    setRecurring(prev => prev.filter(r => r.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      accounts, transactions, stocks, physicalAssets, liabilities, receivables, recurring, loading,
      addAccount,
      addTransactions,
      addStock, updateStockPrice,
      addPhysicalAsset,
      addLiability, payLiability,
      addReceivable, collectReceivable,
      addRecurring, toggleRecurring, removeRecurring,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppData must be used within AppProvider")
  return ctx
}

// ── Legacy hooks (backwards compat) ──────────────────────────────────────────
export function useLiabilities() {
  const { liabilities, addLiability, payLiability } = useAppData()
  return { liabilities, setLiabilities: () => {}, payLiability, addLiability }
}

export function useReceivables() {
  const { receivables, addReceivable, collectReceivable } = useAppData()
  return { receivables, setReceivables: () => {}, collectReceivable, addReceivable }
}

export function useRecurring() {
  const { recurring, addRecurring, toggleRecurring, removeRecurring } = useAppData()
  return { recurring, setRecurring: () => {}, addRecurring, toggleRecurring, removeRecurring }
}

// Keep old export name working
export { AppProvider as LiabilitiesProvider }
