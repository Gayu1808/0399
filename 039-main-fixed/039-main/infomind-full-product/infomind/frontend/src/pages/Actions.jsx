import { useMemo, useState } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  RefreshCw,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  User,
  ArrowRight,
  X
} from 'lucide-react'

import { api } from '../api'
import { useApp, useData } from '../ctx'

function StatusBadge({ status }) {
  const value = String(status || 'OPEN').toUpperCase()

  const styles = {
    OPEN:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    IN_PROGRESS:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    COMPLETED:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    DONE:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    CLOSED:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        styles[value] || styles.OPEN
      }`}
    >
      {value.replaceAll('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const value = String(priority || 'MEDIUM').toUpperCase()

  const styles = {
    CRITICAL:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    HIGH:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    MEDIUM:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    LOW:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  }

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        styles[value] || styles.MEDIUM
      }`}
    >
      {value}
    </span>
  )
}

function ActionCard({
  action,
  onOpen,
  onStatusChange
}) {
  const title =
    action?.title ||
    action?.name ||
    action?.description ||
    'Untitled action'

  const description =
    action?.description ||
    action?.summary ||
    'Follow up on this organizational finding.'

  const status =
    action?.status ||
    'OPEN'

  const priority =
    action?.priority ||
    action?.severity ||
    'MEDIUM'

  const due =
    action?.due_date ||
    action?.deadline

  return (
    <div className="card !p-4">

      <div className="flex items-start gap-3">

        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center shrink-0">
          <CheckSquare size={19} />
        </div>

        <div className="flex-1 min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="font-semibold">
              {title}
            </h3>

            <StatusBadge status={status} />

            <PriorityBadge priority={priority} />

          </div>

          <p className="mut mt-1 line-clamp-2">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">

            {action?.assignee && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {action.assignee}
              </span>
            )}

            {due && (
              <span className="flex items-center gap-1">
                <Clock3 size={12} />
                {new Date(due).toLocaleDateString()}
              </span>
            )}

            {action?.finding_id && (
              <span>
                Finding #{action.finding_id}
              </span>
            )}

          </div>

        </div>

        <button
          className="btn !p-2"
          onClick={() => onOpen(action)}
        >
          <ArrowRight size={16} />
        </button>

      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">

        {String(status).toUpperCase() === 'OPEN' && (
          <button
            className="btn text-xs"
            onClick={() =>
              onStatusChange(action, 'IN_PROGRESS')
            }
          >
            Start
          </button>
        )}

        {String(status).toUpperCase() === 'IN_PROGRESS' && (
          <button
            className="btn btn-p text-xs"
            onClick={() =>
              onStatusChange(action, 'COMPLETED')
            }
          >
            Mark completed
          </button>
        )}

        {[
          'COMPLETED',
          'DONE',
          'CLOSED'
        ].includes(
          String(status).toUpperCase()
        ) && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={14} />
            Completed
          </span>
        )}

      </div>

    </div>
  )
}

