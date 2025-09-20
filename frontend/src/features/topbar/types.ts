export type QuickAction = {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export type ContextChip = {
  id: string;
  label: string;
  count?: number;
  ariaLabel?: string;
};

export type Connectivity = {
  api: 'online' | 'degraded' | 'offline';
  ws: 'connected' | 'connecting' | 'disconnected';
  env?: 'DEV' | 'TEST' | 'PROD';
};

export type DocMeta = {
  words?: number;
  readingMinutes?: number;
};

export type CommandItem = {
  id: string;
  title: string;
  group?: 'Navigate' | 'Actions' | string;
  run: () => void;
};

export type TopContribution = {
  breadcrumb?: string;
  quickActions?: QuickAction[];
  chips?: ContextChip[];
  meta?: DocMeta;
  connectivity?: Connectivity;
  promptEnabled?: boolean;
};

export type TopBarAPI = {
  set: (_contrib: TopContribution) => void;
  patch: (_contrib: Partial<TopContribution>) => void;
  openPalette: () => void;
  closePalette: () => void;
  registerCommands: (_items: CommandItem[]) => void;
  setMockConnectivity: (_conn: Partial<Connectivity>) => void;
  setMockDocMeta: (_meta: DocMeta) => void;
};
