var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageService", "vs/editor/contrib/linesOperations/browser/moveLinesCommand", "vs/editor/test/browser/testCommand", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, lifecycle_1, utils_1, selection_1, language_1, languageConfigurationRegistry_1, languageService_1, moveLinesCommand_1, testCommand_1, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MoveLinesDirection;
    (function (MoveLinesDirection) {
        MoveLinesDirection[MoveLinesDirection["Up"] = 0] = "Up";
        MoveLinesDirection[MoveLinesDirection["Down"] = 1] = "Down";
    })(MoveLinesDirection || (MoveLinesDirection = {}));
    function testMoveLinesDownCommand(lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        testMoveLinesUpOrDownCommand(1 /* MoveLinesDirection.Down */, lines, selection, expectedLines, expectedSelection, languageConfigurationService);
    }
    function testMoveLinesUpCommand(lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        testMoveLinesUpOrDownCommand(0 /* MoveLinesDirection.Up */, lines, selection, expectedLines, expectedSelection, languageConfigurationService);
    }
    function testMoveLinesDownWithIndentCommand(languageId, lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        testMoveLinesUpOrDownWithIndentCommand(1 /* MoveLinesDirection.Down */, languageId, lines, selection, expectedLines, expectedSelection, languageConfigurationService);
    }
    function testMoveLinesUpWithIndentCommand(languageId, lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        testMoveLinesUpOrDownWithIndentCommand(0 /* MoveLinesDirection.Up */, languageId, lines, selection, expectedLines, expectedSelection, languageConfigurationService);
    }
    function testMoveLinesUpOrDownCommand(direction, lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        const disposables = new lifecycle_1.DisposableStore();
        if (!languageConfigurationService) {
            languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
        }
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new moveLinesCommand_1.MoveLinesCommand(sel, direction === 0 /* MoveLinesDirection.Up */ ? false : true, 3 /* EditorAutoIndentStrategy.Advanced */, languageConfigurationService), expectedLines, expectedSelection);
        disposables.dispose();
    }
    function testMoveLinesUpOrDownWithIndentCommand(direction, languageId, lines, selection, expectedLines, expectedSelection, languageConfigurationService) {
        const disposables = new lifecycle_1.DisposableStore();
        if (!languageConfigurationService) {
            languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
        }
        (0, testCommand_1.testCommand)(lines, languageId, selection, (accessor, sel) => new moveLinesCommand_1.MoveLinesCommand(sel, direction === 0 /* MoveLinesDirection.Up */ ? false : true, 4 /* EditorAutoIndentStrategy.Full */, languageConfigurationService), expectedLines, expectedSelection);
        disposables.dispose();
    }
    suite('Editor Contrib - Move Lines Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('move first up / last down disabled', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1));
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1));
        });
        test('move first line down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 2, 1));
        });
        test('move 2nd line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 2, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('issue #1322a: move 2nd line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 12, 2, 12), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 12, 1, 12));
        });
        test('issue #1322b: move last line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 6, 4, 6));
        });
        test('issue #1322c: move last line selected up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 6, 4, 1));
        });
        test('move last line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 1, 4, 1));
        });
        test('move 4th line down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 4, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(5, 1, 5, 1));
        });
        test('move multiple lines down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 4, 2, 2), [
                'first',
                'fifth',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(5, 4, 3, 2));
        });
        test('invisible selection is ignored', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 1, 2, 1));
        });
    });
    let IndentRulesMode = class IndentRulesMode extends lifecycle_1.Disposable {
        constructor(indentationRules, languageService, languageConfigurationService) {
            super();
            this.languageId = 'moveLinesIndentMode';
            this._register(languageService.registerLanguage({ id: this.languageId }));
            this._register(languageConfigurationService.register(this.languageId, {
                indentationRules: indentationRules
            }));
        }
    };
    IndentRulesMode = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], IndentRulesMode);
    suite('Editor contrib - Move Lines Command honors Indentation Rules', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const indentRules = {
            decreaseIndentPattern: /^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
            increaseIndentPattern: /(\{[^}"'`]*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
            indentNextLinePattern: /^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$)/,
            unIndentedLinePattern: /^(?!.*([;{}]|\S:)\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!.*(\{[^}"']*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$))/
        };
        // https://github.com/microsoft/vscode/issues/28552#issuecomment-307862797
        test('first line indentation adjust to 0', () => {
            const languageService = new languageService_1.LanguageService();
            const languageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
            const mode = new IndentRulesMode(indentRules, languageService, languageConfigurationService);
            testMoveLinesUpWithIndentCommand(mode.languageId, [
                'class X {',
                '\tz = 2',
                '}'
            ], new selection_1.Selection(2, 1, 2, 1), [
                'z = 2',
                'class X {',
                '}'
            ], new selection_1.Selection(1, 1, 1, 1), languageConfigurationService);
            mode.dispose();
            languageService.dispose();
            languageConfigurationService.dispose();
        });
        // https://github.com/microsoft/vscode/issues/28552#issuecomment-307867717
        test('move lines across block', () => {
            const languageService = new languageService_1.LanguageService();
            const languageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
            const mode = new IndentRulesMode(indentRules, languageService, languageConfigurationService);
            testMoveLinesDownWithIndentCommand(mode.languageId, [
                'const value = 2;',
                'const standardLanguageDescriptions = [',
                '    {',
                '        diagnosticSource: \'js\',',
                '    }',
                '];'
            ], new selection_1.Selection(1, 1, 1, 1), [
                'const standardLanguageDescriptions = [',
                '    const value = 2;',
                '    {',
                '        diagnosticSource: \'js\',',
                '    }',
                '];'
            ], new selection_1.Selection(2, 5, 2, 5), languageConfigurationService);
            mode.dispose();
            languageService.dispose();
            languageConfigurationService.dispose();
        });
        test('move line should still work as before if there is no indentation rules', () => {
            testMoveLinesUpWithIndentCommand(null, [
                'if (true) {',
                '    var task = new Task(() => {',
                '        var work = 1234;',
                '    });',
                '}'
            ], new selection_1.Selection(3, 1, 3, 1), [
                'if (true) {',
                '        var work = 1234;',
                '    var task = new Task(() => {',
                '    });',
                '}'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
    });
    let EnterRulesMode = class EnterRulesMode extends lifecycle_1.Disposable {
        constructor(languageService, languageConfigurationService) {
            super();
            this.languageId = 'moveLinesEnterMode';
            this._register(languageService.registerLanguage({ id: this.languageId }));
            this._register(languageConfigurationService.register(this.languageId, {
                indentationRules: {
                    decreaseIndentPattern: /^\s*\[$/,
                    increaseIndentPattern: /^\s*\]$/,
                },
                brackets: [
                    ['{', '}']
                ]
            }));
        }
    };
    EnterRulesMode = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], EnterRulesMode);
    suite('Editor - contrib - Move Lines Command honors onEnter Rules', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #54829. move block across block', () => {
            const languageService = new languageService_1.LanguageService();
            const languageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
            const mode = new EnterRulesMode(languageService, languageConfigurationService);
            testMoveLinesDownWithIndentCommand(mode.languageId, [
                'if (true) {',
                '    if (false) {',
                '        if (1) {',
                '            console.log(\'b\');',
                '        }',
                '        console.log(\'a\');',
                '    }',
                '}'
            ], new selection_1.Selection(3, 9, 5, 10), [
                'if (true) {',
                '    if (false) {',
                '        console.log(\'a\');',
                '        if (1) {',
                '            console.log(\'b\');',
                '        }',
                '    }',
                '}'
            ], new selection_1.Selection(4, 9, 6, 10), languageConfigurationService);
            mode.dispose();
            languageService.dispose();
            languageConfigurationService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUxpbmVzQ29tbWFuZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGluZXNPcGVyYXRpb25zL3Rlc3QvYnJvd3Nlci9tb3ZlTGluZXNDb21tYW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBZ0JBLElBQVcsa0JBR1Y7SUFIRCxXQUFXLGtCQUFrQjtRQUM1Qix1REFBRSxDQUFBO1FBQ0YsMkRBQUksQ0FBQTtJQUNMLENBQUMsRUFIVSxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBRzVCO0lBRUQsU0FBUyx3QkFBd0IsQ0FBQyxLQUFlLEVBQUUsU0FBb0IsRUFBRSxhQUF1QixFQUFFLGlCQUE0QixFQUFFLDRCQUE0RDtRQUMzTCw0QkFBNEIsa0NBQTBCLEtBQUssRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDekksQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBZSxFQUFFLFNBQW9CLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEIsRUFBRSw0QkFBNEQ7UUFDekwsNEJBQTRCLGdDQUF3QixLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3ZJLENBQUM7SUFFRCxTQUFTLGtDQUFrQyxDQUFDLFVBQWtCLEVBQUUsS0FBZSxFQUFFLFNBQW9CLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEIsRUFBRSw0QkFBNEQ7UUFDek4sc0NBQXNDLGtDQUEwQixVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUMvSixDQUFDO0lBRUQsU0FBUyxnQ0FBZ0MsQ0FBQyxVQUFrQixFQUFFLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCLEVBQUUsNEJBQTREO1FBQ3ZOLHNDQUFzQyxnQ0FBd0IsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDN0osQ0FBQztJQUVELFNBQVMsNEJBQTRCLENBQUMsU0FBNkIsRUFBRSxLQUFlLEVBQUUsU0FBb0IsRUFBRSxhQUF1QixFQUFFLGlCQUE0QixFQUFFLDRCQUE0RDtRQUM5TixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNuQyw0QkFBNEIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbUVBQWdDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFDRCxJQUFBLHlCQUFXLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLG1DQUFnQixDQUFDLEdBQUcsRUFBRSxTQUFTLGtDQUEwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksNkNBQXFDLDRCQUE0QixDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDek8sV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFTLHNDQUFzQyxDQUFDLFNBQTZCLEVBQUUsVUFBa0IsRUFBRSxLQUFlLEVBQUUsU0FBb0IsRUFBRSxhQUF1QixFQUFFLGlCQUE0QixFQUFFLDRCQUE0RDtRQUM1UCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNuQyw0QkFBNEIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbUVBQWdDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFDRCxJQUFBLHlCQUFXLEVBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLG1DQUFnQixDQUFDLEdBQUcsRUFBRSxTQUFTLGtDQUEwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUkseUNBQWlDLDRCQUE0QixDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDM08sV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxLQUFLLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBRWpELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsb0NBQW9DLEVBQUU7WUFDMUMsc0JBQXNCLENBQ3JCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztZQUVGLHdCQUF3QixDQUN2QjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDekI7Z0JBQ0MsT0FBTztnQkFDUCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUM1Qix3QkFBd0IsQ0FDdkI7Z0JBQ0MsT0FBTztnQkFDUCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCO2dCQUNDLGFBQWE7Z0JBQ2IsT0FBTztnQkFDUCxZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUN6QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDeEIsc0JBQXNCLENBQ3JCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxhQUFhO2dCQUNiLE9BQU87Z0JBQ1AsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFO1lBQ3RDLHNCQUFzQixDQUNyQjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDM0I7Z0JBQ0MsYUFBYTtnQkFDYixPQUFPO2dCQUNQLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQzNCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRTtZQUN2QyxzQkFBc0IsQ0FDckI7Z0JBQ0MsT0FBTztnQkFDUCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLE9BQU87Z0JBQ1AsYUFBYTthQUNiLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUN6QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUU7WUFDaEQsc0JBQXNCLENBQ3JCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixPQUFPO2dCQUNQLGFBQWE7YUFDYixFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3pCLHNCQUFzQixDQUNyQjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDekI7Z0JBQ0MsT0FBTztnQkFDUCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osT0FBTztnQkFDUCxhQUFhO2FBQ2IsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUMxQix3QkFBd0IsQ0FDdkI7Z0JBQ0MsT0FBTztnQkFDUCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLE9BQU87Z0JBQ1AsYUFBYTthQUNiLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUN6QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEJBQTBCLEVBQUU7WUFDaEMsd0JBQXdCLENBQ3ZCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7YUFDYixFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFO1lBQ3RDLHdCQUF3QixDQUN2QjtnQkFDQyxPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixhQUFhO2dCQUNiLE9BQU87YUFDUCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDekI7Z0JBQ0MsYUFBYTtnQkFDYixPQUFPO2dCQUNQLFlBQVk7Z0JBQ1osYUFBYTtnQkFDYixPQUFPO2FBQ1AsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUV2QyxZQUNDLGdCQUFpQyxFQUNmLGVBQWlDLEVBQ3BCLDRCQUEyRDtZQUUxRixLQUFLLEVBQUUsQ0FBQztZQU5PLGVBQVUsR0FBRyxxQkFBcUIsQ0FBQztZQU9sRCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ3JFLGdCQUFnQixFQUFFLGdCQUFnQjthQUNsQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBYkssZUFBZTtRQUlsQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsNkRBQTZCLENBQUE7T0FMMUIsZUFBZSxDQWFwQjtJQUVELEtBQUssQ0FBQyw4REFBOEQsRUFBRSxHQUFHLEVBQUU7UUFFMUUsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sV0FBVyxHQUFHO1lBQ25CLHFCQUFxQixFQUFFLDJGQUEyRjtZQUNsSCxxQkFBcUIsRUFBRSx5R0FBeUc7WUFDaEkscUJBQXFCLEVBQUUsbUVBQW1FO1lBQzFGLHFCQUFxQixFQUFFLCtUQUErVDtTQUN0VixDQUFDO1FBRUYsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxpQ0FBZSxFQUFFLENBQUM7WUFDOUMsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLG1FQUFnQyxFQUFFLENBQUM7WUFDNUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFlLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBRTdGLGdDQUFnQyxDQUMvQixJQUFJLENBQUMsVUFBVSxFQUNmO2dCQUNDLFdBQVc7Z0JBQ1gsU0FBUztnQkFDVCxHQUFHO2FBQ0gsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCO2dCQUNDLE9BQU87Z0JBQ1AsV0FBVztnQkFDWCxHQUFHO2FBQ0gsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCLDRCQUE0QixDQUM1QixDQUFDO1lBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLDRCQUE0QixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxpQ0FBZSxFQUFFLENBQUM7WUFDOUMsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLG1FQUFnQyxFQUFFLENBQUM7WUFDNUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFlLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBRTdGLGtDQUFrQyxDQUNqQyxJQUFJLENBQUMsVUFBVSxFQUNmO2dCQUNDLGtCQUFrQjtnQkFDbEIsd0NBQXdDO2dCQUN4QyxPQUFPO2dCQUNQLG1DQUFtQztnQkFDbkMsT0FBTztnQkFDUCxJQUFJO2FBQ0osRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCO2dCQUNDLHdDQUF3QztnQkFDeEMsc0JBQXNCO2dCQUN0QixPQUFPO2dCQUNQLG1DQUFtQztnQkFDbkMsT0FBTztnQkFDUCxJQUFJO2FBQ0osRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCLDRCQUE0QixDQUM1QixDQUFDO1lBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLDRCQUE0QixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLHdFQUF3RSxFQUFFLEdBQUcsRUFBRTtZQUNuRixnQ0FBZ0MsQ0FDL0IsSUFBSyxFQUNMO2dCQUNDLGFBQWE7Z0JBQ2IsaUNBQWlDO2dCQUNqQywwQkFBMEI7Z0JBQzFCLFNBQVM7Z0JBQ1QsR0FBRzthQUNILEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxhQUFhO2dCQUNiLDBCQUEwQjtnQkFDMUIsaUNBQWlDO2dCQUNqQyxTQUFTO2dCQUNULEdBQUc7YUFDSCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFFdEMsWUFDbUIsZUFBaUMsRUFDcEIsNEJBQTJEO1lBRTFGLEtBQUssRUFBRSxDQUFDO1lBTE8sZUFBVSxHQUFHLG9CQUFvQixDQUFDO1lBTWpELElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDckUsZ0JBQWdCLEVBQUU7b0JBQ2pCLHFCQUFxQixFQUFFLFNBQVM7b0JBQ2hDLHFCQUFxQixFQUFFLFNBQVM7aUJBQ2hDO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7aUJBQ1Y7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBbEJLLGNBQWM7UUFHakIsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLDZEQUE2QixDQUFBO09BSjFCLGNBQWMsQ0FrQm5CO0lBRUQsS0FBSyxDQUFDLDREQUE0RCxFQUFFLEdBQUcsRUFBRTtRQUV4RSxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUNsRCxNQUFNLGVBQWUsR0FBRyxJQUFJLGlDQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLDRCQUE0QixHQUFHLElBQUksbUVBQWdDLEVBQUUsQ0FBQztZQUM1RSxNQUFNLElBQUksR0FBRyxJQUFJLGNBQWMsQ0FBQyxlQUFlLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztZQUUvRSxrQ0FBa0MsQ0FDakMsSUFBSSxDQUFDLFVBQVUsRUFFZjtnQkFDQyxhQUFhO2dCQUNiLGtCQUFrQjtnQkFDbEIsa0JBQWtCO2dCQUNsQixpQ0FBaUM7Z0JBQ2pDLFdBQVc7Z0JBQ1gsNkJBQTZCO2dCQUM3QixPQUFPO2dCQUNQLEdBQUc7YUFDSCxFQUNELElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDMUI7Z0JBQ0MsYUFBYTtnQkFDYixrQkFBa0I7Z0JBQ2xCLDZCQUE2QjtnQkFDN0Isa0JBQWtCO2dCQUNsQixpQ0FBaUM7Z0JBQ2pDLFdBQVc7Z0JBQ1gsT0FBTztnQkFDUCxHQUFHO2FBQ0gsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQzFCLDRCQUE0QixDQUM1QixDQUFDO1lBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLDRCQUE0QixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==