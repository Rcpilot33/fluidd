import type { GlobalPrTouchSurface } from '@/util/prtouch-global-offsets'
import type { M191Setting } from '@/util/m191-settings'
export type { M191Setting } from '@/util/m191-settings'
export type { GlobalPrTouchSurface } from '@/util/prtouch-global-offsets'

export interface ConsoleState {
  // [key: string]: string;
  consoleCommand: string;
  consoleSearch: string;
  console: ConsoleEntry[]; // console stream
  gcodeHelp: Moonraker.KlippyApis.GcodeHelpResponse; // known commands
  consoleEntryCount: number; // give each console entry a unique id.
  commandHistory: string[];
  autoScroll: boolean;
  lastCleared: number;
  promptDialog: PromptDialog;
  globalTouchOffsetsDialog: GlobalTouchOffsetsDialog;
  globalPrTouchOffsetsDialog: GlobalPrTouchOffsetsDialog;
  materialZOffsetsDialog: MaterialZOffsetsDialog;
  m191SettingsDialog: M191SettingsDialog;
  consoleFilters: ConsoleFilter[];
  consoleFiltersRegexp: RegExp[];
}

export interface ConsoleEntry {
  id: number;
  message: string;
  time?: number;
  type: 'command' | 'response' | 'action';
}

export type ConsoleFilterType = 'contains' | 'starts-with' | 'expression'

export interface ConsoleFilter {
  id: string;
  name: string;
  type: ConsoleFilterType;
  value: string;
  enabled: boolean;
}

export interface PromptDialog {
  open: boolean;
  title?: string;
  items: PromptDialogItem[];
  footerButtons: PromptDialogButton[]
}

export type PromptDialogItem = PromptDialogItemText | PromptDialogItemButton

export interface PromptDialogItemText {
  type: 'text';
  text: string;
}

export interface PromptDialogItemButton extends PromptDialogButton {
  type: 'button';
}

export interface GlobalTouchOffsetModel {
  index: number;
  name: string;
  value: number;
}

export interface GlobalPrTouchOffsetsDialog {
  open: boolean;
  selectedIndex: number;
  increment: number;
  surfaces: GlobalPrTouchSurface[];
}

export interface GlobalTouchOffsetsDialog {
  open: boolean;
  mode: 'touch' | 'scan';
  models: GlobalTouchOffsetModel[];
}

export interface MaterialZOffset {
  index: number;
  name: string;
  value: number;
}

export interface MaterialZOffsetsDialog {
  open: boolean;
  materials: MaterialZOffset[];
}

export interface M191SettingsDialog {
  open: boolean;
  settings: M191Setting[];
}

export interface PromptDialogButton {
  text: string;
  command?: string;
  color?: string;
}
