import { useState, useEffect, useCallback, useRef } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when value changes.
  // 初回マウント時は localStorage から読んだ値をそのまま書き戻すだけの
  // 無駄な同期I/Oになるためスキップする。
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Wrapped setter that handles function updates
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value
      return newValue
    })
  }, [])

  return [storedValue, setValue]
}
