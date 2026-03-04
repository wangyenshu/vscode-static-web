/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languagesRegistry", "vs/editor/common/tokens/lineTokens", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/tokens/sparseTokensStore", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, position_1, range_1, encodedTokenAttributes_1, languageConfigurationRegistry_1, languagesRegistry_1, lineTokens_1, sparseMultilineTokens_1, sparseTokensStore_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TokensStore', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const SEMANTIC_COLOR = 5;
        function parseTokensState(state) {
            const text = [];
            const tokens = [];
            let baseLine = 1;
            for (let i = 0; i < state.length; i++) {
                const line = state[i];
                let startOffset = 0;
                let lineText = '';
                while (true) {
                    const firstPipeOffset = line.indexOf('|', startOffset);
                    if (firstPipeOffset === -1) {
                        break;
                    }
                    const secondPipeOffset = line.indexOf('|', firstPipeOffset + 1);
                    if (secondPipeOffset === -1) {
                        break;
                    }
                    if (firstPipeOffset + 1 === secondPipeOffset) {
                        // skip ||
                        lineText += line.substring(startOffset, secondPipeOffset + 1);
                        startOffset = secondPipeOffset + 1;
                        continue;
                    }
                    lineText += line.substring(startOffset, firstPipeOffset);
                    const tokenStartCharacter = lineText.length;
                    const tokenLength = secondPipeOffset - firstPipeOffset - 1;
                    const metadata = (SEMANTIC_COLOR << 15 /* MetadataConsts.FOREGROUND_OFFSET */
                        | 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */);
                    if (tokens.length === 0) {
                        baseLine = i + 1;
                    }
                    tokens.push(i + 1 - baseLine, tokenStartCharacter, tokenStartCharacter + tokenLength, metadata);
                    lineText += line.substr(firstPipeOffset + 1, tokenLength);
                    startOffset = secondPipeOffset + 1;
                }
                lineText += line.substring(startOffset);
                text.push(lineText);
            }
            return {
                text: text.join('\n'),
                tokens: sparseMultilineTokens_1.SparseMultilineTokens.create(baseLine, new Uint32Array(tokens))
            };
        }
        function extractState(model) {
            const result = [];
            for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber++) {
                const lineTokens = model.tokenization.getLineTokens(lineNumber);
                const lineContent = model.getLineContent(lineNumber);
                let lineText = '';
                for (let i = 0; i < lineTokens.getCount(); i++) {
                    const tokenStartCharacter = lineTokens.getStartOffset(i);
                    const tokenEndCharacter = lineTokens.getEndOffset(i);
                    const metadata = lineTokens.getMetadata(i);
                    const color = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
                    const tokenText = lineContent.substring(tokenStartCharacter, tokenEndCharacter);
                    if (color === SEMANTIC_COLOR) {
                        lineText += `|${tokenText}|`;
                    }
                    else {
                        lineText += tokenText;
                    }
                }
                result.push(lineText);
            }
            return result;
        }
        function testTokensAdjustment(rawInitialState, edits, rawFinalState) {
            const initialState = parseTokensState(rawInitialState);
            const model = (0, testTextModel_1.createTextModel)(initialState.text);
            model.tokenization.setSemanticTokens([initialState.tokens], true);
            model.applyEdits(edits);
            const actualState = extractState(model);
            assert.deepStrictEqual(actualState, rawFinalState);
            model.dispose();
        }
        test('issue #86303 - color shifting between different tokens', () => {
            testTokensAdjustment([
                `import { |URI| } from 'vs/base/common/uri';`,
                `const foo = |URI|.parse('hey');`
            ], [
                { range: new range_1.Range(2, 9, 2, 10), text: '' }
            ], [
                `import { |URI| } from 'vs/base/common/uri';`,
                `const fo = |URI|.parse('hey');`
            ]);
        });
        test('deleting a newline', () => {
            testTokensAdjustment([
                `import { |URI| } from 'vs/base/common/uri';`,
                `const foo = |URI|.parse('hey');`
            ], [
                { range: new range_1.Range(1, 42, 2, 1), text: '' }
            ], [
                `import { |URI| } from 'vs/base/common/uri';const foo = |URI|.parse('hey');`
            ]);
        });
        test('inserting a newline', () => {
            testTokensAdjustment([
                `import { |URI| } from 'vs/base/common/uri';const foo = |URI|.parse('hey');`
            ], [
                { range: new range_1.Range(1, 42, 1, 42), text: '\n' }
            ], [
                `import { |URI| } from 'vs/base/common/uri';`,
                `const foo = |URI|.parse('hey');`
            ]);
        });
        test('deleting a newline 2', () => {
            testTokensAdjustment([
                `import { `,
                `    |URI| } from 'vs/base/common/uri';const foo = |URI|.parse('hey');`
            ], [
                { range: new range_1.Range(1, 10, 2, 5), text: '' }
            ], [
                `import { |URI| } from 'vs/base/common/uri';const foo = |URI|.parse('hey');`
            ]);
        });
        test('issue #179268: a complex edit', () => {
            testTokensAdjustment([
                `|export| |'interior_material_selector.dart'|;`,
                `|export| |'mileage_selector.dart'|;`,
                `|export| |'owners_selector.dart'|;`,
                `|export| |'price_selector.dart'|;`,
                `|export| |'seat_count_selector.dart'|;`,
                `|export| |'year_selector.dart'|;`,
                `|export| |'winter_options_selector.dart'|;|export| |'camera_selector.dart'|;`
            ], [
                { range: new range_1.Range(1, 9, 1, 9), text: `camera_selector.dart';\nexport '` },
                { range: new range_1.Range(6, 9, 7, 9), text: `` },
                { range: new range_1.Range(7, 39, 7, 39), text: `\n` },
                { range: new range_1.Range(7, 47, 7, 48), text: `ye` },
                { range: new range_1.Range(7, 49, 7, 51), text: `` },
                { range: new range_1.Range(7, 52, 7, 53), text: `` },
            ], [
                `|export| |'|camera_selector.dart';`,
                `export 'interior_material_selector.dart';`,
                `|export| |'mileage_selector.dart'|;`,
                `|export| |'owners_selector.dart'|;`,
                `|export| |'price_selector.dart'|;`,
                `|export| |'seat_count_selector.dart'|;`,
                `|export| |'||winter_options_selector.dart'|;`,
                `|export| |'year_selector.dart'|;`
            ]);
        });
        test('issue #91936: Semantic token color highlighting fails on line with selected text', () => {
            const model = (0, testTextModel_1.createTextModel)('                    else if ($s = 08) then \'\\b\'');
            model.tokenization.setSemanticTokens([
                sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                    0, 20, 24, 0b01111000000000010000,
                    0, 25, 27, 0b01111000000000010000,
                    0, 28, 29, 0b00001000000000010000,
                    0, 29, 31, 0b10000000000000010000,
                    0, 32, 33, 0b00001000000000010000,
                    0, 34, 36, 0b00110000000000010000,
                    0, 36, 37, 0b00001000000000010000,
                    0, 38, 42, 0b01111000000000010000,
                    0, 43, 47, 0b01011000000000010000,
                ]))
            ], true);
            const lineTokens = model.tokenization.getLineTokens(1);
            const decodedTokens = [];
            for (let i = 0, len = lineTokens.getCount(); i < len; i++) {
                decodedTokens.push(lineTokens.getEndOffset(i), lineTokens.getMetadata(i));
            }
            assert.deepStrictEqual(decodedTokens, [
                20, 0b10000000001000010000000001,
                24, 0b10000001111000010000000001,
                25, 0b10000000001000010000000001,
                27, 0b10000001111000010000000001,
                28, 0b10000000001000010000000001,
                29, 0b10000000001000010000000001,
                31, 0b10000010000000010000000001,
                32, 0b10000000001000010000000001,
                33, 0b10000000001000010000000001,
                34, 0b10000000001000010000000001,
                36, 0b10000000110000010000000001,
                37, 0b10000000001000010000000001,
                38, 0b10000000001000010000000001,
                42, 0b10000001111000010000000001,
                43, 0b10000000001000010000000001,
                47, 0b10000001011000010000000001
            ]);
            model.dispose();
        });
        test('issue #147944: Language id "vs.editor.nullLanguage" is not configured nor known', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables, [
                [languageConfigurationRegistry_1.ILanguageConfigurationService, languageConfigurationRegistry_1.LanguageConfigurationService]
            ]);
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '--[[\n\n]]'));
            model.tokenization.setSemanticTokens([
                sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                    0, 2, 4, 0b100000000000010000,
                    1, 0, 0, 0b100000000000010000,
                    2, 0, 2, 0b100000000000010000,
                ]))
            ], true);
            assert.strictEqual(model.getWordAtPosition(new position_1.Position(2, 1)), null);
            disposables.dispose();
        });
        test('partial tokens 1', () => {
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            // setPartial: [1,1 -> 31,2], [(5,5-10),(10,5-10),(15,5-10),(20,5-10),(25,5-10),(30,5-10)]
            store.setPartial(new range_1.Range(1, 1, 31, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(5, new Uint32Array([
                    0, 5, 10, 1,
                    5, 5, 10, 2,
                    10, 5, 10, 3,
                    15, 5, 10, 4,
                    20, 5, 10, 5,
                    25, 5, 10, 6,
                ]))
            ]);
            // setPartial: [18,1 -> 42,1], [(20,5-10),(25,5-10),(30,5-10),(35,5-10),(40,5-10)]
            store.setPartial(new range_1.Range(18, 1, 42, 1), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(20, new Uint32Array([
                    0, 5, 10, 4,
                    5, 5, 10, 5,
                    10, 5, 10, 6,
                    15, 5, 10, 7,
                    20, 5, 10, 8,
                ]))
            ]);
            // setPartial: [1,1 -> 31,2], [(5,5-10),(10,5-10),(15,5-10),(20,5-10),(25,5-10),(30,5-10)]
            store.setPartial(new range_1.Range(1, 1, 31, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(5, new Uint32Array([
                    0, 5, 10, 1,
                    5, 5, 10, 2,
                    10, 5, 10, 3,
                    15, 5, 10, 4,
                    20, 5, 10, 5,
                    25, 5, 10, 6,
                ]))
            ]);
            const lineTokens = store.addSparseTokens(10, new lineTokens_1.LineTokens(new Uint32Array([12, 1]), `enum Enum1 {`, codec));
            assert.strictEqual(lineTokens.getCount(), 3);
        });
        test('partial tokens 2', () => {
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            // setPartial: [1,1 -> 31,2], [(5,5-10),(10,5-10),(15,5-10),(20,5-10),(25,5-10),(30,5-10)]
            store.setPartial(new range_1.Range(1, 1, 31, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(5, new Uint32Array([
                    0, 5, 10, 1,
                    5, 5, 10, 2,
                    10, 5, 10, 3,
                    15, 5, 10, 4,
                    20, 5, 10, 5,
                    25, 5, 10, 6,
                ]))
            ]);
            // setPartial: [6,1 -> 36,2], [(10,5-10),(15,5-10),(20,5-10),(25,5-10),(30,5-10),(35,5-10)]
            store.setPartial(new range_1.Range(6, 1, 36, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(10, new Uint32Array([
                    0, 5, 10, 2,
                    5, 5, 10, 3,
                    10, 5, 10, 4,
                    15, 5, 10, 5,
                    20, 5, 10, 6,
                ]))
            ]);
            // setPartial: [17,1 -> 42,1], [(20,5-10),(25,5-10),(30,5-10),(35,5-10),(40,5-10)]
            store.setPartial(new range_1.Range(17, 1, 42, 1), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(20, new Uint32Array([
                    0, 5, 10, 4,
                    5, 5, 10, 5,
                    10, 5, 10, 6,
                    15, 5, 10, 7,
                    20, 5, 10, 8,
                ]))
            ]);
            const lineTokens = store.addSparseTokens(20, new lineTokens_1.LineTokens(new Uint32Array([12, 1]), `enum Enum1 {`, codec));
            assert.strictEqual(lineTokens.getCount(), 3);
        });
        test('partial tokens 3', () => {
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            // setPartial: [1,1 -> 31,2], [(5,5-10),(10,5-10),(15,5-10),(20,5-10),(25,5-10),(30,5-10)]
            store.setPartial(new range_1.Range(1, 1, 31, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(5, new Uint32Array([
                    0, 5, 10, 1,
                    5, 5, 10, 2,
                    10, 5, 10, 3,
                    15, 5, 10, 4,
                    20, 5, 10, 5,
                    25, 5, 10, 6,
                ]))
            ]);
            // setPartial: [11,1 -> 16,2], [(15,5-10),(20,5-10)]
            store.setPartial(new range_1.Range(11, 1, 16, 2), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(10, new Uint32Array([
                    0, 5, 10, 3,
                    5, 5, 10, 4,
                ]))
            ]);
            const lineTokens = store.addSparseTokens(5, new lineTokens_1.LineTokens(new Uint32Array([12, 1]), `enum Enum1 {`, codec));
            assert.strictEqual(lineTokens.getCount(), 3);
        });
        test('issue #94133: Semantic colors stick around when using (only) range provider', () => {
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            // setPartial: [1,1 -> 1,20] [(1,9-11)]
            store.setPartial(new range_1.Range(1, 1, 1, 20), [
                sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                    0, 9, 11, 1,
                ]))
            ]);
            // setPartial: [1,1 -> 1,20], []
            store.setPartial(new range_1.Range(1, 1, 1, 20), []);
            const lineTokens = store.addSparseTokens(1, new lineTokens_1.LineTokens(new Uint32Array([12, 1]), `enum Enum1 {`, codec));
            assert.strictEqual(lineTokens.getCount(), 1);
        });
        test('bug', () => {
            function createTokens(str) {
                str = str.replace(/^\[\(/, '');
                str = str.replace(/\)\]$/, '');
                const strTokens = str.split('),(');
                const result = [];
                let firstLineNumber = 0;
                for (const strToken of strTokens) {
                    const pieces = strToken.split(',');
                    const chars = pieces[1].split('-');
                    const lineNumber = parseInt(pieces[0], 10);
                    const startChar = parseInt(chars[0], 10);
                    const endChar = parseInt(chars[1], 10);
                    if (firstLineNumber === 0) {
                        // this is the first line
                        firstLineNumber = lineNumber;
                    }
                    result.push(lineNumber - firstLineNumber, startChar, endChar, (lineNumber + startChar) % 13);
                }
                return sparseMultilineTokens_1.SparseMultilineTokens.create(firstLineNumber, new Uint32Array(result));
            }
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            // setPartial [36446,1 -> 36475,115] [(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35),(36470,38-46),(36473,25-35),(36473,36-51),(36474,28-33),(36474,36-49),(36474,50-58),(36475,35-53),(36475,54-62)]
            store.setPartial(new range_1.Range(36446, 1, 36475, 115), [createTokens('[(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35),(36470,38-46),(36473,25-35),(36473,36-51),(36474,28-33),(36474,36-49),(36474,50-58),(36475,35-53),(36475,54-62)]')]);
            // setPartial [36436,1 -> 36464,142] [(36437,33-37),(36437,38-42),(36437,47-57),(36437,58-67),(36438,35-53),(36438,54-62),(36440,24-29),(36440,33-46),(36440,47-53),(36442,25-35),(36442,36-50),(36443,30-39),(36443,42-46),(36443,47-53),(36443,54-58),(36443,63-73),(36443,74-84),(36443,87-91),(36443,92-98),(36443,101-105),(36443,106-112),(36443,113-119),(36444,28-37),(36444,38-42),(36444,47-57),(36444,58-75),(36444,80-95),(36444,96-105),(36445,35-53),(36445,54-62),(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62)]
            store.setPartial(new range_1.Range(36436, 1, 36464, 142), [createTokens('[(36437,33-37),(36437,38-42),(36437,47-57),(36437,58-67),(36438,35-53),(36438,54-62),(36440,24-29),(36440,33-46),(36440,47-53),(36442,25-35),(36442,36-50),(36443,30-39),(36443,42-46),(36443,47-53),(36443,54-58),(36443,63-73),(36443,74-84),(36443,87-91),(36443,92-98),(36443,101-105),(36443,106-112),(36443,113-119),(36444,28-37),(36444,38-42),(36444,47-57),(36444,58-75),(36444,80-95),(36444,96-105),(36445,35-53),(36445,54-62),(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62)]')]);
            // setPartial [36457,1 -> 36485,140] [(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35),(36470,38-46),(36473,25-35),(36473,36-51),(36474,28-33),(36474,36-49),(36474,50-58),(36475,35-53),(36475,54-62),(36477,28-32),(36477,33-37),(36477,42-52),(36477,53-69),(36478,32-36),(36478,37-41),(36478,46-56),(36478,57-74),(36479,32-36),(36479,37-41),(36479,46-56),(36479,57-76),(36480,32-36),(36480,37-41),(36480,46-56),(36480,57-68),(36481,32-36),(36481,37-41),(36481,46-56),(36481,57-68),(36482,39-57),(36482,58-66),(36484,34-38),(36484,39-45),(36484,46-50),(36484,55-65),(36484,66-82),(36484,86-97),(36484,98-102),(36484,103-109),(36484,111-124),(36484,125-133),(36485,39-57),(36485,58-66)]
            store.setPartial(new range_1.Range(36457, 1, 36485, 140), [createTokens('[(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35),(36470,38-46),(36473,25-35),(36473,36-51),(36474,28-33),(36474,36-49),(36474,50-58),(36475,35-53),(36475,54-62),(36477,28-32),(36477,33-37),(36477,42-52),(36477,53-69),(36478,32-36),(36478,37-41),(36478,46-56),(36478,57-74),(36479,32-36),(36479,37-41),(36479,46-56),(36479,57-76),(36480,32-36),(36480,37-41),(36480,46-56),(36480,57-68),(36481,32-36),(36481,37-41),(36481,46-56),(36481,57-68),(36482,39-57),(36482,58-66),(36484,34-38),(36484,39-45),(36484,46-50),(36484,55-65),(36484,66-82),(36484,86-97),(36484,98-102),(36484,103-109),(36484,111-124),(36484,125-133),(36485,39-57),(36485,58-66)]')]);
            // setPartial [36441,1 -> 36469,56] [(36442,25-35),(36442,36-50),(36443,30-39),(36443,42-46),(36443,47-53),(36443,54-58),(36443,63-73),(36443,74-84),(36443,87-91),(36443,92-98),(36443,101-105),(36443,106-112),(36443,113-119),(36444,28-37),(36444,38-42),(36444,47-57),(36444,58-75),(36444,80-95),(36444,96-105),(36445,35-53),(36445,54-62),(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35)]
            store.setPartial(new range_1.Range(36441, 1, 36469, 56), [createTokens('[(36442,25-35),(36442,36-50),(36443,30-39),(36443,42-46),(36443,47-53),(36443,54-58),(36443,63-73),(36443,74-84),(36443,87-91),(36443,92-98),(36443,101-105),(36443,106-112),(36443,113-119),(36444,28-37),(36444,38-42),(36444,47-57),(36444,58-75),(36444,80-95),(36444,96-105),(36445,35-53),(36445,54-62),(36448,24-29),(36448,33-46),(36448,47-54),(36450,25-35),(36450,36-50),(36451,28-33),(36451,36-49),(36451,50-57),(36452,35-53),(36452,54-62),(36454,33-38),(36454,41-54),(36454,55-60),(36455,35-53),(36455,54-62),(36457,33-44),(36457,45-49),(36457,50-56),(36457,62-83),(36457,84-88),(36458,35-53),(36458,54-62),(36460,33-37),(36460,38-42),(36460,47-57),(36460,58-67),(36461,35-53),(36461,54-62),(36463,34-38),(36463,39-45),(36463,46-51),(36463,54-63),(36463,64-71),(36463,76-80),(36463,81-87),(36463,88-92),(36463,97-107),(36463,108-119),(36464,35-53),(36464,54-62),(36466,33-71),(36466,72-76),(36467,35-53),(36467,54-62),(36469,24-29),(36469,33-46),(36469,47-54),(36470,24-35)]')]);
            const lineTokens = store.addSparseTokens(36451, new lineTokens_1.LineTokens(new Uint32Array([60, 1]), `                        if (flags & ModifierFlags.Ambient) {`, codec));
            assert.strictEqual(lineTokens.getCount(), 7);
        });
        test('issue #95949: Identifiers are colored in bold when targetting keywords', () => {
            function createTMMetadata(foreground, fontStyle, languageId) {
                return ((languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                    | (fontStyle << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
                    | (foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0;
            }
            function toArr(lineTokens) {
                const r = [];
                for (let i = 0; i < lineTokens.getCount(); i++) {
                    r.push(lineTokens.getEndOffset(i));
                    r.push(lineTokens.getMetadata(i));
                }
                return r;
            }
            const codec = new languagesRegistry_1.LanguageIdCodec();
            const store = new sparseTokensStore_1.SparseTokensStore(codec);
            store.set([
                sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                    0, 6, 11, (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */,
                ]))
            ], true);
            const lineTokens = store.addSparseTokens(1, new lineTokens_1.LineTokens(new Uint32Array([
                5, createTMMetadata(5, 2 /* FontStyle.Bold */, 53),
                14, createTMMetadata(1, 0 /* FontStyle.None */, 53),
                17, createTMMetadata(6, 0 /* FontStyle.None */, 53),
                18, createTMMetadata(1, 0 /* FontStyle.None */, 53),
            ]), `const hello = 123;`, codec));
            const actual = toArr(lineTokens);
            assert.deepStrictEqual(actual, [
                5, createTMMetadata(5, 2 /* FontStyle.Bold */, 53),
                6, createTMMetadata(1, 0 /* FontStyle.None */, 53),
                11, createTMMetadata(1, 0 /* FontStyle.None */, 53),
                14, createTMMetadata(1, 0 /* FontStyle.None */, 53),
                17, createTMMetadata(6, 0 /* FontStyle.None */, 53),
                18, createTMMetadata(1, 0 /* FontStyle.None */, 53)
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zU3RvcmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC90b2tlbnNTdG9yZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUV6QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxjQUFjLEdBQUcsQ0FBWSxDQUFDO1FBRXBDLFNBQVMsZ0JBQWdCLENBQUMsS0FBZTtZQUN4QyxNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7WUFDMUIsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXRCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNsQixPQUFPLElBQUksRUFBRSxDQUFDO29CQUNiLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLGVBQWUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM1QixNQUFNO29CQUNQLENBQUM7b0JBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLElBQUksZ0JBQWdCLEtBQUssQ0FBQyxD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