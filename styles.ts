export const buttonGroupStyles = `
.btn-group {
    display: flex;
    align-items: stretch;
    gap: 0;
    padding: 6px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    overflow: hidden;
    border-radius: 12px;
}
.btn-group .btn {
    flex: 1 1 0;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-size: 15px;
    line-height: 1.2;
    padding: 12px 16px;
    min-height: 44px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--text-normal);
    cursor: pointer;
    user-select: none;
    transition: background .15s ease, color .15s ease, box-shadow .15s ease;
}
.btn-group .btn + .btn {
    border-left: 1px solid var(--background-modifier-border-hover);
}
.btn-group .btn:hover { background: var(--interactive-hover); border-radius: 12px; }
.btn-group .btn:active { background: var(--background-modifier-hover); border-radius: 12px; }

.btn-group:has(.btn:hover) .btn:not(:hover),
.btn-group:has(.btn:focus-visible) .btn:not(:focus-visible) {
    border-left: none;
}

.btn-group .btn.primary,
.btn-group .btn.is-active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
}

.btn-group .btn.primary + .btn,
.btn-group .btn.is-active + .btn {
    border-left-color: color-mix(in oklab, var(--interactive-accent) 60%, transparent);
}

@media (max-width: 480px) {
    .btn-group { padding: 4px; border-radius: 10px; }
    .btn-group .btn { padding: 14px 12px; font-size: 16px; }
}
`