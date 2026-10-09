import { useMemo, useState } from 'react'
import {
  Network,
  Search,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  AlertTriangle,
  Link2,
  CheckCircle2,
  X
} from 'lucide-react'

import { api } from '../api'
import { useApp, useData } from '../ctx'

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="mut">{label}</div>
          <div className="text-2xl font-bold mt-1">
            {value}
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
          <Icon size={19} />
        </div>
      </div>
    </div>
  )
}

function NodeCard({ node, onClick }) {
  const type = String(
    node?.type ||
    node?.kind ||
    'document'
  ).toLowerCase()

  const label =
    node?.label ||
    node?.name ||
    node?.title ||
    'Unknown'

  return (
    <button
      onClick={() => onClick(node)}
      className="absolute -translate-x-1/2 -translate-y-1/2 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md p-3 text-left hover:border-indigo-500 hover:shadow-lg transition"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`
      }}
    >
      <div className="flex items-center gap-2">

        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center shrink-0">
          {type.includes('finding') ||
          type.includes('risk') ? (
            <AlertTriangle size={14} />
          ) : (
            <FileText size={14} />
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">
            {label}
          </div>

          <div className="text-[10px] text-slate-500 capitalize">
            {type}
          </div>
        </div>

      </div>
    </button>
  )
}

export default function Insights() {
  const { toast } = useApp()

  const [insights, loadingInsights, errorInsights, reloadInsights] =
    useData(() => api('/insights'))

  const [graph, loadingGraph, errorGraph, reloadGraph] =
    useData(() => api('/graph'))

  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState(null)

  const [zoom, setZoom] = useState(1)

  const [showConflicts, setShowConflicts] =
    useState(false)

  const nodes = useMemo(() => {
    const raw = Array.isArray(graph?.nodes)
      ? graph.nodes
      : []

    return raw.map((node, index) => {

      const angle =
        (index / Math.max(raw.length, 1)) *
        Math.PI *
        2

      const radius =
        raw.length <= 1
          ? 0
          : 30

      return {
        ...node,
        x:
          node?.x ??
          50 + Math.cos(angle) * radius,
        y:
          node?.y ??
          50 + Math.sin(angle) * radius
      }
    })
  }, [graph])

  const edges = Array.isArray(graph?.edges)
    ? graph.edges
    : []

  const filteredNodes = useMemo(() => {

    let result = nodes

    if (showConflicts) {
      result = result.filter(node => {

        const type = String(
          node?.type ||
          node?.kind ||
          ''
        ).toLowerCase()

        return (
          type.includes('finding') ||
          type.includes('conflict') ||
          type.includes('risk')
        )
      })
    }

    if (search.trim()) {

      const q = search.toLowerCase()

      result = result.filter(node => {

        const text = [
          node?.label,
          node?.name,
          node?.title,
          node?.type,
          node?.kind
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return text.includes(q)
      })
    }

    return result
  }, [
    nodes,
    search,
    showConflicts
  ])

  const visibleNodeIds = new Set(
    filteredNodes.map(
      node => String(
        node?.id ||
        node?.node_id
      )
    )
  )

  const filteredEdges = edges.filter(edge => {

    if (!showConflicts && search.trim() === '') {
      return true
    }

    const source = String(
      edge?.source ||
      edge?.from ||
      ''
    )

    const target = String(
      edge?.target ||
      edge?.to ||
      ''
    )

    return (
      visibleNodeIds.has(source) ||
      visibleNodeIds.has(target)
    )
  })

  const summary = insights || {}

  const documentCount =
    summary?.documents ??
    summary?.document_count ??
    nodes.filter(node =>
      String(
        node?.type ||
        node?.kind ||
        ''
      ).toLowerCase() === 'document'
    ).length

  const connectionCount =
    summary?.connections ??
    summary?.relationships ??
    edges.length

  const findingCount =
    summary?.findings ??
    summary?.finding_count ??
    nodes.filter(node =>
      String(
        node?.type ||
        node?.kind ||
        ''
      ).toLowerCase().includes('finding')
    ).length

  function refresh() {
    reloadInsights()
    reloadGraph()
    toast('Connections refreshed.')
  }

  function resetZoom() {
    setZoom(1)
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
          <Network size={17} />
          Knowledge Intelligence
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mt-1">
          Connections
        </h1>

        <p className="mut mt-2 max-w-2xl">
          Explore how documents, findings and organizational
          information are connected.
        </p>

      </section>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Stat
          label="Documents"
          value={documentCount}
          icon={FileText}
        />

        <Stat
          label="Connections"
          value={connectionCount}
          icon={Link2}
        />

        <Stat
          label="Findings"
          value={findingCount}
          icon={AlertTriangle}
        />

      </div>

      {/* SEARCH + CONTROLS */}

      <section className="card !p-3">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="flex items-center gap-2 flex-1 px-3">

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
              placeholder="Search connected information..."
            />

          </div>

          <div className="flex items-center gap-2">

            <button
              className={`btn ${
                showConflicts
                  ? 'btn-p'
                  : ''
              }`}
              onClick={() =>
                setShowConflicts(
                  value => !value
                )
              }
            >
              <AlertTriangle
                size={14}
                className="inline mr-1"
              />
              Findings only
            </button>

            <button
              className="btn !p-2"
              onClick={() =>
                setZoom(
                  value =>
                    Math.min(
                      value + 0.2,
                      2
                    )
                )
              }
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>

            <button
              className="btn !p-2"
              onClick={() =>
                setZoom(
                  value =>
                    Math.max(
                      value - 0.2,
                      0.6
                    )
                )
              }
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <button
              className="btn !p-2"
              onClick={resetZoom}
              title="Reset zoom"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className="btn !p-2"
              onClick={refresh}
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={
                  loadingGraph ||
                  loadingInsights
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>

          </div>

        </div>

      </section>

      {/* GRAPH */}

      <section className="card !p-0 overflow-hidden">

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Organizational knowledge graph
              </h2>

              <p className="mut mt-1">
                Select a node to inspect its information.
              </p>

            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Information
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Finding
              </span>

            </div>

          </div>

        </div>

        <div className="relative h-[560px] overflow-hidden bg-slate-50 dark:bg-slate-950">

          {(loadingGraph ||
            loadingInsights) && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm">

              <div className="flex items-center gap-2">

                <RefreshCw
                  size={18}
                  className="animate-spin text-indigo-600"
                />

                <span className="mut">
                  Building knowledge graph...
                </span>

              </div>

            </div>
          )}

          {(errorGraph ||
            errorInsights) && (
            <div className="absolute top-4 left-4 right-4 z-20 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
              Connection data could not be fully loaded.
            </div>
          )}

          {filteredNodes.length === 0 ? (

            <div className="absolute inset-0 grid place-items-center">

              <div className="text-center">

                <Network
                  size={40}
                  className="mx-auto text-slate-400"
                />

                <h3 className="font-semibold mt-4">
                  No connections found
                </h3>

                <p className="mut mt-1">
                  Upload documents or change your search filter.
                </p>

              </div>

            </div>

          ) : (

            <div
              className="absolute inset-0 origin-center transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`
              }}
            >

              {/* CONNECTION LINES */}

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
              >

                {filteredEdges.map(
                  (edge, index) => {

                    const sourceId =
                      String(
                        edge?.source ||
                        edge?.from ||
                        ''
                      )

                    const targetId =
                      String(
                        edge?.target ||
                        edge?.to ||
                        ''
                      )

                    const source =
                      filteredNodes.find(
                        node =>
                          String(
                            node?.id ||
                            node?.node_id
                          ) === sourceId
                      )

                    const target =
                      filteredNodes.find(
                        node =>
                          String(
                            node?.id ||
                            node?.node_id
                          ) === targetId
                      )

                    if (!source || !target) {
                      return null
                    }

                    return (
                      <line
                        key={index}
                        x1={`${source.x}%`}
                        y1={`${source.y}%`}
                        x2={`${target.x}%`}
                        y2={`${target.y}%`}
                        stroke="currentColor"
                        className="text-slate-300 dark:text-slate-700"
                        strokeWidth="2"
                      />
                    )
                  }
                )}

              </svg>

              {/* NODES */}

              {filteredNodes.map(
                (node, index) => (
                  <NodeCard
                    key={
                      node?.id ||
                      node?.node_id ||
                      index
                    }
                    node={node}
                    onClick={setSelected}
                  />
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* SELECTED NODE */}

      {selected && (

        <section className="card">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">

                {String(
                  selected?.type ||
                  selected?.kind ||
                  ''
                )
                  .toLowerCase()
                  .includes('finding') ? (
                  <AlertTriangle size={20} />
                ) : (
                  <FileText size={20} />
                )}

              </div>

              <div>

                <h2 className="font-semibold">
                  {selected?.label ||
                    selected?.name ||
                    selected?.title ||
                    'Selected information'}
                </h2>

                <p className="mut capitalize">
                  {selected?.type ||
                    selected?.kind ||
                    'Information'}
                </p>

              </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

              <div className="mut">
                Identifier
              </div>

              <div className="font-semibold mt-1 break-all">
                {selected?.id ||
                  selected?.node_id ||
                  '—'}
              </div>

            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

              <div className="mut">
                Type
              </div>

              <div className="font-semibold mt-1 capitalize">
                {selected?.type ||
                  selected?.kind ||
                  'Information'}
              </div>

            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

              <div className="mut">
                Relationships
              </div>

              <div className="font-semibold mt-1">
                {edges.filter(edge =>
                  String(
                    edge?.source ||
                    edge?.from ||
                    ''
                  ) ===
                    String(
                      selected?.id ||
                      selected?.node_id
                    ) ||
                  String(
                    edge?.target ||
                    edge?.to ||
                    ''
                  ) ===
                    String(
                      selected?.id ||
                      selected?.node_id
                    )
                ).length}
              </div>

            </div>

          </div>

          {selected?.description && (
            <div className="mt-5">

              <h3 className="font-semibold">
                Description
              </h3>

              <p className="mut mt-2 leading-6">
                {selected.description}
              </p>

            </div>
          )}

        </section>

      )}

      {/* INSIGHT CARDS */}

      <section>

        <h2 className="font-semibold text-lg">
          What the graph helps you discover
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
              <Link2 size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Hidden relationships
            </h3>

            <p className="mut mt-1">
              Discover how information from different
              documents relates to each other.
            </p>

          </div>

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 grid place-items-center">
              <AlertTriangle size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Risk connections
            </h3>

            <p className="mut mt-1">
              Identify findings that are connected to
              important organizational information.
            </p>

          </div>

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
              <CheckCircle2 size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Knowledge structure
            </h3>

            <p className="mut mt-1">
              Build a visual understanding of how your
              organizational knowledge fits together.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}
