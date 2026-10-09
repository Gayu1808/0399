import { useRef, useState } from 'react'
import {
  Upload,
  FileText,
  Trash2,
  GitCompare,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File
} from 'lucide-react'

import { api } from '../api'
import { useApp, useData } from '../ctx'
import { Sev, Empty, Loading } from '../components'

export default function Documents() {
  const { can, bump, toast, nav, me } = useApp()

  
const { data: docs } = useData(() => api('/documents'))
const { data: findings } = useData(() => api('/findings'))


  const fileRef = useRef(null)

  const [classification, setClassification] = useState('')
  const [uploading, setUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const getSeverity = name => {
    const matches = (findings || []).filter(
      finding =>
        Array.isArray(finding.docs) &&
        finding.docs.includes(name)
    )

    if (!matches.length) {
      return [0, null]
    }

    const sorted = [...matches].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    )

    return [matches.length, sorted[0]?.severity]
  }

  const uploadDocuments = async selectedFiles => {
    if (!selectedFiles.length) return

    setUploading(true)
    setError('')
    setResult(null)

    const summary = {
      files: 0,
      findings: 0,
      conflicts: 0,
      deadlines: 0
    }

    try {
      for (const file of selectedFiles) {
        setCurrentFile(file.name)

        const form = new FormData()
        form.append('file', file)

        if (classification) {
          form.append('classification', classification)
        }

        const response = await api('/documents', {
          method: 'POST',
          form
        })

        summary.files += 1
        summary.findings += response?.summary?.findings || 0
        summary.conflicts += response?.summary?.conflicts || 0
        summary.deadlines += response?.summary?.deadlines || 0
      }

      setResult(summary)

      if (selectedFiles.length === 1) {
        toast('Document uploaded and analyzed')
      } else {
        toast(`${selectedFiles.length} documents uploaded`)
      }

      bump()
    } catch (err) {
      setError(err?.message || 'Unable to upload document')
    } finally {
      setUploading(false)
      setCurrentFile('')

      if (fileRef.current) {
        fileRef.current.value = ''
      }
    }
  }

  const handleFileChange = event => {
    const files = Array.from(event.target.files || [])
    uploadDocuments(files)
  }

  const deleteDocument = async document => {
    const confirmed = window.confirm(
      `Delete "${document.name}"?`
    )

    if (!confirmed) return

    try {
      await api(`/documents/${document.id}`, {
        method: 'DELETE'
      })

      toast('Document deleted')
      bump()
    } catch (err) {
      setError(err?.message || 'Unable to delete document')
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Documents
              {docs && (
                <span className="mut ml-2">
                  {docs.length}
                </span>
              )}
            </h1>

            <p className="mut mt-1">
              Upload documents and let InfoMind AI analyze,
              connect and identify important findings.
            </p>
          </div>

          {can('doc:upload') && (
            <div className="flex items-center gap-2">

              <select
                aria-label="Document classification"
                className="inp !w-auto"
                value={classification}
                onChange={event =>
                  setClassification(event.target.value)
                }
                disabled={uploading}
              >
                <option value="">
                  Auto-classify
                </option>

                <option value="internal">
                  Internal
                </option>

                {me.clearance >= 2 && (
                  <option value="confidential">
                    Confidential
                  </option>
                )}

                {me.clearance >= 3 && (
                  <option value="restricted">
                    Restricted
                  </option>
                )}
              </select>

              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />

              <button
                className="btn btn-p flex items-center gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={16} />
                )}

                {uploading
                  ? 'Analyzing...'
                  : 'Add Documents'}
              </button>

            </div>
          )}
        </div>

        {!can('doc:upload') && (
          <div className="mut mt-3">
            Your role can view documents but does not
            have permission to upload them.
          </div>
        )}
      </div>


      {/* UPLOAD AREA */}
      {can('doc:upload') && (
        <div
          className={`card border-2 border-dashed text-center transition ${
            uploading
              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700'
          }`}
        >

          {uploading ? (
            <div className="py-8">

              <Loader2
                size={42}
                className="mx-auto text-indigo-600 animate-spin"
              />

              <h3 className="font-semibold text-lg mt-4">
                Analyzing document
              </h3>

              <p className="mut mt-1">
                {currentFile}
              </p>

              <div className="max-w-md mx-auto mt-5 grid grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950 p-2">
                  Extract
                </div>

                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950 p-2">
                  Understand
                </div>

                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950 p-2">
                  Connect
                </div>

                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950 p-2">
                  Detect
                </div>
              </div>

            </div>
          ) : (
            <div className="py-8">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
                <Upload size={28} />
              </div>

              <h3 className="font-semibold text-lg mt-4">
                Add documents to InfoMind
              </h3>

              <p className="mut mt-1">
                Upload PDF, DOCX or TXT files
              </p>

              <button
                className="btn btn-p mt-5"
                onClick={() => fileRef.current?.click()}
              >
                Choose Files
              </button>

            </div>
          )}

        </div>
      )}


      {/* ERROR */}
      {error && (
        <div className="card border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={20}
              className="text-red-600 shrink-0 mt-0.5"
            />

            <div>
              <b className="text-red-700 dark:text-red-400">
                Upload failed
              </b>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>

          </div>

        </div>
      )}


      {/* RESULT */}
      {result && (
        <div className="card border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={21}
              className="text-emerald-600 shrink-0"
            />

            <div className="flex-1">

              <b className="text-emerald-700 dark:text-emerald-400">
                Analysis complete
              </b>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

                <ResultItem
                  label="Documents"
                  value={result.files}
                />

                <ResultItem
                  label="Findings"
                  value={result.findings}
                />

                <ResultItem
                  label="Conflicts"
                  value={result.conflicts}
                />

                <ResultItem
                  label="Deadlines"
                  value={result.deadlines}
                />

              </div>

            </div>

          </div>

        </div>
      )}


      {/* DOCUMENT LIST */}
      <div>

        <div className="flex items-center justify-between mb-3">

          <div>
            <h2 className="text-xl font-semibold">
              Your Documents
            </h2>

            <p className="mut">
              Information analyzed by InfoMind AI
            </p>
          </div>

          {docs && docs.length > 0 && (
            <span className="mut">
              {docs.length} document
              {docs.length !== 1 ? 's' : ''}
            </span>
          )}

        </div>


        {!docs ? (
          <Loading />
        ) : docs.length === 0 ? (
          <Empty
            title="No documents yet"
            text="Upload your first document to start building your information map."
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

            {docs.map(document => {

              const [findingCount, severity] =
                getSeverity(document.name)

              return (
                <div
                  key={document.id}
                  className="card hover:shadow-md transition"
                >

                  {/* FILE HEADER */}
                  <div className="flex items-start gap-3">

                    <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center shrink-0">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start gap-2">

                        <b className="truncate">
                          {document.name}
                        </b>

                        {document.classification !== 'internal' && (
                          <Lock
                            size={14}
                            className="shrink-0 text-slate-500"
                          />
                        )}

                      </div>

                      <div className="mut mt-1">
                        {document.doc_type?.toUpperCase() || 'DOCUMENT'}
                      </div>

                    </div>

                    {severity && (
                      <Sev s={severity} />
                    )}

                  </div>


                  {/* DETAILS */}
                  <div className="mt-4 space-y-2">

                    <div className="flex justify-between text-sm">
                      <span className="mut">
                        Classification
                      </span>

                      <span className="font-medium capitalize">
                        {document.classification}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="mut">
                        Uploaded by
                      </span>

                      <span className="font-medium">
                        {document.uploaded_by}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="mut">
                        Findings
                      </span>

                      <span className="font-medium">
                        {findingCount}
                      </span>
                    </div>

                    {document.entity && (
                      <div className="text-sm">

                        <span className="mut">
                          Entity:
                        </span>

                        <span className="font-medium ml-1">
                          {document.entity}
                        </span>

                      </div>
                    )}

                  </div>


                  {/* STATUS */}
                  <div className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-3">

                    <div className="flex items-center gap-2">

                      {findingCount > 0 ? (
                        <>
                          <AlertCircle
                            size={16}
                            className="text-amber-500"
                          />

                          <span className="text-sm">
                            {findingCount} open finding
                            {findingCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />

                          <span className="text-sm">
                            No open findings
                          </span>
                        </>
                      )}

                    </div>

                  </div>


                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-4">

                    <button
                      className="btn flex-1 flex items-center justify-center gap-2"
                      onClick={() =>
                        nav('compare', {
                          a: document.name
                        })
                      }
                    >
                      <GitCompare size={14} />
                      Compare
                    </button>

                    {can('doc:delete') && (
                      <button
                        className="btn flex items-center justify-center gap-2"
                        title="Delete document"
                        onClick={() =>
                          deleteDocument(document)
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

    </div>
  )
}


function ResultItem({ label, value }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 p-3">

      <div className="text-xl font-bold">
        {value}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </div>

    </div>
  )
}
