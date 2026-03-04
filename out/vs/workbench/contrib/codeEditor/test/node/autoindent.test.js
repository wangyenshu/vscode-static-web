/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "path", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/indentation/common/indentation", "vs/editor/test/common/testTextModel", "vs/workbench/contrib/codeEditor/common/languageConfigurationExtensionPoint", "vs/base/common/json", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "child_process"], function (require, exports, fs, path, assert, lifecycle_1, utils_1, languageConfigurationRegistry_1, indentation_1, testTextModel_1, languageConfigurationExtensionPoint_1, json_1, trimTrailingWhitespaceCommand_1, child_process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getIRange(range) {
        return {
            startLineNumber: range.startLineNumber,
            startColumn: range.startColumn,
            endLineNumber: range.endLineNumber,
            endColumn: range.endColumn
        };
    }
    var LanguageId;
    (function (LanguageId) {
        LanguageId["TypeScript"] = "ts-test";
    })(LanguageId || (LanguageId = {}));
    function registerLanguage(languageConfigurationService, languageId) {
        let configPath;
        switch (languageId) {
            case "ts-test" /* LanguageId.TypeScript */:
                configPath = path.join('extensions', 'typescript-basics', 'language-configuration.json');
                break;
            default:
                throw new Error('Unknown languageId');
        }
        const configContent = fs.readFileSync(configPath, { encoding: 'utf-8' });
        const parsedConfig = (0, json_1.parse)(configContent, []);
        const languageConfig = languageConfigurationExtensionPoint_1.LanguageConfigurationFileHandler.extractValidConfig(languageId, parsedConfig);
        return languageConfigurationService.register(languageId, languageConfig);
    }
    suite('Auto-Reindentation - TypeScript/JavaScript', () => {
        const languageId = "ts-test" /* LanguageId.TypeScript */;
        const options = {};
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            disposables.add(registerLanguage(languageConfigurationService, languageId));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // Test which can be ran to find cases of incorrect indentation...
        test.skip('Find Cases of Incorrect Indentation with the Reindent Lines Command', () => {
            // ./scripts/test.sh --inspect --grep='Find Cases of Incorrect Indentation with the Reindent Lines Command' --timeout=15000
            function walkDirectoryAndReindent(directory, languageId) {
                const files = fs.readdirSync(directory, { withFileTypes: true });
                const directoriesToRecurseOn = [];
                for (const file of files) {
                    if (file.isDirectory()) {
                        directoriesToRecurseOn.push(path.join(directory, file.name));
                    }
                    else {
                        const filePathName = path.join(directory, file.name);
                        const fileExtension = path.extname(filePathName);
                        if (fileExtension !== '.ts') {
                            continue;
                        }
                        const fileContents = fs.readFileSync(filePathName, { encoding: 'utf-8' });
                        const modelOptions = {
                            tabSize: 4,
                            insertSpaces: false
                        };
                        const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, modelOptions));
                        const lineCount = model.getLineCount();
                        const editOperations = [];
                        for (let line = 1; line <= lineCount - 1; line++) {
                            /*
                            NOTE: Uncomment in order to ignore incorrect JS DOC indentation
                            const lineContent = model.getLineContent(line);
                            const trimmedLineContent = lineContent.trim();
                            if (trimmedLineContent.length === 0 || trimmedLineContent.startsWith('*') || trimmedLineContent.startsWith('/*')) {
                                continue;
                            }
                            */
                            const lineContent = model.getLineContent(line);
                            const trimmedLineContent = lineContent.trim();
                            if (trimmedLineContent.length === 0) {
                                continue;
                            }
                            const editOperation = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, line, line + 1);
                            /*
                            NOTE: Uncomment in order to see actual incorrect indentation diff
                            model.applyEdits(editOperation);
                            */
                            editOperations.push(...editOperation);
                        }
                        model.applyEdits(editOperations);
                        model.applyEdits((0, trimTrailingWhitespaceCommand_1.trimTrailingWhitespace)(model, [], true));
                        fs.writeFileSync(filePathName, model.getValue());
                    }
                }
                for (const directory of directoriesToRecurseOn) {
                    walkDirectoryAndReindent(directory, languageId);
                }
            }
            walkDirectoryAndReindent('/Users/aiday/Desktop/Test/vscode-test', 'ts-test');
            const output = (0, child_process_1.execSync)('cd /Users/aiday/Desktop/Test/vscode-test && git diff --shortstat', { encoding: 'utf-8' });
            console.log('\ngit diff --shortstat:\n', output);
        });
        // Unit tests for increase and decrease indent patterns...
        /**
         * First increase indent and decrease indent patterns:
         *
         * - decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/
         *  - In (https://macromates.com/manual/en/appendix)
         * 	  Either we have white space before the closing bracket, or we have a multi line comment ending on that line followed by whitespaces
         *    This is followed by any character.
         *    Textmate decrease indent pattern is as follows: /^(.*\*\/)?\s*\}[;\s]*$/
         *    Presumably allowing multi line comments ending on that line implies that } is itself not part of a multi line comment
         *
         * - increaseIndentPattern: /^.*\{[^}"']*$/
         *  - In (https://macromates.com/manual/en/appendix)
         *    This regex means that we increase the indent when we have any characters followed by the opening brace, followed by characters
         *    except for closing brace }, double quotes " or single quote '.
         *    The } is checked in order to avoid the indentation in the following case `int arr[] = { 1, 2, 3 };`
         *    The double quote and single quote are checked in order to avoid the indentation in the following case: str = "foo {";
         */
        test('Issue #25437', () => {
            // issue: https://github.com/microsoft/vscode/issues/25437
            // fix: https://github.com/microsoft/vscode/commit/8c82a6c6158574e098561c28d470711f1b484fc8
            // explanation: var foo = `{`; should not increase indentation
            // increaseIndentPattern: /^.*\{[^}"']*$/ -> /^.*\{[^}"'`]*$/
            const fileContents = [
                'const foo = `{`;',
                '    ',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 5,
            });
            assert.deepStrictEqual(operation.text, '');
        });
        test('Enriching the hover', () => {
            // issue: -
            // fix: https://github.com/microsoft/vscode/commit/19ae0932c45b1096443a8c1335cf1e02eb99e16d
            // explanation:
            //  - decrease indent on ) and ] also
            //  - increase indent on ( and [ also
            // decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/ -> /^(.*\*\/)?\s*[\}\]\)].*$/
            // increaseIndentPattern: /^.*\{[^}"'`]*$/ -> /^.*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
            let fileContents = [
                'function foo(',
                '    bar: string',
                '    ){}',
            ].join('\n');
            let model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            let editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            let operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 3,
                "startColumn": 1,
                "endLineNumber": 3,
                "endColumn": 5,
            });
            assert.deepStrictEqual(operation.text, '');
            fileContents = [
                'function foo(',
                'bar: string',
                '){}',
            ].join('\n');
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 1,
            });
            assert.deepStrictEqual(operation.text, '    ');
        });
        test('Issue #86176', () => {
            // issue: https://github.com/microsoft/vscode/issues/86176
            // fix: https://github.com/microsoft/vscode/commit/d89e2e17a5d1ba37c99b1d3929eb6180a5bfc7a8
            // explanation: When quotation marks are present on the first line of an if statement or for loop, following line should not be indented
            // increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/ -> /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/
            // explanation: after open brace, do not decrease indent if it is followed on the same line by "<whitespace characters> // <any characters>"
            // todo@aiday-mar: should also apply for when it follows ( and [
            const fileContents = [
                `if () { // '`,
                `x = 4`,
                `}`
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 1,
            });
            assert.deepStrictEqual(operation.text, '    ');
        });
        test('Issue #141816', () => {
            // issue: https://github.com/microsoft/vscode/issues/141816
            // fix: https://github.com/microsoft/vscode/pull/141997/files
            // explanation: if (, [, {, is followed by a forward slash then assume we are in a regex pattern, and do not indent
            // increaseIndentPattern: /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/ -> /^((?!\/\/).)*(\{([^}"'`/]*|(\t|[ ])*\/\/.*)|\([^)"'`/]*|\[[^\]"'`/]*)$/
            // -> Final current increase indent pattern at of writing
            const fileContents = [
                'const r = /{/;',
                '   ',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 4,
            });
            assert.deepStrictEqual(operation.text, '');
        });
        test('Issue #29886', () => {
            // issue: https://github.com/microsoft/vscode/issues/29886
            // fix: https://github.com/microsoft/vscode/commit/7910b3d7bab8a721aae98dc05af0b5e1ea9d9782
            // decreaseIndentPattern: /^(.*\*\/)?\s*[\}\]\)].*$/ -> /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/
            // -> Final current decrease indent pattern at the time of writing
            // explanation: Positive lookahead: (?= «pattern») matches if pattern matches what comes after the current location in the input string.
            // Negative lookahead: (?! «pattern») matches if pattern does not match what comes after the current location in the input string
            // The change proposed is to not decrease the indent if there is a multi-line comment ending on the same line before the closing parentheses
            const fileContents = [
                'function foo() {',
                '    bar(/*  */)',
                '};',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        // Failing tests inferred from the current regexes...
        test.skip('Incorrect deindentation after `*/}` string', () => {
            // explanation: If */ was not before the }, the regex does not allow characters before the }, so there would not be an indent
            // Here since there is */ before the }, the regex allows all the characters before, hence there is a deindent
            const fileContents = [
                `const obj = {`,
                `    obj1: {`,
                `        brace : '*/}'`,
                `    }`,
                `}`,
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        // Failing tests from issues...
        test.skip('Issue #56275', () => {
            // issue: https://github.com/microsoft/vscode/issues/56275
            // explanation: If */ was not before the }, the regex does not allow characters before the }, so there would not be an indent
            // Here since there is */ before the }, the regex allows all the characters before, hence there is a deindent
            let fileContents = [
                'function foo() {',
                '    var bar = (/b*/);',
                '}',
            ].join('\n');
            let model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            let editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
            fileContents = [
                'function foo() {',
                '    var bar = "/b*/)";',
                '}',
            ].join('\n');
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue #116843', () => {
            // issue: https://github.com/microsoft/vscode/issues/116843
            // related: https://github.com/microsoft/vscode/issues/43244
            // explanation: When you have an arrow function, you don't have { or }, but you would expect indentation to still be done in that way
            // TODO: requires exploring indent/outdent pairs instead
            const fileContents = [
                'const add1 = (n) =>',
                '	n + 1;',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue #185252', () => {
            // issue: https://github.com/microsoft/vscode/issues/185252
            // explanation: Reindenting the comment correctly
            const fileContents = [
                '/*',
                ' * This is a comment.',
                ' */',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue 43244: incorrect indentation when signature of function call spans several lines', () => {
            // issue: https://github.com/microsoft/vscode/issues/43244
            const fileContents = [
                'function callSomeOtherFunction(one: number, two: number) { }',
                'function someFunction() {',
                '    callSomeOtherFunction(4,',
                '        5)',
                '}',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2luZGVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci90ZXN0L25vZGUvYXV0b2luZGVudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxTQUFTLFNBQVMsQ0FBQyxLQUFhO1FBQy9CLE9BQU87WUFDTixlQUFlLEVBQUUsS0FBSyxDQUFDLGVBQWU7WUFDdEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO1lBQzlCLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtZQUNsQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7U0FDMUIsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFXLFVBRVY7SUFGRCxXQUFXLFVBQVU7UUFDcEIsb0NBQXNCLENBQUE7SUFDdkIsQ0FBQyxFQUZVLFVBQVUsS0FBVixVQUFVLFFBRXBCO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyw0QkFBMkQsRUFBRSxVQUFzQjtRQUM1RyxJQUFJLFVBQWtCLENBQUM7UUFDdkIsUUFBUSxVQUFVLEVBQUUsQ0FBQztZQUNwQjtnQkFDQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztnQkFDekYsTUFBTTtZQUNQO2dCQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN6RSxNQUFNLFlBQVksR0FBMkIsSUFBQSxZQUFLLEVBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sY0FB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