/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeviewsService = void 0;
    class TreeviewsService {
        constructor() {
            this._renderedElements = new Map();
        }
        getRenderedTreeElement(node) {
            if (this._renderedElements.has(node)) {
                return this._renderedElements.get(node);
            }
            return undefined;
        }
        addRenderedTreeItemElement(node, element) {
            this._renderedElements.set(node, element);
        }
        removeRenderedTreeItemElement(node) {
            if (this._renderedElements.has(node)) {
                this._renderedElements.delete(node);
            }
        }
    }
    exports.TreeviewsService = TreeviewsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy92aWV3cy9jb21tb24vdHJlZVZpZXdzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxnQkFBZ0I7UUFBN0I7WUFFUyxzQkFBaUIsR0FBbUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQWtCdkQsQ0FBQztRQWhCQSxzQkFBc0IsQ0FBQyxJQUFZO1lBQ2xDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCwwQkFBMEIsQ0FBQyxJQUFZLEVBQUUsT0FBVTtZQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsNkJBQTZCLENBQUMsSUFBWTtZQUN6QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBcEJELDRDQW9CQyJ9