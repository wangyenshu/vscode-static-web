/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = exports.ValidationStatus = exports.ValidationState = void 0;
    var ValidationState;
    (function (ValidationState) {
        ValidationState[ValidationState["OK"] = 0] = "OK";
        ValidationState[ValidationState["Info"] = 1] = "Info";
        ValidationState[ValidationState["Warning"] = 2] = "Warning";
        ValidationState[ValidationState["Error"] = 3] = "Error";
        ValidationState[ValidationState["Fatal"] = 4] = "Fatal";
    })(ValidationState || (exports.ValidationState = ValidationState = {}));
    class ValidationStatus {
        constructor() {
            this._state = 0 /* ValidationState.OK */;
        }
        get state() {
            return this._state;
        }
        set state(value) {
            if (value > this._state) {
                this._state = value;
            }
        }
        isOK() {
            return this._state === 0 /* ValidationState.OK */;
        }
        isFatal() {
            return this._state === 4 /* ValidationState.Fatal */;
        }
    }
    exports.ValidationStatus = ValidationStatus;
    class Parser {
        constructor(problemReporter) {
            this._problemReporter = problemReporter;
        }
        reset() {
            this._problemReporter.status.state = 0 /* ValidationState.OK */;
        }
        get problemReporter() {
            return this._problemReporter;
        }
        info(message) {
            this._problemReporter.info(message);
        }
        warn(message) {
            this._problemReporter.warn(message);
        }
        error(message) {
            this._problemReporter.error(message);
        }
        fatal(message) {
            this._problemReporter.fatal(message);
        }
    }
    exports.Parser = Parser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2Vycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3BhcnNlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLElBQWtCLGVBTWpCO0lBTkQsV0FBa0IsZUFBZTtRQUNoQyxpREFBTSxDQUFBO1FBQ04scURBQVEsQ0FBQTtRQUNSLDJEQUFXLENBQUE7UUFDWCx1REFBUyxDQUFBO1FBQ1QsdURBQVMsQ0FBQTtJQUNWLENBQUMsRUFOaUIsZUFBZSwrQkFBZixlQUFlLFFBTWhDO0lBRUQsTUFBYSxnQkFBZ0I7UUFHNUI7WUFDQyxJQUFJLENBQUMsTUFBTSw2QkFBcUIsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFXLEtBQUssQ0FBQyxLQUFzQjtZQUN0QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBRU0sSUFBSTtZQUNWLE9BQU8sSUFBSSxDQUFDLE1BQU0sK0JBQXVCLENBQUM7UUFDM0MsQ0FBQztRQUVNLE9BQU87WUFDYixPQUFPLElBQUksQ0FBQyxNQUFNLGtDQUEwQixDQUFDO1FBQzlDLENBQUM7S0FDRDtJQXhCRCw0Q0F3QkM7SUFVRCxNQUFzQixNQUFNO1FBSTNCLFlBQVksZUFBaUM7WUFDNUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztRQUN6QyxDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsS0FBSyw2QkFBcUIsQ0FBQztRQUN6RCxDQUFDO1FBRUQsSUFBVyxlQUFlO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFFTSxJQUFJLENBQUMsT0FBZTtZQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTSxJQUFJLENBQUMsT0FBZTtZQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTSxLQUFLLENBQUMsT0FBZTtZQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFTSxLQUFLLENBQUMsT0FBZTtZQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQS9CRCx3QkErQkMifQ==