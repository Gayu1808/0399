import { useMemo, useState } from 'react'
import {
  GitCompare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  RefreshCw,
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

function DiffRow({ type, text, oldValue, newValue }) {
  const styles = {
    added:
      'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    removed:
      'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
    changed:
      'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
  }

  const labels = {
    added: 'ADDED',
    removed: 'REMOVED',
    changed: 'CHANGED'
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        styles[type] || styles.changed
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold">
          {labels[type] || 'CHANGED'}
        </span>
      </div>

      {text && (
        <p className="text-sm font-medium">
          {text}
        </p>
      )}

      {(oldValue || newValue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">

          <div>
            <div className="text-[11px] text-slate-500 mb-1">
              Previous
            </div>

            <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-3 text-sm">
              {oldValue || '—'}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 mb-1">
              Current
            </div>

            <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-3 text-sm">
              {newValue || '—'}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default function Compare() {
  const { params, toast } = useApp()

  const [documents, loading] =
    useData(() => api('/documents'))

  const docs = Array.isArray(documents)
    ? documents
    : []

  const [leftId, setLeftId] =
    useState(params?.documentId || '')

  const [rightId, setRightId] =
    useState('')

  const [result, setResult] =
    useState(null)

  const [comparing, setComparing] =
    useState(false)

  const [search, setSearch] =
    useState('')

  async function runCompare() {
    if (!leftId || !rightId) {
      toast('Select two documents to compare.')
      return
    }

    if (leftId === rightId) {
      toast('Please select two different documents.')
      return
    }

    setComparing(true)
    setResult(null)

    try {
      
const response = await api('/compare', {
  params: {
    a: leftDocument?.name,
    b: rightDocument?.name
  }
})


      setResult(response)
    } catch (error) {
      toast(
        error?.message ||
        'Unable to compare the selected documents.'
      )
    } finally {
      setComparing(false)
    }
  }

  const leftDocument = docs.find(
    doc =>
      String(doc?.id || doc?.document_id) ===
      String(leftId)
  )

  const rightDocument = docs.find(
    doc =>
      String(doc?.id || doc?.document_id) ===
      String(rightId)
  )

  const changes = useMemo(() => {
    if (!result) return []

    const candidates = [
      result?.changes,
      result?.differences,
      result?.diff,
      result?.findings
    ]

    const found = candidates.find(
      value => Array.isArray(value)
    )

    if (found) return found

    return []
  }, [result])

  const filteredChanges = useMemo(() => {
    if (!search.trim()) return changes

    const query = search.toLowerCase()

    return changes.filter(change => {
      const text = [
        change?.title,
        change?.description,
        change?.text,
        change?.summary,
        change?.old_value,
        change?.new_value,
        change?.type,
        change?.severity
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(query)
    })
  }, [changes, search])

  const criticalChanges = changes.filter(
    item =>
      String(item?.severity || '').toUpperCase() ===
      'CRITICAL'
  ).length

  const highChanges = changes.filter(
    item =>
      String(item?.severity || '').toUpperCase() ===
      'HIGH'
  ).length

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>
        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
          <GitCompare size={17} />
          Intelligent Comparison
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mt-1">
          Compare Documents
        </h1>

        <p className="mut mt-2 max-w-2xl">
          Compare two documents to identify changes,
          contradictions and potentially important differences.
        </p>
      </section>

      {/* SELECTOR */}

      <section className="card">

        <div className="flex items-start gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
            <Sparkles size={19} />
          </div>

          <div>
            <h2 className="font-semibold">
              Select information to compare
            </h2>

            <p className="mut mt-1">
              InfoMind AI will analyze the relationship between
              the selected documents.
            </p>
          </div>

        </div>

        {loading ? (
          <div className="flex items-center gap-2 mut">
            <RefreshCw
              size={16}
              className="animate-spin"
            />
            Loading documents...
          </div>
        ) : docs.length < 2 ? (
          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-4 text-sm">
            You need at least two documents before you can
            perform a comparison.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Document A
              </label>

              <select
                className="inp mt-2"
                value={leftId}
                onChange={e => setLeftId(e.target.value)}
              >
                <option value="">
                  Select first document
                </option>

                {docs.map((doc, index) => {
                  const id =
                    doc?.id ||
                    doc?.document_id

                  return (
                    <option
                      key={id || index}
                      value={id}
                    >
                      {doc?.name ||
                        doc?.filename ||
                        doc?.title ||
                        `Document ${index + 1}`}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="hidden lg:grid place-items-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
              <GitCompare size={17} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Document B
              </label>

              <select
                className="inp mt-2"
                value={rightId}
                onChange={e => setRightId(e.target.value)}
              >
                <option value="">
                  Select second document
                </option>

                {docs.map((doc, index) => {
                  const id =
                    doc?.id ||
                    doc?.document_id

                  return (
                    <option
                      key={id || index}
                      value={id}
                    >
                      {doc?.name ||
                        doc?.filename ||
                        doc?.title ||
                        `Document ${index + 1}`}
                    </option>
                  )
                })}
              </select>
            </div>

            <button
              className="btn btn-p lg:col-span-3 flex items-center justify-center gap-2"
              disabled={
                !leftId ||
                !rightId ||
                comparing
              }
              onClick={runCompare}
            >
              {comparing ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <GitCompare size={16} />
                  Compare documents
                </>
              )}
            </button>

          </div>
        )}

      </section>

      {/* SELECTED DOCUMENTS */}

      {(leftDocument || rightDocument) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {[
            ['Document A', leftDocument],
            ['Document B', rightDocument]
          ].map(([label, doc]) => (
            <div
              key={label}
              className="card"
            >

              <div className="text-xs text-indigo-600 font-semibold">
                {label}
              </div>

              <div className="flex items-center gap-3 mt-3">

                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center">
                  <FileText size={18} />
                </div>

                <div className="min-w-0">

                  <div className="font-semibold truncate">
                    {doc?.name ||
                      doc?.filename ||
                      doc?.title ||
                      'Not selected'}
                  </div>

                  <div className="mut">
                    {doc?.classification ||
                      doc?.doc_type ||
                      'General'}
                  </div>

                </div>

              </div>

            </div>
          ))}

        </section>
      )}

      {/* RESULT */}

      {result && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="card">
              <div className="mut">
                Differences
              </div>

              <div className="text-2xl font-bold mt-1">
                {changes.length}
              </div>
            </div>

            <div className="card">
              <div className="mut">
                Critical
              </div>

              <div className="text-2xl font-bold mt-1 text-red-600">
                {criticalChanges}
              </div>
            </div>

            <div className="card">
              <div className="mut">
                High priority
              </div>

              <div className="text-2xl font-bold mt-1 text-orange-600">
                {highChanges}
              </div>
            </div>

            <div className="card">
              <div className="mut">
                Analysis
              </div>

              <div className="flex items-center gap-2 mt-2 text-emerald-600 font-semibold">
                <CheckCircle2 size={17} />
                Complete
              </div>
            </div>

          </section>

          {/* SUMMARY */}

          {(result?.summary ||
            result?.analysis ||
            result?.message) && (
            <section className="card">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
                  <Sparkles size={19} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    AI comparison summary
                  </h2>

                  <p className="mut">
                    High-level interpretation of the comparison.
                  </p>
                </div>

              </div>

              <p className="text-sm leading-7 mt-5 whitespace-pre-wrap">
                {result?.summary ||
                  result?.analysis ||
                  result?.message}
              </p>

            </section>
          )}

          {/* SEARCH CHANGES */}

          <section>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">

              <div>
                <h2 className="font-semibold text-lg">
                  Detected changes
                </h2>

                <p className="mut mt-1">
                  Review the differences identified between the documents.
                </p>
              </div>

              {changes.length > 0 && (
                <div className="card !p-2 flex items-center gap-2 md:w-72">

                  <Search
                    size={16}
                    className="text-slate-400"
                  />

                  <input
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search changes..."
                    value={search}
                    onChange={e =>
                      setSearch(e.target.value)
                    }
                  />

                </div>
              )}

            </div>

            {filteredChanges.length === 0 ? (
              <div className="card text-center py-10">

                <CheckCircle2
                  size={30}
                  className="mx-auto text-emerald-500"
                />

                <h3 className="font-semibold mt-3">
                  No detailed differences found
                </h3>

                <p className="mut mt-1">
                  The comparison did not return individual change records.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {filteredChanges.map(
                  (change, index) => {

                    const type =
                      String(
                        change?.type ||
                        change?.change_type ||
                        'changed'
                      ).toLowerCase()

                    return (
                      <DiffRow
                        key={
                          change?.id ||
                          change?.finding_id ||
                          index
                        }
                        type={
                          type.includes('add')
                            ? 'added'
                            : type.includes('remov')
                              ? 'removed'
                              : 'changed'
                        }
                        text={
                          change?.title ||
                          change?.description ||
                          change?.summary ||
                          change?.text
                        }
                        oldValue={
                          change?.old_value ||
                          change?.old ||
                          change?.previous
                        }
                        newValue={
                          change?.new_value ||
                          change?.new ||
                          change?.current
                        }
                      />
                    )
                  }
                )}

              </div>
            )}

          </section>

          {/* RAW FINDINGS FALLBACK */}

          {Array.isArray(result?.findings) &&
            result.findings.length > 0 && (
              <section className="card">

                <div className="flex items-center gap-3 mb-4">

                  <AlertTriangle
                    size={19}
                    className="text-orange-500"
                  />

                  <div>
                    <h2 className="font-semibold">
                      Findings from comparison
                    </h2>

                    <p className="mut">
                      Potential issues identified during analysis.
                    </p>
                  </div>

                </div>

                <div className="space-y-3">

                  {result.findings.map(
                    (finding, index) => (
                      <div
                        key={
                          finding?.id ||
                          index
                        }
                        className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <div className="font-medium">
                              {finding?.title ||
                                finding?.name ||
                                'Finding'}
                            </div>

                            <p className="mut mt-1">
                              {finding?.description ||
                                finding?.summary ||
                                finding?.message ||
                                'Potential difference detected.'}
                            </p>
                          </div>

                          <SeverityBadge
                            severity={
                              finding?.severity
                            }
                          />

                        </div>

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

        </>
      )}

      {/* EMPTY STATE */}

      {!result && !comparing && (
        <section className="card text-center py-12">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
            <GitCompare size={26} />
          </div>

          <h2 className="font-semibold text-lg mt-4">
            Ready to find what changed?
          </h2>

          <p className="mut max-w-lg mx-auto mt-2">
            Select two documents above. InfoMind AI will compare
            them and help identify important differences,
            potential conflicts and changes.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              Detect changes
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              Find conflicts
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              Prioritize risks
            </div>

          </div>

        </section>
      )}

    </div>
  )
}
