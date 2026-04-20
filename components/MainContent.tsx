"use client"

import { usePathname } from "next/navigation"

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/auth")
  return (
    <main className={isAuth ? "min-h-screen" : "ml-[220px] min-h-screen"}>
      {children}
    </main>
  )
}
