import { useState } from 'react'
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  LockKeyhole
} from 'lucide-react'

import { login } from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')

    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }

    try {
      setLoading(true)

      await login(
        username.trim(),
        password
      )

      if (onLogin) {
        await onLogin()
      } else {
        window.location.reload()
      }

    } catch (err) {
      setError(
        err?.message ||
        'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-5">

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

        {/* LEFT — BRAND */}

        <section className="hidden lg:block">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
            <Sparkles size={15} />
            AI Information Intelligence
          </div>

          <h1 className="text-5xl font-bold tracking-tight mt-6 leading-tight">
            Understand your
            <span className="text-indigo-600">
              {' '}information.
            </span>
            <br />
            Make better decisions.
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 mt-6 max-w-xl leading-8">
            InfoMind AI connects organizational knowledge,
            detects important changes and risks, and turns
            information into actionable decisions.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">

            <Feature
              title="Understand"
              description="AI-powered document understanding"
            />

            <Feature
              title="Connect"
              description="Discover relationships between information"
            />

            <Feature
              title="Detect"
              description="Find conflicts, risks and important changes"
            />

            <Feature
              title="Act"
              description="Convert findings into decisions"
            />

          </div>

        </section>

        {/* RIGHT — LOGIN */}

        <section className="w-full max-w-md mx-auto">

          {/* LOGO */}

          <div className="text-center mb-7">

            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white mx-auto grid place-items-center shadow-lg shadow-indigo-200 dark:shadow-none">

              <ShieldCheck size={32} />

            </div>

            <h2 className="text-2xl font-bold mt-5">
              Welcome to InfoMind AI
            </h2>

            <p className="mut mt-2">
              Sign in to your intelligence workspace
            </p>

          </div>

          {/* CARD */}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-7">

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div>

                <label className="text-sm font-semibold">
                  Username
                </label>

                <input
                  className="inp mt-2"
                  value={username}
                  onChange={e =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="text-sm font-semibold">
                  Password
                </label>

                <div className="relative mt-2">

                  <input
                    className="inp pr-11"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={e =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg grid place-items-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

              {/* ERROR */}

              {error && (

                <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">

                  {error}

                </div>

              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-p py-2.5 flex items-center justify-center gap-2"
              >

                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </form>

            {/* SECURITY */}

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">

                <LockKeyhole size={14} />

                Secure workspace authentication

              </div>

            </div>

          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            InfoMind AI • Information Intelligence Platform
          </p>

        </section>

      </div>

    </main>
  )
}

function Feature({
  title,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">

      <div className="w-2 h-2 rounded-full bg-indigo-600 mb-3" />

      <div className="font-semibold">
        {title}
      </div>

      <div className="text-sm text-slate-500 mt-1 leading-5">
        {description}
      </div>

    </div>
  )
}
