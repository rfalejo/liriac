import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders liriac header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /liriac/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<App />);
    const description = screen.getByText(
      /React \+ TypeScript single-page application for AI-assisted writing/i,
    );
    expect(description).toBeInTheDocument();
  });
});
