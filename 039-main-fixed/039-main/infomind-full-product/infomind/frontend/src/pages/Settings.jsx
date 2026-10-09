import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  UserCircle,
  Palette,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2
} from 'lucide-react'

import { useApp } from '../ctx'

const TEAM = [
  'Gayathri K T',
  'Mithun Raj M',
  'Moneshwaran R',
  'Mokkul'
]

const THEMES = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Comfortable for low light'
  },
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Classic InfoMind'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Fresh and professional'
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Creative and modern'
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm and distinctive'
  }
]

function applyTheme(theme) {
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

  localStorage.setItem(
    'infomind-theme',
    theme
  )
}

export default function Settings() {
  const { me, toast } = useApp()

  const [name, setName] = useState(
    localStorage.getItem(
      'infomind-display-name'
    ) ||
      me?.name ||
      ''
  )

  const [theme, setTheme] = useState(
    localStorage.getItem(
      'infomind-theme'
    ) || 'light'
  )

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedName =
      localStorage.getItem(
        'infomind-display-name'
      )

    if (savedName) {
      setName(savedName)
    }
  }, [])

  
function saveName() {
  const cleanName = name.trim()

  if (!cleanName) {
    toast('Please enter your name.')
    return
  }

  localStorage.setItem('infomind-display-name', cleanName)

  // Update the app immediately.
  window.dispatchEvent(
    new CustomEvent('infomind-name-updated', {
      detail: { name: cleanName }
    })
  )

  setName(cleanName)
  setSaved(true)
  toast('Display name updated successfully.')

  window.setTimeout(() => {
    setSaved(false)
  }, 1800)
}


  function changeTheme(value) {
    setTheme(value)
    applyTheme(value)

    toast(
      `${value.charAt(0).toUpperCase() + value.slice(1)} theme applied.`
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
          <SettingsIcon size={17} />
          Workspace Settings
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mt-1">
          Settings
        </h1>

        <p className="mut mt-2 max-w-2xl">
          Manage your InfoMind AI profile, appearance and
          workspace information.
        </p>

      </section>

      {/* PROFILE */}

      <section className="card">

        <div className="flex items-start gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
            <UserCircle size={20} />
          </div>

          <div>

            <h2 className="font-semibold">
              Profile
            </h2>

            <p className="mut mt-1">
              Your display information inside InfoMind AI.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* NAME */}

          <div>

            <label className="text-sm font-semibold">
              Display name
            </label>

            <div className="flex gap-2 mt-2">

              <input
                className="inp"
                value={name}
                onChange={e =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
              />

              <button
                className="btn btn-p flex items-center gap-2"
                onClick={saveName}
              >
                {saved ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Save size={15} />
                )}

                {saved
                  ? 'Saved'
                  : 'Save'}
              </button>

            </div>

            <p className="text-xs text-slate-500 mt-2">
              This name is used in the Dashboard greeting
              and workspace profile.
            </p>

          </div>

          {/* ROLE */}

          <div>

            <label className="text-sm font-semibold">
              Role
            </label>

            <div className="inp mt-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">

              <span>
                {me?.role || 'User'}
              </span>

              <span className="text-xs text-slate-500">
                Read only
              </span>

            </div>

            <p className="text-xs text-slate-500 mt-2">
              Your role is controlled by the workspace administrator.
            </p>

          </div>

        </div>

      </section>

      {/* SECURITY */}

      <section className="card">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
            <ShieldCheck size={20} />
          </div>

          <div>

            <h2 className="font-semibold">
              Access & security
            </h2>

            <p className="mut mt-1">
              Your workspace access is controlled by your assigned role.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

            <div className="text-xs text-slate-500">
              Current role
            </div>

            <div className="font-semibold mt-1 capitalize">
              {me?.role || 'User'}
            </div>

          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

            <div className="text-xs text-slate-500">
              Permissions
            </div>

            <div className="font-semibold mt-1">
              {Array.isArray(me?.permissions)
                ? me.permissions.length
                : 0}
            </div>

          </div>

          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4">

            <div className="text-xs text-emerald-600">
              Workspace status
            </div>

            <div className="font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
              Active
            </div>

          </div>

        </div>

      </section>

      {/* THEME */}

      <section className="card">

        <div className="flex items-start gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 grid place-items-center">
            <Palette size={20} />
          </div>

          <div>

            <h2 className="font-semibold">
              Appearance
            </h2>

            <p className="mut mt-1">
              Choose how InfoMind AI looks on your device.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {THEMES.map(item => {

            const active =
              theme === item.id

            return (
              <button
                key={item.id}
                onClick={() =>
                  changeTheme(item.id)
                }
                className={`
                  text-left rounded-2xl border p-4
                  transition
                  ${
                    active
                      ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }
                `}
              >

                <div className="flex items-center justify-between">

                  <div
                    className={`
                      w-10 h-10 rounded-xl
                      ${
                        item.id === 'light'
                          ? 'bg-slate-100'
                          : item.id === 'dark'
                            ? 'bg-slate-900'
                            : item.id === 'emerald'
                              ? 'bg-emerald-500'
                              : item.id === 'violet'
                                ? 'bg-violet-500'
                                : item.id === 'rose'
                                  ? 'bg-rose-500'
                                  : 'bg-indigo-500'
                      }
                    `}
                  />

                  {active && (
                    <CheckCircle2
                      size={18}
                      className="text-indigo-600"
                    />
                  )}

                </div>

                <div className="font-semibold mt-4">
                  {item.name}
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  {item.description}
                </div>

              </button>
            )
          })}

        </div>

      </section>

      {/* TEAM */}

      <section className="card">

        <div className="flex items-start gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 grid place-items-center">
            <Users size={20} />
          </div>

          <div>

            <h2 className="font-semibold">
              Team
            </h2>

            <p className="mut mt-1">
              InfoMind AI project team members.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {TEAM.map((member, index) => (

            <div
              key={member}
              className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4"
            >

              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center font-semibold">
                {member.charAt(0)}
              </div>

              <div>

                <div className="font-medium">
                  {member}
                </div>

                <div className="text-xs text-slate-500">
                  Team member {index + 1}
                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* INFO */}

      <section className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-5">

        <div className="flex gap-3">

          <SettingsIcon
            size={18}
            className="text-indigo-600 mt-0.5"
          />

          <div>

            <h3 className="font-semibold text-sm">
              InfoMind AI workspace
            </h3>

            <p className="text-xs text-slate-500 mt-1 leading-5">
              InfoMind AI transforms organizational documents
              into connected, understandable and actionable
              intelligence.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}
