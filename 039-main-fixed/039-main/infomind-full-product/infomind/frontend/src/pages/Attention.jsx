import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Sparkles
} from 'lucide-react'

import { api } from '../api'
import { useApp, useData } from '../ctx'

function SeverityBadge({ severity }) {
  const value = String(severity || 'INFO').toUpperCase()

  const styles = {
    CRITICAL:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    HIGH:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    MEDIUM:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    LOW:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    INFO:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        styles[value] || styles.INFO
      }`}
    >
      {value}
    </span>
  )
}

function PriorityCard({
  title,
  count,
  description,
  icon: Icon,
  danger,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`
        card text-left w-full
        hover:shadow-md transition
        ${
          danger
            ? 'border-red-200 dark:border-red-900'
            : ''
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">

        <div>

          <div className="mut">
            {title}
          </div>

          <div className="text-3xl font-bold mt-1">
            {count}
          </div>

          <div className="text-xs text-slate-500 mt-2">
            {description}
          </div>

        </div>

        <div
          className={`
            w-10 h-10 rounded-xl grid place-items-center
            ${
              danger
                ? 'bg-red-50 dark:bg-red-950 text-red-600'
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
            }
          `}
        >
          <Icon size={20} />
        </div>

      </div>
    </button>
  )
}

export default function Attention() {

  const { nav, params, toast } = useApp()

  const [findings, loading, error, reload] =
    useData(() => api('/findings'))

  const [search, setSearch] =
    useState('')

  const [severity, setSeverity] =
    useState('ALL')

  const [selected, setSelected] =
    useState(null)

  const list = Array.isArray(findings)
    ? findings
    : []

  const critical = list.filter(
    item =>
      String(item?.severity || '').toUpperCase() ===
      'CRITICAL'
  )

  const high = list.filter(
    item =>
      String(item?.severity || '').toUpperCase() ===
      'HIGH'
  )

  const medium = list.filter(
    item =>
      String(item?.severity || '').toUpperCase() ===
      'MEDIUM'
  )

  const filtered = useMemo(() => {

    let result = [...list]

    if (severity !== 'ALL') {
      result = result.filter(
        item =>
          String(
            item?.severity || ''
          ).toUpperCase() === severity
      )
    }

    if (search.trim()) {

      const query = search.toLowerCase()

      result = result.filter(item => {

        const text = [
          item?.title,
          item?.name,
          item?.description,
          item?.summary,
          item?.message,
          item?.type,
          item?.severity,
          item?.document_name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return text.includes(query)

      })

    }

    result.sort((a, b) => {

      const priority = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        INFO: 0
      }

      const pa =
        priority[
          String(a?.severity || 'INFO').toUpperCase()
        ] || 0

      const pb =
        priority[
          String(b?.severity || 'INFO').toUpperCase()
        ] || 0

      return pb - pa

    })

    return result

  }, [list, search, severity])

  const selectedFromParams = params?.findingId

  if (
    selectedFromParams &&
    !selected &&
    list.length > 0
  ) {
    const found = list.find(
      item =>
        String(
          item?.id ||
          item?.finding_id
        ) === String(selectedFromParams)
    )

    if (found) {
      setSelected(found)
    }
  }

  function openFinding(finding) {
    setSelected(finding)
  }

  function createAction(finding) {

    nav('actions', {
      findingId:
        finding?.id ||
        finding?.finding_id
    })

    toast('Finding sent to Actions.')

  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <ShieldAlert size={17} />
          Risk & Attention Intelligence
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

          <div>

            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              Attention Center
            </h1>

            <p className="mut mt-2 max-w-2xl">
              See what InfoMind AI believes needs attention,
              why it matters and what you can do next.
            </p>

          </div>

          <button
            className="btn flex items-center gap-2"
            onClick={reload}
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>

        </div>

      </section>

      {/* PRIORITY SUMMARY */}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <PriorityCard
          title="Critical"
          count={critical.length}
          description="Immediate review recommended"
          icon={ShieldAlert}
          danger={critical.length > 0}
          onClick={() =>
            setSeverity('CRITICAL')
          }
        />

        <PriorityCard
          title="High priority"
          count={high.length}
          description="Should be reviewed soon"
          icon={AlertTriangle}
          danger={high.length > 0}
          onClick={() =>
            setSeverity('HIGH')
          }
        />

        <PriorityCard
          title="Medium priority"
          count={medium.length}
          description="Monitor and review"
          icon={Clock3}
          onClick={() =>
            setSeverity('MEDIUM')
          }
        />

      </section>

      {/* SEARCH / FILTER */}

      <section className="card !p-3">

        <div className="flex flex-col md:flex-row gap-3">

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
              placeholder="Search findings, risks or conflicts..."
            />

          </div>

          <div className="flex items-center gap-2">

            <Filter
              size={15}
              className="text-slate-400"
            />

            <select
              className="inp !w-auto"
              value={severity}
              onChange={e =>
                setSeverity(e.target.value)
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

              <option value="INFO">
                Info
              </option>
            </select>

            <button
              className="btn"
              onClick={() => {
                setSearch('')
                setSeverity('ALL')
              }}
            >
              Clear
            </button>

          </div>

        </div>

      </section>

      {/* EXPLANATION */}

      <section className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border border-red-100 dark:border-red-900 p-5">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-red-600 grid place-items-center shrink-0">
            <Sparkles size={19} />
          </div>

          <div>

            <h2 className="font-semibold">
              AI prioritization
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-6">
              InfoMind AI brings the most important findings
              to the top so users do not have to manually
              inspect every document to discover potential risks.
            </p>

          </div>

        </div>

      </section>

      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
          Findings could not be completely loaded.
          Please try refreshing the page.
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
            Loading attention items...
          </span>

        </div>

      )}

      {/* LIST */}

      {!loading && (

        <section>

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="font-semibold text-lg">
                Findings
              </h2>

              <p className="mut mt-1">
                {filtered.length} item
                {filtered.length === 1
                  ? ''
                  : 's'} matching your current filter.
              </p>

            </div>

          </div>

          {filtered.length === 0 ? (

            <div className="card text-center py-12">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
                <CheckCircle2 size={27} />
              </div>

              <h3 className="font-semibold mt-4">
                Nothing requires attention
              </h3>

              <p className="mut max-w-md mx-auto mt-2">
                No findings match the current filters.
                Your information environment looks clear from
                the available data.
              </p>

              <button
                className="btn mt-5"
                onClick={() => {
                  setSearch('')
                  setSeverity('ALL')
                }}
              >
                Show all findings
              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {filtered.map(
                (finding, index) => {

                  const id =
                    finding?.id ||
                    finding?.finding_id ||
                    index

                  const title =
                    finding?.title ||
                    finding?.name ||
                    'Detected finding'

                  const description =
                    finding?.description ||
                    finding?.summary ||
                    finding?.message ||
                    'InfoMind AI detected information that may require review.'

                  const severity =
                    String(
                      finding?.severity ||
                      'INFO'
                    ).toUpperCase()

                  return (

                    <button
                      key={id}
                      onClick={() =>
                        openFinding(finding)
                      }
                      className={`
                        card !p-4 w-full text-left
                        hover:shadow-md transition
                        ${
                          severity === 'CRITICAL'
                            ? 'border-red-200 dark:border-red-900'
                            : ''
                        }
                      `}
                    >

                      <div className="flex items-start gap-4">

                        <div
                          className={`
                            w-10 h-10 rounded-xl
                            grid place-items-center shrink-0
                            ${
                              severity === 'CRITICAL'
                                ? 'bg-red-50 dark:bg-red-950 text-red-600'
                                : severity === 'HIGH'
                                  ? 'bg-orange-50 dark:bg-orange-950 text-orange-600'
                                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                            }
                          `}
                        >

                          <AlertTriangle size={19} />

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold">
                              {title}
                            </h3>

                            <SeverityBadge
                              severity={severity}
                            />

                          </div>

                          <p className="mut mt-1 line-clamp-2">
                            {description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">

                            {finding?.type && (
                              <span>
                                {finding.type}
                              </span>
                            )}

                            {finding?.document_name && (
                              <span className="flex items-center gap-1">
                                <FileText size={12} />
                                {finding.document_name}
                              </span>
                            )}

                            {finding?.created_at && (
                              <span className="flex items-center gap-1">
                                <Clock3 size={12} />
                                {new Date(
                                  finding.created_at
                                ).toLocaleDateString()}
                              </span>
                            )}

                          </div>

                        </div>

                        <ArrowRight
                          size={17}
                          className="shrink-0 text-slate-400 mt-1"
                        />

                      </div>

                    </button>

                  )
                }
              )}

            </div>

          )}

        </section>

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
            onClick={event =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 grid place-items-center shrink-0">
                  <AlertTriangle size={21} />
                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="font-semibold text-lg">
                      {selected?.title ||
                        selected?.name ||
                        'Finding'}
                    </h2>

                    <SeverityBadge
                      severity={
                        selected?.severity
                      }
                    />

                  </div>

                  <p className="mut mt-1">
                    {selected?.type ||
                      'AI detected finding'}
                  </p>

                </div>

              </div>

              <button
                className="btn !p-2"
                onClick={() =>
                  setSelected(null)
                }
              >
                ×
              </button>

            </div>

            <div className="mt-6">

              <h3 className="font-semibold">
                What InfoMind detected
              </h3>

              <p className="mut mt-2 leading-7">
                {selected?.description ||
                  selected?.summary ||
                  selected?.message ||
                  'No additional explanation is available.'}
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Severity
                </div>

                <div className="mt-2">
                  <SeverityBadge
                    severity={
                      selected?.severity
                    }
                  />
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Type
                </div>

                <div className="font-semibold mt-2">
                  {selected?.type ||
                    'Finding'}
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Source document
                </div>

                <div className="font-semibold mt-2">
                  {selected?.document_name ||
                    selected?.document_id ||
                    'Not specified'}
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Detected
                </div>

                <div className="font-semibold mt-2">
                  {selected?.created_at
                    ? new Date(
                        selected.created_at
                      ).toLocaleString()
                    : 'Not available'}
                </div>

              </div>

            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">

              <div className="flex gap-3">

                <Sparkles
                  size={18}
                  className="text-indigo-600 mt-0.5"
                />

                <div>

                  <div className="font-semibold text-sm">
                    Recommended next step
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Review the finding and convert it into
                    an actionable task if follow-up is required.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-wrap gap-2 mt-6">

              <button
                className="btn btn-p flex items-center gap-2"
                onClick={() =>
                  createAction(selected)
                }
              >
                Create action
                <ArrowRight size={15} />
              </button>

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
