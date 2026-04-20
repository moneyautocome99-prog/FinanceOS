import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"
import { ClientProviders } from "@/components/ClientProviders"
import { MainContent } from "@/components/MainContent"

export const metadata: Metadata = {
  title: "FinanceOS",
  description: "Personal Finance Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <ClientProviders>
          <Sidebar />
          <MainContent>
            {children}
          </MainContent>
        </ClientProviders>
      </body>
    </html>
  )
}
