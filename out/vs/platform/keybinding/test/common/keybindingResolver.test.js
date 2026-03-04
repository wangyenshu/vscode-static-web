/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keybindings", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/test/common/keybindingsTestUtils"], function (require, exports, assert, keybindings_1, keyCodes_1, platform_1, utils_1, contextkey_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, keybindingsTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('KeybindingResolver', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function kbItem(keybinding, command, commandArgs, when, isDefault) {
            const resolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS);
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, command, commandArgs, when, isDefault, null, false);
        }
        function getDispatchStr(chord) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.getDispatchStr(chord);
        }
        test('resolve key', () => {
            const keybinding = 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */;
            const runtimeKeybinding = (0, keybindings_1.createSimpleKeybinding)(keybinding, platform_1.OS);
            const contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            const keybindingItem = kbItem(keybinding, 'yes', null, contextRules, true);
            assert.strictEqual(contextRules.evaluate(createContext({ bar: 'baz' })), true);
            assert.strictEqual(contextRules.evaluate(createContext({ bar: 'bz' })), false);
            const resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], [], () => { });
            const r1 = resolver.resolve(createContext({ bar: 'baz' }), [], getDispatchStr(runtimeKeybinding));
            assert.ok(r1.kind === 2 /* ResultKind.KbFound */);
            assert.strictEqual(r1.commandId, 'yes');
            const r2 = resolver.resolve(createContext({ bar: 'bz' }), [], getDispatchStr(runtimeKeybinding));
            assert.strictEqual(r2.kind, 0 /* ResultKind.NoMatchingKb */);
        });
        test('resolve key with arguments', () => {
            const commandArgs = { text: 'no' };
            const keybinding = 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */;
            const runtimeKeybinding = (0, keybindings_1.createSimpleKeybinding)(keybinding, platform_1.OS);
            const contextRules = contextkey_1.ContextKeyExpr.equals('bar', 'baz');
            const keybindingItem = kbItem(keybinding, 'yes', commandArgs, contextRules, true);
            const resolver = new keybindingResolver_1.KeybindingResolver([keybindingItem], [], () => { });
            const r = resolver.resolve(createContext({ bar: 'baz' }), [], getDispatchStr(runtimeKeybinding));
            assert.ok(r.kind === 2 /* ResultKind.KbFound */);
            assert.strictEqual(r.commandArgs, commandArgs);
        });
        suite('handle keybinding removals', () => {
            test('simple 1', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true)
                ];
                const overrides = [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), false),
                ]);
            });
            test('simple 2', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(33 /* KeyCode.KeyC */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true),
                    kbItem(33 /* KeyCode.KeyC */, 'yes3', null, contextkey_1.ContextKeyExpr.equals('3', 'c'), false),
                ]);
            });
            test('removal with not matching when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'b'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with not matching keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(32 /* KeyCode.KeyB */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with matching keybinding and when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(0, '-yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified when', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('removal with unspecified when and unspecified keybinding', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(0, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('issue #138997 - removal in default list', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'yes1', null, undefined, true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, undefined, true),
                    kbItem(0, '-yes1', null, undefined, false)
                ];
                const overrides = [];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, undefined, true)
                ]);
            });
            test('issue #612#issuecomment-222109084 cannot remove keybindings for commands with ^', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, '^yes1', null, contextkey_1.ContextKeyExpr.equals('1', 'a'), true),
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-yes1', null, undefined, false)
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(32 /* KeyCode.KeyB */, 'yes2', null, contextkey_1.ContextKeyExpr.equals('2', 'b'), true)
                ]);
            });
            test('issue #140884 Unable to reassign F1 as keybinding for Show All Commands', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, undefined, false),
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, false)
                ]);
            });
            test('issue #141638: Keyboard Shortcuts: Change When Expression might actually remove keybinding in Insiders', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.equals('a', '1'), false),
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, undefined, false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.equals('a', '1'), false)
                ]);
            });
            test('issue #157751: Auto-quoting of context keys prevents removal of keybindings via UI', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, contextkey_1.ContextKeyExpr.deserialize(`editorTextFocus && activeEditor != workbench.editor.notebook && editorLangId in julia.supportedLanguageIds`), true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, contextkey_1.ContextKeyExpr.deserialize(`editorTextFocus && activeEditor != 'workbench.editor.notebook' && editorLangId in 'julia.supportedLanguageIds'`), false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, []);
            });
            test('issue #160604: Remove keybindings with when clause does not work', () => {
                const defaults = [
                    kbItem(31 /* KeyCode.KeyA */, 'command1', null, undefined, true),
                ];
                const overrides = [
                    kbItem(31 /* KeyCode.KeyA */, '-command1', null, contextkey_1.ContextKeyExpr.true(), false),
                ];
                const actual = keybindingResolver_1.KeybindingResolver.handleRemovals([...defaults, ...overrides]);
                assert.deepStrictEqual(actual, []);
            });
            test('contextIsEntirelyIncluded', () => {
                const toContextKeyExpression = (expr) => {
                    if (typeof expr === 'string' || !expr) {
                        return contextkey_1.ContextKeyExpr.deserialize(expr);
                    }
                    return expr;
                };
                const assertIsIncluded = (a, b) => {
                    assert.strictEqual(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(toContextKeyExpression(a), toContextKeyExpression(b)), true);
                };
                const assertIsNotIncluded = (a, b) => {
                    assert.strictEqual(keybindingResolver_1.KeybindingResolver.whenIsEntirelyIncluded(toContextKeyExpression(a), toContextKeyExpression(b)), false);
                };
                assertIsIncluded(null, null);
                assertIsIncluded(null, contextkey_1.ContextKeyExpr.true());
                assertIsIncluded(contextkey_1.ContextKeyExpr.true(), null);
                assertIsIncluded(contextkey_1.ContextKeyExpr.true(), contextkey_1.ContextKeyExpr.true());
                assertIsIncluded('key1', null);
                assertIsIncluded('key1', '');
                assertIsIncluded('key1', 'key1');
                assertIsIncluded('key1', contextkey_1.ContextKeyExpr.true());
                assertIsIncluded('!key1', '');
                assertIsIncluded('!key1', '!key1');
                assertIsIncluded('key2', '');
                assertIsIncluded('key2', 'key2');
                assertIsIncluded('key1 && key1 && key2 && key2', 'key2');
                assertIsIncluded('key1 && key2', 'key2');
                assertIsIncluded('key1 && key2', 'key1');
                assertIsIncluded('key1 && key2', '');
                assertIsIncluded('key1', 'key1 || key2');
                assertIsIncluded('key1 || !key1', 'key2 || !key2');
                assertIsIncluded('key1', 'key1 || key2 && key3');
                assertIsNotIncluded('key1', '!key1');
                assertIsNotIncluded('!key1', 'key1');
                assertIsNotIncluded('key1 && key2', 'key3');
                assertIsNotIncluded('key1 && key2', 'key4');
                assertIsNotIncluded('key1', 'key2');
                assertIsNotIncluded('key1 || key2', 'key2');
                assertIsNotIncluded('', 'key2');
                assertIsNotIncluded(null, 'key2');
            });
        });
        suite('resolve command', () => {
            function _kbItem(keybinding, command, when) {
                return kbItem(keybinding, command, null, when, true);
            }
            const items = [
                // This one will never match because its "when" is always overwritten by another one
                _kbItem(54 /* KeyCode.KeyX */, 'first', contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('key1', true), contextkey_1.ContextKeyExpr.notEquals('key2', false))),
                // This one always overwrites first
                _kbItem(54 /* KeyCode.KeyX */, 'second', contextkey_1.ContextKeyExpr.equals('key2', true)),
                // This one is a secondary mapping for `second`
                _kbItem(56 /* KeyCode.KeyZ */, 'second', undefined),
                // This one sometimes overwrites first
                _kbItem(54 /* KeyCode.KeyX */, 'third', contextkey_1.ContextKeyExpr.equals('key3', true)),
                // This one is always overwritten by another one
                _kbItem(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 'fourth', contextkey_1.ContextKeyExpr.equals('key4', true)),
                // This one overwrites with a chord the previous one
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */), 'fifth', undefined),
                // This one has no keybinding
                _kbItem(0, 'sixth', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'seventh', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */), 'seventh', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'uncomment lines', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), // cmd+k cmd+c
                'comment lines', undefined),
                _kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), // cmd+g cmd+c
                'unreachablechord', undefined),
                _kbItem(2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, // cmd+g
                'eleven', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */], // cmd+k a b
                'long multi chord', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */], // cmd+b cmd+c
                'shadowed by long-multi-chord-2', undefined),
                _kbItem([2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, 39 /* KeyCode.KeyI */], // cmd+b cmd+c i
                'long-multi-chord-2', undefined)
            ];
            const resolver = new keybindingResolver_1.KeybindingResolver(items, [], () => { });
            const testKbLookupByCommand = (commandId, expectedKeys) => {
                // Test lookup
                const lookupResult = resolver.lookupKeybindings(commandId);
                assert.strictEqual(lookupResult.length, expectedKeys.length, 'Length mismatch @ commandId ' + commandId);
                for (let i = 0, len = lookupResult.length; i < len; i++) {
                    const expected = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(expectedKeys[i], platform_1.OS);
                    assert.strictEqual(lookupResult[i].resolvedKeybinding.getUserSettingsLabel(), expected.getUserSettingsLabel(), 'value mismatch @ commandId ' + commandId);
                }
            };
            const testResolve = (ctx, _expectedKey, commandId) => {
                const expectedKeybinding = (0, keybindings_1.decodeKeybinding)(_expectedKey, platform_1.OS);
                const previousChord = [];
                for (let i = 0, len = expectedKeybinding.chords.length; i < len; i++) {
                    const chord = getDispatchStr(expectedKeybinding.chords[i]);
                    const result = resolver.resolve(ctx, previousChord, chord);
                    if (i === len - 1) {
                        // if it's the final chord, then we should find a valid command,
                        // and there should not be a chord.
                        assert.ok(result.kind === 2 /* ResultKind.KbFound */, `Enters multi chord for ${commandId} at chord ${i}`);
                        assert.strictEqual(result.commandId, commandId, `Enters multi chord for ${commandId} at chord ${i}`);
                    }
                    else if (i > 0) {
                        // if this is an intermediate chord, we should not find a valid command,
                        // and there should be an open chord we continue.
                        assert.ok(result.kind === 1 /* ResultKind.MoreChordsNeeded */, `Continues multi chord for ${commandId} at chord ${i}`);
                    }
                    else {
                        // if it's not the final chord and not an intermediate, then we should not
                        // find a valid command, and we should enter a chord.
                        assert.ok(result.kind === 1 /* ResultKind.MoreChordsNeeded */, `Enters multi chord for ${commandId} at chord ${i}`);
                    }
                    previousChord.push(chord);
                }
            };
            test('resolve command - 1', () => {
                testKbLookupByCommand('first', []);
            });
            test('resolve command - 2', () => {
                testKbLookupByCommand('second', [56 /* KeyCode.KeyZ */, 54 /* KeyCode.KeyX */]);
                testResolve(createContext({ key2: true }), 54 /* KeyCode.KeyX */, 'second');
                testResolve(createContext({}), 56 /* KeyCode.KeyZ */, 'second');
            });
            test('resolve command - 3', () => {
                testKbLookupByCommand('third', [54 /* KeyCode.KeyX */]);
                testResolve(createContext({ key3: true }), 54 /* KeyCode.KeyX */, 'third');
            });
            test('resolve command - 4', () => {
                testKbLookupByCommand('fourth', []);
            });
            test('resolve command - 5', () => {
                testKbLookupByCommand('fifth', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */), 'fifth');
            });
            test('resolve command - 6', () => {
                testKbLookupByCommand('seventh', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */), 'seventh');
            });
            test('resolve command - 7', () => {
                testKbLookupByCommand('uncomment lines', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */), 'uncomment lines');
            });
            test('resolve command - 8', () => {
                testKbLookupByCommand('comment lines', [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */)]);
                testResolve(createContext({}), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */), 'comment lines');
            });
            test('resolve command - 9', () => {
                testKbLookupByCommand('unreachablechord', []);
            });
            test('resolve command - 10', () => {
                testKbLookupByCommand('eleven', [2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */]);
                testResolve(createContext({}), 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, 'eleven');
            });
            test('resolve command - 11', () => {
                testKbLookupByCommand('sixth', []);
            });
            test('resolve command - 12', () => {
                testKbLookupByCommand('long multi chord', [[2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */]]);
                testResolve(createContext({}), [2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 31 /* KeyCode.KeyA */, 32 /* KeyCode.KeyB */], 'long multi chord');
            });
            const emptyContext = createContext({});
            test('KBs having common prefix - the one defined later is returned', () => {
                testResolve(emptyContext, [2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, 39 /* KeyCode.KeyI */], 'long-multi-chord-2');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1Jlc29sdmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXliaW5kaW5nL3Rlc3QvY29tbW9uL2tleWJpbmRpbmdSZXNvbHZlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLFNBQVMsYUFBYSxDQUFDLEdBQVE7UUFDOUIsT0FBTztZQUNOLFFBQVEsRUFBRSxDQUFDLEdBQVcsRUFBRSxFQUFFO2dCQUN6QixPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBRWhDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLE1BQU0sQ0FBQyxVQUE2QixFQUFFLE9BQWUsRUFBRSxXQUFnQixFQUFFLElBQXNDLEVBQUUsU0FBa0I7WUFDM0ksTUFBTSxrQkFBa0IsR0FBRyxJQUFBLHVEQUFnQyxFQUFDLFVBQVUsRUFBRSxhQUFFLENBQUMsQ0FBQztZQUM1RSxPQUFPLElBQUksK0NBQXNCLENBQ2hDLGtCQUFrQixFQUNsQixPQUFPLEVBQ1AsV0FBVyxFQUNYLElBQUksRUFDSixTQUFTLEVBQ1QsSUFBSSxFQUNKLEtBQUssQ0FDTCxDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMsY0FBYyxDQUFDLEtBQW1CO1lBQzFDLE9BQU8sdURBQTBCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBRSxDQUFDO1FBQzFELENBQUM7UUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUN4QixNQUFNLFVBQVUsR0FBRyxtREFBNkIsd0JBQWUsQ0FBQztZQUNoRSxNQUFNLGlCQUFpQixHQUFHLElBQUEsb0NBQXNCLEVBQUMsVUFB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