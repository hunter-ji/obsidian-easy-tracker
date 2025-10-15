import { Editor } from 'obsidian';

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

export function parseEntry(line: string): { date: Date; value: number } | null {
    const match = line.match(/^\*\s+(\d{4}-\d{2}-\d{2})\s+-\s+(\d+)/);
    if (!match) return null;

    const date = parseDate(match[1]);
    const value = parseInt(match[2], 10);
    if (!date || isNaN(value)) return null;

    return { date, value };
}

export function parseEntries(content: string): { date: Date; value: number }[] {
    const lines = content.split('\n');
    const entries: { date: Date; value: number }[] = [];

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