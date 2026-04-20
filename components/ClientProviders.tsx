"use client"

import { LiabilitiesProvider } from "@/lib/store"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <LiabilitiesProvider>{children}</LiabilitiesProvider>
}
