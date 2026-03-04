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
define(["require", "exports", "vs/base/common/marked/marked", "vs/nls", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/common/chatViewModel"], function (require, exports, marked_1, nls_1, accessibleView_1, chatViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAccessibilityProvider = void 0;
    let ChatAccessibilityProvider = class ChatAccessibilityProvider {
        constructor(_accessibleViewService) {
            this._accessibleViewService = _accessibleViewService;
        }
        getWidgetRole() {
            return 'list';
        }
        getRole(element) {
            return 'listitem';
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('chat', "Chat");
        }
        getAriaLabel(element) {
            if ((0, chatViewModel_1.isRequestVM)(element)) {
                return element.messageText;
            }
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                return this._getLabelWithCodeBlockCount(element);
            }
            if ((0, chatViewModel_1.isWelcomeVM)(element)) {
                return element.content.map(c => 'value' in c ? c.value : c.map(followup => followup.message).join('\n')).join('\n');
            }
            return '';
        }
        _getLabelWithCodeBlockCount(element) {
            const accessibleViewHint = this._accessibleViewService.getOpenAriaHint("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */);
            let label = '';
            const fileTreeCount = element.response.value.filter((v) => !('value' in v))?.length ?? 0;
            let fileTreeCountHint = '';
            switch (fileTreeCount) {
                case 0:
                    break;
                case 1:
                    fileTreeCountHint = (0, nls_1.localize)('singleFileTreeHint', "1 file tree");
                    break;
                default:
                    fileTreeCountHint = (0, nls_1.localize)('multiFileTreeHint', "{0} file trees", fileTreeCount);
                    break;
            }
            const codeBlockCount = marked_1.marked.lexer(element.response.asString()).filter(token => token.type === 'code')?.length ?? 0;
            switch (codeBlockCount) {
                case 0:
                    label = accessibleViewHint ? (0, nls_1.localize)('noCodeBlocksHint', "{0} {1} {2}", fileTreeCountHint, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('noCodeBlocks', "{0} {1}", fileTreeCountHint, element.response.asString());
                    break;
                case 1:
                    label = accessibleViewHint ? (0, nls_1.localize)('singleCodeBlockHint', "{0} 1 code block: {1} {2}", fileTreeCountHint, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('singleCodeBlock', "{0} 1 code block: {1}", fileTreeCountHint, element.response.asString());
                    break;
                default:
                    label = accessibleViewHint ? (0, nls_1.localize)('multiCodeBlockHint', "{0} {1} code blocks: {2}", fileTreeCountHint, codeBlockCount, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('multiCodeBlock', "{0} {1} code blocks", fileTreeCountHint, codeBlockCount, element.response.asString());
                    break;
            }
            return label;
        }
    };
    exports.ChatAccessibilityProvider = ChatAccessibilityProvider;
    exports.ChatAccessibilityProvider = ChatAccessibilityProvider = __decorate([
        __param(0, accessibleView_1.IAccessibleViewService)
    ], ChatAccessibilityProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0QWNjZXNzaWJpbGl0eVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtRQUVyQyxZQUMwQyxzQkFBOEM7WUFBOUMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtRQUd4RixDQUFDO1FBQ0QsYUFBYTtZQUNaLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELE9BQU8sQ0FBQyxPQUFxQjtZQUM1QixPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO1FBRUQsa0JBQWtCO1lBQ2pCLE9BQU8sSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBcUI7WUFDakMsSUFBSSxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBRUQsSUFBSSxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxD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