export type LocaleCode = 'en' | 'zh-CN';
export type LanguageSetting = 'system' | LocaleCode;

const en = {
	'notice.noActiveMarkdownView': 'No active Markdown view',
	'notice.alreadyCheckedIn': 'Already checked in today',
	'notice.editorUnavailable': 'Editor instance not available',
	'notice.onlyCheckInInEditMode': 'Please switch to edit mode to check in.',
	'notice.checkInTooFast': 'You are checking in too frequently. Please wait a moment before trying again.',
	'notice.checkInSuccess': 'Check-in recorded successfully!',
	'notice.checkInUpdated': 'Check-in value updated!',
	'notice.checkInFailed': 'Failed to record check-in. Please try again.',
	'notice.fileNotFound': 'Could not find the note file.',
	'card.goalTitle': 'My goal',
	'card.goalPlaceholder': 'Define your goal here!',
	'card.goalChecklistTitle': 'My goals',
	'card.goalChecklistPlaceholder': 'Add your goals here (one per line)',
	'card.activityHistoryTitle': 'Activity history',
	'card.buttonsTitle': 'How did you do today?',
	'card.checkInCongrats': 'Another day done, you\'re making progress! 🎉',
	'card.currentValue': 'Current value: {{value}}',
	'card.defaultButton': 'Button',
	'card.noteCounterTitle': 'Today\'s new notes',
	'card.noteCounterLabel': 'Notes created',
	'card.noteCounterHint': 'You created {{count}} new notes today',
	'command.insertCalendarHeatmap': 'Insert calendar heatmap',
	'command.insertCheckInComponent': 'Insert check-in component',
	'command.insertSingleCheckInComponent': 'Insert single check-in component',
	'command.insertDailyOverview': 'Insert daily overview',
	'command.insertGoalChecklist': 'Insert goal checklist',
	'command.insertNoteCounter': 'Insert note counter',
	'snippet.justABit': 'Just a bit',
	'snippet.gotItDone': 'Got it done',
	'snippet.didExtra': 'Did extra',
	'snippet.checkIn': 'Check in',
	'setting.weekStartName': 'Week start',
	'setting.weekStartDescription': 'Choose the first day of the week used by the calendar',
	'setting.weekStart.monday': 'Monday',
	'setting.weekStart.sunday': 'Sunday',
	'setting.dateFieldName': 'Date field',
	'setting.dateFieldDescription': 'Frontmatter field used to read the note\'s date (e.g. "date")',
	'setting.valueFieldName': 'Check-in value field',
	'setting.valueFieldDescription': 'Frontmatter field used to store the check-in value (e.g. "tracker")',
	'setting.allowEditName': 'Allow editing check-ins',
	'setting.allowEditDescription': 'Allow updating check-in values for past dates',
	'overview.title': "Today's overview",
	'overview.statusLabel': "Today's status",
	'overview.statusValue.checkedIn': 'Checked in',
	'overview.statusValue.missed': 'Missed',
	'overview.statusHint.checkedIn': 'Keep the pace',
	'overview.statusHint.missed': 'Remember to check in',
	'overview.streakLabel': 'Streak',
	'overview.streakHint.active': 'Keep it going',
	'overview.streakHint.inactive': 'Waiting to start',
	'overview.gapLabel': 'Most recent gap',
	'overview.gapValue.none': 'No gaps',
	'overview.noData': 'No data yet',
	'overview.gapHint.present': 'Review this day',
	'overview.gapHint.none': 'Looking steady',
	'overview.streakValue': '{{count}} days',
} as const;

export type LocaleKey = keyof typeof en;

