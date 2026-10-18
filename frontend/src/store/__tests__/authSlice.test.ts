import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authSlice, { 
  setUser, 
  clearUser, 
  setLoading, 
  setError,
  updateUserStatus,
  AuthState 
} from '../authSlice'

describe('authSlice', () => {
  const createStore = () => configureStore({
    reducer: {
      auth: authSlice
    }
  })

  const mockUser = {
    _id: '123',
    email: 'test@example.com',
    role: 'buyer' as const,
    status: 'approved' as const,
    del_flg: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  it('should return the initial state', () => {
    const store = createStore()
    const state = store.getState().auth
    
    expect(state).toEqual({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
  })

  it('should handle setUser', () => {
    const store = createStore()
    
    store.dispatch(setUser(mockUser))
    const state = store.getState().auth
    
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.error).toBe(null)
  })

  it('should handle clearUser', () => {
    const store = createStore()
    
    // First set a user
    store.dispatch(setUser(mockUser))
    // Then clear
    store.dispatch(clearUser())
    
    const state = store.getState().auth
    expect(state.user).toBe(null)
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle setLoading', () => {
    const store = createStore()
    
    store.dispatch(setLoading(true))
    expect(store.getState().auth.loading).toBe(true)
    
    store.dispatch(setLoading(false))
    expect(store.getState().auth.loading).toBe(false)
  })

  it('should handle setError', () => {
    const store = createStore()
    const errorMessage = 'Authentication failed'
    
    store.dispatch(setError(errorMessage))
    expect(store.getState().auth.error).toBe(errorMessage)
    
    store.dispatch(setError(null))
    expect(store.getState().auth.error).toBe(null)
  })

  it('should handle updateUserStatus', () => {
    const store = createStore()
    
    // First set a user
    store.dispatch(setUser(mockUser))
    
    // Update status
    store.dispatch(updateUserStatus('pending'))
    
    const state = store.getState().auth
    expect(state.user?.status).toBe('pending')
  })

  it('should not update status if no user is set', () => {
    const store = createStore()
    
    store.dispatch(updateUserStatus('approved'))
    
    const state = store.getState().auth
    expect(state.user).toBe(null)
  })
})