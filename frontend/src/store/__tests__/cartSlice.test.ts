import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import cartSlice, { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  CartItem 
} from '../cartSlice'

describe('cartSlice', () => {
  const createStore = () => configureStore({
    reducer: {
      cart: cartSlice
    }
  })

  const mockProduct = {
    _id: '123',
    name: 'Test Banh Mi',
    type: 'banhmi' as const,
    description: 'Test description',
    price: 500,
    stock: 10,
    options: [
      { name: 'パクチー', extraCost: 50 },
      { name: 'チリソース', extraCost: 0 }
    ],
    imageUrl: 'test.jpg',
    del_flg: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const mockCartItem: CartItem = {
    product: mockProduct,
    quantity: 1,
    selectedOptions: ['パクチー'],
    subtotal: 550 // 500 + 50 for パクチー
  }

  it('should return the initial state', () => {
    const store = createStore()
    const state = store.getState().cart
    
    expect(state).toEqual({
      items: [],
      totalAmount: 0,
      totalItems: 0
    })
  })

  it('should handle addToCart for new item', () => {
    const store = createStore()
    
    store.dispatch(addToCart(mockCartItem))
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toEqual(mockCartItem)
    expect(state.totalAmount).toBe(550)
    expect(state.totalItems).toBe(1)
  })

  it('should handle addToCart for existing item with same options', () => {
    const store = createStore()
    
    // Add item twice
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(addToCart(mockCartItem))
    
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)
    expect(state.totalAmount).toBe(1100) // 550 * 2
    expect(state.totalItems).toBe(2)
  })

  it('should handle addToCart for existing item with different options', () => {
    const store = createStore()
    
    const itemWithDifferentOptions: CartItem = {
      ...mockCartItem,
      selectedOptions: ['チリソース'],
      subtotal: 500 // No extra cost for チリソース
    }
    
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(addToCart(itemWithDifferentOptions))
    
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(2)
    expect(state.totalAmount).toBe(1050) // 550 + 500
    expect(state.totalItems).toBe(2)
  })

  it('should handle removeFromCart', () => {
    const store = createStore()
    
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(removeFromCart({ 
      productId: mockProduct._id, 
      selectedOptions: ['パクチー'] 
    }))
    
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(0)
    expect(state.totalAmount).toBe(0)
    expect(state.totalItems).toBe(0)
  })

  it('should handle updateQuantity', () => {
    const store = createStore()
    
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(updateQuantity({ 
      productId: mockProduct._id, 
      selectedOptions: ['パクチー'],
      quantity: 3
    }))
    
    const state = store.getState().cart
    
    expect(state.items[0].quantity).toBe(3)
    expect(state.totalAmount).toBe(1650) // 550 * 3
    expect(state.totalItems).toBe(3)
  })

  it('should remove item when quantity is set to 0', () => {
    const store = createStore()
    
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(updateQuantity({ 
      productId: mockProduct._id, 
      selectedOptions: ['パクチー'],
      quantity: 0
    }))
    
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(0)
    expect(state.totalAmount).toBe(0)
    expect(state.totalItems).toBe(0)
  })

  it('should handle clearCart', () => {
    const store = createStore()
    
    store.dispatch(addToCart(mockCartItem))
    store.dispatch(clearCart())
    
    const state = store.getState().cart
    
    expect(state.items).toHaveLength(0)
    expect(state.totalAmount).toBe(0)
    expect(state.totalItems).toBe(0)
  })

  it('should calculate totals correctly with multiple items', () => {
    const store = createStore()
    
    const item1: CartItem = {
      product: { ...mockProduct, _id: '1', price: 500 },
      quantity: 2,
      selectedOptions: ['パクチー'],
      subtotal: 550
    }
    
    const item2: CartItem = {
      product: { ...mockProduct, _id: '2', price: 300 },
      quantity: 1,
      selectedOptions: [],
      subtotal: 300
    }
    
    store.dispatch(addToCart(item1))
    store.dispatch(addToCart(item2))
    
    const state = store.getState().cart
    
    expect(state.totalAmount).toBe(1400) // (550 * 2) + 300
    expect(state.totalItems).toBe(3) // 2 + 1
  })
})