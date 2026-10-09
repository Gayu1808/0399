import { useMemo, useRef, useState } from 'react'
import {
  Upload,
  FileText,
  Trash2,
  GitCompare,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Sparkles,
  X,
  Eye
} from 'lucide-react'

import { api } from '../api'
import { useApp, useData } from '../ctx'

function StatusBadge({ status }) {
  const value = String(status || 'READY').toUpperCase()

  const styles = {
    READY:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    PROCESSING:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    PENDING:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    FAILED:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
  }

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        styles[value] || styles.READY
      }`}
    >
      {value}
    </span>
  )
}

function EmptyDocuments({ onUpload }) {
  return (
    <div className="card text-center py-14">

      <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
        <FileText size={30} />
      </div>

      <h2 className="text-lg font-semibold mt-5">
        Your knowledge base is empty
      </h2>

      <p className="mut max-w-lg mx-auto mt-2">
        Upload organizational documents and let InfoMind AI
        understand, connect and analyze the information.
      </p>

      <button
        className="btn btn-p mt-5 inline-flex items-center gap-2"
        onClick={onUpload}
      >
        <Upload size={16} />
        Upload your first document
      </button>

    </div>
  )
}

function DocumentIcon({ name }) {
  const extension =
    String(name || '')
      .split('.')
      .pop()
      .toLowerCase()

  return (
    <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">

      {extension === 'pdf' ? (
        <span className="text-xs font-bold">PDF</span>
      ) : extension === 'docx' ? (
        <span className="text-xs font-bold">DOC</span>
      ) : (
        <FileText size={20} />
      )}

    </div>
  )
}

export default function Documents() {

  const { nav, toast } = useApp()

  const fileInput = useRef(null)

  const [documents, loading, error, reload] =
    useData(() => api('/documents'))

  const [file, setFile] = useState(null)

  const [classification, setClassification] =
    useState('GENERAL')

  const [uploading, setUploading] =
    useState(false)

  const [deleting, setDeleting] =
    useState(null)

  const [search, setSearch] =
    useState('')

  const [selected, setSelected] =
    useState(null)

  const docs = Array.isArray(documents)
    ? documents
    : []

  const filteredDocuments = useMemo(() => {

    if (!search.trim()) {
      return docs
    }

    const q = search.toLowerCase()

    return docs.filter(doc => {

      const text = [
        doc?.name,
        doc?.filename,
        doc?.title,
        doc?.classification,
        doc?.doc_type,
        doc?.entity
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(q)

    })

  }, [docs, search])

  function chooseFile(event) {

    const selectedFile =
      event.target.files?.[0]

    if (!selectedFile) return

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    const extension =
      selectedFile.name
        .split('.')
        .pop()
        .toLowerCase()

    if (
      !allowed.includes(selectedFile.type) &&
      !['pdf', 'docx', 'txt'].includes(extension)
    ) {

      toast(
        'Please select a PDF, DOCX or TXT file.'
      )

      event.target.value = ''
      return
    }

    setFile(selectedFile)

  }

  async function uploadDocument() {

    if (!file) {

      toast('Please choose a document first.')
      return

    }

    setUploading(true)

    try {

      const form = new FormData()

      form.append('file', file)
      form.append(
        'classification',
        classification
      )

      await api('/documents', {
        method: 'POST',
        form
      })

      toast(
        'Document uploaded successfully.'
      )

      setFile(null)

      if (fileInput.current) {
        fileInput.current.value = ''
      }

      await reload()

    } catch (err) {

      toast(
        err?.message ||
        'Document upload failed.'
      )

    } finally {

      setUploading(false)

    }

  }

  async function deleteDocument(id) {

    if (!id) return

    const confirmed =
      window.confirm(
        'Are you sure you want to delete this document?'
      )

    if (!confirmed) return

    setDeleting(id)

    try {

      await api(`/documents/${id}`, {
        method: 'DELETE'
      })

      toast(
        'Document deleted successfully.'
      )

      if (
        selected?.id === id ||
        selected?.document_id === id
      ) {
        setSelected(null)
      }

      await reload()

    } catch (err) {

      toast(
        err?.message ||
        'Unable to delete the document.'
      )

    } finally {

      setDeleting(null)

    }

  }

  function compareDocument(doc) {

    const id =
      doc?.id ||
      doc?.document_id

    nav('compare', {
      documentId: id
    })

  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
            <FileText size={16} />
            Knowledge Base
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            Documents
          </h1>

          <p className="mut mt-2 max-w-2xl">
            Upload and manage the information that powers
            InfoMind AI's intelligence layer.
          </p>

        </div>

        <button
          className="btn btn-p inline-flex items-center justify-center gap-2"
          onClick={() =>
            fileInput.current?.click()
          }
        >
          <Upload size={16} />
          Add document
        </button>

      </section>

      {/* UPLOAD */}

      <section className="card">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
            <Sparkles size={20} />
          </div>

          <div>

            <h2 className="font-semibold">
              Intelligent document ingestion
            </h2>

            <p className="mut mt-1">
              InfoMind AI will process the document and use
              it as part of the organizational knowledge base.
            </p>

          </div>

        </div>

        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={chooseFile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-3 mt-5">

          <button
            type="button"
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-left hover:border-indigo-500 transition"
            onClick={() =>
              fileInput.current?.click()
            }
          >

            {file ? (

              <div className="flex items-center gap-3">

                <DocumentIcon
                  name={file.name}
                />

                <div className="min-w-0">

                  <div className="font-semibold truncate">
                    {file.name}
                  </div>

                  <div className="mut">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>

                </div>

                <button
                  type="button"
                  className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={event => {
                    event.stopPropagation()
                    setFile(null)

                    if (fileInput.current) {
                      fileInput.current.value = ''
                    }
                  }}
                >
                  <X size={16} />
                </button>

              </div>

            ) : (

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center">
                  <Upload size={20} />
                </div>

                <div>

                  <div className="font-semibold">
                    Choose a document
                  </div>

                  <div className="mut mt-1">
                    PDF, DOCX or TXT
                  </div>

                </div>

              </div>

            )}

          </button>

          <select
            className="inp"
            value={classification}
            onChange={e =>
              setClassification(e.target.value)
            }
          >
            <option value="GENERAL">
              General
            </option>

            <option value="POLICY">
              Policy
            </option>

            <option value="CONTRACT">
              Contract
            </option>

            <option value="REPORT">
              Report
            </option>

            <option value="REQUIREMENT">
              Requirement
            </option>

            <option value="PROJECT">
              Project
            </option>

            <option value="MEETING">
              Meeting
            </option>
          </select>

          <button
            className="btn btn-p flex items-center justify-center gap-2"
            disabled={!file || uploading}
            onClick={uploadDocument}
          >

            {uploading ? (
              <>
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload
              </>
            )}

          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="flex items-center gap-2">
              <FileText
                size={15}
                className="text-indigo-600"
              />
              <span className="text-sm font-medium">
                Understand
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Extract useful information from documents.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="flex items-center gap-2">
              <GitCompare
                size={15}
                className="text-violet-600"
              />
              <span className="text-sm font-medium">
                Detect
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Identify changes, conflicts and findings.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="flex items-center gap-2">
              <Sparkles
                size={15}
                className="text-cyan-600"
              />
              <span className="text-sm font-medium">
                Connect
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Build relationships across information.
            </p>
          </div>

        </div>

      </section>

      {/* SEARCH */}

      <div className="card !p-3 flex items-center gap-3">

        <Search
          size={18}
          className="text-slate-400"
        />

        <input
          className="w-full bg-transparent outline-none text-sm"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          placeholder="Search your documents..."
        />

        {search && (
          <button
            className="text-xs text-indigo-600 font-semibold"
            onClick={() => setSearch('')}
          >
            Clear
          </button>
        )}

      </div>

      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">

          <AlertTriangle size={18} />

          Unable to load some document information.

          <button
            className="ml-auto underline font-semibold"
            onClick={reload}
          >
            Retry
          </button>

        </div>

      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="card">

          <div className="mut">
            Total documents
          </div>

          <div className="text-2xl font-bold mt-1">
            {docs.length}
          </div>

        </div>

        <div className="card">

          <div className="mut">
            Showing
          </div>

          <div className="text-2xl font-bold mt-1">
            {filteredDocuments.length}
          </div>

        </div>

        <div className="card">

          <div className="mut">
            Supported
          </div>

          <div className="text-2xl font-bold mt-1">
            3
          </div>

          <div className="text-xs text-slate-500 mt-1">
            PDF · DOCX · TXT
          </div>

        </div>

        <div className="card">

          <div className="mut">
            AI status
          </div>

          <div className="flex items-center gap-2 mt-2">

            <span className="w-2 h-2 rounded-full bg-emerald-500" />

            <span className="font-semibold text-sm">
              Active
            </span>

          </div>

        </div>

      </div>

      {/* DOCUMENT LIST */}

      <section>

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="font-semibold text-lg">
              Your documents
            </h2>

            <p className="mut mt-1">
              Manage the information available to InfoMind AI.
            </p>

          </div>

          <button
            className="btn !p-2"
            onClick={reload}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

        </div>

        {loading && (

          <div className="card flex items-center justify-center gap-3 py-10">

            <RefreshCw
              size={18}
              className="animate-spin text-indigo-600"
            />

            <span className="mut">
              Loading documents...
            </span>

          </div>

        )}

        {!loading &&
          filteredDocuments.length === 0 &&
          docs.length === 0 && (

            <EmptyDocuments
              onUpload={() =>
                fileInput.current?.click()
              }
            />

          )}

        {!loading &&
          filteredDocuments.length === 0 &&
          docs.length > 0 && (

            <div className="card text-center py-10">

              <Search
                size={28}
                className="mx-auto text-slate-400"
              />

              <h3 className="font-semibold mt-3">
                No matching documents
              </h3>

              <p className="mut mt-1">
                Try another search term.
              </p>

            </div>

          )}

        {!loading &&
          filteredDocuments.length > 0 && (

            <div className="grid grid-cols-1 gap-3">

              {filteredDocuments.map(
                (doc, index) => {

                  const id =
                    doc?.id ||
                    doc?.document_id

                  const name =
                    doc?.name ||
                    doc?.filename ||
                    doc?.title ||
                    'Untitled document'

                  const type =
                    doc?.classification ||
                    doc?.doc_type ||
                    'GENERAL'

                  const date =
                    doc?.created_at ||
                    doc?.uploaded_at

                  return (

                    <div
                      key={id || index}
                      className="card !p-4"
                    >

                      <div className="flex flex-col md:flex-row md:items-center gap-4">

                        <DocumentIcon
                          name={name}
                        />

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-2 flex-wrap">

                            <h3 className="font-semibold truncate">
                              {name}
                            </h3>

                            <StatusBadge
                              status={
                                doc?.status ||
                                'READY'
                              }
                            />

                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1">

                            <span className="text-xs text-slate-500">
                              {type}
                            </span>

                            {date && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock3 size={12} />
                                {new Date(
                                  date
                                ).toLocaleDateString()}
                              </span>
                            )}

                            {doc?.entity && (
                              <span className="text-xs text-slate-500">
                                {doc.entity}
                              </span>
                            )}

                          </div>

                        </div>

                        <div className="flex items-center gap-2">

                          <button
                            className="btn !p-2"
                            title="View details"
                            onClick={() =>
                              setSelected(doc)
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="btn !p-2"
                            title="Compare"
                            onClick={() =>
                              compareDocument(doc)
                            }
                          >
                            <GitCompare size={16} />
                          </button>

                          <button
                            className="btn !p-2 text-red-600 hover:border-red-400"
                            title="Delete"
                            disabled={
                              deleting === id
                            }
                            onClick={() =>
                              deleteDocument(id)
                            }
                          >
                            {deleting === id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                }
              )}

            </div>

          )}

      </section>

      {/* DETAILS MODAL */}

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

              <div className="flex items-center gap-3">

                <DocumentIcon
                  name={
                    selected?.name ||
                    selected?.filename ||
                    selected?.title
                  }
                />

                <div>

                  <h2 className="font-semibold">
                    {
                      selected?.name ||
                      selected?.filename ||
                      selected?.title ||
                      'Document details'
                    }
                  </h2>

                  <p className="mut">
                    {
                      selected?.classification ||
                      selected?.doc_type ||
                      'GENERAL'
                    }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Status
                </div>

                <div className="mt-2">
                  <StatusBadge
                    status={
                      selected?.status ||
                      'READY'
                    }
                  />
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Classification
                </div>

                <div className="font-semibold mt-2">
                  {
                    selected?.classification ||
                    selected?.doc_type ||
                    'GENERAL'
                  }
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Uploaded
                </div>

                <div className="font-semibold mt-2">
                  {selected?.created_at
                    ? new Date(
                        selected.created_at
                      ).toLocaleString()
                    : 'Not available'}
                </div>

              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

                <div className="mut">
                  Entity
                </div>

                <div className="font-semibold mt-2">
                  {selected?.entity || 'Not specified'}
                </div>

              </div>

            </div>

            {(selected?.summary ||
              selected?.description) && (

              <div className="mt-5">

                <h3 className="font-semibold">
                  Information
                </h3>

                <p className="mut mt-2 leading-6">
                  {
                    selected?.summary ||
                    selected?.description
                  }
                </p>

              </div>

            )}

            <div className="flex flex-wrap gap-2 mt-6">

              <button
                className="btn btn-p flex items-center gap-2"
                onClick={() => {
                  setSelected(null)
                  compareDocument(selected)
                }}
              >
                <GitCompare size={15} />
                Compare
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
