/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteRunningLocation = exports.LocalWebWorkerRunningLocation = exports.LocalProcessRunningLocation = void 0;
    class LocalProcessRunningLocation {
        constructor(affinity) {
            this.affinity = affinity;
            this.kind = 1 /* ExtensionHostKind.LocalProcess */;
        }
        equals(other) {
            return (this.kind === other.kind && this.affinity === other.affinity);
        }
        asString() {
            if (this.affinity === 0) {
                return 'LocalProcess';
            }
            return `LocalProcess${this.affinity}`;
        }
    }
    exports.LocalProcessRunningLocation = LocalProcessRunningLocation;
    class LocalWebWorkerRunningLocation {
        constructor(affinity) {
            this.affinity = affinity;
            this.kind = 2 /* ExtensionHostKind.LocalWebWorker */;
        }
        equals(other) {
            return (this.kind === other.kind && this.affinity === other.affinity);
        }
        asString() {
            if (this.affinity === 0) {
                return 'LocalWebWorker';
            }
            return `LocalWebWorker${this.affinity}`;
        }
    }
    exports.LocalWebWorkerRunningLocation = LocalWebWorkerRunningLocation;
    class RemoteRunningLocation {
        constructor() {
            this.kind = 3 /* ExtensionHostKind.Remote */;
            this.affinity = 0;
        }
        equals(other) {
            return (this.kind === other.kind);
        }
        asString() {
            return 'Remote';
        }
    }
    exports.RemoteRunningLocation = RemoteRunningLocation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUnVubmluZ0xvY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvblJ1bm5pbmdMb2NhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSwyQkFBMkI7UUFFdkMsWUFDaUIsUUFBZ0I7WUFBaEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUZqQixTQUFJLDBDQUFrQztRQUdsRCxDQUFDO1FBQ0UsTUFBTSxDQUFDLEtBQStCO1lBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUNNLFFBQVE7WUFDZCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sY0FBYyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxPQUFPLGVBQWUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQWRELGtFQWNDO0lBRUQsTUFBYSw2QkFBNkI7UUFFekMsWUFDaUIsUUFBZ0I7WUFBaEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUZqQixTQUFJLDRDQUFvQztRQUdwRCxDQUFDO1FBQ0UsTUFBTSxDQUFDLEtBQStCO1lBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUNNLFFBQVE7WUFDZCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sZ0JBQWdCLENBQUM7WUFDekIsQ0FBQztZQUNELE9BQU8saUJBQWlCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUFkRCxzRUFjQztJQUVELE1BQWEscUJBQXFCO1FBQWxDO1lBQ2lCLFNBQUksb0NBQTRCO1lBQ2hDLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFPOUIsQ0FBQztRQU5PLE1BQU0sQ0FBQyxLQUErQjtZQUM1QyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNNLFFBQVE7WUFDZCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFURCxzREFTQyJ9