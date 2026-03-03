import { Entry } from './entry-types';
import { Editor } from 'obsidian';

// Extract an ISO date (YYYY-MM-DD) from a filename/basename as fallback
export function extractDateFromFilename(basename: string): Date | null {
    const match = basename.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return isNaN(d.getTime()) ? null : d;
}

// Read a date value from a frontmatter object by field name
export function getDateFromFrontmatter(
    frontmatter: Record<string, unknown>,
    dateField: string
): Date | null {
    const val = frontmatter[dateField];
    if (val == null) return null;
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function parseDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

export function parseEntry(line: string): Entry | null {
    const match = line.match(/^\*\s+(\d{4}-\d{2}-\d{2})\s+-\s+(\d+)/);
    if (!match) return null;

    const date = parseDate(match[1]);
    const value = parseInt(match[2], 10);

    if (!date || isNaN(value)) return null;

    return { date, value };
}

export function parseEntries(content: string): Entry[] {
    const lines = content.split('\n');
    const entries: Entry[] = [];

    for (const line of lines) {
        const entry = parseEntry(line);
        if (entry) {
            entries.push(entry);
        }
    }

    return entries;
}

export function hasTodayEntry(content: string): boolean {
    const todayStr = formatDate(new Date());
    const regex = new RegExp(`^\\*\\s+${todayStr}\\s+-`, 'm');
    return regex.test(content);
}

export function insertTodayEntry(editor: Editor, num: number): void {
    const lastLine = editor.lastLine();
    const endCh = editor.getLine(lastLine).length;
    const entry = todayEntry(num);
    editor.replaceRange(`\n${entry}`, { line: lastLine, ch: endCh });
}

function todayEntry(num: number): string {
    return `* ${formatDate(new Date())} - ${num}`;
}