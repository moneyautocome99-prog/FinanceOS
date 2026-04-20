"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Liability, mockLiabilities, Receivable, mockReceivables, RecurringTransaction, mockRecurring } from "./data"

interface LiabilitiesCtx {
  liabilities: Liability[]
  setLiabilities: (l: Liability[]) => void
  payLiability: (id: string, amount: number) => void
}

interface ReceivablesCtx {
  receivables: Receivable[]
  setReceivables: (r: Receivable[]) => void
  collectReceivable: (id: string, amount: number) => void
}

interface RecurringCtx {
  recurring: RecurringTransaction[]
  setRecurring: (r: RecurringTransaction[]) => void
}

const LiabilitiesContext = createContext<LiabilitiesCtx | null>(null)
const ReceivablesContext = createContext<ReceivablesCtx | null>(null)
const RecurringContext = createContext<RecurringCtx | null>(null)

export function LiabilitiesProvider({ children }: { children: ReactNode }) {
  const [liabilities, setLiabilities] = useState<Liability[]>(mockLiabilities)
  const [receivables, setReceivables] = useState<Receivable[]>(mockReceivables)
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(mockRecurring)

  function payLiability(id: string, amount: number) {
    setLiabilities(prev =>
      prev.map(l => l.id === id ? { ...l, outstanding: Math.max(0, l.outstanding - amount) } : l)
    )
  }

  function collectReceivable(id: string, amount: number) {
    setReceivables(prev =>
      prev.map(r => r.id === id ? { ...r, outstanding: Math.max(0, r.outstanding - amount) } : r)
    )
  }

  return (
    <LiabilitiesContext.Provider value={{ liabilities, setLiabilities, payLiability }}>
      <ReceivablesContext.Provider value={{ receivables, setReceivables, collectReceivable }}>
        <RecurringContext.Provider value={{ recurring, setRecurring }}>
          {children}
        </RecurringContext.Provider>
      </ReceivablesContext.Provider>
    </LiabilitiesContext.Provider>
  )
}

export function useLiabilities() {
  const ctx = useContext(LiabilitiesContext)
  if (!ctx) throw new Error("useLiabilities must be used within LiabilitiesProvider")
  return ctx
}

export function useReceivables() {
  const ctx = useContext(ReceivablesContext)
  if (!ctx) throw new Error("useReceivables must be used within LiabilitiesProvider")
  return ctx
}

export function useRecurring() {
  const ctx = useContext(RecurringContext)
  if (!ctx) throw new Error("useRecurring must be used within LiabilitiesProvider")
  return ctx
}
