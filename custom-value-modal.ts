import { App, Modal, Setting, Notice, TextComponent, ButtonComponent } from "obsidian";
import type EasyTrackerPlugin from "./main";

export class CustomValueModal extends Modal {
    plugin: EasyTrackerPlugin;
    onSubmit: (result: number) => void;

    constructor(app: App, plugin: EasyTrackerPlugin, onSubmit: (result: number) => void) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h2", { text: this.plugin.t("modal.customValueTitle") });

        let value = "";

        const submitAction = () => {
            const num = parseFloat(value);
            if (isNaN(num)) {
                new Notice(this.plugin.t("notice.invalidValue"));
                return;
            }
            this.close();
            this.onSubmit(num);
        };

        new Setting(contentEl)
            .setName(this.plugin.t("modal.customValuePlaceholder"))
            .addText((text: TextComponent) => {
                text.onChange((val: string) => {
                    value = val;
                });

                // Auto-focus the input field
                setTimeout(() => {
                    text.inputEl.focus();
                    text.inputEl.select();
                }, 50);

                // Support Enter key for submission
                text.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        submitAction();
                    }
                });
            });

        new Setting(contentEl).addButton((btn: ButtonComponent) =>
            btn
                .setButtonText(this.plugin.t("modal.submit"))
                .setCta()
                .onClick(() => {
                    submitAction();
                })
        );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
