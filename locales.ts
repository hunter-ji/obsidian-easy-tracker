const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const;
export type LocaleCode = typeof SUPPORTED_LOCALES[number];
export type LanguageSetting = 'system' | LocaleCode;

const en = {
	'notice.noActiveMarkdownView': 'No active Markdown view',
	'notice.alreadyCheckedIn': 'Already checked in today',
	'notice.editorUnavailable': 'Editor instance not available',
	'notice.onlyCheckInInEditMode': 'Please switch to edit mode to check in.',
	'notice.checkInTooFast': 'You are checking in too frequently. Please wait a moment before trying again.',
	'card.goalTitle': 'My Goal',
	'card.goalPlaceholder': 'Define your goal here!',
	'card.activityHistoryTitle': 'Activity History',
	'card.buttonsTitle': 'How did you do today?',
	'card.checkInCongrats': 'Another day done, you\'re making progress! 🎉',
	'card.defaultButton': 'Button',
	'command.insertCalendarHeatmap': 'Insert calendar heatmap',
	'command.insertCheckInComponent': 'Insert Check-in Component',
	'command.insertSingleCheckInComponent': 'Insert Single Check-in Component',
	'command.insertDailyOverview': 'Insert Daily Overview',
	'command.insertMyGoal': 'Insert My Goal',
	'snippet.justABit': 'Just a bit',
	'snippet.gotItDone': 'Got it done',
	'snippet.didExtra': 'Did extra',
	'snippet.checkIn': 'Check in',
	'setting.weekStartName': 'Week start',
	'setting.weekStartDescription': 'Choose the first day of the week used by the calendar',
	'setting.weekStart.monday': 'Monday',
	'setting.weekStart.sunday': 'Sunday',
	'setting.languageName': 'Language',
	'setting.languageDescription': 'Choose how the plugin language is determined',
	'setting.languageOption.system': 'Follow Obsidian language',
	'setting.languageOption.en': 'English',
	'setting.languageOption.zhCN': 'Simplified Chinese',
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
	'card.goalTitle': '我的目标',
	'card.goalPlaceholder': '在这里描述你的目标！',
	'card.activityHistoryTitle': '活动记录',
	'card.buttonsTitle': '今天表现如何？',
	'card.checkInCongrats': '又坚持了一天，你正在不断进步！🎉',
	'card.defaultButton': '按钮',
	'command.insertCalendarHeatmap': '插入日历热力图',
	'command.insertCheckInComponent': '插入打卡组件',
	'command.insertSingleCheckInComponent': '插入单按钮打卡组件',
	'command.insertDailyOverview': '插入每日概览',
	'command.insertMyGoal': '插入目标卡片',
	'snippet.justABit': '稍微做了一点',
	'snippet.gotItDone': '顺利完成',
	'snippet.didExtra': '额外完成',
	'snippet.checkIn': '打卡',
	'setting.weekStartName': '每周起始日',
	'setting.weekStartDescription': '选择热力图中的每周起始日',
	'setting.weekStart.monday': '周一',
	'setting.weekStart.sunday': '周日',
	'setting.languageName': '界面语言',
	'setting.languageDescription': '选择插件语言的来源',
	'setting.languageOption.system': '跟随 Obsidian 语言',
	'setting.languageOption.en': '英文',
	'setting.languageOption.zhCN': '简体中文',
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

export const isLanguageSetting = (value: unknown): value is LanguageSetting => {
	return value === 'system' || value === 'en' || value === 'zh-CN';
};
