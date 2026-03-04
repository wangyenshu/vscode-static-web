define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/editor/common/modelLineProjectionData", "vs/editor/common/viewModel/monospaceLineBreaksComputer"], function (require, exports, assert, utils_1, editorOptions_1, fontInfo_1, modelLineProjectionData_1, monospaceLineBreaksComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseAnnotatedText(annotatedText) {
        let text = '';
        let currentLineIndex = 0;
        const indices = [];
        for (let i = 0, len = annotatedText.length; i < len; i++) {
            if (annotatedText.charAt(i) === '|') {
                currentLineIndex++;
            }
            else {
                text += annotatedText.charAt(i);
                indices[text.length - 1] = currentLineIndex;
            }
        }
        return { text: text, indices: indices };
    }
    function toAnnotatedText(text, lineBreakData) {
        // Insert line break markers again, according to algorithm
        let actualAnnotatedText = '';
        if (lineBreakData) {
            let previousLineIndex = 0;
            for (let i = 0, len = text.length; i < len; i++) {
                const r = lineBreakData.translateToOutputPosition(i);
                if (previousLineIndex !== r.outputLineIndex) {
                    previousLineIndex = r.outputLineIndex;
                    actualAnnotatedText += '|';
                }
                actualAnnotatedText += text.charAt(i);
            }
        }
        else {
            // No wrapping
            actualAnnotatedText = text;
        }
        return actualAnnotatedText;
    }
    function getLineBreakData(factory, tabSize, breakAfter, columnsForFullWidthChar, wrappingIndent, wordBreak, text, previousLineBreakData) {
        const fontInfo = new fontInfo_1.FontInfo({
            pixelRatio: 1,
            fontFamily: 'testFontFamily',
            fontWeight: 'normal',
            fontSize: 14,
            fontFeatureSettings: '',
            fontVariationSettings: '',
            lineHeight: 19,
            letterSpacing: 0,
            isMonospace: true,
            typicalHalfwidthCharacterWidth: 7,
            typicalFullwidthCharacterWidth: 7 * columnsForFullWidthChar,
            canUseHalfwidthRightwardsArrow: true,
            spaceWidth: 7,
            middotWidth: 7,
            wsmiddotWidth: 7,
            maxDigitWidth: 7
        }, false);
        const lineBreaksComputer = factory.createLineBreaksComputer(fontInfo, tabSize, breakAfter, wrappingIndent, wordBreak);
        const previousLineBreakDataClone = previousLineBreakData ? new modelLineProjectionData_1.ModelLineProjectionData(null, null, previousLineBreakData.breakOffsets.slice(0), previousLineBreakData.breakOffsetsVisibleColumn.slice(0), previousLineBreakData.wrappedTextIndentLength) : null;
        lineBreaksComputer.addRequest(text, null, previousLineBreakDataClone);
        return lineBreaksComputer.finalize()[0];
    }
    function assertLineBreaks(factory, tabSize, breakAfter, annotatedText, wrappingIndent = 0 /* WrappingIndent.None */, wordBreak = 'normal') {
        // Create version of `annotatedText` with line break markers removed
        const text = parseAnnotatedText(annotatedText).text;
        const lineBreakData = getLineBreakData(factory, tabSize, breakAfter, 2, wrappingIndent, wordBreak, text, null);
        const actualAnnotatedText = toAnnotatedText(text, lineBreakData);
        assert.strictEqual(actualAnnotatedText, annotatedText);
        return lineBreakData;
    }
    suite('Editor ViewModel - MonospaceLineBreaksComputer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('MonospaceLineBreaksComputer', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('(', '\t).');
            // Empty string
            assertLineBreaks(factory, 4, 5, '');
            // No wrapping if not necessary
            assertLineBreaks(factory, 4, 5, 'aaa');
            assertLineBreaks(factory, 4, 5, 'aaaaa');
            assertLineBreaks(factory, 4, -1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
            // Acts like hard wrapping if no char found
            assertLineBreaks(factory, 4, 5, 'aaaaa|a');
            // Honors wrapping character
            assertLineBreaks(factory, 4, 5, 'aaaaa|.');
            assertLineBreaks(factory, 4, 5, 'aaaaa|a.|aaa.|aa');
            assertLineBreaks(factory, 4, 5, 'aaaaa|a..|aaa.|aa');
            assertLineBreaks(factory, 4, 5, 'aaaaa|a...|aaa.|aa');
            assertLineBreaks(factory, 4, 5, 'aaaaa|a....|aaa.|aa');
            // Honors tabs when computing wrapping position
            assertLineBreaks(factory, 4, 5, '\t');
            assertLineBreaks(factory, 4, 5, '\t|aaa');
            assertLineBreaks(factory, 4, 5, '\t|a\t|aa');
            assertLineBreaks(factory, 4, 5, 'aa\ta');
            assertLineBreaks(factory, 4, 5, 'aa\t|aa');
            // Honors wrapping before characters (& gives it priority)
            assertLineBreaks(factory, 4, 5, 'aaa.|aa');
            assertLineBreaks(factory, 4, 5, 'aaa(.|aa');
            // Honors wrapping after characters (& gives it priority)
            assertLineBreaks(factory, 4, 5, 'aaa))|).aaa');
            assertLineBreaks(factory, 4, 5, 'aaa))|).|aaaa');
            assertLineBreaks(factory, 4, 5, 'aaa)|().|aaa');
            assertLineBreaks(factory, 4, 5, 'aaa|(().|aaa');
            assertLineBreaks(factory, 4, 5, 'aa.|(().|aaa');
            assertLineBreaks(factory, 4, 5, 'aa.|(.).|aaa');
        });
        function assertLineBreakDataEqual(a, b) {
            if (!a || !b) {
                assert.deepStrictEqual(a, b);
                return;
            }
            assert.deepStrictEqual(a.breakOffsets, b.breakOffsets);
            assert.deepStrictEqual(a.wrappedTextIndentLength, b.wrappedTextIndentLength);
            for (let i = 0; i < a.breakOffsetsVisibleColumn.length; i++) {
                const diff = a.breakOffsetsVisibleColumn[i] - b.breakOffsetsVisibleColumn[i];
                assert.ok(diff < 0.001);
            }
        }
        function assertIncrementalLineBreaks(factory, text, tabSize, breakAfter1, annotatedText1, breakAfter2, annotatedText2, wrappingIndent = 0 /* WrappingIndent.None */, columnsForFullWidthChar = 2) {
            // sanity check the test
            assert.strictEqual(text, parseAnnotatedText(annotatedText1).text);
            assert.strictEqual(text, parseAnnotatedText(annotatedText2).text);
            // check that the direct mapping is ok for 1
            const directLineBreakData1 = getLineBreakData(factory, tabSize, breakAfter1, columnsForFullWidthChar, wrappingIndent, 'normal', text, null);
            assert.strictEqual(toAnnotatedText(text, directLineBreakData1), annotatedText1);
            // check that the direct mapping is ok for 2
            const directLineBreakData2 = getLineBreakData(factory, tabSize, breakAfter2, columnsForFullWidthChar, wrappingIndent, 'normal', text, null);
            assert.strictEqual(toAnnotatedText(text, directLineBreakData2), annotatedText2);
            // check that going from 1 to 2 is ok
            const lineBreakData2from1 = getLineBreakData(factory, tabSize, breakAfter2, columnsForFullWidthChar, wrappingIndent, 'normal', text, directLineBreakData1);
            assert.strictEqual(toAnnotatedText(text, lineBreakData2from1), annotatedText2);
            assertLineBreakDataEqual(lineBreakData2from1, directLineBreakData2);
            // check that going from 2 to 1 is ok
            const lineBreakData1from2 = getLineBreakData(factory, tabSize, breakAfter1, columnsForFullWidthChar, wrappingIndent, 'normal', text, directLineBreakData2);
            assert.strictEqual(toAnnotatedText(text, lineBreakData1from2), annotatedText1);
            assertLineBreakDataEqual(lineBreakData1from2, directLineBreakData1);
        }
        test('MonospaceLineBreaksComputer incremental 1', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertIncrementalLineBreaks(factory, 'just some text and more', 4, 10, 'just some |text and |more', 15, 'just some text |and more');
            assertIncrementalLineBreaks(factory, 'Cu scripserit suscipiantur eos, in affert pericula contentiones sed, cetero sanctus et pro. Ius vidit magna regione te, sit ei elaboraret liberavisse. Mundi verear eu mea, eam vero scriptorem in, vix in menandri assueverit. Natum definiebas cu vim. Vim doming vocibus efficiantur id. In indoctum deseruisse voluptatum vim, ad debitis verterem sed.', 4, 47, 'Cu scripserit suscipiantur eos, in affert |pericula contentiones sed, cetero sanctus et |pro. Ius vidit magna regione te, sit ei |elaboraret liberavisse. Mundi verear eu mea, |eam vero scriptorem in, vix in menandri |assueverit. Natum definiebas cu vim. Vim |doming vocibus efficiantur id. In indoctum |deseruisse voluptatum vim, ad debitis verterem |sed.', 142, 'Cu scripserit suscipiantur eos, in affert pericula contentiones sed, cetero sanctus et pro. Ius vidit magna regione te, sit ei elaboraret |liberavisse. Mundi verear eu mea, eam vero scriptorem in, vix in menandri assueverit. Natum definiebas cu vim. Vim doming vocibus efficiantur |id. In indoctum deseruisse voluptatum vim, ad debitis verterem sed.');
            assertIncrementalLineBreaks(factory, 'An his legere persecuti, oblique delicata efficiantur ex vix, vel at graecis officiis maluisset. Et per impedit voluptua, usu discere maiorum at. Ut assum ornatus temporibus vis, an sea melius pericula. Ea dicunt oblique phaedrum nam, eu duo movet nobis. His melius facilis eu, vim malorum temporibus ne. Nec no sale regione, meliore civibus placerat id eam. Mea alii fabulas definitionem te, agam volutpat ad vis, et per bonorum nonumes repudiandae.', 4, 57, 'An his legere persecuti, oblique delicata efficiantur ex |vix, vel at graecis officiis maluisset. Et per impedit |voluptua, usu discere maiorum at. Ut assum ornatus |temporibus vis, an sea melius pericula. Ea dicunt |oblique phaedrum nam, eu duo movet nobis. His melius |facilis eu, vim malorum temporibus ne. Nec no sale |regione, meliore civibus placerat id eam. Mea alii |fabulas definitionem te, agam volutpat ad vis, et per |bonorum nonumes repudiandae.', 58, 'An his legere persecuti, oblique delicata efficiantur ex |vix, vel at graecis officiis maluisset. Et per impedit |voluptua, usu discere maiorum at. Ut assum ornatus |temporibus vis, an sea melius pericula. Ea dicunt oblique |phaedrum nam, eu duo movet nobis. His melius facilis eu, |vim malorum temporibus ne. Nec no sale regione, meliore |civibus placerat id eam. Mea alii fabulas definitionem |te, agam volutpat ad vis, et per bonorum nonumes |repudiandae.');
            assertIncrementalLineBreaks(factory, '\t\t"owner": "vscode",', 4, 14, '\t\t"owner|": |"vscod|e",', 16, '\t\t"owner":| |"vscode"|,', 1 /* WrappingIndent.Same */);
            assertIncrementalLineBreaks(factory, '🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇&👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬', 4, 51, '🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇&|👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬', 50, '🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇|&|👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬', 1 /* WrappingIndent.Same */);
            assertIncrementalLineBreaks(factory, '🐇👬&🌞🌖', 4, 5, '🐇👬&|🌞🌖', 4, '🐇👬|&|🌞🌖', 1 /* WrappingIndent.Same */);
            assertIncrementalLineBreaks(factory, '\t\tfunc(\'🌞🏇🍼🌞🏇🍼🐇&👬🌖🌞👬🌖🌞🏇🍼🐇👬\', WrappingIndent.Same);', 4, 26, '\t\tfunc|(\'🌞🏇🍼🌞🏇🍼🐇&|👬🌖🌞👬🌖🌞🏇🍼🐇|👬\', |WrappingIndent.|Same);', 27, '\t\tfunc|(\'🌞🏇🍼🌞🏇🍼🐇&|👬🌖🌞👬🌖🌞🏇🍼🐇|👬\', |WrappingIndent.|Same);', 1 /* WrappingIndent.Same */);
            assertIncrementalLineBreaks(factory, 'factory, "xtxtfunc(x"🌞🏇🍼🌞🏇🍼🐇&👬🌖🌞👬🌖🌞🏇🍼🐇👬x"', 4, 16, 'factory, |"xtxtfunc|(x"🌞🏇🍼🌞🏇🍼|🐇&|👬🌖🌞👬🌖🌞🏇🍼|🐇👬x"', 17, 'factory, |"xtxtfunc|(x"🌞🏇🍼🌞🏇🍼🐇|&👬🌖🌞👬🌖🌞🏇🍼|🐇👬x"', 1 /* WrappingIndent.Same */);
        });
        test('issue #95686: CRITICAL: loop forever on the monospaceLineBreaksComputer', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertIncrementalLineBreaks(factory, '						<tr dmx-class:table-danger="(alt <= 50)" dmx-class:table-warning="(alt <= 200)" dmx-class:table-primary="(alt <= 400)" dmx-class:table-info="(alt <= 800)" dmx-class:table-success="(alt >= 400)">', 4, 179, '						<tr dmx-class:table-danger="(alt <= 50)" dmx-class:table-warning="(alt <= 200)" dmx-class:table-primary="(alt <= 400)" dmx-class:table-info="(alt <= 800)" |dmx-class:table-success="(alt >= 400)">', 1, '	|	|	|	|	|	|<|t|r| |d|m|x|-|c|l|a|s|s|:|t|a|b|l|e|-|d|a|n|g|e|r|=|"|(|a|l|t| |<|=| |5|0|)|"| |d|m|x|-|c|l|a|s|s|:|t|a|b|l|e|-|w|a|r|n|i|n|g|=|"|(|a|l|t| |<|=| |2|0|0|)|"| |d|m|x|-|c|l|a|s|s|:|t|a|b|l|e|-|p|r|i|m|a|r|y|=|"|(|a|l|t| |<|=| |4|0|0|)|"| |d|m|x|-|c|l|a|s|s|:|t|a|b|l|e|-|i|n|f|o|=|"|(|a|l|t| |<|=| |8|0|0|)|"| |d|m|x|-|c|l|a|s|s|:|t|a|b|l|e|-|s|u|c|c|e|s|s|=|"|(|a|l|t| |>|=| |4|0|0|)|"|>', 1 /* WrappingIndent.Same */);
        });
        test('issue #110392: Occasional crash when resize with panel on the right', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertIncrementalLineBreaks(factory, '你好 **hello** **hello** **hello-world** hey there!', 4, 15, '你好 **hello** |**hello** |**hello-world**| hey there!', 1, '你|好| |*|*|h|e|l|l|o|*|*| |*|*|h|e|l|l|o|*|*| |*|*|h|e|l|l|o|-|w|o|r|l|d|*|*| |h|e|y| |t|h|e|r|e|!', 1 /* WrappingIndent.Same */, 1.6605405405405405);
        });
        test('MonospaceLineBreaksComputer - CJK and Kinsoku Shori', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('(', '\t)');
            assertLineBreaks(factory, 4, 5, 'aa \u5b89|\u5b89');
            assertLineBreaks(factory, 4, 5, '\u3042 \u5b89|\u5b89');
            assertLineBreaks(factory, 4, 5, '\u3042\u3042|\u5b89\u5b89');
            assertLineBreaks(factory, 4, 5, 'aa |\u5b89)\u5b89|\u5b89');
            assertLineBreaks(factory, 4, 5, 'aa \u3042|\u5b89\u3042)|\u5b89');
            assertLineBreaks(factory, 4, 5, 'aa |(\u5b89aa|\u5b89');
        });
        test('MonospaceLineBreaksComputer - WrappingIndent.Same', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('', '\t ');
            assertLineBreaks(factory, 4, 38, ' *123456789012345678901234567890123456|7890', 1 /* WrappingIndent.Same */);
        });
        test('issue #16332: Scroll bar overlaying on top of text', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('', '\t ');
            assertLineBreaks(factory, 4, 24, 'a/ very/long/line/of/tex|t/that/expands/beyon|d/your/typical/line/|of/code/', 2 /* WrappingIndent.Indent */);
        });
        test('issue #35162: wrappingIndent not consistently working', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('', '\t ');
            const mapper = assertLineBreaks(factory, 4, 24, '                t h i s |i s |a l |o n |g l |i n |e', 2 /* WrappingIndent.Indent */);
            assert.strictEqual(mapper.wrappedTextIndentLength, '                    '.length);
        });
        test('issue #75494: surrogate pairs', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('\t', ' ');
            assertLineBreaks(factory, 4, 49, '🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼|🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼🐇👬🌖🌞🏇🍼|🐇👬', 1 /* WrappingIndent.Same */);
        });
        test('issue #75494: surrogate pairs overrun 1', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 4, '🐇👬|&|🌞🌖', 1 /* WrappingIndent.Same */);
        });
        test('issue #75494: surrogate pairs overrun 2', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 17, 'factory, |"xtxtfunc|(x"🌞🏇🍼🌞🏇🍼🐇|&👬🌖🌞👬🌖🌞🏇🍼|🐇👬x"', 1 /* WrappingIndent.Same */);
        });
        test('MonospaceLineBreaksComputer - WrappingIndent.DeepIndent', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory('', '\t ');
            const mapper = assertLineBreaks(factory, 4, 26, '        W e A r e T e s t |i n g D e |e p I n d |e n t a t |i o n', 3 /* WrappingIndent.DeepIndent */);
            assert.strictEqual(mapper.wrappedTextIndentLength, '                '.length);
        });
        test('issue #33366: Word wrap algorithm behaves differently around punctuation', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 23, 'this is a line of |text, text that sits |on a line', 1 /* WrappingIndent.Same */);
        });
        test('issue #152773: Word wrap algorithm behaves differently with bracket followed by comma', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 24, 'this is a line of |(text), text that sits |on a line', 1 /* WrappingIndent.Same */);
        });
        test('issue #112382: Word wrap doesn\'t work well with control characters', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 6, '\x06\x06\x06|\x06\x06\x06', 1 /* WrappingIndent.Same */);
        });
        test('Word break work well with Chinese/Japanese/Korean (CJK) text when setting normal', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 5, '你好|1111', 1 /* WrappingIndent.Same */, 'normal');
        });
        test('Word break work well with Chinese/Japanese/Korean (CJK) text when setting keepAll', () => {
            const factory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(editorOptions_1.EditorOptions.wordWrapBreakBeforeCharacters.defaultValue, editorOptions_1.EditorOptions.wordWrapBreakAfterCharacters.defaultValue);
            assertLineBreaks(factory, 4, 8, '你好1111', 1 /* WrappingIndent.Same */, 'keepAll');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ub3NwYWNlTGluZUJyZWFrc0NvbXB1dGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vdmlld01vZGVsL21vbm9zcGFjZUxpbmVCcmVha3NDb21wdXRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVdBLFNBQVMsa0JBQWtCLENBQUMsYUFBcUI7UUFDaEQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDekIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ3JDLGdCQUFnQixFQUFFLENBQUM7WUFDcEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsSUFBWSxFQUFFLGFBQTZDO1FBQ25GLDBEQUEwRDtRQUMxRCxJQUFJLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztRQUM3QixJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ25CLElB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