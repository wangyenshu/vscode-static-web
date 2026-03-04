/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.latexBracketRules = exports.typescriptBracketRules = exports.htmlBracketRules = exports.luaBracketRules = exports.vbBracketRules = exports.phpBracketRules = exports.goBracketRules = exports.cppBracketRules = exports.rubyBracketRules = void 0;
    const standardBracketRules = [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ];
    exports.rubyBracketRules = standardBracketRules;
    exports.cppBracketRules = standardBracketRules;
    exports.goBracketRules = standardBracketRules;
    exports.phpBracketRules = standardBracketRules;
    exports.vbBracketRules = standardBracketRules;
    exports.luaBracketRules = standardBracketRules;
    exports.htmlBracketRules = [
        ['<!--', '-->'],
        ['{', '}'],
        ['(', ')']
    ];
    exports.typescriptBracketRules = [
        ['${', '}'],
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ];
    exports.latexBracketRules = [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['[', ')'],
        ['(', ']'],
        ['\\left(', '\\right)'],
        ['\\left(', '\\right.'],
        ['\\left.', '\\right)'],
        ['\\left[', '\\right]'],
        ['\\left[', '\\right.'],
        ['\\left.', '\\right]'],
        ['\\left\\{', '\\right\\}'],
        ['\\left\\{', '\\right.'],
        ['\\left.', '\\right\\}'],
        ['\\left<', '\\right>'],
        ['\\bigl(', '\\bigr)'],
        ['\\bigl[', '\\bigr]'],
        ['\\bigl\\{', '\\bigr\\}'],
        ['\\Bigl(', '\\Bigr)'],
        ['\\Bigl[', '\\Bigr]'],
        ['\\Bigl\\{', '\\Bigr\\}'],
        ['\\biggl(', '\\biggr)'],
        ['\\biggl[', '\\biggr]'],
        ['\\biggl\\{', '\\biggr\\}'],
        ['\\Biggl(', '\\Biggr)'],
        ['\\Biggl[', '\\Biggr]'],
        ['\\Biggl\\{', '\\Biggr\\}'],
        ['\\langle', '\\rangle'],
        ['\\lvert', '\\rvert'],
        ['\\lVert', '\\rVert'],
        ['\\left|', '\\right|'],
        ['\\left\\vert', '\\right\\vert'],
        ['\\left\\|', '\\right\\|'],
        ['\\left\\Vert', '\\right\\Vert'],
        ['\\left\\langle', '\\right\\rangle'],
        ['\\left\\lvert', '\\right\\rvert'],
        ['\\left\\lVert', '\\right\\rVert'],
        ['\\bigl\\langle', '\\bigr\\rangle'],
        ['\\bigl|', '\\bigr|'],
        ['\\bigl\\vert', '\\bigr\\vert'],
        ['\\bigl\\lvert', '\\bigr\\rvert'],
        ['\\bigl\\|', '\\bigr\\|'],
        ['\\bigl\\lVert', '\\bigr\\rVert'],
        ['\\bigl\\Vert', '\\bigr\\Vert'],
        ['\\Bigl\\langle', '\\Bigr\\rangle'],
        ['\\Bigl|', '\\Bigr|'],
        ['\\Bigl\\lvert', '\\Bigr\\rvert'],
        ['\\Bigl\\vert', '\\Bigr\\vert'],
        ['\\Bigl\\|', '\\Bigr\\|'],
        ['\\Bigl\\lVert', '\\Bigr\\rVert'],
        ['\\Bigl\\Vert', '\\Bigr\\Vert'],
        ['\\biggl\\langle', '\\biggr\\rangle'],
        ['\\biggl|', '\\biggr|'],
        ['\\biggl\\lvert', '\\biggr\\rvert'],
        ['\\biggl\\vert', '\\biggr\\vert'],
        ['\\biggl\\|', '\\biggr\\|'],
        ['\\biggl\\lVert', '\\biggr\\rVert'],
        ['\\biggl\\Vert', '\\biggr\\Vert'],
        ['\\Biggl\\langle', '\\Biggr\\rangle'],
        ['\\Biggl|', '\\Biggr|'],
        ['\\Biggl\\lvert', '\\Biggr\\rvert'],
        ['\\Biggl\\vert', '\\Biggr\\vert'],
        ['\\Biggl\\|', '\\Biggr\\|'],
        ['\\Biggl\\lVert', '\\Biggr\\rVert'],
        ['\\Biggl\\Vert', '\\Biggr\\Vert']
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFJ1bGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVzL3N1cHBvcnRzL2JyYWNrZXRSdWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBTSxvQkFBb0IsR0FBb0I7UUFDN0MsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0tBQ1YsQ0FBQztJQUVXLFFBQUEsZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUM7SUFFeEMsUUFBQSxlQUFlLEdBQUcsb0JBQW9CLENBQUM7SUFFdkMsUUFBQSxjQUFjLEdBQUcsb0JBQW9CLENBQUM7SUFFdEMsUUFBQSxlQUFlLEdBQUcsb0JBQW9CLENBQUM7SUFFdkMsUUFBQSxjQUFjLEdBQUcsb0JBQW9CLENBQUM7SUFFdEMsUUFBQSxlQUFlLEdBQUcsb0JBQW9CLENBQUM7SUFFdkMsUUFBQSxnQkFBZ0IsR0FBb0I7UUFDaEQsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ2YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0tBQ1YsQ0FBQztJQUVXLFFBQUEsc0JBQXNCLEdBQW9CO1FBQ3RELENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztRQUNYLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztLQUNWLENBQUM7SUFFVyxRQUFBLGlCQUFpQixHQUFvQjtRQUNqRCxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDVixDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7UUFDdkIsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDO1FBQ3ZCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQztRQUN2QixDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7UUFDdkIsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDO1FBQ3ZCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQztRQUN2QixDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7UUFDM0IsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDO1FBQ3pCLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQztRQUN6QixDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7UUFDdkIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO1FBQ3RCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztRQUN0QixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7UUFDMUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO1FBQ3RCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztRQUN0QixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7UUFDMUIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hCLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4QixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUM7UUFDNUIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hCLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4QixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUM7UUFDNUIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztRQUN0QixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7UUFDdEIsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDO1FBQ3ZCLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQztRQUNqQyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7UUFDM0IsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO1FBQ2pDLENBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUM7UUFDckMsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUM7UUFDbkMsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUM7UUFDbkMsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQztRQUNwQyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7UUFDdEIsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO1FBQ2hDLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQztRQUNsQyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7UUFDMUIsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDO1FBQ2xDLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztRQUNoQyxDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDO1FBQ3BDLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztRQUN0QixDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUM7UUFDbEMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO1FBQ2hDLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQztRQUMxQixDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUM7UUFDbEMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO1FBQ2hDLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUM7UUFDdEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hCLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUM7UUFDcEMsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDO1FBQ2xDLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQztRQUM1QixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDO1FBQ3BDLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQztRQUNsQyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO1FBQ3RDLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4QixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDO1FBQ3BDLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQztRQUNsQyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUM7UUFDNUIsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQztRQUNwQyxDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUM7S0FDbEMsQ0FBQyJ9