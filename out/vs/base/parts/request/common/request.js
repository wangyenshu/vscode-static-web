/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OfflineError = void 0;
    exports.isOfflineError = isOfflineError;
    const offlineName = 'Offline';
    /**
     * Checks if the given error is offline error
     */
    function isOfflineError(error) {
        if (error instanceof OfflineError) {
            return true;
        }
        return error instanceof Error && error.name === offlineName && error.message === offlineName;
    }
    class OfflineError extends Error {
        constructor() {
            super(offlineName);
            this.name = this.message;
        }
    }
    exports.OfflineError = OfflineError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvcmVxdWVzdC9jb21tb24vcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsd0NBS0M7SUFWRCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUM7SUFFOUI7O09BRUc7SUFDSCxTQUFnQixjQUFjLENBQUMsS0FBVTtRQUN4QyxJQUFJLEtBQUssWUFBWSxZQUFZLEVBQUUsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxPQUFPLEtBQUssWUFBWSxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUM7SUFDOUYsQ0FBQztJQUVELE1BQWEsWUFBYSxTQUFRLEtBQUs7UUFDdEM7WUFDQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFCLENBQUM7S0FDRDtJQUxELG9DQUtDIn0=