"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const PIN_LENGTH = 6

function PinRow({
  label,
  digits,
  shake,
  refs,
  disabled,
  onChange,
  onKeyDown,
}: {
  label: string
  digits: string[]
  shake: boolean
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  disabled: boolean
  onChange: (i: number, val: string) => void
  onKeyDown: (i: number, e: React.KeyboardEvent) => void
}) {
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3">{label}</p>
      <div className={`flex gap-2 ${shake ? "shake" : ""}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={d}
            onChange={e => onChange(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            disabled={disabled}
            className={`
              w-9 h-11 text-center text-base font-semibold rounded-lg border transition-colors outline-none
              bg-zinc-800 text-zinc-100
              ${d ? "border-emerald-500" : "border-zinc-700"}
              focus:border-emerald-400 disabled:opacity-40
            `}
          />
        ))}
      </div>
    </div>
  )
}

export default function SetupPinPage() {
  const router = useRouter()
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""))
  const [confirm, setConfirm] = useState<string[]>(Array(PIN_LENGTH).fill(""))
  const [shakePin, setShakePin] = useState(false)
  const [shakeConfirm, setShakeConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { pinRefs.current[0]?.focus() }, [])

  function handlePin(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1)
    const next = [...pin]; next[i] = d; setPin(next)
    if (d && i < PIN_LENGTH - 1) pinRefs.current[i + 1]?.focus()
    if (d && i === PIN_LENGTH - 1) confirmRefs.current[0]?.focus()
  }

  function handleConfirm(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1)
    const next = [...confirm]; next[i] = d; setConfirm(next)
    if (d && i < PIN_LENGTH - 1) confirmRefs.current[i + 1]?.focus()
    if (d && i === PIN_LENGTH - 1) {
      const full = [...confirm]; full[i] = d
      if (full.join("").length === PIN_LENGTH) handleSubmit([...pin], full)
    }
  }

  function handlePinKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus()
  }

  function handleConfirmKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !confirm[i] && i > 0) confirmRefs.current[i - 1]?.focus()
  }

  async function handleSubmit(pinDigits: string[], confirmDigits: string[]) {
    setError("")
    const p = pinDigits.join("")
    const c = confirmDigits.join("")

    if (p.length < PIN_LENGTH) return
    if (p !== c) {
      setShakeConfirm(true)
      setConfirm(Array(PIN_LENGTH).fill(""))
      setTimeout(() => { setShakeConfirm(false); confirmRefs.current[0]?.focus() }, 500)
      setError("PINs don't match. Try again.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: p })
    setLoading(false)

    if (err) {
      setError(err.message)
      setShakePin(true)
      setShakeConfirm(true)
      setPin(Array(PIN_LENGTH).fill(""))
      setConfirm(Array(PIN_LENGTH).fill(""))
      setTimeout(() => { setShakePin(false); setShakeConfirm(false); pinRefs.current[0]?.focus() }, 500)
    } else {
      setDone(true)
      setTimeout(() => router.push("/"), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Shield size={22} className="text-emerald-500" />
          <span className="text-lg font-semibold text-zinc-100 tracking-tight">FinanceOS</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          {done ? (
            <div className="text-center py-2">
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-100">PIN set!</p>
              <p className="text-xs text-zinc-500 mt-1">Taking you in…</p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-zinc-100 mb-1">Set your PIN</h2>
              <p className="text-xs text-zinc-500 mb-6">Choose a 6-digit PIN. You'll use it every time you sign in.</p>

              <PinRow label="Enter PIN" digits={pin} shake={shakePin} refs={pinRefs} disabled={loading} onChange={handlePin} onKeyDown={handlePinKey} />
              <PinRow label="Confirm PIN" digits={confirm} shake={shakeConfirm} refs={confirmRefs} disabled={loading} onChange={handleConfirm} onKeyDown={handleConfirmKey} />

              {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
              {loading && <p className="text-xs text-zinc-500 mt-3">Saving…</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
