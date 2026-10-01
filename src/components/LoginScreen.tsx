import React, { useState } from 'react'
import { Calendar, Lock, Loader2, AlertCircle } from 'lucide-react'
import { login } from '../services/auth'

interface LoginScreenProps {
  onSuccess: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    try {
      const ok = await login(password)
      if (ok) {
        onSuccess()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6"
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs shadow-blue-500/20 text-white mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h1 className="font-extrabold text-base text-slate-800 tracking-tight">
            Study Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enter the access password to continue</p>
        </div>

        <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="access-password">
          Password
        </label>
        <div className="relative mb-2">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="access-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>{isSubmitting ? 'Checking...' : 'Unlock'}</span>
        </button>
      </form>
    </div>
  )
}

export default LoginScreen
