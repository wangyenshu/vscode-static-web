/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMatchers = createMatchers;
    function createMatchers(selector, matchesName, results) {
        const tokenizer = newTokenizer(selector);
        let token = tokenizer.next();
        while (token !== null) {
            let priority = 0;
            if (token.length === 2 && token.charAt(1) === ':') {
                switch (token.charAt(0)) {
                    case 'R':
                        priority = 1;
                        break;
                    case 'L':
                        priority = -1;
                        break;
                    default:
                        console.log(`Unknown priority ${token} in scope selector`);
                }
                token = tokenizer.next();
            }
            const matcher = parseConjunction();
            if (matcher) {
                results.push({ matcher, priority });
            }
            if (token !== ',') {
                break;
            }
            token = tokenizer.next();
        }
        function parseOperand() {
            if (token === '-') {
                token = tokenizer.next();
                const expressionToNegate = parseOperand();
                if (!expressionToNegate) {
                    return null;
                }
                return matcherInput => {
                    const score = expressionToNegate(matcherInput);
                    return score < 0 ? 0 : -1;
                };
            }
            if (token === '(') {
                token = tokenizer.next();
                const expressionInParents = parseInnerExpression();
                if (token === ')') {
                    token = tokenizer.next();
                }
                return expressionInParents;
            }
            if (isIdentifier(token)) {
                const identifiers = [];
                do {
                    identifiers.push(token);
                    token = tokenizer.next();
                } while (isIdentifier(token));
                return matcherInput => matchesName(identifiers, matcherInput);
            }
            return null;
        }
        function parseConjunction() {
            let matcher = parseOperand();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                matcher = parseOperand();
            }
            return matcherInput => {
                let min = matchers[0](matcherInput);
                for (let i = 1; min >= 0 && i < matchers.length; i++) {
                    min = Math.min(min, matchers[i](matcherInput));
                }
                return min;
            };
        }
        function parseInnerExpression() {
            let matcher = parseConjunction();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                if (token === '|' || token === ',') {
                    do {
                        token = tokenizer.next();
                    } while (token === '|' || token === ','); // ignore subsequent commas
                }
                else {
                    break;
                }
                matcher = parseConjunction();
            }
            return matcherInput => {
                let max = matchers[0](matcherInput);
                for (let i = 1; i < matchers.length; i++) {
                    max = Math.max(max, matchers[i](matcherInput));
                }
                return max;
            };
        }
    }
    function isIdentifier(token) {
        return !!token && !!token.match(/[\w\.:]+/);
    }
    function newTokenizer(input) {
        const regex = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g;
        let match = regex.exec(input);
        return {
            next: () => {
                if (!match) {
                    return null;
                }
                const res = match[0];
                match = regex.exec(input);
                return res;
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVTY29wZU1hdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi90ZXh0TWF0ZVNjb3BlTWF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7SUFFaEcsWUFBWSxDQUFDOztJQVdiLHdDQWtHQztJQWxHRCxTQUFnQixjQUFjLENBQUksUUFBZ0IsRUFBRSxXQUF5RCxFQUFFLE9BQWlDO1FBQy9JLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsT0FBTyxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDdkIsSUFBSSxRQUFRLEdBQWUsQ0FBQyxDQUFDO1lBQzdCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDbkQsUUFBUSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLEtBQUssR0FBRzt3QkFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDO3dCQUFDLE1BQU07b0JBQzlCLEtBQUssR0FBRzt3QkFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQUMsTUFBTTtvQkFDL0I7d0JBQ0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsS0FBSyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO2dCQUNELEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLGdCQUFnQixFQUFFLENBQUM7WUFDbkMsSUFB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