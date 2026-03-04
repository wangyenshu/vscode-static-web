/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/editor/common/languages/supports/tokenization"], function (require, exports, assert, fs, tokenization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseTest(fileName) {
        const testContents = fs.readFileSync(fileName).toString();
        const lines = testContents.split(/\r\n|\n/);
        const magicToken = lines[0];
        let currentElement = {
            line: lines[1],
            assertions: []
        };
        const parsedTest = [];
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line.substr(0, magicToken.length) === magicToken) {
                // this is an assertion line
                const m1 = line.substr(magicToken.length).match(/^( +)([\^]+) (\w+)\\?$/);
                if (m1) {
                    currentElement.assertions.push({
                        testLineNumber: i + 1,
                        startOffset: magicToken.length + m1[1].length,
                        length: m1[2].length,
                        expectedTokenType: (0, tokenization_1.toStandardTokenType)(m1[3])
                    });
                }
                else {
                    const m2 = line.substr(magicToken.length).match(/^( +)<(-+) (\w+)\\?$/);
                    if (m2) {
                        currentElement.assertions.push({
                            testLineNumber: i + 1,
                            startOffset: 0,
                            length: m2[2].length,
                            expectedTokenType: (0, tokenization_1.toStandardTokenType)(m2[3])
                        });
                    }
                    else {
                        throw new Error(`Invalid test line at line number ${i + 1}.`);
                    }
                }
            }
            else {
                // this is a line to be parsed
                parsedTest.push(currentElement);
                currentElement = {
                    line: line,
                    assertions: []
                };
            }
        }
        parsedTest.push(currentElement);
        const assertions = [];
        let offset = 0;
        for (let i = 0; i < parsedTest.length; i++) {
            const parsedTestLine = parsedTest[i];
            for (let j = 0; j < parsedTestLine.assertions.length; j++) {
                const assertion = parsedTestLine.assertions[j];
                assertions.push({
                    testLineNumber: assertion.testLineNumber,
                    startOffset: offset + assertion.startOffset,
                    length: assertion.length,
                    tokenType: assertion.expectedTokenType
                });
            }
            offset += parsedTestLine.line.length + 1;
        }
        const content = parsedTest.map(parsedTestLine => parsedTestLine.line).join('\n');
        return { content, assertions };
    }
    // @ts-expect-error
    function executeTest(fileName, parseFunc) {
        const { content, assertions } = parseTest(fileName);
        const actual = parseFunc(content);
        let actualIndex = 0;
        const actualCount = actual.length / 3;
        for (let i = 0; i < assertions.length; i++) {
            const assertion = assertions[i];
            while (actualIndex < actualCount && actual[3 * actualIndex] + actual[3 * actualIndex + 1] <= assertion.startOffset) {
                actualIndex++;
            }
            assert.ok(actual[3 * actualIndex] <= assertion.startOffset, `Line ${assertion.testLineNumber} : startOffset : ${actual[3 * actualIndex]} <= ${assertion.startOffset}`);
            assert.ok(actual[3 * actualIndex] + actual[3 * actualIndex + 1] >= assertion.startOffset + assertion.length, `Line ${assertion.testLineNumber} : length : ${actual[3 * actualIndex]} + ${actual[3 * actualIndex + 1]} >= ${assertion.startOffset} + ${assertion.length}.`);
            assert.strictEqual(actual[3 * actualIndex + 2], assertion.tokenType, `Line ${assertion.testLineNumber} : tokenType`);
        }
    }
    suite('Classification', () => {
        test('TypeScript', () => {
            // executeTest(getPathFromAmdModule(require, 'vs/editor/test/node/classification/typescript-test.ts').replace(/\bout\b/, 'src'), parse);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3Qvbm9kZS9jbGFzc2lmaWNhdGlvbi90eXBlc2NyaXB0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5QmhHLFNBQVMsU0FBUyxDQUFDLFFBQWdCO1FBYWxDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDMUQsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUIsSUFBSSxjQUFjLEdBQXdCO1lBQ3pDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2QsVUFBVSxFQUFFLEVBQUU7U0FDZCxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQTBCLEVBQUUsQ0FBQztRQUM3QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDdEQsNEJBQTRCO2dCQUM1QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDUixj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