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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/preferences/common/smartSnippetInserter", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/base/common/json", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/platform/theme/common/themeService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/model", "vs/base/common/keybindingParser", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/preferences/common/preferences"], function (require, exports, nls, async_1, htmlContent_1, lifecycle_1, keybinding_1, instantiation_1, range_1, editorExtensions_1, snippetController2_1, smartSnippetInserter_1, keybindingWidgets_1, json_1, windowsKeyboardMapper_1, themeService_1, editorColorRegistry_1, model_1, keybindingParser_1, types_1, resources_1, userDataProfile_1, preferences_1) {
    "use strict";
    var KeybindingEditorDecorationsRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingEditorDecorationsRenderer = void 0;
    const NLS_KB_LAYOUT_ERROR_MESSAGE = nls.localize('defineKeybinding.kbLayoutErrorMessage', "You won't be able to produce this key combination under your current keyboard layout.");
    let DefineKeybindingEditorContribution = class DefineKeybindingEditorContribution extends lifecycle_1.Disposable {
        constructor(_editor, _instantiationService, _userDataProfileService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._userDataProfileService = _userDataProfileService;
            this._keybindingDecorationRenderer = this._register(new lifecycle_1.MutableDisposable());
            this._defineWidget = this._register(this._instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingOverlayWidget, this._editor));
            this._register(this._editor.onDidChangeModel(e => this._update()));
            this._update();
        }
        _update() {
            this._keybindingDecorationRenderer.value = isInterestingEditorModel(this._editor, this._userDataProfileService)
                // Decorations are shown for the default keybindings.json **and** for the user keybindings.json
                ? this._instantiationService.createInstance(KeybindingEditorDecorationsRenderer, this._editor)
                : undefined;
        }
        showDefineKeybindingWidget() {
            if (isInterestingEditorModel(this._editor, this._userDataProfileService)) {
                this._defineWidget.start().then(keybinding => this._onAccepted(keybinding));
            }
        }
        _onAccepted(keybinding) {
            this._editor.focus();
            if (keybinding && this._editor.hasModel()) {
                const regexp = new RegExp(/\\/g);
                const backslash = regexp.test(keybinding);
                if (backslash) {
                    keybinding = keybinding.slice(0, -1) + '\\\\';
                }
                let snippetText = [
                    '{',
                    '\t"key": ' + JSON.stringify(keybinding) + ',',
                    '\t"command": "${1:commandId}",',
                    '\t"when": "${2:editorTextFocus}"',
                    '}$0'
                ].join('\n');
                const smartInsertInfo = smartSnippetInserter_1.SmartSnippetInserter.insertSnippet(this._editor.getModel(), this._editor.getPosition());
                snippetText = smartInsertInfo.prepend + snippetText + smartInsertInfo.append;
                this._editor.setPosition(smartInsertInfo.position);
                snippetController2_1.SnippetController2.get(this._editor)?.insert(snippetText, { overwriteBefore: 0, overwriteAfter: 0 });
            }
        }
    };
    DefineKeybindingEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataProfile_1.IUserDataProfileService)
    ], DefineKeybindingEditorContribution);
    let KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer_1 = class KeybindingEditorDecorationsRenderer extends lifecycle_1.Disposable {
        constructor(_editor, _keybindingService) {
            super();
            this._editor = _editor;
            this._keybindingService = _keybindingService;
            this._dec = this._editor.createDecorationsCollection();
            this._updateDecorations = this._register(new async_1.RunOnceScheduler(() => this._updateDecorationsNow(), 500));
            const model = (0, types_1.assertIsDefined)(this._editor.getModel());
            this._register(model.onDidChangeContent(() => this._updateDecorations.schedule()));
            this._register(this._keybindingService.onDidUpdateKeybindings(() => this._updateDecorations.schedule()));
            this._register({
                dispose: () => {
                    this._dec.clear();
                    this._updateDecorations.cancel();
                }
            });
            this._updateDecorations.schedule();
        }
        _updateDecorationsNow() {
            const model = (0, types_1.assertIsDefined)(this._editor.getModel());
            const newDecorations = [];
            const root = (0, json_1.parseTree)(model.getValue());
            if (root && Array.isArray(root.children)) {
                for (let i = 0, len = root.children.length; i < len; i++) {
                    const entry = root.children[i];
                    const dec = this._getDecorationForEntry(model, entry);
                    if (dec !== null) {
                        newDecorations.push(dec);
                    }
                }
            }
            this._dec.set(newDecorations);
        }
        _getDecorationForEntry(model, entry) {
            if (!Array.isArray(entry.children)) {
                return null;
            }
            for (let i = 0, len = entry.children.length; i < len; i++) {
                const prop = entry.children[i];
                if (prop.type !== 'property') {
                    continue;
                }
                if (!Array.isArray(prop.children) || prop.children.length !== 2) {
                    continue;
                }
                const key = prop.children[0];
                if (key.value !== 'key') {
                    continue;
                }
                const value = prop.children[1];
                if (value.type !== 'string') {
                    continue;
                }
                const resolvedKeybindings = this._keybindingService.resolveUserBinding(value.value);
                if (resolvedKeybindings.length === 0) {
                    return this._createDecoration(true, null, null, model, value);
                }
                const resolvedKeybinding = resolvedKeybindings[0];
                let usLabel = null;
                if (resolvedKeybinding instanceof windowsKeyboardMapper_1.WindowsNativeResolvedKeybinding) {
                    usLabel = resolvedKeybinding.getUSLabel();
                }
                if (!resolvedKeybinding.isWYSIWYG()) {
                    const uiLabel = resolvedKeybinding.getLabel();
                    if (typeof uiLabel === 'string' && value.value.toLowerCase() === uiLabel.toLowerCase()) {
                        // coincidentally, this is actually WYSIWYG
                        return null;
                    }
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                if (/abnt_|oem_/.test(value.value)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                const expectedUserSettingsLabel = resolvedKeybinding.getUserSettingsLabel();
                if (typeof expectedUserSettingsLabel === 'string' && !KeybindingEditorDecorationsRenderer_1._userSettingsFuzzyEquals(value.value, expectedUserSettingsLabel)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                return null;
            }
            return null;
        }
        static _userSettingsFuzzyEquals(a, b) {
            a = a.trim().toLowerCase();
            b = b.trim().toLowerCase();
            if (a === b) {
                return true;
            }
            const aKeybinding = keybindingParser_1.KeybindingParser.parseKeybinding(a);
            const bKeybinding = keybindingParser_1.KeybindingParser.parseKeybinding(b);
            if (aKeybinding === null && bKeybinding === null) {
                return true;
            }
            if (!aKeybinding || !bKeybinding) {
                return false;
            }
            return aKeybinding.equals(bKeybinding);
        }
        _createDecoration(isError, uiLabel, usLabel, model, keyNode) {
            let msg;
            let className;
            let overviewRulerColor;
            if (isError) {
                // this is the error case
                msg = new htmlContent_1.MarkdownString().appendText(NLS_KB_LAYOUT_ERROR_MESSAGE);
                className = 'keybindingError';
                overviewRulerColor = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerError);
            }
            else {
                // this is the info case
                if (usLabel && uiLabel !== usLabel) {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalAndUSMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholders such that they will be rendered in bold.',
                            'The placeholders will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout (**{1}** for US standard).", uiLabel, usLabel));
                }
                else {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholder such that it will be rendered in bold.',
                            'The placeholder will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout.", uiLabel));
                }
                className = 'keybindingInfo';
                overviewRulerColor = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerInfo);
            }
            const startPosition = model.getPositionAt(keyNode.offset);
            const endPosition = model.getPositionAt(keyNode.offset + keyNode.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            // icon + highlight + message decoration
            return {
                range: range,
                options: {
                    description: 'keybindings-widget',
                    stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                    className: className,
                    hoverMessage: msg,
                    overviewRuler: {
                        color: overviewRulerColor,
                        position: model_1.OverviewRulerLane.Right
                    }
                }
            };
        }
    };
    exports.KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer;
    exports.KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], KeybindingEditorDecorationsRenderer);
    function isInterestingEditorModel(editor, userDataProfileService) {
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        return (0, resources_1.isEqual)(model.uri, userDataProfileService.currentProfile.keybindingsResource);
    }
    (0, editorExtensions_1.registerEditorContribution)(preferences_1.DEFINE_KEYBINDING_EDITOR_CONTRIB_ID, DefineKeybindingEditorContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL2tleWJpbmRpbmdzRWRpdG9yQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDO0lBRW5MLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7UUFNMUQsWUFDUyxPQUFvQixFQUNMLHFCQUE2RCxFQUMzRCx1QkFBaUU7WUFFMUYsS0FBSyxFQUFFLENBQUM7WUFKQSxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ1ksMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMxQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBUDFFLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBdUMsQ0FBQyxDQUFDO1lBVzdILElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLGlEQUE2QixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyxPQUFPO1lBQ2QsSUFB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