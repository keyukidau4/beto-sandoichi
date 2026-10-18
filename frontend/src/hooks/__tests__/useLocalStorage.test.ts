import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

    expect(result.current[0]).toBe('initial-value')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

    expect(result.current[0]).toBe('stored-value')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('should store value in localStorage when setValue is called', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle function updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(5))

    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(6)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', JSON.stringify(6))
  })

  it('should handle complex objects', () => {
    const complexObject = {
      name: 'Test User',
      age: 30,
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject))

    const { result } = renderHook(() => useLocalStorage('user', {}))

    expect(result.current[0]).toEqual(complexObject)
  })

  it('should handle arrays', () => {
    const testArray = [1, 2, 3, 4, 5]
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testArray))

    const { result } = renderHook(() => useLocalStorage('numbers', []))

    expect(result.current[0]).toEqual(testArray)

    act(() => {
      result.current[1]([...testArray, 6])
    })

    expect(result.current[0]).toEqual([1, 2, 3, 4, 5, 6])
    expect(localStorageMock.setItem).toHaveBeenCalledWith('numbers', JSON.stringify([1, 2, 3, 4, 5, 6]))
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
  })

  it('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{')

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
  })

  it('should handle setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new-value')
    })

    // Value should still be updated in state even if localStorage fails
    expect(result.current[0]).toBe('new-value')
  })

  it('should handle boolean values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(true))

    const { result } = renderHook(() => useLocalStorage('is-enabled', false))

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1](false)
    })

    expect(result.current[0]).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('is-enabled', JSON.stringify(false))
  })

  it('should handle null values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(null))

    const { result } = renderHook(() => useLocalStorage('nullable', 'default'))

    expect(result.current[0]).toBe(null)
  })

  it('should handle undefined initial values', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useLocalStorage('test-key', undefined))

    expect(result.current[0]).toBe(undefined)
  })

  it('should persist across hook re-renders', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('persisted-value'))

    const { result, rerender } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('persisted-value')

    rerender()

    expect(result.current[0]).toBe('persisted-value')
  })

  it('should handle multiple instances with same key', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('shared-value'))

    const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'))
    const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'initial'))

    expect(result1.current[0]).toBe('shared-value')
    expect(result2.current[0]).toBe('shared-value')

    act(() => {
      result1.current[1]('updated-value')
    })

    expect(result1.current[0]).toBe('updated-value')
    // Note: result2 won't automatically update unless we implement storage event listening
  })

  it('should handle empty string values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(''))

    const { result } = renderHook(() => useLocalStorage('empty-string', 'default'))

    expect(result.current[0]).toBe('')
  })

  it('should handle numeric values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(42))

    const { result } = renderHook(() => useLocalStorage('number', 0))

    expect(result.current[0]).toBe(42)

    act(() => {
      result.current[1](100)
    })

    expect(result.current[0]).toBe(100)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('number', JSON.stringify(100))
  })

  it('should handle Date objects', () => {
    const testDate = new Date('2024-01-01')
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testDate.toISOString()))

    const { result } = renderHook(() => useLocalStorage('date', null))

    expect(result.current[0]).toBe(testDate.toISOString())
  })
})