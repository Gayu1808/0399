import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Send,
  User,
  Bot,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
  Search
} from 'lucide-react'

import { api } from '../api'
import { useApp } from '../ctx'

function MessageBubble({ message, onCopy }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
          <Bot size={19} />
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-2xl p-4
          ${
            isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
          }
        `}
      >
        <div className="whitespace-pre-wrap text-sm leading-6">
          {message.content}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">

            <div className="flex items-center gap-2 text-xs font-semibold mb-2">
              <FileText size={14} />
              Sources
            </div>

            <div className="space-y-2">
              {message.sources.map((source, index) => (
                <div
                  key={index}
                  className="text-xs rounded-lg bg-slate-50 dark:bg-slate-800 p-2"
                >
                  {typeof source === 'string'
                    ? source
                    : source?.name ||
                      source?.title ||
                      source?.filename ||
                      `Source ${index + 1}`}
                </div>
              ))}
            </div>

          </div>
        )}

        {!isUser && (
          <div className="flex justify-end mt-3">

            <button
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600"
              onClick={() => onCopy(message.content)}
            >
              <Copy size={13} />
              Copy
            </button>

          </div>
        )}
      </div>

      {isUser && (
        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 grid place-items-center">
          <User size={18} />
        </div>
      )}
    </div>
  )
}

function Suggestion({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="text-left card !p-4 hover:border-indigo-400 hover:shadow-md transition group"
    >
      <div className="flex items-start gap-3">

        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center shrink-0">
          <Lightbulb size={17} />
        </div>

        <div>
          <div className="text-sm font-medium group-hover:text-indigo-600">
            {text}
          </div>

          <div className="text-xs text-slate-500 mt-1">
            Ask InfoMind AI
          </div>
        </div>

      </div>
    </button>
  )
}

export default function Ask() {

  const { params, toast } = useApp()

  const [messages, setMessages] = useState([])

  const [input, setInput] = useState('')

  const [loading, setLoading] = useState(false)

  const [copied, setCopied] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {

    const initialQuestion = params?.q

    if (
      initialQuestion &&
      typeof initialQuestion === 'string' &&
      !messages.length
    ) {
      setInput(initialQuestion)
    }

  }, [params, messages.length])

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })

  }, [messages, loading])

  async function askQuestion(question) {

    const cleanQuestion =
      String(question || input).trim()

    if (!cleanQuestion || loading) {
      return
    }

    const userMessage = {
      role: 'user',
      content: cleanQuestion
    }

    setMessages(current => [
      ...current,
      userMessage
    ])

    setInput('')
    setLoading(true)

    try {

      const result = await api('/ask', {
        method: 'POST',
        body: {
          question: cleanQuestion
        }
      })

      const answer =
        result?.answer ||
        result?.response ||
        result?.message ||
        result?.result ||
        'I could not generate an answer for this question.'

      const sources =
        result?.sources ||
        result?.documents ||
        result?.references ||
        []

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: String(answer),
          sources: Array.isArray(sources)
            ? sources
            : []
        }
      ])

    } catch (error) {

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content:
            error?.message ||
            'Something went wrong while asking InfoMind AI.'
        }
      ])

    } finally {

      setLoading(false)

    }
  }

  function handleSubmit(event) {

    event.preventDefault()

    askQuestion(input)

  }

  async function copyText(text) {

    try {

      await navigator.clipboard.writeText(text)

      setCopied(true)

      toast('Answer copied.')

      setTimeout(() => {
        setCopied(false)
      }, 1500)

    } catch {
      toast('Unable to copy answer.')
    }
  }

  function clearConversation() {

    setMessages([])
    setInput('')

  }

  const suggestions = [
    'What are the most important risks in my documents?',
    'What information has changed recently?',
    'Find contradictions between the available documents.',
    'What actions should I prioritize?',
    'Which documents are most connected to each other?',
    'What information appears outdated or needs review?'
  ]

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section>

        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
          <Sparkles size={17} />
          Intelligent Knowledge Assistant
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

          <div>

            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              Ask InfoMind AI
            </h1>

            <p className="mut mt-2 max-w-2xl">
              Ask questions about your organizational information
              and get context-aware answers from your knowledge base.
            </p>

          </div>

          {messages.length > 0 && (
            <button
              className="btn flex items-center gap-2"
              onClick={clearConversation}
            >
              <RotateCcw size={15} />
              New conversation
            </button>
          )}

        </div>

      </section>

      {/* TRUST BAR */}

      <div className="card !p-4">

        <div className="flex flex-col sm:flex-row gap-4">

          <div className="flex items-center gap-3 flex-1">

            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
              <ShieldCheck size={18} />
            </div>

            <div>
              <div className="text-sm font-semibold">
                Knowledge-grounded AI
              </div>

              <div className="text-xs text-slate-500">
                Answers are generated using your available information.
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            InfoMind ready
          </div>

        </div>

      </div>

      {/* CHAT */}

      <section className="card min-h-[500px] flex flex-col">

        {messages.length === 0 ? (

          <div className="flex-1 flex flex-col justify-center">

            <div className="text-center max-w-2xl mx-auto">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white grid place-items-center shadow-lg">
                <Sparkles size={30} />
              </div>

              <h2 className="text-xl font-bold mt-5">
                What would you like to know?
              </h2>

              <p className="mut mt-2">
                Ask about risks, changes, documents, relationships,
                conflicts or recommended actions.
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-3xl mx-auto w-full">

              {suggestions.map(text => (
                <Suggestion
                  key={text}
                  text={text}
                  onClick={askQuestion}
                />
              ))}

            </div>

          </div>

        ) : (

          <div className="flex-1 space-y-5 overflow-y-auto max-h-[60vh] pr-1">

            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                onCopy={copyText}
              />
            ))}

            {loading && (

              <div className="flex gap-3">

                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
                  <Bot size={19} />
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3">

                  <div className="flex items-center gap-1">

                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />

                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: '120ms' }}
                    />

                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: '240ms' }}
                    />

                    <span className="ml-2 text-xs text-slate-500">
                      InfoMind is thinking...
                    </span>

                  </div>

                </div>

              </div>

            )}

            <div ref={bottomRef} />

          </div>

        )}

        {/* INPUT */}

        <form
          onSubmit={handleSubmit}
          className="mt-5"
        >

          <div className="flex items-end gap-2 p-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">

            <Search
              size={18}
              className="text-slate-400 ml-2 mb-2.5"
            />

            <textarea
              value={input}
              onChange={event =>
                setInput(event.target.value)
              }
              onKeyDown={event => {

                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault()
                  handleSubmit(event)
                }

              }}
              rows={1}
              placeholder="Ask InfoMind anything..."
              className="flex-1 resize-none bg-transparent outline-none text-sm py-2"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-p !p-2.5 rounded-xl"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>

          </div>

          <div className="text-[11px] text-slate-500 mt-2 px-2">
            Press Enter to ask · Shift + Enter for a new line
          </div>

        </form>

      </section>

      {/* CAPABILITIES */}

      <section>

        <h2 className="font-semibold text-lg">
          Ask InfoMind about
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 grid place-items-center">
              <FileText size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Documents
            </h3>

            <p className="mut mt-1">
              Find information across the organization's
              documents.
            </p>

          </div>

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-600 grid place-items-center">
              <Search size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Risks & conflicts
            </h3>

            <p className="mut mt-1">
              Ask about contradictions, risks and information
              that needs attention.
            </p>

          </div>

          <div className="card">

            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
              <Lightbulb size={19} />
            </div>

            <h3 className="font-semibold mt-4">
              Decisions & actions
            </h3>

            <p className="mut mt-1">
              Turn organizational information into useful
              recommendations and next steps.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}
