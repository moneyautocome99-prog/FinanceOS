export type AccountType = "bank" | "cash" | "investment" | "credit_card"

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
}

export type TransactionType = "income" | "expense" | "transfer" | "investment" | "loan_repayment" | "loan_out" | "loan_collection"

export interface Transaction {
  id: string
  date: string
  accountId: string
  accountName: string
  category: string
  tags: string[]
  amount: number
  type: TransactionType
  notes: string
  linkedLiabilityId?: string
  linkedLiabilityName?: string
  linkedReceivableId?: string
  linkedReceivableName?: string
}

export interface Receivable {
  id: string
  name: string        // person's name
  amount: number      // original amount lent
  outstanding: number // still owed
  date: string        // date lent
  notes: string
}

export interface RecurringTransaction {
  id: string
  name: string
  type: TransactionType
  accountId: string
  category: string
  amount: number
  dayOfMonth: number  // 1–28
  notes: string
  tags: string[]
  active: boolean
}

export interface StockHolding {
  id: string
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  annualDividend: number
}

export type LiabilityType = "loan" | "margin"

export type AssetType = "property" | "vehicle" | "business" | "collectible" | "other"

export interface PhysicalAsset {
  id: string
  name: string
  type: AssetType
  currentValue: number
  acquisitionCost: number
  acquiredDate: string
  notes: string
}

export interface Liability {
  id: string
  name: string
  type: LiabilityType
  principal: number
  outstanding: number
  interestRate: number
  monthlyPayment: number
}

export const INCOME_CATEGORIES = [
  "Salary",
  "Dividend",
  "Business Income",
  "Loan Received",
  "Transfer In",
  "Other Income",
]

export const EXPENSE_CATEGORIES = [
  // Fixed
  "Housing",
  "Insurance",
  "Healthcare",
  "Government Tax",
  "EPF Contribution",
  "Loan Given",
  "Credit Card Payment",
  // Growth
  "Investment",
  "Business Expense",
  // Lifestyle
  "Food & Dining",
  "Transport",
  "Shopping",
  "Travel & Vacation",
  "Entertainment",
  "Subscription",
  "Donation & Charity",
  "Gifts",
  // Other
  "Transfer Out",
  "Other Expense",
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export type SpendingGroup = "Fixed" | "Growth" | "Lifestyle" | "Transfer"

export const CATEGORY_GROUPS: Record<string, SpendingGroup> = {
  "Housing":              "Fixed",
  "Insurance":            "Fixed",
  "Healthcare":           "Fixed",
  "Government Tax":       "Fixed",
  "EPF Contribution":     "Fixed",
  "Loan Given":           "Fixed",
  "Credit Card Payment":  "Fixed",
  "Investment":           "Growth",
  "Business Expense":     "Growth",
  "Food & Dining":        "Lifestyle",
  "Transport":            "Lifestyle",
  "Shopping":             "Lifestyle",
  "Travel & Vacation":    "Lifestyle",
  "Entertainment":        "Lifestyle",
  "Subscription":         "Lifestyle",
  "Donation & Charity":   "Lifestyle",
  "Gifts":                "Lifestyle",
  "Other Expense":        "Lifestyle",
  "Transfer Out":         "Transfer",
}

export const SPENDING_GROUP_META: Record<SpendingGroup, { color: string; bar: string; dot: string }> = {
  Fixed:     { color: "text-amber-400",   bar: "bg-amber-500",   dot: "bg-amber-500" },
  Growth:    { color: "text-emerald-400", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  Lifestyle: { color: "text-blue-400",    bar: "bg-blue-500",    dot: "bg-blue-500" },
  Transfer:  { color: "text-zinc-400",    bar: "bg-zinc-600",    dot: "bg-zinc-500" },
}

export interface GroupBreakdown {
  group: SpendingGroup
  total: number
  pct: number
  categories: { name: string; amount: number; pct: number }[]
}

export function getSpendingBreakdown(transactions: Transaction[]): GroupBreakdown[] {
  const expenses = transactions.filter(t => t.type === "expense" || t.type === "investment")
  const totalSpend = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  if (totalSpend === 0) return []

  const groups: SpendingGroup[] = ["Fixed", "Growth", "Lifestyle", "Transfer"]
  return groups.map(group => {
    const groupTxns = expenses.filter(t => (CATEGORY_GROUPS[t.category] ?? "Lifestyle") === group)
    const groupTotal = groupTxns.reduce((s, t) => s + Math.abs(t.amount), 0)

    // Roll up by category
    const catMap: Record<string, number> = {}
    for (const t of groupTxns) {
      catMap[t.category] = (catMap[t.category] ?? 0) + Math.abs(t.amount)
    }
    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount, pct: groupTotal > 0 ? (amount / groupTotal) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)

    return {
      group,
      total: groupTotal,
      pct: (groupTotal / totalSpend) * 100,
      categories,
    }
  }).filter(g => g.total > 0)
}

export const mockAccounts: Account[] = []

export const mockTransactions: Transaction[] = []

export const mockStocks: StockHolding[] = []

export const mockPhysicalAssets: PhysicalAsset[] = []

export const mockLiabilities: Liability[] = []

export const mockReceivables: Receivable[] = []

export const mockRecurring: RecurringTransaction[] = []

export const mockMonthlyData: { month: string; income: number; expense: number; current?: boolean }[] = []

// --- Computed helpers ---

export function getCreditCardDebt(accounts: Account[]) {
  return accounts
    .filter(a => a.type === "credit_card")
    .reduce((s, a) => s + Math.abs(a.balance), 0)
}

export function getTotalAssets(accounts: Account[], stocks: StockHolding[], physicalAssets: PhysicalAsset[] = []) {
  const cash = accounts
    .filter(a => a.type !== "credit_card")
    .reduce((s, a) => s + a.balance, 0)
  const stockValue = stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0)
  const physicalValue = physicalAssets.reduce((s, a) => s + a.currentValue, 0)
  return cash + stockValue + physicalValue
}

export function getTotalLiabilities(accounts: Account[], liabilities: Liability[]) {
  const explicit = liabilities.reduce((s, l) => s + l.outstanding, 0)
  return explicit + getCreditCardDebt(accounts)
}

export function getNetWorth(accounts: Account[], stocks: StockHolding[], liabilities: Liability[], physicalAssets: PhysicalAsset[] = []) {
  return getTotalAssets(accounts, stocks, physicalAssets) - getTotalLiabilities(accounts, liabilities)
}

export function getLeverageRatio(accounts: Account[], stocks: StockHolding[], liabilities: Liability[], physicalAssets: PhysicalAsset[] = []) {
  const assets = getTotalAssets(accounts, stocks, physicalAssets)
  if (assets === 0) return 0
  return getTotalLiabilities(accounts, liabilities) / assets
}

export function getMonthlyCashFlow(transactions: Transaction[]) {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0)
  return { income, expense, net: income - expense }
}

export function fmt(amount: number, showSign = false) {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (showSign) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return formatted
}

export function fmtCurrency(amount: number, showSign = false) {
  return `MYR ${fmt(amount, showSign)}`
}
