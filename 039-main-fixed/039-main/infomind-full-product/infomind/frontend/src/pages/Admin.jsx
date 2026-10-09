import { useMemo, useState } from 'react'
import {
  Shield,
  Users,
  Search,
  RefreshCw,
  UserPlus,
  Activity,
  Clock3,
  CheckCircle2,
  XCircle
} from 'lucide-react'

import { api } from '../api'
import { useData } from '../ctx'

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  analyst: 'Analyst',
  user: 'User'
}

export default function Admin() {
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    reload: reloadUsers
  } = useData(() => api('/users'), [])

  const {
    data: audit,
    loading: auditLoading,
    error: auditError,
    reload: reloadAudit
  } = useData(() => api('/audit'), [])

  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const [form, setForm] = useState({
    name: '',
    username: '',
    role: 'user'
  })

  const userList = useMemo(() => {
    if (Array.isArray(users)) return users
    if (Array.isArray(users?.users)) return users.users
    if (Array.isArray(users?.items)) return users.items
    return []
  }, [users])

  const auditList = useMemo(() => {
    if (Array.isArray(audit)) return audit
    if (Array.isArray(audit?.items)) return audit.items
    if (Array.isArray(audit?.logs)) return audit.logs
    return []
  }, [audit])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return userList

    return userList.filter(user =>
      [
        user?.name,
        user?.username,
        user?.email,
        user?.role
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [userList, search])

  const filteredAudit = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return auditList

    return auditList.filter(item =>
      [
        item?.action,
        item?.event,
        item?.username,
        item?.user,
        item?.resource,
        item?.message
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [auditList, search])

  const activeUsers = userList.filter(
    user =>
      user?.active !== false &&
      user?.is_active !== false
  ).length

  const adminCount = userList.filter(
    user =>
      String(user?.role || '').toLowerCase() === 'admin'
  ).length

  const auditCount = auditList.length

  async function refreshAll() {
    await Promise.all([
      reloadUsers(),
      reloadAudit()
    ])
  }

  function openCreate() {
    setForm({
      name: '',
      username: '',
      role: 'user'
    })

    setShowCreate(true)
  }

  async function createUser(e) {
    e.preventDefault()

    try {
      await api('/users', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          username: form.username.trim(),
          role: form.role
        }
      })

      setShowCreate(false)
      await reloadUsers()
    } catch (err) {
      alert(err.message || 'Unable to create user')
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
              <Shield size={17} />
              Workspace Administration
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              Users & Audit
            </h1>

            <p className="mut mt-2 max-w-2xl">
              Manage workspace users, roles and review important
              activity across InfoMind AI.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              className="btn flex items-center gap-2"
              onClick={refreshAll}
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              className="btn btn-p flex items-center gap-2"
              onClick={openCreate}
            >
              <UserPlus size={15} />
              Add User
            </button>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          icon={Users}
          label="Total Users"
          value={userList.length}
        />

        <StatCard
          icon={CheckCircle2}
          label="Active Users"
          value={activeUsers}
        />

        <StatCard
          icon={Shield}
          label="Administrators"
          value={adminCount}
        />

        <StatCard
          icon={Activity}
          label="Audit Events"
          value={auditCount}
        />

      </section>

      {/* TABS */}

      <section className="card p-2">

        <div className="flex flex-col md:flex-row gap-2">

          <button
            onClick={() => setTab('users')}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-semibold
              flex items-center gap-2
              ${
                tab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Users size={16} />
            Users
          </button>

          <button
            onClick={() => setTab('audit')}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-semibold
              flex items-center gap-2
              ${
                tab === 'audit'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Activity size={16} />
            Audit Log
          </button>

          <div className="md:ml-auto relative flex-1 md:max-w-sm">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className="inp pl-9"
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              placeholder={
                tab === 'users'
                  ? 'Search users...'
                  : 'Search audit events...'
              }
            />

          </div>

        </div>

      </section>

      {/* USERS */}

      {tab === 'users' && (

        <section className="card">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="font-semibold">
                Workspace users
              </h2>

              <p className="mut mt-1">
                Users who can access InfoMind AI.
              </p>

            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {filteredUsers.length} shown
            </span>

          </div>

          {usersLoading && (
            <LoadingState />
          )}

          {usersError && !usersLoading && (
            <ErrorState
              message={usersError}
              onRetry={reloadUsers}
            />
          )}

          {!usersLoading &&
            !usersError &&
            filteredUsers.length === 0 && (
              <EmptyState
                icon={Users}
                title="No users found"
                description="There are no users matching your search."
              />
            )}

          {!usersLoading &&
            !usersError &&
            filteredUsers.length > 0 && (

              <div className="space-y-3">

                {filteredUsers.map((user, index) => (

                  <div
                    key={
                      user?.id ||
                      user?.username ||
                      index
                    }
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                  >

                    <div className="flex flex-col md:flex-row md:items-center gap-4">

                      <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center font-bold shrink-0">
                        {String(
                          user?.name ||
                          user?.username ||
                          'U'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="font-semibold truncate">
                          {user?.name ||
                            user?.username ||
                            'Unnamed user'}
                        </div>

                        <div className="text-sm text-slate-500 truncate">
                          {user?.email ||
                            user?.username ||
                            'No email available'}
                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {
                            ROLE_LABELS[
                              String(
                                user?.role || 'user'
                              ).toLowerCase()
                            ] ||
                            user?.role ||
                            'User'
                          }
                        </span>

                        <span
                          className={`
                            px-2.5 py-1 rounded-full
                            text-xs font-semibold
                            ${
                              user?.active === false ||
                              user?.is_active === false
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }
                          `}
                        >
                          {user?.active === false ||
                          user?.is_active === false
                            ? 'Inactive'
                            : 'Active'}
                        </span>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

        </section>

      )}

      {/* AUDIT */}

      {tab === 'audit' && (

        <section className="card">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="font-semibold">
                Audit activity
              </h2>

              <p className="mut mt-1">
                Review important workspace events and actions.
              </p>

            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {filteredAudit.length} events
            </span>

          </div>

          {auditLoading && (
            <LoadingState />
          )}

          {auditError && !auditLoading && (
            <ErrorState
              message={auditError}
              onRetry={reloadAudit}
            />
          )}

          {!auditLoading &&
            !auditError &&
            filteredAudit.length === 0 && (
              <EmptyState
                icon={Activity}
                title="No audit events found"
                description="There are no audit events matching your search."
              />
            )}

          {!auditLoading &&
            !auditError &&
            filteredAudit.length > 0 && (

              <div className="space-y-3">

                {filteredAudit.map((item, index) => (

                  <div
                    key={
                      item?.id ||
                      item?.created_at ||
                      index
                    }
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                  >

                    <div className="flex gap-3">

                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center shrink-0">

                        <Activity
                          size={16}
                          className="text-indigo-600"
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">

                          <div className="font-semibold">
                            {item?.action ||
                              item?.event ||
                              'Workspace activity'}
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock3 size={13} />
                            {formatDate(
                              item?.created_at ||
                              item?.timestamp ||
                              item?.time
                            )}
                          </div>

                        </div>

                        <div className="text-sm text-slate-500 mt-1">
                          {item?.message ||
                            item?.resource ||
                            item?.description ||
                            'Activity recorded in the workspace.'}
                        </div>

                        {(item?.username ||
                          item?.user) && (

                          <div className="text-xs text-slate-400 mt-2">
                            User:{' '}
                            {item?.username ||
                              item?.user}
                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

        </section>

      )}

      {/* SECURITY BANNER */}

      <section className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 p-5">

        <div className="flex gap-3">

          <Shield
            size={19}
            className="text-indigo-600 mt-0.5 shrink-0"
          />

          <div>

            <h3 className="font-semibold text-sm">
              Information governance
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-6">
              InfoMind AI keeps user access, roles and important
              workspace activity visible so organizations can
              maintain accountability and controlled information access.
            </p>

          </div>

        </div>

      </section>

      {/* CREATE USER MODAL */}

      {showCreate && (

        <div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center">

          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">

            <div className="p-5 border-b border-slate-200 dark:border-slate-800">

              <h2 className="text-lg font-bold">
                Add workspace user
              </h2>

              <p className="mut mt-1">
                Create a new user account.
              </p>

            </div>

            <form
              onSubmit={createUser}
              className="p-5 space-y-4"
            >

              <div>

                <label className="text-sm font-semibold">
                  Name
                </label>

                <input
                  className="inp mt-2"
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                  required
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Username
                </label>

                <input
                  className="inp mt-2"
                  value={form.username}
                  onChange={e =>
                    setForm({
                      ...form,
                      username: e.target.value
                    })
                  }
                  required
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Role
                </label>

                <select
                  className="inp mt-2"
                  value={form.role}
                  onChange={e =>
                    setForm({
                      ...form,
                      role: e.target.value
                    })
                  }
                >

                  <option value="user">
                    User
                  </option>

                  <option value="analyst">
                    Analyst
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="admin">
                    Administrator
                  </option>

                </select>

              </div>

              <div className="flex justify-end gap-2 pt-3">

                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-p"
                >
                  Create User
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="card">

      <div className="flex items-center justify-between">

        <div className="text-sm text-slate-500">
          {label}
        </div>

        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
          <Icon size={17} />
        </div>

      </div>

      <div className="text-2xl font-bold mt-3">
        {value}
      </div>

    </div>
  )
}

function LoadingState() {
  return (
    <div className="py-12 text-center">

      <RefreshCw
        size={22}
        className="mx-auto animate-spin text-indigo-600"
      />

      <p className="mut mt-3">
        Loading workspace data...
      </p>

    </div>
  )
}

function ErrorState({
  message,
  onRetry
}) {
  return (
    <div className="py-10 text-center">

      <XCircle
        size={24}
        className="mx-auto text-rose-500"
      />

      <p className="font-semibold mt-3">
        Unable to load data
      </p>

      <p className="mut mt-1">
        {message}
      </p>

      <button
        className="btn mt-4"
        onClick={onRetry}
      >
        Try again
      </button>

    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="py-12 text-center">

      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto grid place-items-center">
        <Icon
          size={22}
          className="text-slate-400"
        />
      </div>

      <div className="font-semibold mt-3">
        {title}
      </div>

      <p className="mut mt-1">
        {description}
      </p>

    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Recently'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString()
}
