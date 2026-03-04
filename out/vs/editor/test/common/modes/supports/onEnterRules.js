/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration"], function (require, exports, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.htmlOnEnterRules = exports.cppOnEnterRules = exports.phpOnEnterRules = exports.javascriptOnEnterRules = void 0;
    exports.javascriptOnEnterRules = [
        {
            // e.g. /** | */
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: ' * ' }
        }, {
            // e.g. /** ...|
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, appendText: ' * ' }
        }, {
            // e.g.  * ...|
            beforeText: /^(\t|[ ])*[ ]\*([ ]([^\*]|\*(?!\/))*)?$/,
            previousLineText: /(?=^(\s*(\/\*\*|\*)).*)(?=(?!(\s*\*\/)))/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, appendText: '* ' }
        }, {
            // e.g.  */|
            beforeText: /^(\t|[ ])*[ ]\*\/\s*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, removeText: 1 }
        },
        {
            // e.g.  *-----*/|
            beforeText: /^(\t|[ ])*[ ]\*[^/]*\*\/\s*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, removeText: 1 }
        },
        {
            beforeText: /^\s*(\bcase\s.+:|\bdefault:)$/,
            afterText: /^(?!\s*(\bcase\b|\bdefault\b))/,
            action: { indentAction: languageConfiguration_1.IndentAction.Indent }
        },
        {
            previousLineText: /^\s*(((else ?)?if|for|while)\s*\(.*\)\s*|else\s*)$/,
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            action: { indentAction: languageConfiguration_1.IndentAction.Outdent }
        },
        // Indent when pressing enter from inside ()
        {
            beforeText: /^.*\([^\)]*$/,
            afterText: /^\s*\).*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
        // Indent when pressing enter from inside {}
        {
            beforeText: /^.*\{[^\}]*$/,
            afterText: /^\s*\}.*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
        // Indent when pressing enter from inside []
        {
            beforeText: /^.*\[[^\]]*$/,
            afterText: /^\s*\].*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
    ];
    exports.phpOnEnterRules = [
        {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.IndentOutdent,
                appendText: ' * ',
            }
        },
        {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                appendText: ' * ',
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                appendText: '* ',
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                removeText: 1,
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                removeText: 1,
            }
        },
        {
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            previousLineText: /^\s*(((else ?)?if|for(each)?|while)\s*\(.*\)\s*|else\s*)$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.Outdent
            }
        },
    ];
    exports.cppOnEnterRules = [
        {
            previousLineText: /^\s*(((else ?)?if|for|while)\s*\(.*\)\s*|else\s*)$/,
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.Outdent
            }
        }
    ];
    exports.htmlOnEnterRules = [
        {
            beforeText: /<(?!(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr))([_:\w][_:\w-.\d]*)(?:(?:[^'"/>]|"[^"]*"|'[^']*')*?(?!\/)>)[^<]*$/i,
            afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
            action: {
                indentAction: languageConfiguration_1.IndentAction.IndentOutdent
            }
        },
        {
            beforeText: /<(?!(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr))([_:\w][_:\w-.\d]*)(?:(?:[^'"/>]|"[^"]*"|'[^']*')*?(?!\/)>)[^<]*$/i,
            action: {
                indentAction: languageConfiguration_1.IndentAction.Indent
            }
        }
    ];
});
/*
export enum IndentAction {
    None = 0,
    Indent = 1,
    IndentOutdent = 2,
    Outdent = 3
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlclJ1bGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVzL3N1cHBvcnRzL29uRW50ZXJSdWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJbkYsUUFBQSxzQkFBc0IsR0FBRztRQUNyQztZQUNDLGdCQUFnQjtZQUNoQixVQUFVLEVBQUUsb0NBQW9DO1lBQ2hELFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO1NBQ3ZFLEVBQUU7WUFDRixnQkFBZ0I7WUFDaEIsVUFBVSxFQUFFLG9DQUFvQztZQUNoRCxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsb0NBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtTQUM5RCxFQUFFO1lBQ0YsZUFBZTtZQUNmLFVBQVUsRUFBRSx5Q0FBeUM7WUFDckQsZ0JBQWdCLEVBQUUsMENBQTBDO1lBQzVELE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1NBQzdELEVBQUU7WUFDRixZQUFZO1lBQ1osVUFBVSxFQUFFLHVCQUF1QjtZQUNuQyxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsb0NBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRTtTQUMxRDtRQUNEO1lBQ0Msa0JBQWtCO1lBQ2xCLFVBQVUsRUFBRSw4QkFBOEI7WUFDMUMsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLG9DQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUU7U0FDMUQ7UUFDRDtZQUNDLFVBQVUsRUFBRSwrQkFB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