const zhCN: Record<LocaleKey, string> = {
	'notice.noActiveMarkdownView': '没有打开的 Markdown 视图',
	'notice.alreadyCheckedIn': '今天已经打卡了',
	'notice.editorUnavailable': '无法获取编辑器实例',
	'notice.onlyCheckInInEditMode': '请切换到编辑模式以进行打卡。',
	'notice.checkInTooFast': '你打卡得太频繁了，请稍等片刻再试。',
	'notice.checkInSuccess': '打卡记录成功！',
	'notice.checkInUpdated': '打卡值已更新！',
	'notice.checkInFailed': '打卡失败，请重试。',
	'notice.fileNotFound': '找不到笔记文件。',
	'card.goalTitle': '我的目标',
	'card.goalPlaceholder': '在这里描述你的目标！',
	'card.goalChecklistTitle': '我的目标清单',
	'card.goalChecklistPlaceholder': '在这里添加你的目标（每行一个）',
	'card.activityHistoryTitle': '活动记录',
	'card.buttonsTitle': '今天表现如何？',
	'card.checkInCongrats': '又坚持了一天，你正在不断进步！🎉',
	'card.currentValue': '当前值：{{value}}',
	'card.defaultButton': '按钮',
	'card.noteCounterTitle': '今日新增笔记',
	'card.noteCounterLabel': '新增笔记数',
	'card.noteCounterHint': '今天你创建了 {{count}} 篇新笔记',
	'command.insertCalendarHeatmap': '插入日历热力图',
	'command.insertCheckInComponent': '插入打卡组件',
	'command.insertSingleCheckInComponent': '插入单按钮打卡组件',
	'command.insertDailyOverview': '插入每日概览',
	'command.insertGoalChecklist': '插入目标清单',
	'command.insertNoteCounter': '插入笔记计数器',
	'snippet.justABit': '稍微做了一点',
	'snippet.gotItDone': '顺利完成',
	'snippet.didExtra': '额外完成',
	'snippet.checkIn': '打卡',
	'setting.weekStartName': '每周起始日',
	'setting.weekStartDescription': '选择热力图中的每周起始日',
	'setting.weekStart.monday': '周一',
	'setting.weekStart.sunday': '周日',
	'setting.dateFieldName': '日期字段',
	'setting.dateFieldDescription': '用于读取笔记日期的 frontmatter 字段名（如 "date"）',
	'setting.valueFieldName': '打卡值字段',
	'setting.valueFieldDescription': '用于存储打卡值的 frontmatter 字段名（如 "tracker"）',
	'setting.allowEditName': '允许编辑打卡记录',
	'setting.allowEditDescription': '允许更新过去日期的打卡值',
	'overview.title': '今日概览',
	'overview.statusLabel': '今日状态',
	'overview.statusValue.checkedIn': '已打卡',
	'overview.statusValue.missed': '未打卡',
	'overview.statusHint.checkedIn': '保持节奏',
	'overview.statusHint.missed': '别忘了打卡',
	'overview.streakLabel': '连续天数',
	'overview.streakHint.active': '继续保持',
	'overview.streakHint.inactive': '等待开启',
	'overview.gapLabel': '最近一次中断',
	'overview.gapValue.none': '暂无中断',
	'overview.noData': '暂无数据',
	'overview.gapHint.present': '回顾那一天',
	'overview.gapHint.none': '表现稳定',
	'overview.streakValue': '{{count}} 天',
};

const DICTIONARIES: Record<LocaleCode, Record<LocaleKey, string>> = {
	en,
	'zh-CN': zhCN,
};

const FALLBACK_LOCALE: LocaleCode = 'en';
const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

export type Translator = (key: LocaleKey, vars?: Record<string, string | number>) => string;

export const createTranslator = (locale: LocaleCode): Translator => {
	return (key, vars) => {
		const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[FALLBACK_LOCALE];
		const fallback = DICTIONARIES[FALLBACK_LOCALE];
		const template = dictionary[key] ?? fallback[key] ?? String(key);
		if (!vars) return template;
		return template.replace(PLACEHOLDER_PATTERN, (match, token) => {
			if (Object.prototype.hasOwnProperty.call(vars, token)) {
				const value = vars[token];
				return value === undefined || value === null ? '' : String(value);
			}
			return match;
		});
	};
};

export const normalizeLocaleCode = (value?: string): LocaleCode => {
	if (!value) return FALLBACK_LOCALE;
	const lower = value.toLowerCase();
	if (lower.startsWith('zh')) return 'zh-CN';
	return 'en';
};

export const resolveLocale = (preference: LanguageSetting, systemLocale?: string): LocaleCode => {
	if (preference === 'system') {
		return normalizeLocaleCode(systemLocale);
	}
	return preference;
};
