/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParseErrorMessage = getParseErrorMessage;
    function getParseErrorMessage(errorCode) {
        switch (errorCode) {
            case 1 /* ParseErrorCode.InvalidSymbol */: return (0, nls_1.localize)('error.invalidSymbol', 'Invalid symbol');
            case 2 /* ParseErrorCode.InvalidNumberFormat */: return (0, nls_1.localize)('error.invalidNumberFormat', 'Invalid number format');
            case 3 /* ParseErrorCode.PropertyNameExpected */: return (0, nls_1.localize)('error.propertyNameExpected', 'Property name expected');
            case 4 /* ParseErrorCode.ValueExpected */: return (0, nls_1.localize)('error.valueExpected', 'Value expected');
            case 5 /* ParseErrorCode.ColonExpected */: return (0, nls_1.localize)('error.colonExpected', 'Colon expected');
            case 6 /* ParseErrorCode.CommaExpected */: return (0, nls_1.localize)('error.commaExpected', 'Comma expected');
            case 7 /* ParseErrorCode.CloseBraceExpected */: return (0, nls_1.localize)('error.closeBraceExpected', 'Closing brace expected');
            case 8 /* ParseErrorCode.CloseBracketExpected */: return (0, nls_1.localize)('error.closeBracketExpected', 'Closing bracket expected');
            case 9 /* ParseErrorCode.EndOfFileExpected */: return (0, nls_1.localize)('error.endOfFileExpected', 'End of file expected');
            default:
                return '';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkVycm9yTWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9qc29uRXJyb3JNZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxvREFjQztJQWRELFNBQWdCLG9CQUFvQixDQUFDLFNBQXlCO1FBQzdELFFBQVEsU0FBUyxFQUFFLENBQUM7WUFDbkIseUNBQWlDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUYsK0NBQXVDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDL0csZ0RBQXdDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDbEgseUNBQWlDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUYseUNBQWlDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUYseUNBQWlDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUYsOENBQXNDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDOUcsZ0RBQXdDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDcEgsNkNBQXFDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDMUc7Z0JBQ0MsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDO0lBQ0YsQ0FBQyJ9