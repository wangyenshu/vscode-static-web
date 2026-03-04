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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/platform/configuration/common/configuration"], function (require, exports, dom_1, event_1, lifecycle_1, numbers_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnfocusedViewDimmingContribution = void 0;
    let UnfocusedViewDimmingContribution = class UnfocusedViewDimmingContribution extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this._styleElementDisposables = undefined;
            this._register((0, lifecycle_1.toDisposable)(() => this._removeStyleElement()));
            this._register(event_1.Event.runAndSubscribe(configurationService.onDidChangeConfiguration, e => {
                if (e && !e.affectsConfiguration("accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */) && !e.affectsConfiguration("accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */)) {
                    return;
                }
                let cssTextContent = '';
                const enabled = ensureBoolean(configurationService.getValue("accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */), false);
                if (enabled) {
                    const opacity = (0, numbers_1.clamp)(ensureNumber(configurationService.getValue("accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */), 0.75 /* ViewDimUnfocusedOpacityProperties.Default */), 0.2 /* ViewDimUnfocusedOpacityProperties.Minimum */, 1 /* ViewDimUnfocusedOpacityProperties.Maximum */);
                    if (opacity !== 1) {
                        // These filter rules are more specific than may be expected as the `filter`
                        // rule can cause problems if it's used inside the element like on editor hovers
                        const rules = new Set();
                        const filterRule = `filter: opacity(${opacity});`;
                        // Terminal tabs
                        rules.add(`.monaco-workbench .pane-body.integrated-terminal:not(:focus-within) .tabs-container { ${filterRule} }`);
                        // Terminals
                        rules.add(`.monaco-workbench .pane-body.integrated-terminal .terminal-wrapper:not(:focus-within) { ${filterRule} }`);
                        // Text editors
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .monaco-editor { ${filterRule} }`);
                        // Breadcrumbs
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .breadcrumbs-below-tabs { ${filterRule} }`);
                        // Terminal editors
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .terminal-wrapper { ${filterRule} }`);
                        // Settings editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .settings-editor { ${filterRule} }`);
                        // Keybindings editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .keybindings-editor { ${filterRule} }`);
                        // Editor placeholder (error case)
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .monaco-editor-pane-placeholder { ${filterRule} }`);
                        // Welcome editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .gettingStartedContainer { ${filterRule} }`);
                        cssTextContent = [...rules].join('\n');
                    }
                }
                if (cssTextContent.length === 0) {
                    this._removeStyleElement();
                }
                else {
                    this._getStyleElement().textContent = cssTextContent;
                }
            }));
        }
        _getStyleElement() {
            if (!this._styleElement) {
                this._styleElementDisposables = new lifecycle_1.DisposableStore();
                this._styleElement = (0, dom_1.createStyleSheet)(undefined, undefined, this._styleElementDisposables);
                this._styleElement.className = 'accessibilityUnfocusedViewOpacity';
            }
            return this._styleElement;
        }
        _removeStyleElement() {
            this._styleElementDisposables?.dispose();
            this._styleElementDisposables = undefined;
            this._styleElement = undefined;
        }
    };
    exports.UnfocusedViewDimmingContribution = UnfocusedViewDimmingContribution;
    exports.UnfocusedViewDimmingContribution = UnfocusedViewDimmingContribution = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], UnfocusedViewDimmingContribution);
    function ensureBoolean(value, defaultValue) {
        return typeof value === 'boolean' ? value : defaultValue;
    }
    function ensureNumber(value, defaultValue) {
        return typeof value === 'number' ? value : defaultValue;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5mb2N1c2VkVmlld0RpbW1pbmdDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvdW5mb2N1c2VkVmlld0RpbW1pbmdDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFJL0QsWUFDd0Isb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBTEQsNkJBQXdCLEdBQWdDLFNBQVMsQ0FBQztZQU96RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFL0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN2RixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsZ0dBQXFELElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQW9CLGdHQUFxRCxFQUFFLENBQUM7b0JBQ3ZLLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7Z0JBRXhCLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLGdHQUFxRCxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6SCxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLE1BQU0sT0FBTyxHQUFHLElBQUEsZUFBSyxFQUNwQixZQUFZLENBQUMsb0JBQW9CLENBQUMsUUFBUSxnR0FBcUQsdURBQTRD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