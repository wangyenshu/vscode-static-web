define(["require", "exports", "assert", "vs/base/common/stripComments", "vs/base/test/common/utils"], function (require, exports, assert, stripComments_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // We use this regular expression quite often to strip comments in JSON files.
    suite('Strip Comments', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Line comment', () => {
            const content = [
                "{",
                "  \"prop\": 10 // a comment",
                "}",
            ].join('\n');
            const expected = [
                "{",
                "  \"prop\": 10 ",
                "}",
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Line comment - EOF', () => {
            const content = [
                "{",
                "}",
                "// a comment"
            ].join('\n');
            const expected = [
                "{",
                "}",
                ""
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Line comment - \\r\\n', () => {
            const content = [
                "{",
                "  \"prop\": 10 // a comment",
                "}",
            ].join('\r\n');
            const expected = [
                "{",
                "  \"prop\": 10 ",
                "}",
            ].join('\r\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Line comment - EOF - \\r\\n', () => {
            const content = [
                "{",
                "}",
                "// a comment"
            ].join('\r\n');
            const expected = [
                "{",
                "}",
                ""
            ].join('\r\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Block comment - single line', () => {
            const content = [
                "{",
                "  /* before */\"prop\": 10/* after */",
                "}",
            ].join('\n');
            const expected = [
                "{",
                "  \"prop\": 10",
                "}",
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Block comment - multi line', () => {
            const content = [
                "{",
                "  /**",
                "   * Some comment",
                "   */",
                "  \"prop\": 10",
                "}",
            ].join('\n');
            const expected = [
                "{",
                "  ",
                "  \"prop\": 10",
                "}",
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Block comment - shortest match', () => {
            const content = "/* abc */ */";
            const expected = " */";
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('No strings - double quote', () => {
            const content = [
                "{",
                "  \"/* */\": 10",
                "}"
            ].join('\n');
            const expected = [
                "{",
                "  \"/* */\": 10",
                "}"
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('No strings - single quote', () => {
            const content = [
                "{",
                "  '/* */': 10",
                "}"
            ].join('\n');
            const expected = [
                "{",
                "  '/* */': 10",
                "}"
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Trailing comma in object', () => {
            const content = [
                "{",
                `  "a": 10,`,
                "}"
            ].join('\n');
            const expected = [
                "{",
                `  "a": 10`,
                "}"
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
        test('Trailing comma in array', () => {
            const content = [
                `[ "a", "b", "c", ]`
            ].join('\n');
            const expected = [
                `[ "a", "b", "c" ]`
            ].join('\n');
            assert.strictEqual((0, stripComments_1.stripComments)(content), expected);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaXBDb21tZW50cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9zdHJpcENvbW1lbnRzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsOEVBQThFO0lBRTlFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDNUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQ3pCLE1BQU0sT0FBTyxHQUFXO2dCQUN2QixHQUFHO2dCQUNILDZCQUE2QjtnQkFDN0IsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2IsTUFBTSxRQUFRLEdBQUc7Z0JBQ2hCLEdBQUc7Z0JBQ0gsaUJBQWlCO2dCQUNqQixHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDL0IsTUFBTSxPQUFPLEdBQVc7Z0JBQ3ZCLEdBQUc7Z0JBQ0gsR0FBRztnQkFDSCxjQUFjO2FBQ2QsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLFFBQVEsR0FBRztnQkFDaEIsR0FBRztnQkFDSCxHQUFHO2dCQUNILEVBQUU7YUFDRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNsQyxNQUFNLE9BQU8sR0FBVztnQkFDdkIsR0FBRztnQkFDSCw2QkFBNkI7Z0JBQzdCLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNmLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixHQUFHO2dCQUNILGlCQUFpQjtnQkFDakIsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLE1BQU0sT0FBTyxHQUFXO2dCQUN2QixHQUFHO2dCQUNILEdBQUc7Z0JBQ0gsY0FBYzthQUNkLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2YsTUFBTSxRQUFRLEdBQUc7Z0JBQ2hCLEdBQUc7Z0JBQ0gsR0FBRztnQkFDSCxFQUFFO2FBQ0YsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDZixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDeEMsTUFBTSxPQUFPLEdBQVc7Z0JBQ3ZCLEdBQUc7Z0JBQ0gsdUNBQXVDO2dCQUN2QyxHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLFFBQVEsR0FBRztnQkFDaEIsR0FBRztnQkFDSCxnQkFBZ0I7Z0JBQ2hCLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtZQUN2QyxNQUFNLE9BQU8sR0FBVztnQkFDdkIsR0FBRztnQkFDSCxPQUFPO2dCQUNQLG1CQUFtQjtnQkFDbkIsT0FBTztnQkFDUCxnQkFBZ0I7Z0JBQ2hCLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixHQUFHO2dCQUNILElBQUk7Z0JBQ0osZ0JBQWdCO2dCQUNoQixHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFDM0MsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsTUFBTSxPQUFPLEdBQVc7Z0JBQ3ZCLEdBQUc7Z0JBQ0gsaUJBQWlCO2dCQUNqQixHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLFFBQVEsR0FBVztnQkFDeEIsR0FBRztnQkFDSCxpQkFBaUI7Z0JBQ2pCLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLE9BQU8sR0FBVztnQkFDdkIsR0FBRztnQkFDSCxlQUFlO2dCQUNmLEdBQUc7YUFDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sUUFBUSxHQUFXO2dCQUN4QixHQUFHO2dCQUNILGVBQWU7Z0JBQ2YsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sT0FBTyxHQUFXO2dCQUN2QixHQUFHO2dCQUNILFlBQVk7Z0JBQ1osR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2IsTUFBTSxRQUFRLEdBQVc7Z0JBQ3hCLEdBQUc7Z0JBQ0gsV0FBVztnQkFDWCxHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsTUFBTSxPQUFPLEdBQVc7Z0JBQ3ZCLG9CQUFvQjthQUNwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNiLE1BQU0sUUFBUSxHQUFXO2dCQUN4QixtQkFBbUI7YUFDbkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=