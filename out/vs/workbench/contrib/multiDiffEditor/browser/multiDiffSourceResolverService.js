/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, errors_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffSourceResolverService = exports.MultiDiffEditorItem = exports.IMultiDiffSourceResolverService = void 0;
    exports.IMultiDiffSourceResolverService = (0, instantiation_1.createDecorator)('multiDiffSourceResolverService');
    class MultiDiffEditorItem {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
            if (!original && !modified) {
                throw new errors_1.BugIndicatingError('Invalid arguments');
            }
        }
        getKey() {
            return JSON.stringify([this.modified?.toString(), this.original?.toString()]);
        }
    }
    exports.MultiDiffEditorItem = MultiDiffEditorItem;
    class MultiDiffSourceResolverService {
        constructor() {
            this._resolvers = new Set();
        }
        registerResolver(resolver) {
            // throw on duplicate
            if (this._resolvers.has(resolver)) {
                throw new errors_1.BugIndicatingError('Duplicate resolver');
            }
            this._resolvers.add(resolver);
            return (0, lifecycle_1.toDisposable)(() => this._resolvers.delete(resolver));
        }
        resolve(uri) {
            for (const resolver of this._resolvers) {
                if (resolver.canHandleUri(uri)) {
                    return resolver.resolveDiffSource(uri);
                }
            }
            return Promise.resolve(undefined);
        }
    }
    exports.MultiDiffSourceResolverService = MultiDiffSourceResolverService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmU291cmNlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbXVsdGlEaWZmRWRpdG9yL2Jyb3dzZXIvbXVsdGlEaWZmU291cmNlUmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNuRixRQUFBLCtCQUErQixHQUFHLElBQUEsK0JBQWUsRUFBa0MsZ0NBQWdDLENBQUMsQ0FBQztJQXFCbEksTUFBYSxtQkFBbUI7UUFDL0IsWUFDVSxRQUF5QixFQUN6QixRQUF5QjtZQUR6QixhQUFRLEdBQVIsUUFBUSxDQUFpQjtZQUN6QixhQUFRLEdBQVIsUUFBUSxDQUFpQjtZQUVsQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQztLQUNEO0lBYkQsa0RBYUM7SUFFRCxNQUFhLDhCQUE4QjtRQUEzQztZQUdrQixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7UUFtQm5FLENBQUM7UUFqQkEsZ0JBQWdCLENBQUMsUUFBa0M7WUFDbEQscUJBQXFCO1lBQ3JCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxJQUFJLDJCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFRO1lBQ2YsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNoQyxPQUFPLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNEO0lBdEJELHdFQXNCQyJ9