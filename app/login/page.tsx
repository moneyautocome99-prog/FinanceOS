"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Shield size={22} className="text-emerald-500" />
          <span className="text-lg font-semibold text-zinc-100 tracking-tight">FinanceOS</span>
        </div>

        {sent ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Check your email</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We sent a magic link to <span className="text-zinc-300">{email}</span>.<br />
              Click the link to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail("") }}
              className="mt-5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">Sign in</h2>
            <p className="text-xs text-zinc-500 mb-6">We'll send a magic link to your email.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-600 mt-6">Private · Solo use only</p>
      </div>
    </div>
  )
}
