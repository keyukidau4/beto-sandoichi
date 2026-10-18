import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import notificationSlice, { 
  addNotification, 
  removeNotification, 
  clearNotifications,
  Notification 
} from '../notificationSlice'

describe('notificationSlice', () => {
  const createStore = () => configureStore({
    reducer: {
      notifications: notificationSlice
    }
  })

  const mockNotification: Notification = {
    id: '123',
    type: 'success',
    message: 'Test notification',
    duration: 5000
  }

  it('should return the initial state', () => {
    const store = createStore()
    const state = store.getState().notifications
    
    expect(state).toEqual({
      notifications: []
    })
  })

  it('should handle addNotification', () => {
    const store = createStore()
    
    store.dispatch(addNotification(mockNotification))
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0]).toEqual(mockNotification)
  })

  it('should handle addNotification with auto-generated id', () => {
    const store = createStore()
    
    const notificationWithoutId = {
      type: 'error' as const,
      message: 'Error message',
      duration: 3000
    }
    
    store.dispatch(addNotification(notificationWithoutId))
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].id).toBeDefined()
    expect(state.notifications[0].type).toBe('error')
    expect(state.notifications[0].message).toBe('Error message')
  })

  it('should handle multiple notifications', () => {
    const store = createStore()
    
    const notification1 = { ...mockNotification, id: '1' }
    const notification2 = { ...mockNotification, id: '2', type: 'error' as const }
    
    store.dispatch(addNotification(notification1))
    store.dispatch(addNotification(notification2))
    
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(2)
    expect(state.notifications[0].id).toBe('1')
    expect(state.notifications[1].id).toBe('2')
  })

  it('should handle removeNotification', () => {
    const store = createStore()
    
    const notification1 = { ...mockNotification, id: '1' }
    const notification2 = { ...mockNotification, id: '2' }
    
    store.dispatch(addNotification(notification1))
    store.dispatch(addNotification(notification2))
    store.dispatch(removeNotification('1'))
    
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].id).toBe('2')
  })

  it('should handle removeNotification for non-existent id', () => {
    const store = createStore()
    
    store.dispatch(addNotification(mockNotification))
    store.dispatch(removeNotification('non-existent'))
    
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].id).toBe('123')
  })

  it('should handle clearNotifications', () => {
    const store = createStore()
    
    store.dispatch(addNotification({ ...mockNotification, id: '1' }))
    store.dispatch(addNotification({ ...mockNotification, id: '2' }))
    store.dispatch(clearNotifications())
    
    const state = store.getState().notifications
    
    expect(state.notifications).toHaveLength(0)
  })

  it('should maintain notification order (FIFO)', () => {
    const store = createStore()
    
    const notifications = [
      { ...mockNotification, id: '1', message: 'First' },
      { ...mockNotification, id: '2', message: 'Second' },
      { ...mockNotification, id: '3', message: 'Third' }
    ]
    
    notifications.forEach(notification => {
      store.dispatch(addNotification(notification))
    })
    
    const state = store.getState().notifications
    
    expect(state.notifications[0].message).toBe('First')
    expect(state.notifications[1].message).toBe('Second')
    expect(state.notifications[2].message).toBe('Third')
  })
})