/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions"], function (require, exports, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionRunnerWithContext = void 0;
    class ActionRunnerWithContext extends actions_1.ActionRunner {
        constructor(_getContext) {
            super();
            this._getContext = _getContext;
        }
        runAction(action, _context) {
            const ctx = this._getContext();
            return super.runAction(action, ctx);
        }
    }
    exports.ActionRunnerWithContext = ActionRunnerWithContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvbXVsdGlEaWZmRWRpdG9yL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFhLHVCQUF3QixTQUFRLHNCQUFZO1FBQ3hELFlBQTZCLFdBQTBCO1lBQ3RELEtBQUssRUFBRSxDQUFDO1lBRG9CLGdCQUFXLEdBQVgsV0FBVyxDQUFlO1FBRXZELENBQUM7UUFFa0IsU0FBUyxDQUFDLE1BQWUsRUFBRSxRQUFrQjtZQUMvRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNyQyxDQUFDO0tBQ0Q7SUFURCwwREFTQyJ9