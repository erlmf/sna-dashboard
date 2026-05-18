import { useState, useEffect, useCallback } from 'react'

/**
 * Generic async data fetching hook.
 * @param {Function} fetcher - async function that returns data
 * @param {Array}    deps    - re-fetch when these change
 */
export function useApi(fetcher, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
