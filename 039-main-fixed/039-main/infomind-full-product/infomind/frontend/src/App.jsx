import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  GitCompare,
  BarChart3,
  Flag,
  CheckSquare,
  Shield,
  Search,
  LogOut,
  Bell,
  Settings,
  Menu,
  X
} from 'lucide-react'

import { api, hasToken, setToken } from './api'
import { Ctx, useData } from './ctx.jsx'


import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Attention from './pages/Attention'
import Documents from './pages/Documents'
import Compare from './pages/Compare'
import Ask from './pages/Ask'
import Actions from './pages/Actions'
import Insights from './pages/Insights'
import Admin from './pages/Admin'
import SettingsPage from './pages/Settings'

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard, Dashboard],
  ['documents', 'Documents', FileText, Documents],
  ['ask', 'Ask AI', Sparkles, Ask],
  ['compare', 'Compare', GitCompare, Compare],
  ['insights', 'Connections', BarChart3, Insights],
  ['attention', 'Attention Center', Flag, Attention],
  ['actions', 'Actions', CheckSquare, Actions],
  ['settings', 'Settings', Settings, SettingsPage],
  ['admin', 'Users & Audit', Shield, Admin, 'user:manage']
]

export default function App() {
  const [authed, setAuthed] = useState(hasToken())
  const [me, setMe] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [params, setParams] = useState({})
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')
  const [pal, setPal] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  // Read the saved display name immediately.
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('infomind-display-name') || ''
  )

  // Keep the sidebar synchronized with Settings.
  useEffect(() => {
    const updateDisplayName = event => {
      const nameFromEvent = event?.detail?.name

      setDisplayName(
        nameFromEvent ||
        localStorage.getItem('infomind-display-name') ||
        ''
      )
    }

    window.addEventListener(
      'infomind-name-updated',
      updateDisplayName
    )

    window.addEventListener(
      'storage',
      updateDisplayName
    )

    return () => {
      window.removeEventListener(
        'infomind-name-updated',
        updateDisplayName
      )

      window.removeEventListener(
        'storage',
        updateDisplayName
      )
    }
  }, [])

  const bump = useCallback(() => {
    setTick(value => value + 1)
  }, [])

  const toast = useCallback(message => {
    setMsg(message)
    window.setTimeout(() => setMsg(''), 2600)
  }, [])

  const nav = useCallback((nextPage, nextParams = {}) => {
    setPage(nextPage)
    setParams(nextParams)
    setMobileMenu(false)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!authed) {
      setMe(null)
      return
    }

    let cancelled = false

    api('/auth/me')
      .then(user => {
        if (!cancelled) setMe(user)
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null)
          setMe(null)
          setAuthed(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authed])

  useEffect(() => {
    const handleKeys = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPal(open => !open)
      }

      if (event.key === 'Escape') {
        setPal(false)
        setMobileMenu(false)
      }
    }

    window.addEventListener('keydown', handleKeys)

    return () => {
      window.removeEventListener('keydown', handleKeys)
    }
  }, [])

  // Apply the saved appearance preference on startup.
  useEffect(() => {
    const theme = localStorage.getItem('infomind-theme') || 'light'
    const root = document.documentElement

    root.classList.remove(
      'dark',
      'theme-indigo',
      'theme-emerald',
      'theme-violet',
      'theme-rose'
    )

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme !== 'light') {
      root.classList.add(`theme-${theme}`)
    }
  }, [])

  if (!authed) {
    return (
      <Login
        onLogin={async () => {
          setAuthed(true)
        }}
      />
    )
  }

  if (!me) {
    return <div className="p-10 mut">Loading workspace...</div>
  }

  const permissions = Array.isArray(me.permissions)
    ? me.permissions
    : []

  const can = permission => permissions.includes(permission)

  const items = NAV.filter(
    item => !item[4] || can(item[4])
  )

  const Page = (NAV.find(item => item[0] === page) || NAV[0])[3]

  const currentName =
    displayName.trim() ||
    me?.name ||
    me?.username ||
    'User'

  function signOut() {
    setToken(null)
    setMe(null)
    setAuthed(false)
    setPage('dashboard')
    setParams({})
  }

  return (
    <Ctx.Provider
      value={{
        me,
        can,
        tick,
        bump,
        toast,
        nav,
        params
      }}
    >
      <div className="min-h-screen md:grid md:grid-cols-[286px_minmax(0,1fr)]">

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col gap-1 p-3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">

          <div className="flex items-center gap-3 px-2 py-4 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-400 grid place-items-center text-white text-xl font-bold">
              ◎
            </div>

            <div>
              <div className="font-bold text-lg">InfoMind AI</div>
              <div className="text-xs text-slate-500">
                Understand. Connect. Act.
              </div>
            </div>
          </div>

          {items.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => nav(id)}
              aria-current={page === id ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition ${
                page === id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          <div className="mt-auto card !p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
                <Shield size={19} />
              </div>

              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {currentName}
                </div>
                <div className="mut capitalize">
                  {me.role || 'User'}
                </div>
              </div>
            </div>

            <button
              className="btn mt-3 w-full flex items-center justify-center gap-2"
              onClick={signOut}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="min-w-0">

          {/* HEADER */}
          <header className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-7 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">

            <button
              className="md:hidden btn !p-2"
              onClick={() => setMobileMenu(open => !open)}
              aria-label="Toggle navigation"
            >
              {mobileMenu ? <X size={19} /> : <Menu size={19} />}
            </button>

            <button
              className="flex-1 max-w-2xl flex items-center gap-2 px-3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-left"
              onClick={() => setPal(true)}
              aria-label="Open global search"
            >
              <Search size={17} />
              <span className="truncate">Ask InfoMind anything...</span>
              <kbd className="ml-auto hidden sm:block text-xs bg-slate-200 dark:bg-slate-700 rounded px-2 py-1">
                Ctrl K
              </kbd>
            </button>

            <div className="hidden lg:flex items-center gap-2 text-sm text-emerald-500 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              AI monitoring active
            </div>

            <button
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => nav('attention')}
              aria-label="Open notifications"
            >
              <Bell size={20} />
              <BellCount />
            </button>
          </header>

          {/* MOBILE MENU */}
          {mobileMenu && (
            <div className="md:hidden fixed inset-0 top-[65px] z-30 bg-black/40">
              <div className="w-[85%] max-w-sm h-full bg-white dark:bg-slate-900 p-4 overflow-y-auto">
                <div className="font-bold text-lg mb-4">
                  InfoMind AI
                </div>

                {items.map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => nav(id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 ${
                      page === id
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-semibold">{currentName}</div>
                  <div className="mut capitalize">{me.role || 'User'}</div>

                  <button className="btn mt-3 w-full" onClick={signOut}>
                    <LogOut size={15} className="inline mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE */}
          <main className="p-4 md:p-7 pb-24 md:pb-7 max-w-[1600px] mx-auto">
            <Page />
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex justify-around bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2">
        {[
          ['dashboard', 'Home'],
          ['documents', 'Docs'],
          ['ask', 'Ask AI'],
          ['attention', 'Alerts'],
          ['actions', 'Actions']
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => nav(id)}
            className={`text-xs px-2 py-2 ${
              page === id
                ? 'text-indigo-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* TOAST */}
      {msg && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-lg z-50"
        >
          {msg}
        </div>
      )}

      {/* GLOBAL SEARCH */}
      {pal && (
        <div
          className="fixed inset-0 bg-black/50 z-40 grid place-items-start justify-center pt-[12vh] p-4"
          onClick={() => setPal(false)}
        >
          <div
            className="card w-full max-w-lg !p-3"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            onClick={event => event.stopPropagation()}
          >
            <input
              autoFocus
              className="inp mb-3"
              placeholder="Search or ask InfoMind..."
              onKeyDown={event => {
                if (event.key === 'Enter' && event.target.value.trim()) {
                  nav('ask', { q: event.target.value.trim() })
                  setPal(false)
                }
              }}
            />

            {items.map(([id, label]) => (
              <button
                key={id}
                className="block w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950"
                onClick={() => {
                  nav(id)
                  setPal(false)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

function BellCount() {
  const {
    data: findings
  } = useData(() => api('/findings'), [])

  const list = Array.isArray(findings)
    ? findings
    : Array.isArray(findings?.items)
      ? findings.items
      : []

  const count = list.filter(
    item => String(item?.severity || '').toUpperCase() === 'CRITICAL'
  ).length

  if (!count) return null

  return (
    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] grid place-items-center">
      {count}
    </span>
  )
}
