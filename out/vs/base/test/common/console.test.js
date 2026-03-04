/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/console", "vs/base/common/path", "vs/base/test/common/utils"], function (require, exports, assert, console_1, path_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Console', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getFirstFrame', () => {
            let stack = 'at vscode.commands.registerCommand (/Users/someone/Desktop/test-ts/out/src/extension.js:18:17)';
            let frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at e.$executeContributedCommand(c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17)';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17\nat /Users/someone/Desktop/test-ts/out/src/other.js:28:27\nat /Users/someone/Desktop/test-ts/out/src/more.js:38:37';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9jb25zb2xlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDckIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzFCLElBQUksS0FBSyxHQUFHLGdHQUFnRyxDQUFDO1lBQzdHLElBQUksS0FBSyxHQUFHLElBQUEsdUJBQWEsRUFBQyxLQUFLLENBQUUsQ0FBQztZQUVsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUEsZ0JBQVMsRUFBQyxxREFBcUQsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsOERBQThELENBQUM7WUFDdkUsS0FBSyxHQUFHLElBQUEsdUJBQWEsRUFBQyxLQUFLLENBQUUsQ0FBQztZQUU5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUEsZ0JBQVMsRUFBQyxxREFBcUQsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsNERBQTRELENBQUM7WUFDckUsS0FBSyxHQUFHLElBQUEsdUJBQWEsRUFBQyxLQUFLLENBQUUsQ0FBQztZQUU5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLG1EQUFtRCxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsMEZBQTBGLENBQUM7WUFDbkcsS0FBSyxHQUFHLElBQUEsdUJBQWEsRUFBQyxLQUFLLENBQUUsQ0FBQztZQUU5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLG1EQUFtRCxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsaUxBQWlMLENBQUM7WUFDMUwsS0FBSyxHQUFHLElBQUEsdUJBQWEsRUFBQyxLQUFLLENBQUUsQ0FBQztZQUU5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUEsZ0JBQVMsRUFBQyxxREFBcUQsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=