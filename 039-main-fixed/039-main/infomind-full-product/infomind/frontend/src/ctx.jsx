import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

export const Ctx = createContext(null)

export function useApp() {
  return useContext(Ctx)
}

export function useData(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const result = await loader()
      setData(result)
    } catch (err) {
      setError(
        err?.message || 'Unable to load data.'
      )
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return {
    data,
    loading,
    error,
    reload: load
  }
}

export function AppProvider({ children, value }) {
  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  )
}
