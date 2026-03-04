/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs"], function (require, exports, nls_1, configuration_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldPasteTerminalText = shouldPasteTerminalText;
    async function shouldPasteTerminalText(accessor, text, bracketedPasteMode) {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const dialogService = accessor.get(dialogs_1.IDialogService);
        // If the clipboard has only one line, a warning should never show
        const textForLines = text.split(/\r?\n/);
        if (textForLines.length === 1) {
            return true;
        }
        // Get config value
        function parseConfigValue(value) {
            // Valid value
            if (typeof value === 'string') {
                if (value === 'auto' || value === 'always' || value === 'never') {
                    return value;
                }
            }
            // Legacy backwards compatibility
            if (typeof value === 'boolean') {
                return value ? 'auto' : 'never';
            }
            // Invalid value fallback
            return 'auto';
        }
        const configValue = parseConfigValue(configurationService.getValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */));
        // Never show it
        if (configValue === 'never') {
            return true;
        }
        // Special edge cases to not show for auto
        if (configValue === 'auto') {
            // Ignore check if the shell is in bracketed paste mode (ie. the shell can handle multi-line
            // text).
            if (bracketedPasteMode) {
                return true;
            }
            const textForLines = text.split(/\r?\n/);
            // Ignore check when a command is copied with a trailing new line
            if (textForLines.length === 2 && textForLines[1].trim().length === 0) {
                return true;
            }
        }
        const displayItemsCount = 3;
        const maxPreviewLineLength = 30;
        let detail = (0, nls_1.localize)('preview', "Preview:");
        for (let i = 0; i < Math.min(textForLines.length, displayItemsCount); i++) {
            const line = textForLines[i];
            const cleanedLine = line.length > maxPreviewLineLength ? `${line.slice(0, maxPreviewLineLength)}…` : line;
            detail += `\n${cleanedLine}`;
        }
        if (textForLines.length > displayItemsCount) {
            detail += `\n…`;
        }
        const { result, checkboxChecked } = await dialogService.prompt({
            message: (0, nls_1.localize)('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to paste {0} lines of text into the terminal?", textForLines.length),
            detail,
            type: 'warning',
            buttons: [
                {
                    label: (0, nls_1.localize)({ key: 'multiLinePasteButton', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                    run: () => ({ confirmed: true, singleLine: false })
                },
                {
                    label: (0, nls_1.localize)({ key: 'multiLinePasteButton.oneLine', comment: ['&& denotes a mnemonic'] }, "Paste as &&one line"),
                    run: () => ({ confirmed: true, singleLine: true })
                }
            ],
            cancelButton: true,
            checkbox: {
                label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
            }
        });
        if (!result) {
            return false;
        }
        if (result.confirmed && checkboxChecked) {
            await configurationService.updateValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */, false);
        }
        if (result.singleLine) {
            return { modifiedText: text.replace(/\r?\n/g, '') };
        }
        return result.confirmed;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vdGVybWluYWxDbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsMERBOEZDO0lBOUZNLEtBQUssVUFBVSx1QkFBdUIsQ0FBQyxRQUEwQixFQUFFLElBQVksRUFBRSxrQkFBdUM7UUFDOUgsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFDakUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7UUFFbkQsa0VBQWtFO1FBQ2xFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekMsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixTQUFTLGdCQUFnQixDQUFDLEtBQWM7WUFDdkMsY0FBYztZQUNkLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQy9CLElBQUksS0FBSyxLQUFLLE1BQU0sSUFBSSxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDakUsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFDRCxpQ0FBaUM7WUFDakMsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ2pDLENBQUM7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