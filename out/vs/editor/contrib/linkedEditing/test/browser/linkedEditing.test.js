/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/contrib/linkedEditing/browser/linkedEditing", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, uri_1, timeTravelScheduler_1, utils_1, coreCommands_1, position_1, range_1, wordHelper_1, languageConfigurationRegistry_1, languageFeatures_1, linesOperations_1, linkedEditing_1, wordOperations_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockFile = uri_1.URI.parse('test:somefile.ttt');
    const mockFileSelector = { scheme: 'test' };
    const timeout = 30;
    const languageId = 'linkedEditingTestLangage';
    suite('linked editing', () => {
        let disposables;
        let instantiationService;
        let languageFeaturesService;
        let languageConfigurationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageFeaturesService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            disposables.add(languageConfigurationService.register(languageId, {
                wordPattern: /[a-zA-Z]+/
            }));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createMockEditor(text) {
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, typeof text === 'string' ? text : text.join('\n'), languageId, undefined, mockFile));
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model));
            return editor;
        }
        function testCase(name, initialState, operations, expectedEndText) {
            test(name, async () => {
                await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                    disposables.add(languageFeaturesService.linkedEditingRangeProvider.register(mockFileSelector, {
                        provideLinkedEditingRanges(model, pos) {
                            const wordAtPos = model.getWordAtPosition(pos);
                            if (wordAtPos) {
                                const matches = model.findMatches(wordAtPos.word, false, false, true, wordHelper_1.USUAL_WORD_SEPARATORS, false);
                                return { ranges: matches.map(m => m.range), wordPattern: initialState.responseWordPattern };
                            }
                            return { ranges: [], wordPattern: initialState.responseWordPattern };
                        }
                    }));
                    const editor = createMockEditor(initialState.text);
                    editor.updateOptions({ linkedEditing: true });
                    const linkedEditingContribution = disposables.add(editor.registerAndInstantiateContribution(linkedEditing_1.LinkedEditingContribution.ID, linkedEditing_1.LinkedEditingContribution));
                    linkedEditingContribution.setDebounceDuration(0);
                    const testEditor = {
                        setPosition(pos) {
                            editor.setPosition(pos);
                            return linkedEditingContribution.currentUpdateTriggerPromise;
                        },
                        setSelection(sel) {
                            editor.setSelection(sel);
                            return linkedEditingContribution.currentUpdateTriggerPromise;
                        },
                        trigger(source, handlerId, payload) {
                            if (handlerId === "type" /* Handler.Type */ || handlerId === "paste" /* Handler.Paste */) {
                                editor.trigger(source, handlerId, payload);
                            }
                            else if (handlerId === 'deleteLeft') {
                                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, payload);
                            }
                            else if (handlerId === 'deleteWordLeft') {
                                instantiationService.invokeFunction((accessor) => (new wordOperations_1.DeleteWordLeft()).runEditorCommand(accessor, editor, payload));
                            }
                            else if (handlerId === 'deleteAllLeft') {
                                instantiationService.invokeFunction((accessor) => (new linesOperations_1.DeleteAllLeftAction()).runEditorCommand(accessor, editor, payload));
                            }
                            else {
                                throw new Error(`Unknown handler ${handlerId}!`);
                            }
                            return linkedEditingContribution.currentSyncTriggerPromise;
                        },
                        undo() {
                            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                        },
                        redo() {
                            coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                        }
                    };
                    await operations(testEditor);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            if (typeof expectedEndText === 'string') {
                                assert.strictEqual(editor.getModel().getValue(), expectedEndText);
                            }
                            else {
                                assert.strictEqual(editor.getModel().getValue(), expectedEndText.join('\n'));
                            }
                            resolve();
                        }, timeout);
                    });
                });
            });
        }
        const state = {
            text: '<ooo></ooo>'
        };
        /**
         * Simple insertion
         */
        testCase('Simple insert - initial', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert - middle', state, async (editor) => {
            const pos = new position_1.Position(1, 3);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert - end', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Simple insertion - end
         */
        testCase('Simple insert end - initial', state, async (editor) => {
            const pos = new position_1.Position(1, 8);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert end - middle', state, async (editor) => {
            const pos = new position_1.Position(1, 9);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert end - end', state, async (editor) => {
            const pos = new position_1.Position(1, 11);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Boundary insertion
         */
        testCase('Simple insert - out of boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 1);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, 'i<ooo></ooo>');
        testCase('Simple insert - out of boundary 2', state, async (editor) => {
            const pos = new position_1.Position(1, 6);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo>i</ooo>');
        testCase('Simple insert - out of boundary 3', state, async (editor) => {
            const pos = new position_1.Position(1, 7);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo><i/ooo>');
        testCase('Simple insert - out of boundary 4', state, async (editor) => {
            const pos = new position_1.Position(1, 12);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo></ooo>i');
        /**
         * Insert + Move
         */
        testCase('Continuous insert', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iiooo></iiooo>');
        testCase('Insert - move - insert', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.setPosition(new position_1.Position(1, 4));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ioioo></ioioo>');
        testCase('Insert - move - insert outside region', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.setPosition(new position_1.Position(1, 7));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo>i</iooo>');
        /**
         * Selection insert
         */
        testCase('Selection insert - simple', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 3));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ioo></ioo>');
        testCase('Selection insert - whole', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 5));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<i></i>');
        testCase('Selection insert - across boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 1, 1, 3));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, 'ioo></oo>');
        /**
         * @todo
         * Undefined behavior
         */
        // testCase('Selection insert - across two boundary', state, async (editor) => {
        // 	const pos = new Position(1, 2);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.setSelection(new Range(1, 4, 1, 9));
        // 	await editor.trigger('keyboard', Handler.Type, { text: 'i' });
        // }, '<ooioo>');
        /**
         * Break out behavior
         */
        testCase('Breakout - type space', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
        }, '<ooo ></ooo>');
        testCase('Breakout - type space then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Breakout - type space in middle', state, async (editor) => {
            const pos = new position_1.Position(1, 4);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
        }, '<oo o></ooo>');
        testCase('Breakout - paste content starting with space', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i="i"' });
        }, '<ooo i="i"></ooo>');
        testCase('Breakout - paste content starting with space then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i="i"' });
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Breakout - paste content starting with space in middle', state, async (editor) => {
            const pos = new position_1.Position(1, 4);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i' });
        }, '<oo io></ooo>');
        /**
         * Break out with custom provider wordPattern
         */
        const state3 = {
            ...state,
            responseWordPattern: /[a-yA-Y]+/
        };
        testCase('Breakout with stop pattern - insert', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Breakout with stop pattern - insert stop char', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'z' });
        }, '<zooo></ooo>');
        testCase('Breakout with stop pattern - paste char', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: 'z' });
        }, '<zooo></ooo>');
        testCase('Breakout with stop pattern - paste string', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: 'zo' });
        }, '<zoooo></ooo>');
        testCase('Breakout with stop pattern - insert at end', state3, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'z' });
        }, '<oooz></ooo>');
        const state4 = {
            ...state,
            responseWordPattern: /[a-eA-E]+/
        };
        testCase('Breakout with stop pattern - insert stop char, respos', state4, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></ooo>');
        /**
         * Delete
         */
        testCase('Delete - left char', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - left char then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteLeft', {});
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Delete - left word', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteWordLeft', {});
        }, '<></>');
        testCase('Delete - left word then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteWordLeft', {});
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all', state, async (editor) => {
        // 	const pos = new Position(1, 3);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.trigger('keyboard', 'deleteAllLeft', {});
        // }, '></>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all then undo', state, async (editor) => {
        // 	const pos = new Position(1, 5);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.trigger('keyboard', 'deleteAllLeft', {});
        // 	editor.undo();
        // }, '></ooo>');
        testCase('Delete - left all then undo twice', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteAllLeft', {});
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Delete - selection', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 3));
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - selection across boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 3);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 1, 1, 3));
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, 'oo></oo>');
        /**
         * Undo / redo
         */
        testCase('Undo/redo - simple undo', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Undo/redo - simple undo/redo', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            editor.undo();
            editor.redo();
        }, '<iooo></iooo>');
        /**
         * Multi line
         */
        const state2 = {
            text: [
                '<ooo>',
                '</ooo>'
            ]
        };
        testCase('Multiline insert', state2, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, [
            '<iooo>',
            '</iooo>'
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkRWRpdGluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGlua2VkRWRpdGluZy90ZXN0L2Jyb3dzZXIvbGlua2VkRWRpdGluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDaEQsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUM1QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFVbkIsTUFBTSxVQUFVLEdBQUcsMEJBQTBCLENBQUM7SUFFOUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLHVCQUFpRCxDQUFDO1FBQ3RELElBQUksNEJBQTJELENBQUM7UUFFaEUsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLHlDQUF3QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdELHVCQUF1QixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQywyQ0FBd0IsQ0FBQyxDQUFDO1lBQzdFLDRCQUE0QixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyw2REFBNkIsQ0FBQyxDQUFDO1lBRXZGLFdBQVcsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtnQkFDakUsV0FBVyxFQUFFLFdBQVc7YUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILFFB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