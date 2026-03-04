/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConstLazyPromise = void 0;
    class ConstLazyPromise {
        constructor(_value) {
            this._value = _value;
            this.onHasValueDidChange = event_1.Event.None;
        }
        request() {
            return Promise.resolve(this._value);
        }
        get value() {
            return this._value;
        }
    }
    exports.ConstLazyPromise = ConstLazyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvbXVsdGlEaWZmRWRpdG9yL21vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSxnQkFBZ0I7UUFHNUIsWUFDa0IsTUFBUztZQUFULFdBQU0sR0FBTixNQUFNLENBQUc7WUFIWCx3QkFBbUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBSTdDLENBQUM7UUFFRSxPQUFPO1lBQ2IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7S0FDRDtJQWRELDRDQWNDIn0=