export default function Actions() {

  const { params, toast } = useApp()

  const [actions, loading, error, reload] =
    useData(() => api('/actions'))

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('ALL')

  const [priorityFilter, setPriorityFilter] =
    useState('ALL')

  const [selected, setSelected] =
    useState(null)

  const [showCreate, setShowCreate] =
    useState(false)

  const [updating, setUpdating] =
    useState(null)

  const [creating, setCreating] =
    useState(false)

  const [newAction, setNewAction] =
    useState({
      title: '',
      description: '',
      priority: 'MEDIUM',
      due_date: ''
    })

  const list = Array.isArray(actions)
    ? actions
    : []

  const openCount = list.filter(action =>
    ['OPEN', 'IN_PROGRESS'].includes(
      String(
        action?.status || 'OPEN'
      ).toUpperCase()
    )
  ).length

  const progressCount = list.filter(action =>
    String(
      action?.status || ''
    ).toUpperCase() === 'IN_PROGRESS'
  ).length

  const completedCount = list.filter(action =>
    ['COMPLETED', 'DONE', 'CLOSED'].includes(
      String(
        action?.status || ''
      ).toUpperCase()
    )
  ).length

  const criticalCount = list.filter(action =>
    ['CRITICAL', 'HIGH'].includes(
      String(
        action?.priority ||
        action?.severity ||
        ''
      ).toUpperCase()
    )
  ).length

  const filtered = useMemo(() => {

    let result = [...list]

    if (statusFilter !== 'ALL') {
      result = result.filter(action =>
        String(
          action?.status || 'OPEN'
        ).toUpperCase() === statusFilter
      )
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(action =>
        String(
          action?.priority ||
          action?.severity ||
          'MEDIUM'
        ).toUpperCase() === priorityFilter
      )
    }

    if (search.trim()) {

      const query = search.toLowerCase()

      result = result.filter(action => {

        const text = [
          action?.title,
          action?.name,
          action?.description,
          action?.summary,
          action?.status,
          action?.priority,
          action?.assignee
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return text.includes(query)
      })
    }

    return result

  }, [
    list,
    search,
    statusFilter,
    priorityFilter
  ])

  async function updateStatus(action, status) {

    const id =
      action?.id ||
      action?.action_id

    if (!id) {
      toast('This action does not have a valid ID.')
      return
    }

    setUpdating(id)

    try {

      await api(`/actions/${id}`, {
        method: 'PATCH',
        body: {
          status
        }
      })

      toast(
        status === 'COMPLETED'
          ? 'Action completed.'
          : 'Action status updated.'
      )

      await reload()

    } catch (error) {

      /*
       * Some backend versions may not expose
       * PATCH /actions/{id}. We show the actual
       * server error instead of breaking the page.
       */
      toast(
        error?.message ||
        'Unable to update action.'
      )

    } finally {

      setUpdating(null)

    }
  }

  async function createAction(event) {

    event.preventDefault()

    if (!newAction.title.trim()) {
      toast('Enter an action title.')
      return
    }

    setCreating(true)

    try {

      const body = {
        title: newAction.title,
        description:
          newAction.description,
        priority:
          newAction.priority
      }

      if (newAction.due_date) {
        body.due_date =
          newAction.due_date
      }

      if (params?.findingId) {
        body.finding_id =
          params.findingId
      }

      await api('/actions', {
        method: 'POST',
        body
      })

      toast('Action created successfully.')

      setNewAction({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: ''
      })

      setShowCreate(false)

      await reload()

    } catch (error) {

      toast(
        error?.message ||
        'Unable to create action.'
      )

    } finally {

      setCreating(false)

    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
          <CheckSquare size={17} />
          Action Management
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

          <div>

            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              Actions
            </h1>

            <p className="mut mt-2 max-w-2xl">
              Convert AI findings into trackable work and
              move from insight to action.
            </p>

          </div>

          <button
            className="btn btn-p flex items-center gap-2"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={16} />
            New action
          </button>

        </div>

      </section>

      {/* FLOW */}

      <section className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900 p-5">

        <div className="flex flex-wrap items-center gap-2 text-sm">

          <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 font-medium">
            AI Finding
          </span>

          <ArrowRight
            size={15}
            className="text-indigo-500"
          />

          <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 font-medium">
            Recommendation
          </span>

          <ArrowRight
            size={15}
            className="text-indigo-500"
          />

          <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 font-medium">
            Action
          </span>

          <ArrowRight
            size={15}
            className="text-indigo-500"
          />

          <span className="px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
            Decision
          </span>

        </div>

      </section>

      {/* STATS */}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card">

          <div className="mut">
            Open actions
          </div>

          <div className="text-2xl font-bold mt-1">
            {openCount}
          </div>

        </div>

        <div className="card">

          <div className="mut">
            In progress
          </div>

          <div className="text-2xl font-bold mt-1 text-yellow-600">
            {progressCount}
          </div>

        </div>

        <div className="card">

          <div className="mut">
            Completed
          </div>

          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {completedCount}
          </div>

        </div>

        <div className="card">

          <div className="mut">
            High priority
          </div>

          <div className="text-2xl font-bold mt-1 text-red-600">
            {criticalCount}
          </div>

        </div>

      </section>

      {/* SEARCH / FILTER */}

      <section className="card !p-3">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="flex items-center gap-2 flex-1 px-2">

            <Search
              size={17}
              className="text-slate-400"
            />

            <input
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search actions..."
            />

          </div>

          <div className="flex flex-wrap gap-2">

            <select
              className="inp !w-auto"
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All status
              </option>

              <option value="OPEN">
                Open
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>

            <select
              className="inp !w-auto"
              value={priorityFilter}
              onChange={e =>
                setPriorityFilter(e.target.value)
              }
            >
              <option value="ALL">
                All priorities
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

            <button
              className="btn !p-2"
              onClick={reload}
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>

          </div>

        </div>

      </section>

      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300 flex gap-3">

          <AlertTriangle size={18} />

          <div>
            Unable to load actions completely.
            Please refresh and try again.
          </div>

        </div>

      )}

      {/* LOADING */}

      {loading && (

        <div className="card flex items-center justify-center gap-3 py-10">

          <RefreshCw
            size={18}
            className="animate-spin text-indigo-600"
          />

          <span className="mut">
            Loading actions...
          </span>

        </div>

      )}

      {/* ACTION LIST */}

      {!loading && (

        <section>

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="font-semibold text-lg">
                Action tracker
              </h2>

              <p className="mut mt-1">
                {filtered.length} action
                {filtered.length === 1
                  ? ''
                  : 's'} shown.
              </p>

            </div>

          </div>

          {filtered.length === 0 ? (

            <div className="card text-center py-12">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
                <CheckSquare size={27} />
              </div>

              <h3 className="font-semibold mt-4">
                No actions found
              </h3>

              <p className="mut max-w-md mx-auto mt-2">
                Create an action from an AI finding or
                add a new action manually.
              </p>

              <button
                className="btn btn-p mt-5 inline-flex items-center gap-2"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                <Plus size={15} />
                Create action
              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {filtered.map(
                (action, index) => (

                  <ActionCard
                    key={
                      action?.id ||
                      action?.action_id ||
                      index
                    }
                    action={action}
                    onOpen={setSelected}
                    onStatusChange={
                      updateStatus
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

      )}

      {/* CREATE MODAL */}

      {showCreate && (

        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() =>
            setShowCreate(false)
          }
        >

          <form
            className="card w-full max-w-lg shadow-2xl"
            onClick={e =>
              e.stopPropagation()
            }
            onSubmit={createAction}
          >

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-lg">
                  Create action
                </h2>

                <p className="mut mt-1">
                  Turn an insight into trackable work.
                </p>

              </div>

              <button
                type="button"
                className="btn !p-2"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                <X size={16} />
              </button>

            </div>

            <div className="space-y-4 mt-6">

              <div>

                <label className="text-sm font-semibold">
                  Action title
                </label>

                <input
                  className="inp mt-2"
                  value={newAction.title}
                  onChange={e =>
                    setNewAction({
                      ...newAction,
                      title: e.target.value
                    })
                  }
                  placeholder="Example: Review updated policy"
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Description
                </label>

                <textarea
                  className="inp mt-2 min-h-28"
                  value={
                    newAction.description
                  }
                  onChange={e =>
                    setNewAction({
                      ...newAction,
                      description:
                        e.target.value
                    })
                  }
                  placeholder="Describe what needs to be done..."
                />

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>

                  <label className="text-sm font-semibold">
                    Priority
                  </label>

                  <select
                    className="inp mt-2"
                    value={
                      newAction.priority
                    }
                    onChange={e =>
                      setNewAction({
                        ...newAction,
                        priority:
                          e.target.value
                      })
                    }
                  >
                    <option value="CRITICAL">
                      Critical
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="LOW">
                      Low
                    </option>
                  </select>

                </div>

                <div>

                  <label className="text-sm font-semibold">
                    Due date
                  </label>

                  <input
                    type="date"
                    className="inp mt-2"
                    value={
                      newAction.due_date
                    }
                    onChange={e =>
                      setNewAction({
                        ...newAction,
                        due_date:
                          e.target.value
                      })
                    }
                  />

                </div>

              </div>

            </div>

            <div className="flex justify-end gap-2 mt-6">

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
                className="btn btn-p flex items-center gap-2"
                disabled={creating}
              >

                {creating ? (
                  <>
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Create action
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

      )}

      {/* DETAIL MODAL */}

      {selected && (

        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() =>
            setSelected(null)
          }
        >

          <div
            className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="font-semibold text-lg">
                    {selected?.title ||
                      selected?.name ||
                      selected?.description ||
                      'Action'}
                  </h2>

                  <StatusBadge
                    status={
                      selected?.status
                    }
                  />

                </div>

                <p className="mut mt-1">
                  Action details
                </p>

              </div>

              <button
                className="btn !p-2"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X size={16} />
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Status
                </div>

                <div className="mt-2">
                  <StatusBadge
                    status={
                      selected?.status
                    }
                  />
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Priority
                </div>

                <div className="mt-2">
                  <PriorityBadge
                    priority={
                      selected?.priority ||
                      selected?.severity
                    }
                  />
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Assignee
                </div>

                <div className="font-semibold mt-2">
                  {selected?.assignee ||
                    'Not assigned'}
                </div>

              </div>

            </div>

            <div className="mt-5">

              <h3 className="font-semibold">
                Description
              </h3>

              <p className="mut mt-2 leading-7">
                {selected?.description ||
                  selected?.summary ||
                  'No description available.'}
              </p>

            </div>

            {selected?.due_date && (

              <div className="mt-5 flex items-center gap-2 text-sm">

                <Clock3 size={16} />

                Due:
                {' '}
                {new Date(
                  selected.due_date
                ).toLocaleDateString()}

              </div>

            )}

            <div className="flex flex-wrap gap-2 mt-6">

              {String(
                selected?.status || ''
              ).toUpperCase() === 'OPEN' && (

                <button
                  className="btn"
                  disabled={
                    updating ===
                    (selected?.id ||
                      selected?.action_id)
                  }
                  onClick={async () => {
                    await updateStatus(
                      selected,
                      'IN_PROGRESS'
                    )
                    setSelected(null)
                  }}
                >
                  Start action
                </button>

              )}

              {String(
                selected?.status || ''
              ).toUpperCase() === 'IN_PROGRESS' && (

                <button
                  className="btn btn-p"
                  disabled={
                    updating ===
                    (selected?.id ||
                      selected?.action_id)
                  }
                  onClick={async () => {
                    await updateStatus(
                      selected,
                      'COMPLETED'
                    )
                    setSelected(null)
                  }}
                >
                  Mark completed
                </button>

              )}

              <button
                className="btn"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}
