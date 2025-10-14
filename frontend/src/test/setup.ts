import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

test('renders home page', () => {
  render(
    <TestWrapper>
      <Home />
    </TestWrapper>
  )
  
  expect(screen.getByText(/Agro_C/i)).toBeInTheDocument()
  expect(screen.getByText(/Plant Disease Detection/i)).toBeInTheDocument()
})
