import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PointHistory from '../PointHistory';
import { api } from '../../../services/api';
import jest from "jest"

// Mock store setup
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { _id: 'test-user' }, buyerProfile: null, isAuthenticated: true, loading: false, error: null }) => state,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Mock the API hook
jest.mock('../../../services/api', () => ({
  ...jest.requireActual('../../../services/api'),
  useGetPointTransactionsQuery: jest.fn(),
}));

const mockUseGetPointTransactionsQuery = require('../../../services/api').useGetPointTransactionsQuery;

describe('PointHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseGetPointTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <Provider store={mockStore}>
        <PointHistory />
      </Provider>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    mockUseGetPointTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' },
    });

    render(
      <Provider store={mockStore}>
        <PointHistory />
      </Provider>
    );

    expect(screen.getByText('ポイント履歴の読み込みに失敗しました')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    mockUseGetPointTransactionsQuery.mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
    });

    render(
      <Provider store={mockStore}>
        <PointHistory />
      </Provider>
    );

    expect(screen.getByText('ポイント履歴がありません')).toBeInTheDocument();
  });

  it('renders transaction history correctly', () => {
    const mockTransactions = [
      {
        _id: '1',
        userId: 'test-user',
        type: 'purchase_reward' as const,
        amount: 100,
        note: 'Purchase reward',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        _id: '2',
        userId: 'test-user',
        type: 'purchase_deduction' as const,
        amount: -50,
        note: 'Point usage',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ];

    mockUseGetPointTransactionsQuery.mockReturnValue({
      data: { success: true, data: mockTransactions },
      isLoading: false,
      error: null,
    });

    render(
      <Provider store={mockStore}>
        <PointHistory />
      </Provider>
    );

    expect(screen.getByText('購入特典')).toBeInTheDocument();
    expect(screen.getByText('購入使用')).toBeInTheDocument();
    expect(screen.getByText('+100')).toBeInTheDocument();
    expect(screen.getByText('-50')).toBeInTheDocument();
  });
});