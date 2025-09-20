import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../../../app/layouts/AppLayout';
import { renderWithProviders } from '../../../test/utils';

describe('TopBar', () => {
  it('renders brand in header', () => {
    renderWithProviders(
      <AppLayout>
        <div>content</div>
      </AppLayout>,
    );
    expect(screen.getByRole('heading', { name: /liriac/i })).toBeInTheDocument();
  });

  it('opens command palette via Cmd/Ctrl+K', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppLayout>
        <div>content</div>
      </AppLayout>,
    );

    // Use Meta for Mac; Vitest env maps it appropriately
    await user.keyboard('{Meta>}k{/Meta}');
    // Some tests wrap AppLayout with additional providers; tolerate duplicates
    expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
  });
});
