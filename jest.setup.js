// Import jest-dom to add custom matchers like toBeInTheDocument()
import '@testing-library/jest-dom';

// Mock window object for localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true
}); 