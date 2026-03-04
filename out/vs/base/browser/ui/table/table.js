/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TableError = void 0;
    class TableError extends Error {
        constructor(user, message) {
            super(`TableError [${user}] ${message}`);
        }
    }
    exports.TableError = TableError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdGFibGUvdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0JoRyxNQUFhLFVBQVcsU0FBUSxLQUFLO1FBRXBDLFlBQVksSUFBWSxFQUFFLE9BQWU7WUFDeEMsS0FBSyxDQUFDLGVBQWUsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNEO0lBTEQsZ0NBS0MifQ==