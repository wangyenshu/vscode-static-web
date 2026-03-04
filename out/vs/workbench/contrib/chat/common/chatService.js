/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation"], function (require, exports, uri_1, range_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KEYWORD_ACTIVIATION_SETTING_ID = exports.IChatService = exports.ChatCopyKind = exports.InteractiveSessionVoteDirection = void 0;
    exports.isIDocumentContext = isIDocumentContext;
    exports.isIUsedContext = isIUsedContext;
    function isIDocumentContext(obj) {
        return (!!obj &&
            typeof obj === 'object' &&
            'uri' in obj && obj.uri instanceof uri_1.URI &&
            'version' in obj && typeof obj.version === 'number' &&
            'ranges' in obj && Array.isArray(obj.ranges) && obj.ranges.every(range_1.Range.isIRange));
    }
    function isIUsedContext(obj) {
        return (!!obj &&
            typeof obj === 'object' &&
            'documents' in obj &&
            Array.isArray(obj.documents) &&
            obj.documents.every(isIDocumentContext));
    }
    // Name has to match the one in vscode.d.ts for some reason
    var InteractiveSessionVoteDirection;
    (function (InteractiveSessionVoteDirection) {
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Down"] = 0] = "Down";
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Up"] = 1] = "Up";
    })(InteractiveSessionVoteDirection || (exports.InteractiveSessionVoteDirection = InteractiveSessionVoteDirection = {}));
    var ChatCopyKind;
    (function (ChatCopyKind) {
        // Keyboard shortcut or context menu
        ChatCopyKind[ChatCopyKind["Action"] = 1] = "Action";
        ChatCopyKind[ChatCopyKind["Toolbar"] = 2] = "Toolbar";
    })(ChatCopyKind || (exports.ChatCopyKind = ChatCopyKind = {}));
    exports.IChatService = (0, instantiation_1.createDecorator)('IChatService');
    exports.KEYWORD_ACTIVIATION_SETTING_ID = 'accessibility.voice.keywordActivation';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQ2hHLGdEQVFDO0lBT0Qsd0NBUUM7SUF2QkQsU0FBZ0Isa0JBQWtCLENBQUMsR0FBWTtRQUM5QyxPQUFPLENBQ04sQ0FBQyxDQUFDLEdBQUc7WUFDTCxPQUFPLEdBQUcsS0FBSyxRQUFRO1lBQ3ZCLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsWUFBWSxTQUFHO1lBQ3RDLFNBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsT0FBTyxLQUFLLFFBQVE7WUFDbkQsUUFBUSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFLLENBQUMsUUFBUSxDQUFDLENBQ2hGLENBQUM7SUFDSCxDQUFDO0lBT0QsU0FBZ0IsY0FBYyxDQUFDLEdBQVk7UUFDMUMsT0FBTyxDQUNOLENBQUMsQ0FBQyxHQUFHO1lBQ0wsT0FBTyxHQUFHLEtBQUssUUFBUTtZQUN2QixXQUFXLElBQUksR0FBRztZQUNsQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFDNUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FDdkMsQ0FBQztJQUNILENBQUM7SUFtRkQsMkRBQTJEO0lBQzNELElBQVksK0JBR1g7SUFIRCxXQUFZLCtCQUErQjtRQUMxQyxxRkFBUSxDQUFBO1FBQ1IsaUZBQU0sQ0FBQTtJQUNQLENBQUMsRUFIVywrQkFBK0IsK0NBQS9CLCtCQUErQixRQUcxQztJQVFELElBQVksWUFJWDtJQUpELFdBQVksWUFBWTtRQUN2QixvQ0FBb0M7UUFDcEMsbURBQVUsQ0FBQTtRQUNWLHFEQUFXLENBQUE7SUFDWixDQUFDLEVBSlcsWUFBWSw0QkFBWixZQUFZLFFBSXZCO0lBbUdZLFFBQUEsWUFBWSxHQUFHLElBQUEsK0JBQWUsRUFBZSxjQUFjLENBQUMsQ0FBQztJQW1DN0QsUUFBQSw4QkFBOEIsR0FBRyx1Q0FBdUMsQ0FBQyJ9