/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, json_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SmartSnippetInserter = void 0;
    class SmartSnippetInserter {
        static hasOpenBrace(scanner) {
            while (scanner.scan() !== 17 /* JSONSyntaxKind.EOF */) {
                const kind = scanner.getToken();
                if (kind === 1 /* JSONSyntaxKind.OpenBraceToken */) {
                    return true;
                }
            }
            return false;
        }
        static offsetToPosition(model, offset) {
            let offsetBeforeLine = 0;
            const eolLength = model.getEOL().length;
            const lineCount = model.getLineCount();
            for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
                const lineTotalLength = model.getLineLength(lineNumber) + eolLength;
                const offsetAfterLine = offsetBeforeLine + lineTotalLength;
                if (offsetAfterLine > offset) {
                    return new position_1.Position(lineNumber, offset - offsetBeforeLine + 1);
                }
                offsetBeforeLine = offsetAfterLine;
            }
            return new position_1.Position(lineCount, model.getLineMaxColumn(lineCount));
        }
        static insertSnippet(model, _position) {
            const desiredPosition = model.getValueLengthInRange(new range_1.Range(1, 1, _position.lineNumber, _position.column));
            // <INVALID> [ <BEFORE_OBJECT> { <INVALID> } <AFTER_OBJECT>, <BEFORE_OBJECT> { <INVALID> } <AFTER_OBJECT> ] <INVALID>
            let State;
            (function (State) {
                State[State["INVALID"] = 0] = "INVALID";
                State[State["AFTER_OBJECT"] = 1] = "AFTER_OBJECT";
                State[State["BEFORE_OBJECT"] = 2] = "BEFORE_OBJECT";
            })(State || (State = {}));
            let currentState = State.INVALID;
            let lastValidPos = -1;
            let lastValidState = State.INVALID;
            const scanner = (0, json_1.createScanner)(model.getValue());
            let arrayLevel = 0;
            let objLevel = 0;
            const checkRangeStatus = (pos, state) => {
                if (state !== State.INVALID && arrayLevel === 1 && objLevel === 0) {
                    currentState = state;
                    lastValidPos = pos;
                    lastValidState = state;
                }
                else {
                    if (currentState !== State.INVALID) {
                        currentState = State.INVALID;
                        lastValidPos = scanner.getTokenOffset();
                    }
                }
            };
            while (scanner.scan() !== 17 /* JSONSyntaxKind.EOF */) {
                const currentPos = scanner.getPosition();
                const kind = scanner.getToken();
                let goodKind = false;
                switch (kind) {
                    case 3 /* JSONSyntaxKind.OpenBracketToken */:
                        goodKind = true;
                        arrayLevel++;
                        checkRangeStatus(currentPos, State.BEFORE_OBJECT);
                        break;
                    case 4 /* JSONSyntaxKind.CloseBracketToken */:
                        goodKind = true;
                        arrayLevel--;
                        checkRangeStatus(currentPos, State.INVALID);
                        break;
                    case 5 /* JSONSyntaxKind.CommaToken */:
                        goodKind = true;
                        checkRangeStatus(currentPos, State.BEFORE_OBJECT);
                        break;
                    case 1 /* JSONSyntaxKind.OpenBraceToken */:
                        goodKind = true;
                        objLevel++;
                        checkRangeStatus(currentPos, State.INVALID);
                        break;
                    case 2 /* JSONSyntaxKind.CloseBraceToken */:
                        goodKind = true;
                        objLevel--;
                        checkRangeStatus(currentPos, State.AFTER_OBJECT);
                        break;
                    case 15 /* JSONSyntaxKind.Trivia */:
                    case 14 /* JSONSyntaxKind.LineBreakTrivia */:
                        goodKind = true;
                }
                if (currentPos >= desiredPosition && (currentState !== State.INVALID || lastValidPos !== -1)) {
                    let acceptPosition;
                    let acceptState;
                    if (currentState !== State.INVALID) {
                        acceptPosition = (goodKind ? currentPos : scanner.getTokenOffset());
                        acceptState = currentState;
                    }
                    else {
                        acceptPosition = lastValidPos;
                        acceptState = lastValidState;
                    }
                    if (acceptState === State.AFTER_OBJECT) {
                        return {
                            position: this.offsetToPosition(model, acceptPosition),
                            prepend: ',',
                            append: ''
                        };
                    }
                    else {
                        scanner.setPosition(acceptPosition);
                        return {
                            position: this.offsetToPosition(model, acceptPosition),
                            prepend: '',
                            append: this.hasOpenBrace(scanner) ? ',' : ''
                        };
                    }
                }
            }
            // no valid position found!
            const modelLineCount = model.getLineCount();
            return {
                position: new position_1.Position(modelLineCount, model.getLineMaxColumn(modelLineCount)),
                prepend: '\n[',
                append: ']'
            };
        }
    }
    exports.SmartSnippetInserter = SmartSnippetInserter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcnRTbmlwcGV0SW5zZXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9jb21tb24vc21hcnRTbmlwcGV0SW5zZXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsb0JBQW9CO1FBRXhCLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBb0I7WUFFL0MsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLGdDQUF1QixFQUFFLENBQUM7Z0JBQzlDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFFaEMsSUFBSSxJQUFJLDBDQUFrQyxFQUFFLENBQUM7b0JBQzVDLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQWlCLEVBQUUsTUFBYztZQUNoRSxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUN6QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDO1lBQ3hDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QyxLQUFLLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxVQUFVLElBQUksU0FBUyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hFLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsU0FBUyxDQUFDO2dCQUNwRSxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7Z0JBRTNELElBQUksZUFBZSxHQUFHLE1BQU0sRUFBRSxDQUFDO29CQUM5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