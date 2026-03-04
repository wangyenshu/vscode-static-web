/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/snippets/browser/snippetCompletionProvider", "vs/editor/common/core/position", "vs/editor/test/common/testTextModel", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/base/common/lifecycle", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/core/editOperation", "vs/editor/common/languages/language", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/editor/contrib/suggest/browser/completionModel", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/wordDistance", "vs/editor/common/config/editorOptions"], function (require, exports, assert, snippetCompletionProvider_1, position_1, testTextModel_1, snippetsFile_1, lifecycle_1, testLanguageConfigurationService_1, editOperation_1, language_1, uuid_1, utils_1, completionModel_1, suggest_1, wordDistance_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleSnippetService {
        constructor(snippets) {
            this.snippets = snippets;
        }
        getSnippets() {
            return Promise.resolve(this.getSnippetsSync());
        }
        getSnippetsSync() {
            return this.snippets;
        }
        getSnippetFiles() {
            throw new Error();
        }
        isEnabled() {
            throw new Error();
        }
        updateEnablement() {
            throw new Error();
        }
        updateUsageTimestamp(snippet) {
            throw new Error();
        }
    }
    suite('SnippetsService', function () {
        const defaultCompletionContext = { triggerKind: 0 /* CompletionTriggerKind.Invoke */ };
        let disposables;
        let instantiationService;
        let languageService;
        let snippetService;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({
                id: 'fooLang',
                extensions: ['.fooLang',]
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'barTest', 'bar', '', 'barCodeSnippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'bazzTest', 'bazz', '', 'bazzCodeSnippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function asCompletionModel(model, position, provider, context = defaultCompletionContext) {
            const list = await provider.provideCompletionItems(model, position_1.Position.lift(position), context);
            const result = new completionModel_1.CompletionModel(list.suggestions.map(s => {
                return new suggest_1.CompletionItem(position, s, list, provider);
            }), position.column, { characterCountDelta: 0, leadingLineContent: model.getLineContent(position.lineNumber).substring(0, position.column - 1) }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            return result;
        }
        test('snippet completions - simple', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 2);
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 2);
        });
        test('snippet completions - simple 2', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'hello ', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 6) /* hello| */, defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 0);
            });
            await provider.provideCompletionItems(model, new position_1.Position(1, 7) /* hello |*/, defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 2);
            });
            const completions1 = await asCompletionModel(model, new position_1.Position(1, 6) /* hello| */, provider);
            assert.strictEqual(completions1.items.length, 0);
            const completions2 = await asCompletionModel(model, new position_1.Position(1, 7) /* hello |*/, provider);
            assert.strictEqual(completions2.items.length, 2);
        });
        test('snippet completions - with prefix', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'bar', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 1);
                assert.deepStrictEqual(result.suggestions[0].label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 1);
                assert.strictEqual(result.suggestions[0].insertText, 'barCodeSnippet');
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.deepStrictEqual(completions.items[0].completion.label, {
                label: 'bar',
                description: 'barTest'
            });
            assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
            assert.strictEqual(completions.items[0].completion.insertText, 'barCodeSnippet');
        });
        test('snippet completions - with different prefixes', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'barTest', 'bar', '', 's1', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'name', 'bar-bar', '', 's2', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'bar-bar', 'fooLang'));
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    assert.deepStrictEqual(result.suggestions[0].label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(result.suggestions[0].insertText, 's1');
                    assert.strictEqual(result.suggestions[0].range.insert.startColumn, 1);
                    assert.deepStrictEqual(result.suggestions[1].label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(result.suggestions[1].insertText, 's2');
                    assert.strictEqual(result.suggestions[1].range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
                assert.strictEqual(completions.items.length, 2);
                assert.deepStrictEqual(completions.items[0].completion.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(completions.items[0].completion.insertText, 's1');
                assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
                assert.deepStrictEqual(completions.items[1].completion.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(completions.items[1].completion.insertText, 's2');
                assert.strictEqual(completions.items[1].completion.range.insert.startColumn, 1);
            }
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 5), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    const [first, second] = result.suggestions;
                    assert.deepStrictEqual(first.label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(first.insertText, 's1');
                    assert.strictEqual(first.range.insert.startColumn, 5);
                    assert.deepStrictEqual(second.label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(second.insertText, 's2');
                    assert.strictEqual(second.range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider);
                assert.strictEqual(completions.items.length, 2);
                const [first, second] = completions.items.map(i => i.completion);
                assert.deepStrictEqual(first.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(first.insertText, 's2');
                assert.strictEqual(first.range.insert.startColumn, 1);
                assert.deepStrictEqual(second.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(second.insertText, 's1');
                assert.strictEqual(second.range.insert.startColumn, 5);
            }
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 6), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    assert.deepStrictEqual(result.suggestions[0].label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(result.suggestions[0].insertText, 's1');
                    assert.strictEqual(result.suggestions[0].range.insert.startColumn, 5);
                    assert.deepStrictEqual(result.suggestions[1].label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(result.suggestions[1].insertText, 's2');
                    assert.strictEqual(result.suggestions[1].range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 6), provider);
                assert.strictEqual(completions.items.length, 2);
                assert.deepStrictEqual(completions.items[0].completion.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(completions.items[0].completion.insertText, 's2');
                assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
                assert.deepStrictEqual(completions.items[1].completion.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(completions.items[1].completion.insertText, 's1');
                assert.strictEqual(completions.items[1].completion.range.insert.startColumn, 5);
            }
        });
        test('Cannot use "<?php" as user snippet prefix anymore, #26275', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], '', '<?php', '', 'insert me', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\t<?php', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 7), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions1 = await asCompletionModel(model, new position_1.Position(1, 7), provider);
            assert.strictEqual(completions1.items.length, 1);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\t<?', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 2);
            });
            const completions2 = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions2.items.length, 1);
            assert.strictEqual(completions2.items[0].completion.range.insert.startColumn, 2);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'a<?', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 2);
            });
            const completions3 = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions3.items.length, 1);
            assert.strictEqual(completions3.items[0].completion.range.insert.startColumn, 2);
            model.dispose();
        });
        test('No user snippets in suggestions, when inside the code, #30508', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], '', 'foo', '', '<foo>$0</foo>', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '<head>\n\t\n>/head>', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 1);
            await provider.provideCompletionItems(model, new position_1.Position(2, 2), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions2 = await asCompletionModel(model, new position_1.Position(2, 2), provider);
            assert.strictEqual(completions2.items.length, 1);
        });
        test('SnippetSuggest - ensure extension snippets come last ', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'second', 'second', '', 'second', '', 3 /* SnippetSource.Extension */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'first', 'first', '', 'first', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 2);
                const [first, second] = result.suggestions;
                assert.deepStrictEqual(first.label, {
                    label: 'first',
                    description: 'first'
                });
                assert.deepStrictEqual(second.label, {
                    label: 'second',
                    description: 'second'
                });
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 2);
            const [first, second] = completions.items;
            assert.deepStrictEqual(first.completion.label, {
                label: 'first',
                description: 'first'
            });
            assert.deepStrictEqual(second.completion.label, {
                label: 'second',
                description: 'second'
            });
        });
        test('Dash in snippets prefix broken #53945', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'p-a', 'p-a', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'p-', 'fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            let completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
        });
        test('No snippets suggestion on long lines beyond character 100 #58807', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 158), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
        });
        test('Type colon will trigger snippet #60746', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, ':', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 0);
            const completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(completions.items.length, 0);
        });
        test('substring of prefix can\'t trigger snippet #60737', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'mytemplate', 'mytemplate', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'template', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 9), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            assert.deepStrictEqual(result.suggestions[0].label, {
                label: 'mytemplate',
                description: 'mytemplate'
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 9), provider);
            assert.strictEqual(completions.items.length, 0);
        });
        test('No snippets suggestion beyond character 100 if not at end of line #60247', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b text_after_b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 158), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('issue #61296: VS code freezes when editing CSS file with emoji', async function () {
            const languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            disposables.add(languageConfigurationService.register('fooLang', {
                wordPattern: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', '-a-bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, languageConfigurationService);
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '.🐷-a-b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('No snippets shown when triggering completions at whitespace on line that already has text #62335', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'a ', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('Snippet prefix with special chars and numbers does not work #62906', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'noblockwdelay', '<<', '', '<= #dly"', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'noblockwdelay', '11', '', 'eleven', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ' <', 'fooLang');
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            let [first] = result.suggestions;
            assert.strictEqual(first.range.insert.startColumn, 2);
            let completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 2);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '1', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.startColumn, 1);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 1);
            model.dispose();
        });
        test('Snippet replace range', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'notWordTest', 'not word', '', 'not word snippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not wordFoo bar', 'fooLang');
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            let [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 3);
            assert.strictEqual(first.range.replace.endColumn, 9);
            let completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 3);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not woFoo bar', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 3);
            assert.strictEqual(first.range.replace.endColumn, 3);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 3);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 3);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not word', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 1);
            assert.strictEqual(first.range.replace.endColumn, 9);
            completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 1);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
        });
        test('Snippet replace-range incorrect #108894', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'eng', 'eng', '', '<span></span>', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'filler e KEEP ng filler', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 9), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 9), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 9);
            assert.strictEqual(first.range.replace.endColumn, 9);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 9);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
        });
        test('Snippet will replace auto-closing pair if specified in prefix', async function () {
            const languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            disposables.add(languageConfigurationService.register('fooLang', {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'PSCustomObject', '[PSCustomObject]', '', '[PSCustomObject] @{ Key = Value }', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, languageConfigurationService);
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '[psc]', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 5), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 5);
            // This is 6 because it should eat the `]` at the end of the text even if cursor is before it
            assert.strictEqual(first.range.replace.endColumn, 6);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 5);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 6);
            model.dispose();
        });
        test('Leading whitespace in snippet prefix #123860', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'cite-name', ' cite', '', '~\\cite{$CLIPBOARD}', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ' ci', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.label.label, ' cite');
            assert.strictEqual(first.range.insert.startColumn, 1);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, ' cite');
            assert.strictEqual(completions.items[0].editStart.column, 1);
            model.dispose();
        });
        test('still show suggestions in string when disable string suggestion #136611', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'aaa', 'aaa', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'bbb', 'bbb', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                // new Snippet(['fooLang'], '\'ccc', '\'ccc', '', 'value', '', SnippetSource.User, generateUuid())
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(result.suggestions.length, 0);
            model.dispose();
        });
        test('still show suggestions in string when disable string suggestion #136611 (part 2)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'aaa', 'aaa', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'bbb', 'bbb', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '\'ccc', '\'ccc', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 2), provider, { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(completions.items.length, 1);
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'tys', 'tys', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'hell_or_tell', 'hell_or_tell', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '^y', '^y', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'hellot\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, 'hell_or_tell');
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, 'hell_or_tell');
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (no word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'tys', 'tys', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 't', 't', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '^y', '^y', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ')*&^', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 5), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, '^y');
            const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, '^y');
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (word/word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'async arrow function', 'async arrow function', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'foobarrrrrr', 'foobarrrrrr', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'foobar', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 7), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, 'foobarrrrrr');
            const completions = await asCompletionModel(model, new position_1.Position(1, 7), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, 'foobarrrrrr');
            model.dispose();
        });
        test('Strange and useless autosuggestion #region/#endregion PHP #140039', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'reg', '#region', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'function abc(w)', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 15), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 0);
            model.dispose();
        });
        test.skip('Snippets disappear with . key #145960', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div', 'div', '', 'div', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div.', 'div.', '', 'div.', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div#', 'div#', '', 'div#', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'di', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 3);
            model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), '.')]);
            assert.strictEqual(model.getValue(), 'di.');
            const result2 = await provider.provideCompletionItems(model, new position_1.Position(1, 4), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '.' });
            assert.strictEqual(result2.suggestions.length, 1);
            assert.strictEqual(result2.suggestions[0].insertText, 'div.');
            model.dispose();
        });
        test('Hyphen in snippet prefix de-indents snippet #139016', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'foo', 'Foo- Bar', '', 'Foo', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '    bar', 'fooLang'));
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            const first = result.suggestions[0];
            assert.strictEqual(first.range.insert.startColumn, 5);
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 5);
        });
        test('Autocomplete suggests based on the last letter of a word and it depends on the typing speed #191070', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], '/whiletrue', '/whiletrue', '', 'one', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '/sc not expanding', '/sc not expanding', '', 'two', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            { // PREFIX: w
                model.setValue('w');
                const result1 = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
                assert.strictEqual(result1.suggestions[0].insertText, 'one');
                assert.strictEqual(result1.suggestions.length, 1);
            }
            { // PREFIX: where
                model.setValue('where');
                const result2 = await provider.provideCompletionItems(model, new position_1.Position(1, 6), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
                assert.strictEqual(result2.suggestions[0].insertText, 'one'); // /whiletrue matches where (WHilEtRuE)
                assert.strictEqual(result2.suggestions.length, 1);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy90ZXN0L2Jyb3dzZXIvc25pcHBldHNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLE1BQU0sb0JBQW9CO1FBRXpCLFlBQXFCLFFBQW1CO1lBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFBSSxDQUFDO1FBQzdDLFdBQVc7WUFDVixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELGVBQWU7WUFDZCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUNELGVBQWU7WUFDZCxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUNELFNBQVM7WUFDUixNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUNELGdCQUFnQjtZQUNmLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0Qsb0JBQW9CLENBQUMsT0FBZ0I7WUFDcEMsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ25CLENBQUM7S0FDRDtJQUVELEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUN4QixNQUFNLHdCQUF3QixHQUFzQixFQUFFLFdBQVcsc0NBQThCLEVBQUUsQ0FBQztRQUVsRyxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGVBQWlDLENBQUM7UUFDdEMsSUFBSSxjQUFnQyxDQUFDO1FBRXJDLEtBQUssQ0FBQztZQUNMLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxv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