/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalEditorAction = void 0;
    class InternalEditorAction {
        constructor(id, label, alias, metadata, _precondition, _run, _contextKeyService) {
            this.id = id;
            this.label = label;
            this.alias = alias;
            this.metadata = metadata;
            this._precondition = _precondition;
            this._run = _run;
            this._contextKeyService = _contextKeyService;
        }
        isSupported() {
            return this._contextKeyService.contextMatchesRules(this._precondition);
        }
        run(args) {
            if (!this.isSupported()) {
                return Promise.resolve(undefined);
            }
            return this._run(args);
        }
    }
    exports.InternalEditorAction = InternalEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9lZGl0b3JBY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsb0JBQW9CO1FBRWhDLFlBQ2lCLEVBQVUsRUFDVixLQUFhLEVBQ2IsS0FBYSxFQUNiLFFBQXNDLEVBQ3JDLGFBQStDLEVBQy9DLElBQXNDLEVBQ3RDLGtCQUFzQztZQU52QyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ1YsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUE4QjtZQUNyQyxrQkFBYSxHQUFiLGFBQWEsQ0FBa0M7WUFDL0MsU0FBSSxHQUFKLElBQUksQ0FBa0M7WUFDdEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtRQUNwRCxDQUFDO1FBRUUsV0FBVztZQUNqQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVNLEdBQUcsQ0FBQyxJQUFhO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBdkJELG9EQXVCQyJ9