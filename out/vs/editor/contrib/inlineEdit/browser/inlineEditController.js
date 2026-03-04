/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/inlineEdit/browser/ghostTextWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/base/common/cancellation", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/platform/commands/common/commands", "vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/base/common/errors"], function (require, exports, lifecycle_1, observable_1, editOperation_1, position_1, range_1, ghostTextWidget_1, contextkey_1, instantiation_1, languages_1, languageFeatures_1, cancellation_1, ghostText_1, commands_1, inlineEditHintsWidget_1, dom_1, configuration_1, errors_1) {
    "use strict";
    var InlineEditController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditController = exports.InlineEditWidget = void 0;
    class InlineEditWidget {
        constructor(widget, edit) {
            this.widget = widget;
            this.edit = edit;
        }
        dispose() {
            this.widget.dispose();
        }
    }
    exports.InlineEditWidget = InlineEditWidget;
    let InlineEditController = class InlineEditController extends lifecycle_1.Disposable {
        static { InlineEditController_1 = this; }
        static { this.ID = 'editor.contrib.inlineEditController'; }
        static { this.inlineEditVisibleKey = 'inlineEditVisible'; }
        static { this.inlineEditVisibleContext = new contextkey_1.RawContextKey(InlineEditController_1.inlineEditVisibleKey, false); }
        static { this.cursorAtInlineEditKey = 'cursorAtInlineEdit'; }
        static { this.cursorAtInlineEditContext = new contextkey_1.RawContextKey(InlineEditController_1.cursorAtInlineEditKey, false); }
        static get(editor) {
            return editor.getContribution(InlineEditController_1.ID);
        }
        constructor(editor, instantiationService, contextKeyService, languageFeaturesService, _commandService, _configurationService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.languageFeaturesService = languageFeaturesService;
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._isVisibleContext = InlineEditController_1.inlineEditVisibleContext.bindTo(this.contextKeyService);
            this._isCursorAtInlineEditContext = InlineEditController_1.cursorAtInlineEditContext.bindTo(this.contextKeyService);
            this._currentEdit = this._register((0, observable_1.disposableObservableValue)(this, undefined));
            this._isAccepting = (0, observable_1.observableValue)(this, false);
            this._enabled = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).enabled);
            this._fontFamily = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).fontFamily);
            this._backgroundColoring = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).backgroundColoring);
            //Automatically request inline edit when the content was changed
            //Cancel the previous request if there is one
            //Remove the previous ghost text
            const modelChangedSignal = (0, observable_1.observableSignalFromEvent)('InlineEditController.modelContentChangedSignal', editor.onDidChangeModelContent);
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.modelContentChanged model */
                if (!this._enabled.read(reader)) {
                    return;
                }
                modelChangedSignal.read(reader);
                if (this._isAccepting.read(reader)) {
                    return;
                }
                this.getInlineEdit(editor, true);
            }));
            //Check if the cursor is at the ghost text
            const cursorPosition = (0, observable_1.observableFromEvent)(editor.onDidChangeCursorPosition, () => editor.getPosition());
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.cursorPositionChanged model */
                if (!this._enabled.read(reader)) {
                    return;
                }
                const pos = cursorPosition.read(reader);
                if (pos) {
                    this.checkCursorPosition(pos);
                }
            }));
            //Perform stuff when the current edit has changed
            this._register((0, observable_1.autorun)((reader) => {
                /** @description InlineEditController.update model */
                const currentEdit = this._currentEdit.read(reader);
                this._isCursorAtInlineEditContext.set(false);
                if (!currentEdit) {
                    this._isVisibleContext.set(false);
                    return;
                }
                this._isVisibleContext.set(true);
                const pos = editor.getPosition();
                if (pos) {
                    this.checkCursorPosition(pos);
                }
            }));
            //Clear suggestions on lost focus
            const editorBlurSingal = (0, observable_1.observableSignalFromEvent)('InlineEditController.editorBlurSignal', editor.onDidBlurEditorWidget);
            this._register((0, observable_1.autorun)(async (reader) => {
                /** @description InlineEditController.editorBlur */
                if (!this._enabled.read(reader)) {
                    return;
                }
                editorBlurSingal.read(reader);
                // This is a hidden setting very useful for debugging
                if (this._configurationService.getValue('editor.experimentalInlineEdit.keepOnBlur') || editor.getOption(63 /* EditorOption.inlineEdit */).keepOnBlur) {
                    return;
                }
                this._currentRequestCts?.dispose(true);
                this._currentRequestCts = undefined;
                await this.clear(false);
            }));
            //Invoke provider on focus
            const editorFocusSignal = (0, observable_1.observableSignalFromEvent)('InlineEditController.editorFocusSignal', editor.onDidFocusEditorText);
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.editorFocus */
                if (!this._enabled.read(reader)) {
                    return;
                }
                editorFocusSignal.read(reader);
                this.getInlineEdit(editor, true);
            }));
            //handle changes of font setting
            const styleElement = this._register((0, dom_1.createStyleSheet2)());
            this._register((0, observable_1.autorun)(reader => {
                const fontFamily = this._fontFamily.read(reader);
                styleElement.setStyle(fontFamily === '' || fontFamily === 'default' ? `` : `
.monaco-editor .inline-edit-decoration,
.monaco-editor .inline-edit-decoration-preview,
.monaco-editor .inline-edit {
	font-family: ${fontFamily};
}`);
            }));
            this._register(new inlineEditHintsWidget_1.InlineEditHintsWidget(this.editor, this._currentEdit, this.instantiationService));
        }
        checkCursorPosition(position) {
            if (!this._currentEdit) {
                this._isCursorAtInlineEditContext.set(false);
                return;
            }
            const gt = this._currentEdit.get()?.edit;
            if (!gt) {
                this._isCursorAtInlineEditContext.set(false);
                return;
            }
            this._isCursorAtInlineEditContext.set(range_1.Range.containsPosition(gt.range, position));
        }
        validateInlineEdit(editor, edit) {
            //Multiline inline replacing edit must replace whole lines
            if (edit.text.includes('\n') && edit.range.startLineNumber !== edit.range.endLineNumber && edit.range.startColumn !== edit.range.endColumn) {
                const firstColumn = edit.range.startColumn;
                if (firstColumn !== 1) {
                    return false;
                }
                const lastLine = edit.range.endLineNumber;
                const lastColumn = edit.range.endColumn;
                const lineLength = editor.getModel()?.getLineLength(lastLine) ?? 0;
                if (lastColumn !== lineLength + 1) {
                    return false;
                }
            }
            return true;
        }
        async fetchInlineEdit(editor, auto) {
            if (this._currentRequestCts) {
                this._currentRequestCts.dispose(true);
            }
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const modelVersion = model.getVersionId();
            const providers = this.languageFeaturesService.inlineEditProvider.all(model);
            if (providers.length === 0) {
                return;
            }
            const provider = providers[0];
            this._currentRequestCts = new cancellation_1.CancellationTokenSource();
            const token = this._currentRequestCts.token;
            const triggerKind = auto ? languages_1.InlineEditTriggerKind.Automatic : languages_1.InlineEditTriggerKind.Invoke;
            const shouldDebounce = auto;
            if (shouldDebounce) {
                await wait(50, token);
            }
            if (token.isCancellationRequested || model.isDisposed() || model.getVersionId() !== modelVersion) {
                return;
            }
            const edit = await provider.provideInlineEdit(model, { triggerKind }, token);
            if (!edit) {
                return;
            }
            if (token.isCancellationRequested || model.isDisposed() || model.getVersionId() !== modelVersion) {
                return;
            }
            if (!this.validateInlineEdit(editor, edit)) {
                return;
            }
            return edit;
        }
        async getInlineEdit(editor, auto) {
            this._isCursorAtInlineEditContext.set(false);
            await this.clear();
            const edit = await this.fetchInlineEdit(editor, auto);
            if (!edit) {
                return;
            }
            const line = edit.range.endLineNumber;
            const column = edit.range.endColumn;
            const textToDisplay = edit.text.endsWith('\n') && !(edit.range.startLineNumber === edit.range.endLineNumber && edit.range.startColumn === edit.range.endColumn) ? edit.text.slice(0, -1) : edit.text;
            const ghostText = new ghostText_1.GhostText(line, [new ghostText_1.GhostTextPart(column, textToDisplay, false)]);
            const instance = this.instantiationService.createInstance(ghostTextWidget_1.GhostTextWidget, this.editor, {
                ghostText: (0, observable_1.constObservable)(ghostText),
                minReservedLineCount: (0, observable_1.constObservable)(0),
                targetTextModel: (0, observable_1.constObservable)(this.editor.getModel() ?? undefined),
                range: (0, observable_1.constObservable)(edit.range),
                backgroundColoring: this._backgroundColoring
            });
            this._currentEdit.set(new InlineEditWidget(instance, edit), undefined);
        }
        async trigger() {
            await this.getInlineEdit(this.editor, false);
        }
        async jumpBack() {
            if (!this._jumpBackPosition) {
                return;
            }
            this.editor.setPosition(this._jumpBackPosition);
            //if position is outside viewports, scroll to it
            this.editor.revealPositionInCenterIfOutsideViewport(this._jumpBackPosition);
        }
        async accept() {
            this._isAccepting.set(true, undefined);
            const data = this._currentEdit.get()?.edit;
            if (!data) {
                return;
            }
            //It should only happen in case of last line suggestion
            let text = data.text;
            if (data.text.startsWith('\n')) {
                text = data.text.substring(1);
            }
            this.editor.pushUndoStop();
            this.editor.executeEdits('acceptCurrent', [editOperation_1.EditOperation.replace(range_1.Range.lift(data.range), text)]);
            if (data.accepted) {
                await this._commandService
                    .executeCommand(data.accepted.id, ...(data.accepted.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
            }
            this.freeEdit(data);
            (0, observable_1.transaction)((tx) => {
                this._currentEdit.set(undefined, tx);
                this._isAccepting.set(false, tx);
            });
        }
        jumpToCurrent() {
            this._jumpBackPosition = this.editor.getSelection()?.getStartPosition();
            const data = this._currentEdit.get()?.edit;
            if (!data) {
                return;
            }
            const position = position_1.Position.lift({ lineNumber: data.range.startLineNumber, column: data.range.startColumn });
            this.editor.setPosition(position);
            //if position is outside viewports, scroll to it
            this.editor.revealPositionInCenterIfOutsideViewport(position);
        }
        async clear(sendRejection = true) {
            const edit = this._currentEdit.get()?.edit;
            if (edit && edit?.rejected && sendRejection) {
                await this._commandService
                    .executeCommand(edit.rejected.id, ...(edit.rejected.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
            }
            if (edit) {
                this.freeEdit(edit);
            }
            this._currentEdit.set(undefined, undefined);
        }
        freeEdit(edit) {
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            const providers = this.languageFeaturesService.inlineEditProvider.all(model);
            if (providers.length === 0) {
                return;
            }
            providers[0].freeInlineEdit(edit);
        }
        shouldShowHoverAt(range) {
            const currentEdit = this._currentEdit.get();
            if (!currentEdit) {
                return false;
            }
            const edit = currentEdit.edit;
            const model = currentEdit.widget.model;
            const overReplaceRange = range_1.Range.containsPosition(edit.range, range.getStartPosition()) || range_1.Range.containsPosition(edit.range, range.getEndPosition());
            if (overReplaceRange) {
                return true;
            }
            const ghostText = model.ghostText.get();
            if (ghostText) {
                return ghostText.parts.some(p => range.containsPosition(new position_1.Position(ghostText.lineNumber, p.column)));
            }
            return false;
        }
        shouldShowHoverAtViewZone(viewZoneId) {
            return this._currentEdit.get()?.widget.ownsViewZone(viewZoneId) ?? false;
        }
    };
    exports.InlineEditController = InlineEditController;
    exports.InlineEditController = InlineEditController = InlineEditController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService)
    ], InlineEditController);
    function wait(ms, cancellationToken) {
        return new Promise(resolve => {
            let d = undefined;
            const handle = setTimeout(() => {
                if (d) {
                    d.dispose();
                }
                resolve();
            }, ms);
            if (cancellationToken) {
                d = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(handle);
                    if (d) {
                        d.dispose();
                    }
                    resolve();
                });
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVFZGl0L2Jyb3dzZXIvaW5saW5lRWRpdENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNCaEcsTUFBYSxnQkFBZ0I7UUFDNUIsWUFBNEIsTUFBdUIsRUFBa0IsSUFBaUI7WUFBMUQsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7WUFBa0IsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUFJLENBQUM7UUFFM0YsT0FBTztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBTkQsNENBTUM7SUFFTSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFDNUMsT0FBRSxHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztpQkFFM0IseUJBQW9CLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO2lCQUMzQyw2QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQW9CLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLEFBQS9FLENBQWdGO2lCQUd4RywwQkFBcUIsR0FBRyxvQkFBb0IsQUFBdkIsQ0FBd0I7aUJBQzdDLDhCQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBb0IsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQUFBaEYsQ0FBaUY7UUFHMUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQXVCLHNCQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFhRCxZQUNpQixNQUFtQixFQUNaLG9CQUE0RCxFQUMvRCxpQkFB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