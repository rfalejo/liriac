import React from 'react';
import SettingsDialog from './settings/SettingsDialog';
import ContextEditorTab from './settings/ContextEditorTab';
import { useDialogFocusNav } from '../hooks/useDialogFocusNav';
import { useAppStore } from '../store/appStore';

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
  const { showToast } = useAppStore();

  return (
    <SettingsDialog
      open={open}
      title="Settings"
      activeTab="context"
      onClose={onClose}
      onSave={() => {
        showToast('Settings saved (mock).');
      }}
      onClear={() => {
        showToast('Context cleared (mock).');
      }}
      containerRef={containerRef}
      onKeyDown={onKeyDown}
    >
      <ContextEditorTab tokens={tokens} />
    </SettingsDialog>
  );
}
