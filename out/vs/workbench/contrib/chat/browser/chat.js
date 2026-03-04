/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/common/chatParticipantContribTypes"], function (require, exports, nls_1, instantiation_1, chatParticipantContribTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CHAT_VIEW_ID = exports.GeneratingPhrase = exports.IChatCodeBlockContextProviderService = exports.IChatAccessibilityService = exports.IQuickChatService = exports.IChatWidgetService = void 0;
    exports.showChatView = showChatView;
    exports.IChatWidgetService = (0, instantiation_1.createDecorator)('chatWidgetService');
    async function showChatView(viewsService) {
        return (await viewsService.openView(exports.CHAT_VIEW_ID))?.widget;
    }
    exports.IQuickChatService = (0, instantiation_1.createDecorator)('quickChatService');
    exports.IChatAccessibilityService = (0, instantiation_1.createDecorator)('chatAccessibilityService');
    exports.IChatCodeBlockContextProviderService = (0, instantiation_1.createDecorator)('chatCodeBlockContextProviderService');
    exports.GeneratingPhrase = (0, nls_1.localize)('generating', "Generating");
    exports.CHAT_VIEW_ID = `workbench.panel.chat.view.${chatParticipantContribTypes_1.CHAT_PROVIDER_ID}`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1DaEcsb0NBRUM7SUFsQlksUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQXFCLG1CQUFtQixDQUFDLENBQUM7SUFnQnBGLEtBQUssVUFBVSxZQUFZLENBQUMsWUFBMkI7UUFDN0QsT0FBTyxDQUFDLE1BQU0sWUFBWSxDQUFDLFFBQVEsQ0FBZSxvQkFBWSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUM7SUFDMUUsQ0FBQztJQUVZLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixrQkFBa0IsQ0FBQyxDQUFDO0lBNEIzRSxRQUFBLHlCQUF5QixHQUFHLElBQUEsK0JBQWUsRUFBNEIsMEJBQTBCLENBQUMsQ0FBQztJQWtHbkcsUUFBQSxvQ0FBb0MsR0FBRyxJQUFBLCtCQUFlLEVBQXVDLHFDQUFxQyxDQUFDLENBQUM7SUFPcEksUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFeEQsUUFBQSxZQUFZLEdBQUcsNkJBQTZCLDhDQUFnQixFQUFFLENBQUMifQ==