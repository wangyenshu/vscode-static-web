/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/event", "vs/workbench/contrib/terminalContrib/typeAhead/browser/terminalTypeAheadAddon", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, sinon_1, event_1, terminalTypeAheadAddon_1, terminal_1, testConfigurationService_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CSI = `\x1b[`;
    var CursorMoveDirection;
    (function (CursorMoveDirection) {
        CursorMoveDirection["Back"] = "D";
        CursorMoveDirection["Forwards"] = "C";
    })(CursorMoveDirection || (CursorMoveDirection = {}));
    suite('Workbench - Terminal Typeahead', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('PredictionStats', () => {
            let stats;
            let add;
            let succeed;
            let fail;
            setup(() => {
                add = ds.add(new event_1.Emitter());
                succeed = ds.add(new event_1.Emitter());
                fail = ds.add(new event_1.Emitter());
                stats = ds.add(new terminalTypeAheadAddon_1.PredictionStats({
                    onPredictionAdded: add.event,
                    onPredictionSucceeded: succeed.event,
                    onPredictionFailed: fail.event,
                }));
            });
            test('creates sane data', () => {
                const stubs = createPredictionStubs(5);
                const clock = (0, sinon_1.useFakeTimers)();
                try {
                    for (const s of stubs) {
                        add.fire(s);
                    }
                    for (let i = 0; i < stubs.length; i++) {
                        clock.tick(100);
                        (i % 2 ? fail : succeed).fire(stubs[i]);
                    }
                    assert.strictEqual(stats.accuracy, 3 / 5);
                    assert.strictEqual(stats.sampleSize, 5);
                    assert.deepStrictEqual(stats.latency, {
                        count: 3,
                        min: 100,
                        max: 500,
                        median: 300
                    });
                }
                finally {
                    clock.restore();
                }
            });
            test('circular buffer', () => {
                const bufferSize = 24;
                const stubs = createPredictionStubs(bufferSize * 2);
                for (const s of stubs.slice(0, bufferSize)) {
                    add.fire(s);
                    succeed.fire(s);
                }
                assert.strictEqual(stats.accuracy, 1);
                for (const s of stubs.slice(bufferSize, bufferSize * 3 / 2)) {
                    add.fire(s);
                    fail.fire(s);
                }
                assert.strictEqual(stats.accuracy, 0.5);
                for (const s of stubs.slice(bufferSize * 3 / 2)) {
                    add.fire(s);
                    fail.fire(s);
                }
                assert.strictEqual(stats.accuracy, 0);
            });
        });
        suite('timeline', () => {
            let onBeforeProcessData;
            let publicLog;
            let config;
            let addon;
            const predictedHelloo = [
                `${CSI}?25l`, // hide cursor
                `${CSI}2;7H`, // move cursor
                'o', // new character
                `${CSI}2;8H`, // place cursor back at end of line
                `${CSI}?25h`, // show cursor
            ].join('');
            const expectProcessed = (input, output) => {
                const evt = { data: input };
                onBeforeProcessData.fire(evt);
                assert.strictEqual(JSON.stringify(evt.data), JSON.stringify(output));
            };
            setup(() => {
                onBeforeProcessData = ds.add(new event_1.Emitter());
                config = upcastPartial({
                    localEchoStyle: 'italic',
                    localEchoLatencyThreshold: 0,
                    localEchoExcludePrograms: terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE,
                });
                publicLog = (0, sinon_1.stub)();
                addon = new TestTypeAheadAddon(upcastPartial({ onBeforeProcessData: onBeforeProcessData.event }), new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { ...config } } }), upcastPartial({ publicLog }));
                addon.unlockMakingPredictions();
            });
            teardown(() => {
                addon.dispose();
            });
            test('predicts a single character', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                t.expectWritten(`${CSI}3mo${CSI}23m`);
            });
            test('validates character prediction', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('validates zsh prediction (#112842)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                t.onData('x');
                expectProcessed('\box', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;8H`, // move cursor
                    '\box', // new data
                    `${CSI}2;9H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('does not validate zsh prediction on differing lookbehindn (#112842)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                t.onData('x');
                expectProcessed('\bqx', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;8H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}0m`, // reset style
                    '\bqx', // new data
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0.5);
            });
            test('rolls back character prediction', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('q', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}0m`, // reset style
                    'q', // new character
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('handles left arrow when we hit the boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"D" /* CursorMoveDirection.Back */}`);
                t.expectWritten('');
                // Trigger rollback because we don't expect this data
                onBeforeProcessData.fire({ data: 'xy' });
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (start of prompt)
                cursorXBefore);
            });
            test('handles right arrow when we hit the boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"C" /* CursorMoveDirection.Forwards */}`);
                t.expectWritten('');
                // Trigger rollback because we don't expect this data
                onBeforeProcessData.fire({ data: 'xy' });
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (end of prompt)
                cursorXBefore);
            });
            test('internal cursor state is reset when all predictions are undone', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"D" /* CursorMoveDirection.Back */}`);
                t.expectWritten('');
                addon.undoAllPredictions();
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (start of prompt)
                cursorXBefore);
            });
            test('restores cursor graphics mode', () => {
                const t = ds.add(createMockTerminal({
                    lines: ['hello|'],
                    cursorAttrs: { isAttributeDefault: false, isBold: true, isFgPalette: true, getFgColor: 1 },
                }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('q', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}1;38;5;1m`, // reset style
                    'q', // new character
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('validates against and applies graphics mode on predicted', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed(`${CSI}4mo`, [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor
                    `${CSI}4m`, // new PTY's style
                    'o', // new character
                    `${CSI}2;8H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('ignores cursor hides or shows', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed(`${CSI}?25lo${CSI}?25h`, [
                    `${CSI}?25l`, // hide cursor from PTY
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor
                    'o', // new character
                    `${CSI}?25h`, // show cursor from PTY
                    `${CSI}2;8H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('matches backspace at EOL (bash style)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed(`\b${CSI}K`, `\b${CSI}K`);
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('matches backspace at EOL (zsh style)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed('\b \b', '\b \b');
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('gradually matches backspace', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed('\b', '');
                expectProcessed(' \b', '\b \b');
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('restores old character after invalid backspace', () => {
                const t = ds.add(createMockTerminal({ lines: ['hel|lo'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                t.onData('\x7F');
                t.expectWritten(`${CSI}2;4H${CSI}X`);
                expectProcessed('x', `${CSI}?25l${CSI}0ml${CSI}2;5H${CSI}0mx${CSI}?25h`);
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('waits for validation before deleting to left of cursor', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                // initially should not backspace (until the server confirms it)
                t.onData('\x7F');
                t.expectWritten('');
                expectProcessed('\b \b', '\b \b');
                t.cursor.x--;
                // enter input on the column...
                t.onData('o');
                onBeforeProcessData.fire({ data: 'o' });
                t.cursor.x++;
                t.clearWritten();
                // now that the column is 'unlocked', we should be able to predict backspace on it
                t.onData('\x7F');
                t.expectWritten(`${CSI}2;6H${CSI}X`);
            });
            test('waits for first valid prediction on a line', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.lockMakingPredictions();
                addon.activate(t.terminal);
                t.onData('o');
                t.expectWritten('');
                expectProcessed('o', 'o');
                t.onData('o');
                t.expectWritten(`${CSI}3mo${CSI}23m`);
            });
            test('disables on title change', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, true, 'expected to show initially');
                t.onTitleChange.fire('foo - VIM.exe');
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, false, 'expected to hide when vim is open');
                t.onTitleChange.fire('foo - git.exe');
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, true, 'expected to show again after vim closed');
            });
            test('adds line wrap prediction even if behind a boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.lockMakingPredictions();
                addon.activate(t.terminal);
                t.onData('hi'.repeat(50));
                t.expectWritten('');
                expectProcessed('hi', [
                    `${CSI}?25l`, // hide cursor
                    'hi', // this greeting characters
                    ...new Array(36).fill(`${CSI}3mh${CSI}23m${CSI}3mi${CSI}23m`), // rest of the greetings that fit on this line
                    `${CSI}2;81H`, // move to end of line
                    `${CSI}?25h`
                ].join(''));
            });
        });
    });
    class TestTypeAheadAddon extends terminalTypeAheadAddon_1.TypeAheadAddon {
        unlockMakingPredictions() {
            this._lastRow = { y: 1, startingX: 100, endingX: 100, charState: 2 /* CharPredictState.Validated */ };
        }
        lockMakingPredictions() {
            this._lastRow = undefined;
        }
        unlockNavigating() {
            this._lastRow = { y: 1, startingX: 1, endingX: 1, charState: 2 /* CharPredictState.Validated */ };
        }
        reevaluateNow() {
            this._reevaluatePredictorStateNow(this.stats, this._timeline);
        }
        get isShowing() {
            return !!this._timeline?.isShowingPredictions;
        }
        undoAllPredictions() {
            this._timeline?.undoAllPredictions();
        }
        physicalCursor(buffer) {
            return this._timeline?.physicalCursor(buffer);
        }
        tentativeCursor(buffer) {
            return this._timeline?.tentativeCursor(buffer);
        }
    }
    function upcastPartial(v) {
        return v;
    }
    function createPredictionStubs(n) {
        return new Array(n).fill(0).map(stubPrediction);
    }
    function stubPrediction() {
        return {
            apply: () => '',
            rollback: () => '',
            matches: () => 0,
            rollForwards: () => '',
        };
    }
    function createMockTerminal({ lines, cursorAttrs }) {
        const ds = new lifecycle_1.DisposableStore();
        const written = [];
        const cursor = { y: 1, x: 1 };
        const onTitleChange = ds.add(new event_1.Emitter());
        const onData = ds.add(new event_1.Emitter());
        const csiEmitter = ds.add(new event_1.Emitter());
        for (let y = 0; y < lines.length; y++) {
            const line = lines[y];
            if (line.includes('|')) {
                cursor.y = y + 1;
                cursor.x = line.indexOf('|') + 1;
                lines[y] = line.replace('|', ''); // CodeQL [SM02383] replacing the first occurrence is intended
                break;
            }
        }
        return {
            written,
            cursor,
            expectWritten: (s) => {
                assert.strictEqual(JSON.stringify(written.join('')), JSON.stringify(s));
                written.splice(0, written.length);
            },
            clearWritten: () => written.splice(0, written.length),
            onData: (s) => onData.fire(s),
            csiEmitter,
            onTitleChange,
            dispose: () => ds.dispose(),
            terminal: {
                cols: 80,
                rows: 5,
                onResize: new event_1.Emitter().event,
                onData: onData.event,
                onTitleChange: onTitleChange.event,
                parser: {
                    registerCsiHandler(_, callback) {
                        ds.add(csiEmitter.event(callback));
                    },
                },
                write(line) {
                    written.push(line);
                },
                _core: {
                    _inputHandler: {
                        _curAttrData: mockCell('', cursorAttrs)
                    },
                    writeSync() {
                    }
                },
                buffer: {
                    active: {
                        type: 'normal',
                        baseY: 0,
                        get cursorY() { return cursor.y; },
                        get cursorX() { return cursor.x; },
                        getLine(y) {
                            const s = lines[y - 1] || '';
                            return {
                                length: s.length,
                                getCell: (x) => mockCell(s[x - 1] || ''),
                                translateToString: (trim, start = 0, end = s.length) => {
                                    const out = s.slice(start, end);
                                    return trim ? out.trimRight() : out;
                                },
                            };
                        },
                    }
                }
            }
        };
    }
    function mockCell(char, attrs = {}) {
        return new Proxy({}, {
            get(_, prop) {
                if (typeof prop === 'string' && attrs.hasOwnProperty(prop)) {
                    return () => attrs[prop];
                }
                switch (prop) {
                    case 'getWidth':
                        return () => 1;
                    case 'getChars':
                        return () => char;
                    case 'getCode':
                        return () => char.charCodeAt(0) || 0;
                    case 'isAttributeDefault':
                        return () => true;
                    default:
                        return String(prop).startsWith('is') ? (() => false) : (() => 0);
                }
            },
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUeXBlQWhlYWQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi90eXBlQWhlYWQvdGVzdC9icm93c2VyL3Rlcm1pbmFsVHlwZUFoZWFkLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDO0lBRXBCLElBQVcsbUJBR1Y7SUFIRCxXQUFXLG1CQUFtQjtRQUM3QixpQ0FBVSxDQUFBO1FBQ1YscUNBQWMsQ0FBQTtJQUNmLENBQUMsRUFIVSxtQkFBbUIsS0FBbkIsbUJBQW1CLFFBRzdCO0lBRUQsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxNQUFNLEVBQUUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFckQsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM3QixJQUFJLEtBQXNCLENBQUM7WUFDM0IsSUFBSSxHQUF5QixDQUFDO1lBQzlCLElBQUksT0FBNkIsQ0FBQztZQUNsQyxJQUFJLElBQTBCLENBQUM7WUFFL0IsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWUsQ0FBQyxDQUFDO2dCQUUxQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHdDQUFlLENBQUM7b0JBQ2xDLGlCQUFpQixFQUFFLEdBQUcsQ0FB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