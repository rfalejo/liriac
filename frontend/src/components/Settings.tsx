import React from 'react';
import SettingsDialog from './settings/SettingsDialog';
import ContextEditorTab from './settings/ContextEditorTab';
import { useDialogFocusNav } from '../hooks/useDialogFocusNav';

export default function Settings({
  open,
  tokens,
  onClose,
}: {
  open: boolean;
  tokens: number;
  onClose: () => void;
}) {
  const { containerRef, onKeyDown } = useDialogFocusNav(open);

  return (
    <SettingsDialog
      open={open}
      title="Settings"
      activeTab="context"
      onClose={onClose}
      onSave={() => {
        window.dispatchEvent(
          new CustomEvent('toast:show', { detail: { text: 'Settings saved (mock).' } }),
        );
      }}
      onClear={() => {
        window.dispatchEvent(
          new CustomEvent('toast:show', {
            detail: { text: 'Context cleared (mock).' },
          }),
        );
      }}
      containerRef={containerRef}
      onKeyDown={onKeyDown}
    >
      <ContextEditorTab tokens={tokens} />
    </SettingsDialog>
  );
}
