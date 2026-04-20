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

// --- Mock data ---

export const mockAccounts: Account[] = [
  { id: "a1", name: "Maybank Savings", type: "bank", balance: 42500, currency: "MYR" },
  { id: "a2", name: "CIMB Current", type: "bank", balance: 18200, currency: "MYR" },
  { id: "a3", name: "RHB Fixed Deposit", type: "bank", balance: 80000, currency: "MYR" },
  { id: "a4", name: "Cash Wallet", type: "cash", balance: 1200, currency: "MYR" },
  { id: "a5", name: "Touch 'n Go eWallet", type: "cash", balance: 340, currency: "MYR" },
  { id: "a6", name: "Moomoo", type: "investment", balance: 95000, currency: "MYR" },
  { id: "a7", name: "Rakuten Trade", type: "investment", balance: 62000, currency: "MYR" },
  { id: "a8", name: "EPF", type: "investment", balance: 110000, currency: "MYR" },
  { id: "a9", name: "Maybank Visa Platinum", type: "credit_card", balance: -2840, currency: "MYR" },
  { id: "a10", name: "CIMB Mastercard", type: "credit_card", balance: -1260, currency: "MYR" },
]

const today = new Date()
const y = today.getFullYear()
const m = String(today.getMonth() + 1).padStart(2, "0")

export const mockTransactions: Transaction[] = [
  { id: "t1", date: `${y}-${m}-01`, accountId: "a1", accountName: "Maybank Savings", category: "Salary", tags: [], amount: 8500, type: "income", notes: "April salary" },
  { id: "t2", date: `${y}-${m}-03`, accountId: "a1", accountName: "Maybank Savings", category: "Housing", tags: ["fixed"], amount: -2200, type: "expense", notes: "Rent" },
  { id: "t3", date: `${y}-${m}-05`, accountId: "a4", accountName: "Cash Wallet", category: "Food & Dining", tags: [], amount: -320, type: "expense", notes: "Weekly groceries" },
  { id: "t4", date: `${y}-${m}-07`, accountId: "a6", accountName: "Moomoo", category: "Dividend", tags: ["passive"], amount: 420, type: "income", notes: "IGB REIT dividend" },
  { id: "t5", date: `${y}-${m}-10`, accountId: "a1", accountName: "Maybank Savings", category: "Transport", tags: [], amount: -180, type: "expense", notes: "Petrol + toll" },
  { id: "t6", date: `${y}-${m}-12`, accountId: "a6", accountName: "Moomoo", category: "Investment", tags: [], amount: -5000, type: "investment", notes: "Bought 1000 PBBANK" },
  { id: "t7", date: `${y}-${m}-14`, accountId: "a1", accountName: "Maybank Savings", category: "Business Income", tags: ["freelance"], amount: 3200, type: "income", notes: "Consulting fee" },
  { id: "t8", date: `${y}-${m}-15`, accountId: "a2", accountName: "CIMB Current", category: "Food & Dining", tags: [], amount: -240, type: "expense", notes: "Restaurants" },
  { id: "t9", date: `${y}-${m}-18`, accountId: "a1", accountName: "Maybank Savings", category: "Entertainment", tags: [], amount: -150, type: "expense", notes: "Streaming + gym" },
  { id: "t10", date: `${y}-${m}-20`, accountId: "a7", accountName: "Rakuten Trade", category: "Dividend", tags: ["passive"], amount: 280, type: "income", notes: "Maybank dividend" },
]

