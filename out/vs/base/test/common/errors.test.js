/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errorMessage", "vs/base/test/common/utils"], function (require, exports, assert, errorMessage_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Errors', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Get Error Message', function () {
            assert.strictEqual((0, errorMessage_1.toErrorMessage)('Foo Bar'), 'Foo Bar');
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(new Error('Foo Bar')), 'Foo Bar');
            let error = new Error();
            error = new Error();
            error.detail = {};
            error.detail.exception = {};
            error.detail.exception.message = 'Foo Bar';
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(error), 'Foo Bar');
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(error, true), 'Foo Bar');
            assert((0, errorMessage_1.toErrorMessage)());
            assert((0, errorMessage_1.toErrorMessage)(null));
            assert((0, errorMessage_1.toErrorMessage)({}));
            try {
                throw new Error();
            }
            catch (error) {
                assert.strictEqual((0, errorMessage_1.toErrorMessage)(error), 'An unknown error occurred. Please consult the log for more details.');
                assert.ok((0, errorMessage_1.toErrorMessage)(error, true).length > 'An unknown error occurred. Please consult the log for more details.'.length);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2Vycm9ycy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1FBQ3BCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDekIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVwRSxJQUFJLEtBQUssR0FBUSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzdCLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3BCLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUM1QixLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYyxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUUzRCxNQUFNLENBQUMsSUFBQSw2QkFBYyxHQUFFLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsSUFBQSw2QkFBYyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUEsNkJBQWMsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNCLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxFQUFFLHFFQUFxRSxDQUFDLENBQUM7Z0JBQ2pILE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSw2QkFBYyxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcscUVBQXFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUgsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==