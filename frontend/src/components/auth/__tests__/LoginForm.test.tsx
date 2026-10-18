import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from '../LoginForm'
import authSlice from '../../../store/authSlice'
import notificationSlice from '../../../store/notificationSlice'

// Mock the API hooks
vi.mock('../../../services/apiHooks', () => ({
  useLoginMutation: () => [
    vi.fn(),
    {
      isLoading: false,
      error: null
    }
  ]
}))

const createTestStore = () => configureStore({
  reducer: {
    auth: authSlice,
    notifications: notificationSlice
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore()
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form elements', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('should display validation errors for empty fields', async () => {
    renderWithProviders(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should display validation error for invalid email format', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('should display validation error for short password', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should call login mutation with valid form data', async () => {
    const mockLogin = vi.fn()
    
    vi.doMock('../../../services/apiHooks', () => ({
      useLoginMutation: () => [
        mockLogin,
        {
          isLoading: false,
          error: null
        }
      ]
    }))

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should show loading state during login', () => {
    vi.doMock('../../../services/apiHooks', () => ({
      useLoginMutation: () => [
        vi.fn(),
        {
          isLoading: true,
          error: null
        }
      ]
    }))

    renderWithProviders(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /logging in/i })
    expect(submitButton).toBeDisabled()
  })

  it('should display API error message', () => {
    const mockError = {
      data: {
        message: 'Invalid credentials'
      }
    }

    vi.doMock('../../../services/apiHooks', () => ({
      useLoginMutation: () => [
        vi.fn(),
        {
          isLoading: false,
          error: mockError
        }
      ]
    }))

    renderWithProviders(<LoginForm />)

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('should toggle password visibility', () => {
    renderWithProviders(<LoginForm />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

    expect(passwordInput.type).toBe('password')

    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('should have link to registration page', () => {
    renderWithProviders(<LoginForm />)

    const registerLink = screen.getByRole('link', { name: /sign up here/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('should clear form errors when user starts typing', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    // Trigger validation error
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 't' } })
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })

  it('should handle form submission with Enter key', async () => {
    const mockLogin = vi.fn()
    
    vi.doMock('../../../services/apiHooks', () => ({
      useLoginMutation: () => [
        mockLogin,
        {
          isLoading: false,
          error: null
        }
      ]
    }))

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should focus on first input field when component mounts', () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveFocus()
  })

  it('should trim whitespace from email input', async () => {
    const mockLogin = vi.fn()
    
    vi.doMock('../../../services/apiHooks', () => ({
      useLoginMutation: () => [
        mockLogin,
        {
          isLoading: false,
          error: null
        }
      ]
    }))

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})