export const mockStocks: StockHolding[] = [
  { id: "s1", ticker: "PBBANK", name: "Public Bank", shares: 3000, avgCost: 3.92, currentPrice: 4.10, annualDividend: 0.18 },
  { id: "s2", ticker: "MAYBANK", name: "Malayan Banking", shares: 2000, avgCost: 8.50, currentPrice: 9.12, annualDividend: 0.58 },
  { id: "s3", ticker: "IGB REIT", name: "IGB REIT", shares: 5000, avgCost: 1.65, currentPrice: 1.72, annualDividend: 0.085 },
  { id: "s4", ticker: "TENAGA", name: "Tenaga Nasional", shares: 800, avgCost: 11.20, currentPrice: 10.80, annualDividend: 0.42 },
  { id: "s5", ticker: "DLADY", name: "Dutch Lady", shares: 200, avgCost: 28.50, currentPrice: 29.80, annualDividend: 1.20 },
]

export const mockPhysicalAssets: PhysicalAsset[] = [
  { id: "pa1", name: "Residential Property", type: "property", currentValue: 520000, acquisitionCost: 450000, acquiredDate: "2019-03-15", notes: "3-bedroom, self-occupied" },
  { id: "pa2", name: "Personal Vehicle", type: "vehicle", currentValue: 92000, acquisitionCost: 120000, acquiredDate: "2022-06-01", notes: "" },
]

export const mockLiabilities: Liability[] = [
  { id: "l1", name: "Maybank Home Loan", type: "loan", principal: 450000, outstanding: 388000, interestRate: 3.85, monthlyPayment: 2340 },
  { id: "l2", name: "CIMB Car Loan", type: "loan", principal: 85000, outstanding: 42000, interestRate: 2.6, monthlyPayment: 1180 },
  { id: "l3", name: "Moomoo Margin", type: "margin", principal: 0, outstanding: 28000, interestRate: 5.5, monthlyPayment: 0 },
  { id: "l4", name: "Rakuten Margin", type: "margin", principal: 0, outstanding: 15000, interestRate: 5.2, monthlyPayment: 0 },
]

export const mockReceivables: Receivable[] = [
  { id: "r1", name: "Friend A", amount: 2000, outstanding: 1500, date: "2026-02-10", notes: "Emergency cash" },
  { id: "r2", name: "Friend B", amount: 500, outstanding: 500, date: "2026-03-22", notes: "Dinner split" },
]

export const mockRecurring: RecurringTransaction[] = [
  { id: "rec1", name: "Monthly Salary", type: "income", accountId: "a1", category: "Salary", amount: 8500, dayOfMonth: 1, notes: "Monthly salary", tags: [], active: true },
  { id: "rec2", name: "Rent", type: "expense", accountId: "a1", category: "Housing", amount: 2200, dayOfMonth: 3, notes: "Monthly rent", tags: ["fixed"], active: true },
  { id: "rec3", name: "Home Loan Repayment", type: "loan_repayment", accountId: "a1", category: "Loan Repayment", amount: 2340, dayOfMonth: 1, notes: "Maybank home loan", tags: ["fixed"], active: true },
  { id: "rec4", name: "Car Loan Repayment", type: "loan_repayment", accountId: "a1", category: "Loan Repayment", amount: 1180, dayOfMonth: 5, notes: "CIMB car loan", tags: ["fixed"], active: true },
  { id: "rec5", name: "Netflix", type: "expense", accountId: "a9", category: "Subscription", amount: 55, dayOfMonth: 15, notes: "", tags: [], active: true },
  { id: "rec6", name: "Spotify", type: "expense", accountId: "a9", category: "Subscription", amount: 17, dayOfMonth: 15, notes: "", tags: [], active: true },
  { id: "rec7", name: "EPF Contribution", type: "expense", accountId: "a1", category: "EPF Contribution", amount: 1105, dayOfMonth: 1, notes: "Employee + employer EPF", tags: ["fixed"], active: true },
]

export const mockMonthlyData = [
  { month: "Nov", income: 9200, expense: 4100 },
  { month: "Dec", income: 12400, expense: 6200 },
  { month: "Jan", income: 8800, expense: 3900 },
  { month: "Feb", income: 9100, expense: 4400 },
  { month: "Mar", income: 11200, expense: 5100 },
  { month: "Apr", income: 12400, expense: 3090, current: true },
]

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
