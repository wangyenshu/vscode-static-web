/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatVariablesService = void 0;
    class MockChatVariablesService {
        registerVariable(data, resolver) {
            throw new Error('Method not implemented.');
        }
        getVariable(name) {
            throw new Error('Method not implemented.');
        }
        hasVariable(name) {
            throw new Error('Method not implemented.');
        }
        getVariables() {
            throw new Error('Method not implemented.');
        }
        getDynamicVariables(sessionId) {
            return [];
        }
        async resolveVariables(prompt, model, progress, token) {
            return {
                variables: []
            };
        }
        resolveVariable(variableName, promptText, model, progress, token) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockChatVariablesService = MockChatVariablesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L3Rlc3QvY29tbW9uL21vY2tDaGF0VmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLHdCQUF3QjtRQUVwQyxnQkFBZ0IsQ0FBQyxJQUF1QixFQUFFLFFBQStCO1lBQ3hFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsV0FBVyxDQUFDLElBQVk7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxXQUFXLENBQUMsSUFBWTtZQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELFlBQVk7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELG1CQUFtQixDQUFDLFNBQWlCO1lBQ3BDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUEwQixFQUFFLEtBQWlCLEVBQUUsUUFBdUQsRUFBRSxLQUF3QjtZQUN0SixPQUFPO2dCQUNOLFNBQVMsRUFBRSxFQUFFO2FBQ2IsQ0FBQztRQUNILENBQUM7UUFFRCxlQUFlLENBQUMsWUFBb0IsRUFBRSxVQUFrQixFQUFFLEtBQWlCLEVBQUUsUUFBdUQsRUFBRSxLQUF3QjtZQUM3SixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztLQUNEO0lBL0JELDREQStCQyJ9