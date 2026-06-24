export const DAY_GOAL_BULLET = '• ';
export const DAY_GOAL_INDENT = '\t';

const TAB_EM = 1.5;
const BULLET_HANG_EM = 1.25;
const CHECKBOX_HANG_EM = 2.5;

export type ParsedLine = {
  tabs: string;
  marker: '• ' | '[ ] ' | '[x] ' | null;
  content: string;
};

export function parseLineMarker(line: string): ParsedLine {
  const tabMatch = line.match(/^(\t*)(.*)$/);
  const tabs = tabMatch?.[1] ?? '';
  const rest = tabMatch?.[2] ?? line;

  if (rest.startsWith('• ')) {
    return { tabs, marker: '• ', content: rest.slice(2) };
  }
  if (rest.startsWith('[ ] ')) {
    return { tabs, marker: '[ ] ', content: rest.slice(4) };
  }
  if (rest.startsWith('[x] ')) {
    return { tabs, marker: '[x] ', content: rest.slice(4) };
  }
  return { tabs, marker: null, content: rest };
}

export function lineToStorage(parsed: ParsedLine): string {
  return `${parsed.tabs}${parsed.marker ?? ''}${parsed.content}`;
}

export function hasLineMarker(line: string): boolean {
  return parseLineMarker(line).marker !== null;
}

export function isInBulletBlock(lines: string[], index: number): boolean {
  if (index <= 0) return false;
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].trim() === '') return false;
    if (hasLineMarker(lines[i])) return true;
  }
  return false;
}

export function findBlockRootIndex(lines: string[], index: number): number {
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].trim() === '') return -1;
    if (hasLineMarker(lines[i])) return i;
  }
  return -1;
}

export function findBlockRootLine(lines: string[], index: number): string | null {
  const rootIndex = findBlockRootIndex(lines, index);
  return rootIndex >= 0 ? lines[rootIndex] : null;
}

export type LineLayout = {
  mode: 'plain' | 'hanging' | 'continuation';
  paddingEm: number;
  hangEm: number;
};

export function getMarkerHangEm(marker: ParsedLine['marker']): number {
  if (marker === '• ') return BULLET_HANG_EM;
  if (marker === '[ ] ' || marker === '[x] ') return CHECKBOX_HANG_EM;
  return 0;
}

export function getLineLayout(line: string, lineIndex: number, allLines: string[]): LineLayout {
  const parsed = parseLineMarker(line);
  const tabsEm = parsed.tabs.length * TAB_EM;

  if (parsed.marker) {
    const hangEm = getMarkerHangEm(parsed.marker);
    return {
      mode: 'hanging',
      paddingEm: tabsEm + hangEm,
      hangEm,
    };
  }

  if (isInBulletBlock(allLines, lineIndex)) {
    const rootIndex = findBlockRootIndex(allLines, lineIndex);
    if (rootIndex >= 0) {
      const rootLayout = getLineLayout(allLines[rootIndex], rootIndex, allLines);
      return {
        mode: 'continuation',
        paddingEm: rootLayout.paddingEm,
        hangEm: 0,
      };
    }
  }

  return { mode: 'plain', paddingEm: tabsEm, hangEm: 0 };
}

export function getLineBounds(text: string, position: number): { start: number; end: number } {
  const start = text.lastIndexOf('\n', Math.max(0, position - 1)) + 1;
  const nextNewline = text.indexOf('\n', position);
  const end = nextNewline === -1 ? text.length : nextNewline;
  return { start, end };
}

export function getLineAt(text: string, position: number): string {
  const { start, end } = getLineBounds(text, position);
  return text.slice(start, end);
}

export function getLineIndent(line: string): string {
  return parseLineMarker(line).tabs;
}

export function isContinuableLine(line: string): boolean {
  return hasLineMarker(line) || line.trim().length > 0;
}

export function applyDashDashShortcutToLine(
  line: string,
  cursor: number
): { line: string; cursor: number } | null {
  if (hasLineMarker(line)) return null;

  const tabs = line.match(/^(\t*)/)?.[1] ?? '';
  const afterTabs = line.slice(tabs.length);

  if (!afterTabs.startsWith('--')) return null;

  const withSpace = afterTabs.startsWith('-- ');
  const oldPrefixLen = withSpace ? 3 : 2;

  if (cursor < tabs.length + 2) return null;

  const emptyOnly = afterTabs === '--' || afterTabs === '-- ';
  if (emptyOnly) {
    const newLine = `${tabs}${DAY_GOAL_BULLET}`;
    return { line: newLine, cursor: tabs.length + DAY_GOAL_BULLET.length };
  }

  const rest = withSpace ? afterTabs.slice(3) : afterTabs.slice(2);
  const newLine = `${tabs}${DAY_GOAL_BULLET}${rest}`;
  const newCursor = Math.max(
    tabs.length + DAY_GOAL_BULLET.length,
    cursor - oldPrefixLen + DAY_GOAL_BULLET.length
  );

  return { line: newLine, cursor: newCursor };
}

export function applyDashDashShortcut(text: string, cursor: number): { value: string; cursor: number } | null {
  if (cursor < 2 || text.slice(cursor - 2, cursor) !== '--') {
    return null;
  }

  const { start } = getLineBounds(text, cursor - 2);
  const linePrefix = text.slice(start, cursor - 2);
  if (!/^(\t*)$/.test(linePrefix)) {
    return null;
  }

  const indent = linePrefix;
  const replacement = `${indent}${DAY_GOAL_BULLET}`;
  const value = text.slice(0, cursor - 2) + replacement + text.slice(cursor);
  return { value, cursor: start + replacement.length };
}

export function toggleCheckboxOnLine(line: string): string | null {
  const parsed = parseLineMarker(line);
  if (parsed.marker === '[x] ') {
    return lineToStorage({ ...parsed, marker: '[ ] ' });
  }
  if (parsed.marker === '[ ] ') {
    return lineToStorage({ ...parsed, marker: '[x] ' });
  }
  if (parsed.marker === '• ') {
    return lineToStorage({ ...parsed, marker: '[x] ' });
  }
  return null;
}

export function newBulletLineFromBlock(lines: string[], index: number): string {
  const root = findBlockRootLine(lines, index) ?? lines[index];
  const { tabs } = parseLineMarker(root);
  return `${tabs}${DAY_GOAL_BULLET}`;
}

export function shouldContinueOnEnter(line: string, lineIndex: number, lines: string[]): boolean {
  const parsed = parseLineMarker(line);
  if (parsed.marker && parsed.content.trim().length > 0) return true;
  if (isInBulletBlock(lines, lineIndex) && line.trim().length > 0) return true;
  return false;
}

export function splitGoalLines(value: string): string[] {
  if (value === '') return [''];
  return value.split('\n');
}

export function joinGoalLines(lines: string[]): string {
  return lines.join('\n');
}
