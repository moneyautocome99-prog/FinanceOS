"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const EMAIL = "moneyautocome99@gmail.com"
const PIN_LENGTH = 6

export default function LoginPage() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""))
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [setupSent, setSetupSent] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  async function submit(pin: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: pin })
    setLoading(false)
    if (error) {
      setShake(true)
      setDigits(Array(PIN_LENGTH).fill(""))
      setTimeout(() => { setShake(false); refs.current[0]?.focus() }, 500)
    } else {
      router.push("/")
    }
  }

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[i] = digit
    setDigits(next)
    if (digit && i < PIN_LENGTH - 1) {
      refs.current[i + 1]?.focus()
    }
    if (digit && i === PIN_LENGTH - 1) {
      const pin = next.join("")
      if (pin.length === PIN_LENGTH) submit(pin)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  async function handleSetupPin() {
    setSetupLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: EMAIL,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup-pin` },
    })
    setSetupLoading(false)
    setSetupSent(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Shield size={22} className="text-emerald-500" />
          <span className="text-lg font-semibold text-zinc-100 tracking-tight">FinanceOS</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-sm font-semibold text-zinc-100 mb-1 text-center">Enter PIN</h2>
          <p className="text-xs text-zinc-500 mb-7 text-center">6-digit PIN to access your dashboard</p>

          <div className={`flex justify-center gap-2 ${shake ? "shake" : ""}`}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`
                  w-9 h-11 text-center text-base font-semibold rounded-lg border transition-colors outline-none
                  bg-zinc-800 text-zinc-100
                  ${d ? "border-emerald-500" : "border-zinc-700"}
                  focus:border-emerald-400
                  disabled:opacity-40
                `}
              />
            ))}
          </div>

          {loading && (
            <p className="text-center text-xs text-zinc-500 mt-5">Verifying…</p>
          )}
        </div>

        <div className="text-center mt-5">
          {setupSent ? (
            <p className="text-xs text-zinc-500">Check your email for a setup link.</p>
          ) : (
            <button
              onClick={handleSetupPin}
              disabled={setupLoading}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
            >
              {setupLoading ? "Sending…" : "First time? Set up your PIN"}
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-4">Private · Solo use only</p>
      </div>
    </div>
  )
}
