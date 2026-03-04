/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DraggedTreeItemsIdentifier = exports.TreeViewsDnDService = void 0;
    class TreeViewsDnDService {
        constructor() {
            this._dragOperations = new Map();
        }
        removeDragOperationTransfer(uuid) {
            if ((uuid && this._dragOperations.has(uuid))) {
                const operation = this._dragOperations.get(uuid);
                this._dragOperations.delete(uuid);
                return operation;
            }
            return undefined;
        }
        addDragOperationTransfer(uuid, transferPromise) {
            this._dragOperations.set(uuid, transferPromise);
        }
    }
    exports.TreeViewsDnDService = TreeViewsDnDService;
    class DraggedTreeItemsIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedTreeItemsIdentifier = DraggedTreeItemsIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzRG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy90cmVlVmlld3NEbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsbUJBQW1CO1FBQWhDO1lBRVMsb0JBQWUsR0FBd0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQWMxRSxDQUFDO1FBWkEsMkJBQTJCLENBQUMsSUFBd0I7WUFDbkQsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxJQUFZLEVBQUUsZUFBdUM7WUFDN0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2pELENBQUM7S0FDRDtJQWhCRCxrREFnQkM7SUFHRCxNQUFhLDBCQUEwQjtRQUV0QyxZQUFxQixVQUFrQjtZQUFsQixlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQUksQ0FBQztLQUM1QztJQUhELGdFQUdDIn0=