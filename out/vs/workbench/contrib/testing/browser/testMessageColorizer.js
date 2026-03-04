/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/css!./media/testMessageColorizer"], function (require, exports, markdownRenderer_1, lifecycle_1, strings_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.colorizeTestMessageInEditor = exports.renderTestMessageAsText = void 0;
    const colorAttrRe = /^\x1b\[([0-9]+)m$/;
    var Classes;
    (function (Classes) {
        Classes["Prefix"] = "tstm-ansidec-";
        Classes["ForegroundPrefix"] = "tstm-ansidec-fg";
        Classes["BackgroundPrefix"] = "tstm-ansidec-bg";
        Classes["Bold"] = "tstm-ansidec-1";
        Classes["Faint"] = "tstm-ansidec-2";
        Classes["Italic"] = "tstm-ansidec-3";
        Classes["Underline"] = "tstm-ansidec-4";
    })(Classes || (Classes = {}));
    const renderTestMessageAsText = (tm) => typeof tm === 'string' ? (0, strings_1.removeAnsiEscapeCodes)(tm) : (0, markdownRenderer_1.renderStringAsPlaintext)(tm);
    exports.renderTestMessageAsText = renderTestMessageAsText;
    /**
     * Applies decorations based on ANSI styles from the test message in the editor.
     * ANSI sequences are stripped from the text displayed in editor, and this
     * re-applies their colorization.
     *
     * This uses decorations rather than language features because the string
     * rendered in the editor lacks the ANSI codes needed to actually apply the
     * colorization.
     *
     * Note: does not support TrueColor.
     */
    const colorizeTestMessageInEditor = (message, editor) => {
        const decos = [];
        editor.changeDecorations(changeAccessor => {
            let start = new position_1.Position(1, 1);
            let cls = [];
            for (const part of (0, strings_1.forAnsiStringParts)(message)) {
                if (part.isCode) {
                    const colorAttr = colorAttrRe.exec(part.str)?.[1];
                    if (!colorAttr) {
                        continue;
                    }
                    const n = Number(colorAttr);
                    if (n === 0) {
                        cls.length = 0;
                    }
                    else if (n === 22) {
                        cls = cls.filter(c => c !== "tstm-ansidec-1" /* Classes.Bold */ && c !== "tstm-ansidec-3" /* Classes.Italic */);
                    }
                    else if (n === 23) {
                        cls = cls.filter(c => c !== "tstm-ansidec-3" /* Classes.Italic */);
                    }
                    else if (n === 24) {
                        cls = cls.filter(c => c !== "tstm-ansidec-4" /* Classes.Underline */);
                    }
                    else if ((n >= 30 && n <= 39) || (n >= 90 && n <= 99)) {
                        cls = cls.filter(c => !c.startsWith("tstm-ansidec-fg" /* Classes.ForegroundPrefix */));
                        cls.push("tstm-ansidec-fg" /* Classes.ForegroundPrefix */ + colorAttr);
                    }
                    else if ((n >= 40 && n <= 49) || (n >= 100 && n <= 109)) {
                        cls = cls.filter(c => !c.startsWith("tstm-ansidec-bg" /* Classes.BackgroundPrefix */));
                        cls.push("tstm-ansidec-bg" /* Classes.BackgroundPrefix */ + colorAttr);
                    }
                    else {
                        cls.push("tstm-ansidec-" /* Classes.Prefix */ + colorAttr);
                    }
                }
                else {
                    let line = start.lineNumber;
                    let col = start.column;
                    const graphemes = new strings_1.GraphemeIterator(part.str);
                    for (let i = 0; !graphemes.eol(); i += graphemes.nextGraphemeLength()) {
                        if (part.str[i] === '\n') {
                            line++;
                            col = 1;
                        }
                        else {
                            col++;
                        }
                    }
                    const end = new position_1.Position(line, col);
                    if (cls.length) {
                        decos.push(changeAccessor.addDecoration(range_1.Range.fromPositions(start, end), {
                            inlineClassName: cls.join(' '),
                            description: 'test-message-colorized',
                        }));
                    }
                    start = end;
                }
            }
        });
        return (0, lifecycle_1.toDisposable)(() => editor.removeDecorations(decos));
    };
    exports.colorizeTestMessageInEditor = colorizeTestMessageInEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE1lc3NhZ2VDb2xvcml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdE1lc3NhZ2VDb2xvcml6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQU0sV0FBVyxHQUFHLG1CQUFtQixDQUFDO0lBRXhDLElBQVcsT0FRVjtJQVJELFdBQVcsT0FBTztRQUNqQixtQ0FBd0IsQ0FBQTtRQUN4QiwrQ0FBd0MsQ0FBQTtRQUN4QywrQ0FBd0MsQ0FBQTtRQUN4QyxrQ0FBMkIsQ0FBQTtRQUMzQixtQ0FBNEIsQ0FBQTtRQUM1QixvQ0FBNkIsQ0FBQTtRQUM3Qix1Q0FBZ0MsQ0FBQTtJQUNqQyxDQUFDLEVBUlUsT0FBTyxLQUFQLE9BQU8sUUFRakI7SUFFTSxNQUFNLHVCQUF1QixHQUFHLENBQUMsRUFBNEIsRUFBRSxFQUFFLENBQ3ZFLE9BQU8sRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSwrQkFBcUIsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSwwQ0FBdUIsRUFBQyxFQUFFLENBQUMsQ0FBQztJQURyRSxRQUFBLHVCQUF1QiwyQkFDOEM7SUFHbEY7Ozs7Ozs7Ozs7T0FVRztJQUNJLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxPQUFlLEVBQUUsTUFBd0IsRUFBZSxFQUFFO1FBQ3JHLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztRQUUzQixNQUFNLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDekMsSUFBSSxLQUFLLEdBQUcsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFJLEdBQUcsR0FBYSxFQUFFLENBQUM7WUFDdkIsS0FBSyxN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