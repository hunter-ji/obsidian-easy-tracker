# Easy Tracker

![Easy Tracker Screenshot](./screenshots/easy-tracker-screenshot.jpeg)

English | [简体中文](./README.zh-CN.md)

**Easy Tracker is an Obsidian plugin for ultra-simple goal and habit tracking in daily notes.**

Track progress toward your goals directly inside your daily notes—just insert the ready-made tracker modules and log your daily effort with one click. Each day's data is stored independently in frontmatter, making it compatible with Obsidian Bases for advanced queries and analysis.

## What It Does

- Instantly insert tracker modules (overview, heatmap, buttons, goal checklist, note counter) into any daily note.
- Log your daily progress by clicking a button—check-ins are saved to frontmatter.
- Review streaks, gaps, and annual progress at a glance.
- Track multiple goals with an interactive checklist.
- Monitor daily note creation with the note counter.
- Edit historical check-in values anytime.
- Fully compatible with Obsidian Bases for database queries.
- Supports English and Simplified Chinese, with customizable week start day.

## How To Use

1. Install and enable **Easy Tracker** in **Settings → Community plugins**.
2. Open a daily note (or any note with a `date` field in frontmatter).
3. Run the command palette and select `Insert check-in component` to add all modules at once.
4. Click a button each day to record your effort—no extra setup required.
5. Optionally, use commands to insert or remove individual modules.

## Modules

### Daily Overview
Shows the current note's status, streak, and last missed day. Stats are calculated relative to the note's date, so viewing past notes shows historical data.

### Year Calendar Heatmap
Visualizes your annual progress across all notes. Data is aggregated from all notes with check-in values in your vault.

**Filter by folder (optional):**
You can specify a folder to limit the heatmap to notes in that folder only:
```markdown
```easy-tracker-year-calendar-heatmap
{
  "folder": "Daily Notes"
}
```
````

If no folder is specified, the heatmap will scan all notes in your vault.

### Check-in Buttons
One-click logging with customizable labels and values. The currently selected value is highlighted, and you can update it anytime if editing is enabled.

**Example:**
```easy-tracker-buttons
  Just a bit | 1
  Got it done | 2
  Did extra | 3
```
````
````

### Goal Checklist (NEW)
An interactive checklist for tracking multiple goals. Check off items as you complete them—state is saved to frontmatter.

**Example:**
```easy-tracker-goal-checklist
Read for 30 minutes
Exercise
Learn something new
Maintain good sleep schedule
```
````
````

### Goal Card
Displays a single motivational message or long-term goal description.

### Note Counter (NEW)
Shows the number of notes created on the current note's date. This module automatically displays the count for the date specified in the note's frontmatter, making it useful for tracking daily productivity.

**Example:**
```easy-tracker-note-counter
```
````
```

The counter will show how many notes were created on that specific day.

## Data Storage

All data is stored in your note's frontmatter, making it:
- **Searchable**: Query with Obsidian's search or Dataview
- **Syncable**: Works with any sync solution
- **Database-ready**: Compatible with Obsidian Bases
- **Portable**: Plain YAML format

**Example frontmatter:**
```yaml
---
date: 2026-03-03
tracker: 2                    # Check-in value
tracker-goals: [0, 2]         # Completed goal indices
---
```

## Obsidian Bases Integration

Since check-in data is stored in frontmatter, you can create powerful database views:

1. Create a new Base in Obsidian
2. Set source to your daily notes folder
3. Filter by `tracker` field (not empty)
4. View all your check-ins in a table format
5. Sort, filter, and analyze your habit data

## Settings

### Week Start
Choose whether weeks start on Sunday or Monday (affects heatmap layout).

### Date Field
Frontmatter field used to read the note's date (default: `date`).

### Check-in Value Field
Frontmatter field used to store check-in values (default: `tracker`).

### Allow Editing Check-ins
Enable to update check-in values for past dates. When enabled:
- The current value is displayed and highlighted
- Click any button to change the value
- Useful for correcting mistakes or updating historical data

## Customization

- **Button labels/values**: Edit the text inside the `easy-tracker-buttons` block.
- **Goal list**: Add or remove goals by editing the `easy-tracker-goal-checklist` block.
- **Module arrangement**: Move or remove modules as you wish—they're independent.
- **Field names**: Customize frontmatter field names in settings to match your workflow.

## Commands

- `Insert check-in component`: Adds all modules (overview, heatmap, buttons, goal checklist)
- `Insert single check-in component`: Adds modules with a single check-in button
- `Insert calendar heatmap`: Adds only the heatmap
- `Insert daily overview`: Adds only the overview
- `Insert goal checklist`: Adds only the goal checklist
- `Insert note counter`: Adds only the note counter

## Use Cases

### Daily Habit Tracking
Track exercise, reading, meditation, or any daily habit. The heatmap shows your consistency at a glance.

### Project Progress
Use check-in values to rate daily progress (1 = little, 2 = good, 3 = excellent). Review your productivity patterns over time.

### Goal Management
Create a checklist of daily goals and check them off as you complete them. Each day's checklist is independent.

### Historical Analysis
With Obsidian Bases integration, you can:
- Calculate average check-in values
- Find your most productive days
- Track goal completion rates
- Export data for external analysis

## Tips

- **Per-note independence**: Each daily note has its own check-in state and goal checklist.
- **Flexible dates**: The plugin reads dates from frontmatter, so it works with any daily note format.
- **Edit mode**: Enable "Allow editing check-ins" in settings to update past records.
- **Multiple trackers**: You can use different check-in components in different notes for tracking different habits.
- **Folder filtering**: Use the `folder` parameter in heatmap blocks to track different habits in separate folders.
- **Note counter**: The note counter shows creation count for the note's date, not always "today".

No complex setup—just insert, click, and track.
