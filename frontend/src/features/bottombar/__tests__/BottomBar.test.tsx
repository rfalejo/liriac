import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BottomBarProvider, useBottomBar } from '../context';
import { BottomBar } from '../BottomBar';

function renderBar(children?: React.ReactNode) {
  return render(
    <BottomBarProvider>
      {children}
      <BottomBar />
    </BottomBarProvider>,
  );
}

describe('BottomBar', () => {
  it('renders with defaults', () => {
    renderBar();
    // Default shows nothing critical but element with role status exists
    const bar = screen.getByRole('status');
    expect(bar).toBeInTheDocument();
  });

  it('shows ephemeral message when provided by context', () => {
    const { rerender } = render(
      <BottomBarProvider>
        <BottomBar />
      </BottomBarProvider>,
    );

    // Access provider by re-rendering with a child that pushes a message
    function Pusher() {
      const api = useBottomBar();
      return (
        <button onClick={() => api.pushMessage({ text: 'Save disabled (BL-014)' })}>
          push
        </button>
      );
    }

    rerender(
      <BottomBarProvider>
        <Pusher />
        <BottomBar />
      </BottomBarProvider>,
    );

    // Click to push message
    act(() => {
      screen.getByText('push').click();
    });

    expect(screen.getByText(/Save disabled \(BL-014\)/)).toBeInTheDocument();
  });
});
