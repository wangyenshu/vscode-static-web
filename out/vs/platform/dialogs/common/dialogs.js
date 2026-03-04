/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/severity", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/objects"], function (require, exports, resources_1, severity_1, nls_1, instantiation_1, labels_1, platform_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfirmResult = exports.IFileDialogService = exports.AbstractDialogHandler = exports.IDialogService = void 0;
    exports.getFileNamesMessage = getFileNamesMessage;
    exports.massageMessageBoxOptions = massageMessageBoxOptions;
    exports.IDialogService = (0, instantiation_1.createDecorator)('dialogService');
    var DialogKind;
    (function (DialogKind) {
        DialogKind[DialogKind["Confirmation"] = 1] = "Confirmation";
        DialogKind[DialogKind["Prompt"] = 2] = "Prompt";
        DialogKind[DialogKind["Input"] = 3] = "Input";
    })(DialogKind || (DialogKind = {}));
    class AbstractDialogHandler {
        getConfirmationButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Confirmation);
        }
        getPromptButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Prompt);
        }
        getInputButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Input);
        }
        getButtons(dialog, kind) {
            // We put buttons in the order of "default" button first and "cancel"
            // button last. There maybe later processing when presenting the buttons
            // based on OS standards.
            const buttons = [];
            switch (kind) {
                case DialogKind.Confirmation: {
                    const confirmationDialog = dialog;
                    if (confirmationDialog.primaryButton) {
                        buttons.push(confirmationDialog.primaryButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
                    }
                    if (confirmationDialog.cancelButton) {
                        buttons.push(confirmationDialog.cancelButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                    }
                    break;
                }
                case DialogKind.Prompt: {
                    const promptDialog = dialog;
                    if (Array.isArray(promptDialog.buttons) && promptDialog.buttons.length > 0) {
                        buttons.push(...promptDialog.buttons.map(button => button.label));
                    }
                    if (promptDialog.cancelButton) {
                        if (promptDialog.cancelButton === true) {
                            buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                        }
                        else if (typeof promptDialog.cancelButton === 'string') {
                            buttons.push(promptDialog.cancelButton);
                        }
                        else {
                            if (promptDialog.cancelButton.label) {
                                buttons.push(promptDialog.cancelButton.label);
                            }
                            else {
                                buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                            }
                        }
                    }
                    if (buttons.length === 0) {
                        buttons.push((0, nls_1.localize)({ key: 'okButton', comment: ['&& denotes a mnemonic'] }, "&&OK"));
                    }
                    break;
                }
                case DialogKind.Input: {
                    const inputDialog = dialog;
                    if (inputDialog.primaryButton) {
                        buttons.push(inputDialog.primaryButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)({ key: 'okButton', comment: ['&& denotes a mnemonic'] }, "&&OK"));
                    }
                    if (inputDialog.cancelButton) {
                        buttons.push(inputDialog.cancelButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                    }
                    break;
                }
            }
            return buttons;
        }
        getDialogType(type) {
            if (typeof type === 'string') {
                return type;
            }
            if (typeof type === 'number') {
                return (type === severity_1.default.Info) ? 'info' : (type === severity_1.default.Error) ? 'error' : (type === severity_1.default.Warning) ? 'warning' : 'none';
            }
            return undefined;
        }
        getPromptResult(prompt, buttonIndex, checkboxChecked) {
            const promptButtons = [...(prompt.buttons ?? [])];
            if (prompt.cancelButton && typeof prompt.cancelButton !== 'string' && typeof prompt.cancelButton !== 'boolean') {
                promptButtons.push(prompt.cancelButton);
            }
            let result = promptButtons[buttonIndex]?.run({ checkboxChecked });
            if (!(result instanceof Promise)) {
                result = Promise.resolve(result);
            }
            return { result, checkboxChecked };
        }
    }
    exports.AbstractDialogHandler = AbstractDialogHandler;
    exports.IFileDialogService = (0, instantiation_1.createDecorator)('fileDialogService');
    var ConfirmResult;
    (function (ConfirmResult) {
        ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
        ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
        ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
    })(ConfirmResult || (exports.ConfirmResult = ConfirmResult = {}));
    const MAX_CONFIRM_FILES = 10;
    function getFileNamesMessage(fileNamesOrResources) {
        const message = [];
        message.push(...fileNamesOrResources.slice(0, MAX_CONFIRM_FILES).map(fileNameOrResource => typeof fileNameOrResource === 'string' ? fileNameOrResource : (0, resources_1.basename)(fileNameOrResource)));
        if (fileNamesOrResources.length > MAX_CONFIRM_FILES) {
            if (fileNamesOrResources.length - MAX_CONFIRM_FILES === 1) {
                message.push((0, nls_1.localize)('moreFile', "...1 additional file not shown"));
            }
            else {
                message.push((0, nls_1.localize)('moreFiles', "...{0} additional files not shown", fileNamesOrResources.length - MAX_CONFIRM_FILES));
            }
        }
        message.push('');
        return message.join('\n');
    }
    /**
     * A utility method to ensure the options for the message box dialog
     * are using properties that are consistent across all platforms and
     * specific to the platform where necessary.
     */
    function massageMessageBoxOptions(options, productService) {
        const massagedOptions = (0, objects_1.deepClone)(options);
        let buttons = (massagedOptions.buttons ?? []).map(button => (0, labels_1.mnemonicButtonLabel)(button));
        let buttonIndeces = (options.buttons || []).map((button, index) => index);
        let defaultId = 0; // by default the first button is default button
        let cancelId = massagedOptions.cancelId ?? buttons.length - 1; // by default the last button is cancel button
        // Apply HIG per OS when more than one button is used
        if (buttons.length > 1) {
            const cancelButton = typeof cancelId === 'number' ? buttons[cancelId] : undefined;
            if (platform_1.isLinux || platform_1.isMacintosh) {
                // Linux: the GNOME HIG (https://developer.gnome.org/hig/patterns/feedback/dialogs.html?highlight=dialog)
                // recommend the following:
                // "Always ensure that the cancel button appears first, before the affirmative button. In left-to-right
                //  locales, this is on the left. This button order ensures that users become aware of, and are reminded
                //  of, the ability to cancel prior to encountering the affirmative button."
                //
                // Electron APIs do not reorder buttons for us, so we ensure a reverse order of buttons and a position
                // of the cancel button (if provided) that matches the HIG
                // macOS: the HIG (https://developer.apple.com/design/human-interface-guidelines/components/presentation/alerts)
                // recommend the following:
                // "Place buttons where people expect. In general, place the button people are most likely to choose on the trailing side in a
                //  row of buttons or at the top in a stack of buttons. Always place the default button on the trailing side of a row or at the
                //  top of a stack. Cancel buttons are typically on the leading side of a row or at the bottom of a stack."
                //
                // However: it seems that older macOS versions where 3 buttons were presented in a row differ from this
                // recommendation. In fact, cancel buttons were placed to the left of the default button and secondary
                // buttons on the far left. To support these older macOS versions we have to manually shuffle the cancel
                // button in the same way as we do on Linux. This will not have any impact on newer macOS versions where
                // shuffling is done for us.
                if (typeof cancelButton === 'string' && buttons.length > 1 && cancelId !== 1) {
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndeces[cancelId];
                    buttonIndeces.splice(cancelId, 1);
                    buttonIndeces.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
                if (platform_1.isLinux && buttons.length > 1) {
                    buttons = buttons.reverse();
                    buttonIndeces = buttonIndeces.reverse();
                    defaultId = buttons.length - 1;
                    if (typeof cancelButton === 'string') {
                        cancelId = defaultId - 1;
                    }
                }
            }
            else if (platform_1.isWindows) {
                // Windows: the HIG (https://learn.microsoft.com/en-us/windows/win32/uxguide/win-dialog-box)
                // recommend the following:
                // "One of the following sets of concise commands: Yes/No, Yes/No/Cancel, [Do it]/Cancel,
                //  [Do it]/[Don't do it], [Do it]/[Don't do it]/Cancel."
                //
                // Electron APIs do not reorder buttons for us, so we ensure the position of the cancel button
                // (if provided) that matches the HIG
                if (typeof cancelButton === 'string' && buttons.length > 1 && cancelId !== buttons.length - 1 /* last action */) {
                    buttons.splice(cancelId, 1);
                    buttons.push(cancelButton);
                    const buttonIndex = buttonIndeces[cancelId];
                    buttonIndeces.splice(cancelId, 1);
                    buttonIndeces.push(buttonIndex);
                    cancelId = buttons.length - 1;
                }
            }
        }
        massagedOptions.buttons = buttons;
        massagedOptions.defaultId = defaultId;
        massagedOptions.cancelId = cancelId;
        massagedOptions.noLink = true;
        massagedOptions.title = massagedOptions.title || productService.nameLong;
        return {
            options: massagedOptions,
            buttonIndeces
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9ncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2RpYWxvZ3MvY29tbW9uL2RpYWxvZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOGtCaEcsa0RBY0M7SUErQkQsNERBeUZDO0lBdmNZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUF5Qy9FLElBQUssVUFJSjtJQUpELFdBQUssVUFBVTtRQUNkLDJEQUFnQixDQUFBO1FBQ2hCLCtDQUFNLENBQUE7UUFDTiw2Q0FBSyxDQUFBO0lBQ04sQ0FBQyxFQUpJLFVBQVUsS0FBVixVQUFVLFFBSWQ7SUFFRCxNQUFzQixxQkFBcUI7UUFFaEMsc0JBQXNCLENBQUMsTUFBcUI7WUFDckQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVTLGdCQUFnQixDQUFDLE1BQXdCO1lBQ2xELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFUyxlQUFlLENBQUMsTUFBYztZQUN2QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBS08sVUFBVSxDQUFDLE1BQWlELEVBQUUsSUFBZ0I7WUFFckYscUVBQXFFO1lBQ3JFLHdFQUF3RTtZQUN4RSx5QkFBeUI7WUFFekIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1lBRTdCLFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsS0FBSyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxrQkFB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