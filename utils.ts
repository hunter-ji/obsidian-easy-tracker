import { Entry } from './entry-types';
import { Editor } from 'obsidian';

export function formatDate(d: Date, includeTime = false): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const datePart = `${y}-${m}-${day}`;
    if (!includeTime) return datePart;

    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${datePart} ${h}:${min}:${s}`;
}

export function parseDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

export function parseEntry(line: string): Entry | null {
    // Matches both "YYYY-MM-DD" and "YYYY-MM-DD HH:mm:ss"
    const match = line.match(/^\*\s+(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?)\s+-\s+([\d.]+)/);
    if (!match) return null;

    const date = parseDate(match[1]);
    const value = parseFloat(match[2]);

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
    const todayStr = formatDate(new Date(), false);
    // matches the start of the date part
    const regex = new RegExp(`^\\*\\s+${todayStr}`, 'm');
    return regex.test(content);
}

export function insertTodayEntry(editor: Editor, num: number): void {
    const lastLine = editor.lastLine();
    const endCh = editor.getLine(lastLine).length;
    const entry = todayEntry(num);
    editor.replaceRange(`\n${entry}`, { line: lastLine, ch: endCh });
}

function todayEntry(num: number): string {
    return `* ${formatDate(new Date(), true)} - ${num}`;
}