import { App, PluginSettingTab, Setting } from 'obsidian';
import EasyTrackerPlugin from './main';

// Plugin settings
export interface EasyTrackerPluginSettings {
	weekStart: 0 | 1;
	dateField: string;   // frontmatter field for the note's date, default 'date'
	valueField: string;  // frontmatter field for the check-in value, default 'tracker'
	allowEdit: boolean;  // allow editing existing check-ins
}

export const DEFAULT_SETTINGS: EasyTrackerPluginSettings = {
	weekStart: 1,
	dateField: 'date',
	valueField: 'tracker',
	allowEdit: true,
};

export class EasyTrackerSettingTab extends PluginSettingTab {
	plugin: EasyTrackerPlugin;

	constructor(app: App, plugin: EasyTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(this.plugin.t('setting.weekStartName'))
			.setDesc(this.plugin.t('setting.weekStartDescription'))
			.addDropdown(drop => {
				drop.addOption('1', this.plugin.t('setting.weekStart.monday'));
				drop.addOption('0', this.plugin.t('setting.weekStart.sunday'));
				drop.setValue(String(this.plugin.settings.weekStart));
				drop.onChange(async (value) => {
					this.plugin.settings.weekStart = value === '0' ? 0 : 1;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(this.plugin.t('setting.dateFieldName'))
			.setDesc(this.plugin.t('setting.dateFieldDescription'))
			.addText(text => {
				text.setValue(this.plugin.settings.dateField);
				text.onChange(async (value) => {
					this.plugin.settings.dateField = value.trim() || 'date';
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(this.plugin.t('setting.valueFieldName'))
			.setDesc(this.plugin.t('setting.valueFieldDescription'))
			.addText(text => {
				text.setValue(this.plugin.settings.valueField);
				text.onChange(async (value) => {
					this.plugin.settings.valueField = value.trim() || 'easy-tracker-value';
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(this.plugin.t('setting.allowEditName'))
			.setDesc(this.plugin.t('setting.allowEditDescription'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.allowEdit);
				toggle.onChange(async (value) => {
					this.plugin.settings.allowEdit = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
