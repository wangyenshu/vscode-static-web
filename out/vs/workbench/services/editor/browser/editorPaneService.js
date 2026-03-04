/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorPaneService", "vs/workbench/browser/editor", "vs/platform/instantiation/common/extensions"], function (require, exports, editorPaneService_1, editor_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPaneService = void 0;
    class EditorPaneService {
        constructor() {
            this.onWillInstantiateEditorPane = editor_1.EditorPaneDescriptor.onWillInstantiateEditorPane;
        }
        didInstantiateEditorPane(typeId) {
            return editor_1.EditorPaneDescriptor.didInstantiateEditorPane(typeId);
        }
    }
    exports.EditorPaneService = EditorPaneService;
    (0, extensions_1.registerSingleton)(editorPaneService_1.IEditorPaneService, EditorPaneService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2Jyb3dzZXIvZWRpdG9yUGFuZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsaUJBQWlCO1FBQTlCO1lBSVUsZ0NBQTJCLEdBQUcsNkJBQW9CLENBQUMsMkJBQTJCLENBQUM7UUFLekYsQ0FBQztRQUhBLHdCQUF3QixDQUFDLE1BQWM7WUFDdEMsT0FBTyw2QkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5RCxDQUFDO0tBQ0Q7SUFURCw4Q0FTQztJQUVELElBQUEsOEJBQWlCLEVBQUMsc0NBQWtCLEVBQUUsaUJBQWlCLG9DQUE0QixDQUFDIn0=