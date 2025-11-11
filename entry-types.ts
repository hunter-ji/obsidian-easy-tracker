export interface Entry {
    date?: string | Date;
    day?: string | Date;
    key?: string | Date;
    // Allow fallback to string | Date for legacy or raw entries
}
