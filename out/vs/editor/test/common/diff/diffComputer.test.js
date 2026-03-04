define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/diff/legacyLinesDiffComputer", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, legacyLinesDiffComputer_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertDiff(originalLines, modifiedLines, expectedChanges, shouldComputeCharChanges = true, shouldPostProcessCharChanges = false, shouldIgnoreTrimWhitespace = false) {
        const diffComputer = new legacyLinesDiffComputer_1.DiffComputer(originalLines, modifiedLines, {
            shouldComputeCharChanges,
            shouldPostProcessCharChanges,
            shouldIgnoreTrimWhitespace,
            shouldMakePrettyDiff: true,
            maxComputationTime: 0
        });
        const changes = diffComputer.computeDiff().changes;
        const mapCharChange = (charChange) => {
            return {
                originalStartLineNumber: charChange.originalStartLineNumber,
                originalStartColumn: charChange.originalStartColumn,
                originalEndLineNumber: charChange.originalEndLineNumber,
                originalEndColumn: charChange.originalEndColumn,
                modifiedStartLineNumber: charChange.modifiedStartLineNumber,
                modifiedStartColumn: charChange.modifiedStartColumn,
                modifiedEndLineNumber: charChange.modifiedEndLineNumber,
                modifiedEndColumn: charChange.modifiedEndColumn,
            };
        };
        const actual = changes.map((lineChange) => {
            return {
                originalStartLineNumber: lineChange.originalStartLineNumber,
                originalEndLineNumber: lineChange.originalEndLineNumber,
                modifiedStartLineNumber: lineChange.modifiedStartLineNumber,
                modifiedEndLineNumber: lineChange.modifiedEndLineNumber,
                charChanges: (lineChange.charChanges ? lineChange.charChanges.map(mapCharChange) : undefined)
            };
        });
        assert.deepStrictEqual(actual, expectedChanges);
        if (!shouldIgnoreTrimWhitespace) {
            // The diffs should describe how to apply edits to the original text model to get to the modified text model.
            const modifiedTextModel = (0, testTextModel_1.createTextModel)(modifiedLines.join('\n'));
            const expectedValue = modifiedTextModel.getValue();
            {
                // Line changes:
                const originalTextModel = (0, testTextModel_1.createTextModel)(originalLines.join('\n'));
                originalTextModel.applyEdits(changes.map(c => getLineEdit(c, modifiedTextModel)));
                assert.deepStrictEqual(originalTextModel.getValue(), expectedValue);
                originalTextModel.dispose();
            }
            if (shouldComputeCharChanges) {
                // Char changes:
                const originalTextModel = (0, testTextModel_1.createTextModel)(originalLines.join('\n'));
                originalTextModel.applyEdits(changes.flatMap(c => getCharEdits(c, modifiedTextModel)));
                assert.deepStrictEqual(originalTextModel.getValue(), expectedValue);
                originalTextModel.dispose();
            }
            modifiedTextModel.dispose();
        }
    }
    function getCharEdits(lineChange, modifiedTextModel) {
        if (!lineChange.charChanges) {
            return [getLineEdit(lineChange, modifiedTextModel)];
        }
        return lineChange.charChanges.map(c => {
            const originalRange = new range_1.Range(c.originalStartLineNumber, c.originalStartColumn, c.originalEndLineNumber, c.originalEndColumn);
            const modifiedRange = new range_1.Range(c.modifiedStartLineNumber, c.modifiedStartColumn, c.modifiedEndLineNumber, c.modifiedEndColumn);
            return {
                range: originalRange,
                text: modifiedTextModel.getValueInRange(modifiedRange)
            };
        });
    }
    function getLineEdit(lineChange, modifiedTextModel) {
        let originalRange;
        if (lineChange.originalEndLineNumber === 0) {
            // Insertion
            originalRange = new LineRange(lineChange.originalStartLineNumber + 1, 0);
        }
        else {
            originalRange = new LineRange(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1);
        }
        let modifiedRange;
        if (lineChange.modifiedEndLineNumber === 0) {
            // Deletion
            modifiedRange = new LineRange(lineChange.modifiedStartLineNumber + 1, 0);
        }
        else {
            modifiedRange = new LineRange(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1);
        }
        const [r1, r2] = diffFromLineRanges(originalRange, modifiedRange);
        return {
            range: r1,
            text: modifiedTextModel.getValueInRange(r2),
        };
    }
    function diffFromLineRanges(originalRange, modifiedRange) {
        if (originalRange.startLineNumber === 1 || modifiedRange.startLineNumber === 1) {
            if (!originalRange.isEmpty && !modifiedRange.isEmpty) {
                return [
                    new range_1.Range(originalRange.startLineNumber, 1, originalRange.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                    new range_1.Range(modifiedRange.startLineNumber, 1, modifiedRange.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)
                ];
            }
            // When one of them is one and one of them is empty, the other cannot be the last line of the document
            return [
                new range_1.Range(originalRange.startLineNumber, 1, originalRange.endLineNumberExclusive, 1),
                new range_1.Range(modifiedRange.startLineNumber, 1, modifiedRange.endLineNumberExclusive, 1)
            ];
        }
        return [
            new range_1.Range(originalRange.startLineNumber - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, originalRange.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            new range_1.Range(modifiedRange.startLineNumber - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, modifiedRange.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)
        ];
    }
    class LineRange {
        constructor(startLineNumber, lineCount) {
            this.startLineNumber = startLineNumber;
            this.lineCount = lineCount;
        }
        get isEmpty() {
            return this.lineCount === 0;
        }
        get endLineNumberExclusive() {
            return this.startLineNumber + this.lineCount;
        }
    }
    function createLineDeletion(startLineNumber, endLineNumber, modifiedLineNumber) {
        return {
            originalStartLineNumber: startLineNumber,
            originalEndLineNumber: endLineNumber,
            modifiedStartLineNumber: modifiedLineNumber,
            modifiedEndLineNumber: 0,
            charChanges: undefined
        };
    }
    function createLineInsertion(startLineNumber, endLineNumber, originalLineNumber) {
        return {
            originalStartLineNumber: originalLineNumber,
            originalEndLineNumber: 0,
            modifiedStartLineNumber: startLineNumber,
            modifiedEndLineNumber: endLineNumber,
            charChanges: undefined
        };
    }
    function createLineChange(originalStartLineNumber, originalEndLineNumber, modifiedStartLineNumber, modifiedEndLineNumber, charChanges) {
        return {
            originalStartLineNumber: originalStartLineNumber,
            originalEndLineNumber: originalEndLineNumber,
            modifiedStartLineNumber: modifiedStartLineNumber,
            modifiedEndLineNumber: modifiedEndLineNumber,
            charChanges: charChanges
        };
    }
    function createCharChange(originalStartLineNumber, originalStartColumn, originalEndLineNumber, originalEndColumn, modifiedStartLineNumber, modifiedStartColumn, modifiedEndLineNumber, modifiedEndColumn) {
        return {
            originalStartLineNumber: originalStartLineNumber,
            originalStartColumn: originalStartColumn,
            originalEndLineNumber: originalEndLineNumber,
            originalEndColumn: originalEndColumn,
            modifiedStartLineNumber: modifiedStartLineNumber,
            modifiedStartColumn: modifiedStartColumn,
            modifiedEndLineNumber: modifiedEndLineNumber,
            modifiedEndColumn: modifiedEndColumn
        };
    }
    suite('Editor Diff - DiffComputer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // ---- insertions
        test('one inserted line below', () => {
            const original = ['line'];
            const modified = ['line', 'new line'];
            const expected = [createLineInsertion(2, 2, 1)];
            assertDiff(original, modified, expected);
        });
        test('two inserted lines below', () => {
            const original = ['line'];
            const modified = ['line', 'new line', 'another new line'];
            const expected = [createLineInsertion(2, 3, 1)];
            assertDiff(original, modified, expected);
        });
        test('one inserted line above', () => {
            const original = ['line'];
            const modified = ['new line', 'line'];
            const expected = [createLineInsertion(1, 1, 0)];
            assertDiff(original, modified, expected);
        });
        test('two inserted lines above', () => {
            const original = ['line'];
            const modified = ['new line', 'another new line', 'line'];
            const expected = [createLineInsertion(1, 2, 0)];
            assertDiff(original, modified, expected);
        });
        test('one inserted line in middle', () => {
            const original = ['line1', 'line2', 'line3', 'line4'];
            const modified = ['line1', 'line2', 'new line', 'line3', 'line4'];
            const expected = [createLineInsertion(3, 3, 2)];
            assertDiff(original, modified, expected);
        });
        test('two inserted lines in middle', () => {
            const original = ['line1', 'line2', 'line3', 'line4'];
            const modified = ['line1', 'line2', 'new line', 'another new line', 'line3', 'line4'];
            const expected = [createLineInsertion(3, 4, 2)];
            assertDiff(original, modified, expected);
        });
        test('two inserted lines in middle interrupted', () => {
            const original = ['line1', 'line2', 'line3', 'line4'];
            const modified = ['line1', 'line2', 'new line', 'line3', 'another new line', 'line4'];
            const expected = [createLineInsertion(3, 3, 2), createLineInsertion(5, 5, 3)];
            assertDiff(original, modified, expected);
        });
        // ---- deletions
        test('one deleted line below', () => {
            const original = ['line', 'new line'];
            const modified = ['line'];
            const expected = [createLineDeletion(2, 2, 1)];
            assertDiff(original, modified, expected);
        });
        test('two deleted lines below', () => {
            const original = ['line', 'new line', 'another new line'];
            const modified = ['line'];
            const expected = [createLineDeletion(2, 3, 1)];
            assertDiff(original, modified, expected);
        });
        test('one deleted lines above', () => {
            const original = ['new line', 'line'];
            const modified = ['line'];
            const expected = [createLineDeletion(1, 1, 0)];
            assertDiff(original, modified, expected);
        });
        test('two deleted lines above', () => {
            const original = ['new line', 'another new line', 'line'];
            const modified = ['line'];
            const expected = [createLineDeletion(1, 2, 0)];
            assertDiff(original, modified, expected);
        });
        test('one deleted line in middle', () => {
            const original = ['line1', 'line2', 'new line', 'line3', 'line4'];
            const modified = ['line1', 'line2', 'line3', 'line4'];
            const expected = [createLineDeletion(3, 3, 2)];
            assertDiff(original, modified, expected);
        });
        test('two deleted lines in middle', () => {
            const original = ['line1', 'line2', 'new line', 'another new line', 'line3', 'line4'];
            const modified = ['line1', 'line2', 'line3', 'line4'];
            const expected = [createLineDeletion(3, 4, 2)];
            assertDiff(original, modified, expected);
        });
        test('two deleted lines in middle interrupted', () => {
            const original = ['line1', 'line2', 'new line', 'line3', 'another new line', 'line4'];
            const modified = ['line1', 'line2', 'line3', 'line4'];
            const expected = [createLineDeletion(3, 3, 2), createLineDeletion(5, 5, 3)];
            assertDiff(original, modified, expected);
        });
        // ---- changes
        test('one line changed: chars inserted at the end', () => {
            const original = ['line'];
            const modified = ['line changed'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 5, 1, 5, 1, 5, 1, 13)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('one line changed: chars inserted at the beginning', () => {
            const original = ['line'];
            const modified = ['my line'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 1, 1, 1, 1, 1, 1, 4)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('one line changed: chars inserted in the middle', () => {
            const original = ['abba'];
            const modified = ['abzzba'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 3, 1, 3, 1, 3, 1, 5)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('one line changed: chars inserted in the middle (two spots)', () => {
            const original = ['abba'];
            const modified = ['abzzbzza'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 3, 1, 3, 1, 3, 1, 5),
                    createCharChange(1, 4, 1, 4, 1, 6, 1, 8)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('one line changed: chars deleted 1', () => {
            const original = ['abcdefg'];
            const modified = ['abcfg'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 4, 1, 6, 1, 4, 1, 4)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('one line changed: chars deleted 2', () => {
            const original = ['abcdefg'];
            const modified = ['acfg'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 2, 1, 3, 1, 2, 1, 2),
                    createCharChange(1, 4, 1, 6, 1, 3, 1, 3)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('two lines changed 1', () => {
            const original = ['abcd', 'efgh'];
            const modified = ['abcz'];
            const expected = [
                createLineChange(1, 2, 1, 1, [
                    createCharChange(1, 4, 2, 5, 1, 4, 1, 5)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('two lines changed 2', () => {
            const original = ['foo', 'abcd', 'efgh', 'BAR'];
            const modified = ['foo', 'abcz', 'BAR'];
            const expected = [
                createLineChange(2, 3, 2, 2, [
                    createCharChange(2, 4, 3, 5, 2, 4, 2, 5)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('two lines changed 3', () => {
            const original = ['foo', 'abcd', 'efgh', 'BAR'];
            const modified = ['foo', 'abcz', 'zzzzefgh', 'BAR'];
            const expected = [
                createLineChange(2, 3, 2, 3, [
                    createCharChange(2, 4, 2, 5, 2, 4, 2, 5),
                    createCharChange(3, 1, 3, 1, 3, 1, 3, 5)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('two lines changed 4', () => {
            const original = ['abc'];
            const modified = ['', '', 'axc', ''];
            const expected = [
                createLineChange(1, 1, 1, 4, [
                    createCharChange(1, 1, 1, 1, 1, 1, 3, 1),
                    createCharChange(1, 2, 1, 3, 3, 2, 3, 3),
                    createCharChange(1, 4, 1, 4, 3, 4, 4, 1)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('empty original sequence in char diff', () => {
            const original = ['abc', '', 'xyz'];
            const modified = ['abc', 'qwe', 'rty', 'xyz'];
            const expected = [
                createLineChange(2, 2, 2, 3)
            ];
            assertDiff(original, modified, expected);
        });
        test('three lines changed', () => {
            const original = ['foo', 'abcd', 'efgh', 'BAR'];
            const modified = ['foo', 'zzzefgh', 'xxx', 'BAR'];
            const expected = [
                createLineChange(2, 3, 2, 3, [
                    createCharChange(2, 1, 3, 1, 2, 1, 2, 4),
                    createCharChange(3, 5, 3, 5, 2, 8, 3, 4),
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('big change part 1', () => {
            const original = ['foo', 'abcd', 'efgh', 'BAR'];
            const modified = ['hello', 'foo', 'zzzefgh', 'xxx', 'BAR'];
            const expected = [
                createLineInsertion(1, 1, 0),
                createLineChange(2, 3, 3, 4, [
                    createCharChange(2, 1, 3, 1, 3, 1, 3, 4),
                    createCharChange(3, 5, 3, 5, 3, 8, 4, 4)
                ])
            ];
            assertDiff(original, modified, expected);
        });
        test('big change part 2', () => {
            const original = ['foo', 'abcd', 'efgh', 'BAR', 'RAB'];
            const modified = ['hello', 'foo', 'zzzefgh', 'xxx', 'BAR'];
            const expected = [
                createLineInsertion(1, 1, 0),
                createLineChange(2, 3, 3, 4, [
                    createCharChange(2, 1, 3, 1, 3, 1, 3, 4),
                    createCharChange(3, 5, 3, 5, 3, 8, 4, 4)
                ]),
                createLineDeletion(5, 5, 5)
            ];
            assertDiff(original, modified, expected);
        });
        test('char change postprocessing merges', () => {
            const original = ['abba'];
            const modified = ['azzzbzzzbzzza'];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 2, 1, 4, 1, 2, 1, 13)
                ])
            ];
            assertDiff(original, modified, expected, true, true);
        });
        test('ignore trim whitespace', () => {
            const original = ['\t\t foo ', 'abcd', 'efgh', '\t\t BAR\t\t'];
            const modified = ['  hello\t', '\t foo   \t', 'zzzefgh', 'xxx', '   BAR   \t'];
            const expected = [
                createLineInsertion(1, 1, 0),
                createLineChange(2, 3, 3, 4, [
                    createCharChange(2, 1, 2, 5, 3, 1, 3, 4),
                    createCharChange(3, 5, 3, 5, 4, 1, 4, 4)
                ])
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('issue #12122 r.hasOwnProperty is not a function', () => {
            const original = ['hasOwnProperty'];
            const modified = ['hasOwnProperty', 'and another line'];
            const expected = [
                createLineInsertion(2, 2, 1)
            ];
            assertDiff(original, modified, expected);
        });
        test('empty diff 1', () => {
            const original = [''];
            const modified = ['something'];
            const expected = [
                createLineChange(1, 1, 1, 1, undefined)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('empty diff 2', () => {
            const original = [''];
            const modified = ['something', 'something else'];
            const expected = [
                createLineChange(1, 1, 1, 2, undefined)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('empty diff 3', () => {
            const original = ['something', 'something else'];
            const modified = [''];
            const expected = [
                createLineChange(1, 2, 1, 1, undefined)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('empty diff 4', () => {
            const original = ['something'];
            const modified = [''];
            const expected = [
                createLineChange(1, 1, 1, 1, undefined)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('empty diff 5', () => {
            const original = [''];
            const modified = [''];
            const expected = [];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('pretty diff 1', () => {
            const original = [
                'suite(function () {',
                '	test1() {',
                '		assert.ok(true);',
                '	}',
                '',
                '	test2() {',
                '		assert.ok(true);',
                '	}',
                '});',
                '',
            ];
            const modified = [
                '// An insertion',
                'suite(function () {',
                '	test1() {',
                '		assert.ok(true);',
                '	}',
                '',
                '	test2() {',
                '		assert.ok(true);',
                '	}',
                '',
                '	test3() {',
                '		assert.ok(true);',
                '	}',
                '});',
                '',
            ];
            const expected = [
                createLineInsertion(1, 1, 0),
                createLineInsertion(10, 13, 8)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('pretty diff 2', () => {
            const original = [
                '// Just a comment',
                '',
                'function compute(a, b, c, d) {',
                '	if (a) {',
                '		if (b) {',
                '			if (c) {',
                '				return 5;',
                '			}',
                '		}',
                '		// These next lines will be deleted',
                '		if (d) {',
                '			return -1;',
                '		}',
                '		return 0;',
                '	}',
                '}',
            ];
            const modified = [
                '// Here is an inserted line',
                '// and another inserted line',
                '// and another one',
                '// Just a comment',
                '',
                'function compute(a, b, c, d) {',
                '	if (a) {',
                '		if (b) {',
                '			if (c) {',
                '				return 5;',
                '			}',
                '		}',
                '		return 0;',
                '	}',
                '}',
            ];
            const expected = [
                createLineInsertion(1, 3, 0),
                createLineDeletion(10, 13, 12),
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('pretty diff 3', () => {
            const original = [
                'class A {',
                '	/**',
                '	 * m1',
                '	 */',
                '	method1() {}',
                '',
                '	/**',
                '	 * m3',
                '	 */',
                '	method3() {}',
                '}',
            ];
            const modified = [
                'class A {',
                '	/**',
                '	 * m1',
                '	 */',
                '	method1() {}',
                '',
                '	/**',
                '	 * m2',
                '	 */',
                '	method2() {}',
                '',
                '	/**',
                '	 * m3',
                '	 */',
                '	method3() {}',
                '}',
            ];
            const expected = [
                createLineInsertion(7, 11, 6)
            ];
            assertDiff(original, modified, expected, true, false, true);
        });
        test('issue #23636', () => {
            const original = [
                'if(!TextDrawLoad[playerid])',
                '{',
                '',
                '	TextDrawHideForPlayer(playerid,TD_AppleJob[3]);',
                '	TextDrawHideForPlayer(playerid,TD_AppleJob[4]);',
                '	if(!AppleJobTreesType[AppleJobTreesPlayerNum[playerid]])',
                '	{',
                '		for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[5+i]);',
                '	}',
                '	else',
                '	{',
                '		for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[15+i]);',
                '	}',
                '}',
                'else',
                '{',
                '	TextDrawHideForPlayer(playerid,TD_AppleJob[3]);',
                '	TextDrawHideForPlayer(playerid,TD_AppleJob[27]);',
                '	if(!AppleJobTreesType[AppleJobTreesPlayerNum[playerid]])',
                '	{',
                '		for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[28+i]);',
                '	}',
                '	else',
                '	{',
                '		for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[38+i]);',
                '	}',
                '}',
            ];
            const modified = [
                '	if(!TextDrawLoad[playerid])',
                '	{',
                '	',
                '		TextDrawHideForPlayer(playerid,TD_AppleJob[3]);',
                '		TextDrawHideForPlayer(playerid,TD_AppleJob[4]);',
                '		if(!AppleJobTreesType[AppleJobTreesPlayerNum[playerid]])',
                '		{',
                '			for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[5+i]);',
                '		}',
                '		else',
                '		{',
                '			for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[15+i]);',
                '		}',
                '	}',
                '	else',
                '	{',
                '		TextDrawHideForPlayer(playerid,TD_AppleJob[3]);',
                '		TextDrawHideForPlayer(playerid,TD_AppleJob[27]);',
                '		if(!AppleJobTreesType[AppleJobTreesPlayerNum[playerid]])',
                '		{',
                '			for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[28+i]);',
                '		}',
                '		else',
                '		{',
                '			for(new i=0;i<10;i++) if(StatusTD_AppleJobApples[playerid][i]) TextDrawHideForPlayer(playerid,TD_AppleJob[38+i]);',
                '		}',
                '	}',
            ];
            const expected = [
                createLineChange(1, 27, 1, 27, [
                    createCharChange(1, 1, 1, 1, 1, 1, 1, 2),
                    createCharChange(2, 1, 2, 1, 2, 1, 2, 2),
                    createCharChange(3, 1, 3, 1, 3, 1, 3, 2),
                    createCharChange(4, 1, 4, 1, 4, 1, 4, 2),
                    createCharChange(5, 1, 5, 1, 5, 1, 5, 2),
                    createCharChange(6, 1, 6, 1, 6, 1, 6, 2),
                    createCharChange(7, 1, 7, 1, 7, 1, 7, 2),
                    createCharChange(8, 1, 8, 1, 8, 1, 8, 2),
                    createCharChange(9, 1, 9, 1, 9, 1, 9, 2),
                    createCharChange(10, 1, 10, 1, 10, 1, 10, 2),
                    createCharChange(11, 1, 11, 1, 11, 1, 11, 2),
                    createCharChange(12, 1, 12, 1, 12, 1, 12, 2),
                    createCharChange(13, 1, 13, 1, 13, 1, 13, 2),
                    createCharChange(14, 1, 14, 1, 14, 1, 14, 2),
                    createCharChange(15, 1, 15, 1, 15, 1, 15, 2),
                    createCharChange(16, 1, 16, 1, 16, 1, 16, 2),
                    createCharChange(17, 1, 17, 1, 17, 1, 17, 2),
                    createCharChange(18, 1, 18, 1, 18, 1, 18, 2),
                    createCharChange(19, 1, 19, 1, 19, 1, 19, 2),
                    createCharChange(20, 1, 20, 1, 20, 1, 20, 2),
                    createCharChange(21, 1, 21, 1, 21, 1, 21, 2),
                    createCharChange(22, 1, 22, 1, 22, 1, 22, 2),
                    createCharChange(23, 1, 23, 1, 23, 1, 23, 2),
                    createCharChange(24, 1, 24, 1, 24, 1, 24, 2),
                    createCharChange(25, 1, 25, 1, 25, 1, 25, 2),
                    createCharChange(26, 1, 26, 1, 26, 1, 26, 2),
                    createCharChange(27, 1, 27, 1, 27, 1, 27, 2),
                ])
                // createLineInsertion(7, 11, 6)
            ];
            assertDiff(original, modified, expected, true, true, false);
        });
        test('issue #43922', () => {
            const original = [
                ' * `yarn [install]` -- Install project NPM dependencies. This is automatically done when you first create the project. You should only need to run this if you add dependencies in `package.json`.',
            ];
            const modified = [
                ' * `yarn` -- Install project NPM dependencies. You should only need to run this if you add dependencies in `package.json`.',
            ];
            const expected = [
                createLineChange(1, 1, 1, 1, [
                    createCharChange(1, 9, 1, 19, 1, 9, 1, 9),
                    createCharChange(1, 58, 1, 120, 1, 48, 1, 48),
                ])
            ];
            assertDiff(original, modified, expected, true, true, false);
        });
        test('issue #42751', () => {
            const original = [
                '    1',
                '  2',
            ];
            const modified = [
                '    1',
                '   3',
            ];
            const expected = [
                createLineChange(2, 2, 2, 2, [
                    createCharChange(2, 3, 2, 4, 2, 3, 2, 5)
                ])
            ];
            assertDiff(original, modified, expected, true, true, false);
        });
        test('does not give character changes', () => {
            const original = [
                '    1',
                '  2',
                'A',
            ];
            const modified = [
                '    1',
                '   3',
                ' A',
            ];
            const expected = [
                createLineChange(2, 3, 2, 3)
            ];
            assertDiff(original, modified, expected, false, false, false);
        });
        test('issue #44422: Less than ideal diff results', () => {
            const original = [
                'export class C {',
                '',
                '	public m1(): void {',
                '		{',
                '		//2',
                '		//3',
                '		//4',
                '		//5',
                '		//6',
                '		//7',
                '		//8',
                '		//9',
                '		//10',
                '		//11',
                '		//12',
                '		//13',
                '		//14',
                '		//15',
                '		//16',
                '		//17',
                '		//18',
                '		}',
                '	}',
                '',
                '	public m2(): void {',
                '		if (a) {',
                '			if (b) {',
                '				//A1',
                '				//A2',
                '				//A3',
                '				//A4',
                '				//A5',
                '				//A6',
                '				//A7',
                '				//A8',
                '			}',
                '		}',
                '',
                '		//A9',
                '		//A10',
                '		//A11',
                '		//A12',
                '		//A13',
                '		//A14',
                '		//A15',
                '	}',
                '',
                '	public m3(): void {',
                '		if (a) {',
                '			//B1',
                '		}',
                '		//B2',
                '		//B3',
                '	}',
                '',
                '	public m4(): boolean {',
                '		//1',
                '		//2',
                '		//3',
                '		//4',
                '	}',
                '',
                '}',
            ];
            const modified = [
                'export class C {',
                '',
                '	constructor() {',
                '',
                '',
                '',
                '',
                '	}',
                '',
                '	public m1(): void {',
                '		{',
                '		//2',
                '		//3',
                '		//4',
                '		//5',
                '		//6',
                '		//7',
                '		//8',
                '		//9',
                '		//10',
                '		//11',
                '		//12',
                '		//13',
                '		//14',
                '		//15',
                '		//16',
                '		//17',
                '		//18',
                '		}',
                '	}',
                '',
                '	public m4(): boolean {',
                '		//1',
                '		//2',
                '		//3',
                '		//4',
                '	}',
                '',
                '}',
            ];
            const expected = [
                createLineChange(2, 0, 3, 9),
                createLineChange(25, 55, 31, 0)
            ];
            assertDiff(original, modified, expected, false, false, false);
        });
        test('gives preference to matching longer lines', () => {
            const original = [
                'A',
                'A',
                'BB',
                'C',
            ];
            const modified = [
                'A',
                'BB',
                'A',
                'D',
                'E',
                'A',
                'C',
            ];
            const expected = [
                createLineChange(2, 2, 1, 0),
                createLineChange(3, 0, 3, 6)
            ];
            assertDiff(original, modified, expected, false, false, false);
        });
        test('issue #119051: gives preference to fewer diff hunks', () => {
            const original = [
                '1',
                '',
                '',
                '2',
                '',
            ];
            const modified = [
                '1',
                '',
                '1.5',
                '',
                '',
                '2',
                '',
                '3',
                '',
            ];
            const expected = [
                createLineChange(2, 0, 3, 4),
                createLineChange(5, 0, 8, 9)
            ];
            assertDiff(original, modified, expected, false, false, false);
        });
        test('issue #121436: Diff chunk contains an unchanged line part 1', () => {
            const original = [
                'if (cond) {',
                '    cmd',
                '}',
            ];
            const modified = [
                'if (cond) {',
                '    if (other_cond) {',
                '        cmd',
                '    }',
                '}',
            ];
            const expected = [
                createLineChange(1, 0, 2, 2),
                createLineChange(2, 0, 4, 4)
            ];
            assertDiff(original, modified, expected, false, false, true);
        });
        test('issue #121436: Diff chunk contains an unchanged line part 2', () => {
            const original = [
                'if (cond) {',
                '    cmd',
                '}',
            ];
            const modified = [
                'if (cond) {',
                '    if (other_cond) {',
                '        cmd',
                '    }',
                '}',
            ];
            const expected = [
                createLineChange(1, 0, 2, 2),
                createLineChange(2, 2, 3, 3),
                createLineChange(2, 0, 4, 4)
            ];
            assertDiff(original, modified, expected, false, false, false);
        });
        test('issue #169552: Assertion error when having both leading and trailing whitespace diffs', () => {
            const original = [
                'if True:',
                '    print(2)',
            ];
            const modified = [
                'if True:',
                '\tprint(2) ',
            ];
            const expected = [
                createLineChange(2, 2, 2, 2, [
                    createCharChange(2, 1, 2, 5, 2, 1, 2, 2),
                    createCharChange(2, 13, 2, 13, 2, 10, 2, 11),
                ]),
            ];
            assertDiff(original, modified, expected, true, false, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNvbXB1dGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vZGlmZi9kaWZmQ29tcHV0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFZQSxTQUFTLFVBQVUsQ0FBQyxhQUF1QixFQUFFLGFBQXVCLEVBQUUsZUFBOEIsRUFBRSwyQkFBb0MsSUFBSSxFQUFFLCtCQUF3QyxLQUFLLEVBQUUsNkJBQXNDLEtBQUs7UUFDek8sTUFBTSxZQUFZLEdBQUcsSUFBSSxzQ0FBWSxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUU7WUFDbkUsd0JBQXdCO1lBQ3hCLDRCQUE0QjtZQUM1QiwwQkFBMEI7WUFDMUIsb0JBQW9CLEVBQUUsSUFBSTtZQUMxQixrQkFBa0IsRUFBRSxDQUFDO1NBQ3JCLENBQUMsQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFFbkQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxVQUF1QixFQUFFLEVBQUU7WUFDakQsT0FBTztnQkFDTix1QkFBdUIsRUFBRSxVQUFVLENBQUMsdUJBQXVCO2dCQUMzRCxtQkFBbUIsRUFBRSxVQUFVLENBQUMsbUJBQW1CO2dCQUNuRCxxQkFBcUIsRUFBRSxVQUFVLENBQUMscUJBQXFCO2dCQUN2RCxpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCO2dCQUMvQyx1QkFBdUIsRUFBRSxVQUFVLENBQUMsdUJBQXVCO2dCQUMzRCxtQkFBbUIsRUFBRSxVQUFVLENBQUMsbUJBQW1CO2dCQUNuRCxxQkFBcUIsRUFBRSxVQUFVLENBQUMscUJBQXFCO2dCQUN2RCxpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCO2FBQy9DLENBQUM7UUFDSCxDQUFDLENBQUM7UUFFRixNQUFNLE1BQU0s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QUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUMxRCxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLE1BQU0sUUFBUSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLFFBQVEsR0FBRyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0QyxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLE1BQU0sUUFBUSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLFFBQVEsR0FBRyxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxRCxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLE1BQU0sUUFBUSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFB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LEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFDWjtvQkFDQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1QyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2lC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