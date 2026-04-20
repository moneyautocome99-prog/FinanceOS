"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  CreditCard,
  Shield,
  Landmark,
  RefreshCw,
  CalendarDays,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/annual", label: "Annual", icon: CalendarDays },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
  { href: "/liabilities", label: "Liabilities", icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-zinc-950 border-r border-zinc-800 flex flex-col z-10">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800 flex items-center gap-2">
        <Shield size={18} className="text-emerald-500" />
        <span className="text-sm font-semibold text-zinc-100 tracking-tight">FinanceOS</span>
        <span className="ml-auto text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Private</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative
                ${active
                  ? "bg-zinc-800 text-zinc-100 border-l-2 border-emerald-500 pl-[10px]"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }
              `}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: user + logout */}
      <div className="px-4 py-4 border-t border-zinc-800 space-y-3">
        {email && (
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">{email}</p>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-zinc-600 hover:text-rose-400 transition-colors ml-1 shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest">v0.1 · Prototype</p>
      </div>
    </aside>
  )
}
