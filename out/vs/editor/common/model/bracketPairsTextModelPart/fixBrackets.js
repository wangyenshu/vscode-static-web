/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/parser", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/tokenizer"], function (require, exports, brackets_1, length_1, parser_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fixBracketsInLine = fixBracketsInLine;
    function fixBracketsInLine(tokens, languageConfigurationService) {
        const denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
        const bracketTokens = new brackets_1.LanguageAgnosticBracketTokens(denseKeyProvider, (languageId) => languageConfigurationService.getLanguageConfiguration(languageId));
        const tokenizer = new tokenizer_1.TextBufferTokenizer(new StaticTokenizerSource([tokens]), bracketTokens);
        const node = (0, parser_1.parseDocument)(tokenizer, [], undefined, true);
        let str = '';
        const line = tokens.getLineContent();
        function processNode(node, offset) {
            if (node.kind === 2 /* AstNodeKind.Pair */) {
                processNode(node.openingBracket, offset);
                offset = (0, length_1.lengthAdd)(offset, node.openingBracket.length);
                if (node.child) {
                    processNode(node.child, offset);
                    offset = (0, length_1.lengthAdd)(offset, node.child.length);
                }
                if (node.closingBracket) {
                    processNode(node.closingBracket, offset);
                    offset = (0, length_1.lengthAdd)(offset, node.closingBracket.length);
                }
                else {
                    const singleLangBracketTokens = bracketTokens.getSingleLanguageBracketTokens(node.openingBracket.languageId);
                    const closingTokenText = singleLangBracketTokens.findClosingTokenText(node.openingBracket.bracketIds);
                    str += closingTokenText;
                }
            }
            else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
                // remove the bracket
            }
            else if (node.kind === 0 /* AstNodeKind.Text */ || node.kind === 1 /* AstNodeKind.Bracket */) {
                str += line.substring((0, length_1.lengthGetColumnCountIfZeroLineCount)(offset), (0, length_1.lengthGetColumnCountIfZeroLineCount)((0, length_1.lengthAdd)(offset, node.length)));
            }
            else if (node.kind === 4 /* AstNodeKind.List */) {
                for (const child of node.children) {
                    processNode(child, offset);
                    offset = (0, length_1.lengthAdd)(offset, child.length);
                }
            }
        }
        processNode(node, length_1.lengthZero);
        return str;
    }
    class StaticTokenizerSource {
        constructor(lines) {
            this.lines = lines;
            this.tokenization = {
                getLineTokens: (lineNumber) => {
                    return this.lines[lineNumber - 1];
                }
            };
        }
        getValue() {
            return this.lines.map(l => l.getLineContent()).join('\n');
        }
        getLineCount() {
            return this.lines.length;
        }
        getLineLength(lineNumber) {
            return this.lines[lineNumber - 1].getLineContent().length;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4QnJhY2tldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvZml4QnJhY2tldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsOENBa0RDO0lBbERELFNBQWdCLGlCQUFpQixDQUFDLE1BQXVCLEVBQUUsNEJBQTJEO1FBQ3JILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxvQ0FBZ0IsRUFBVSxDQUFDO1FBQ3hELE1BQU0sYUFBYSxHQUFHLElBQUksd0NBQTZCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUN4Riw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FDakUsQ0FBQztRQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksK0JBQW1CLENBQ3hDLElBQUkscUJBQXFCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUNuQyxhQUFhLENBQ2IsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLElBQUEsc0JBQWEsRUFBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUzRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDYixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFckMsU0FBUyxXQUFXLENBQUMsSUFBYSxFQUFFLE1BQWM7WUFDakQsSUFBSSxJQUFJLENBQUMsSUFBSSw2QkFBcUIsRUFBRSxDQUFDO2dCQUNwQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDekMsTUFBTSxHQUFHLElBQUEsa0JBQVMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxN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