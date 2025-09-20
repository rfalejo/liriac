import { beforeEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../layouts/AppLayout';
import { renderWithProviders } from '../../test/utils';

describe('Theme behaviour', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to dark mode when no stored preference exists', async () => {
    renderWithProviders(
      <AppLayout>
        <div>content</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('persists toggled theme state across renders', async () => {
    const user = userEvent.setup();

    const { getByRole, unmount } = renderWithProviders(
      <AppLayout>
        <div>content</div>
      </AppLayout>,
    );

    const toggleButton = getByRole('button', { name: /switch to light mode/i });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
    expect(window.localStorage.getItem('liriac:theme:v1')).toBe('light');

    unmount();

    renderWithProviders(
      <AppLayout>
        <div>content</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
