/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keybindings", "vs/base/test/common/utils", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionKeybindingResolver", "vs/editor/contrib/codeAction/common/types", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, assert, keybindings_1, utils_1, codeAction_1, codeActionKeybindingResolver_1, types_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CodeActionKeybindingResolver', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const refactorKeybinding = createCodeActionKeybinding(31 /* KeyCode.KeyA */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.value });
        const refactorExtractKeybinding = createCodeActionKeybinding(32 /* KeyCode.KeyB */, codeAction_1.refactorCommandId, { kind: types_1.CodeActionKind.Refactor.append('extract').value });
        const organizeImportsKeybinding = createCodeActionKeybinding(33 /* KeyCode.KeyC */, codeAction_1.organizeImportsCommandId, undefined);
        test('Should match refactor keybindings', async function () {
            const resolver = new codeActionKeybindingResolver_1.CodeActionKeybindingResolver(createMockKeyBindingService([refactorKeybinding])).getResolver();
            assert.strictEqual(resolver({ title: '' }), undefined);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.QuickFix.value }), undefined);
        });
        test('Should prefer most specific keybinding', async function () {
            const resolver = new codeActionKeybindingResolver_1.CodeActionKeybindingResolver(createMockKeyBindingService([refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding])).getResolver();
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.value }), refactorKeybinding.resolvedKeybinding);
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.Refactor.append('extract').value }), refactorExtractKeybinding.resolvedKeybinding);
        });
        test('Organize imports should still return a keybinding even though it does not have args', async function () {
            const resolver = new codeActionKeybindingResolver_1.CodeActionKeybindingResolver(createMockKeyBindingService([refactorKeybinding, refactorExtractKeybinding, organizeImportsKeybinding])).getResolver();
            assert.strictEqual(resolver({ title: '', kind: types_1.CodeActionKind.SourceOrganizeImports.value }), organizeImportsKeybinding.resolvedKeybinding);
        });
    });
    function createMockKeyBindingService(items) {
        return {
            getKeybindings: () => {
                return items;
            },
        };
    }
    function createCodeActionKeybinding(keycode, command, commandArgs) {
        return new resolvedKeybindingItem_1.ResolvedKeybindingItem(new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding([new keybindings_1.KeyCodeChord(false, true, false, false, keycode)], 3 /* OperatingSystem.Linux */), command, commandArgs, undefined, false, null, false);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbktleWJpbmRpbmdSZXNvbHZlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZUFjdGlvbi90ZXN0L2Jyb3dzZXIvY29kZUFjdGlvbktleWJpbmRpbmdSZXNvbHZlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7UUFFMUMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sa0JBQWtCLEdBQUcsMEJBQTBCLHdCQUVwRCw4QkFBaUIsRUFDakIsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUUxQyxNQUFNLHlCQUF5QixHQUFHLDBCQUEwQix3QkFFM0QsOEJBQWlCLEVBQ2pCLEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRTVELE1BQU0seUJBQXlCLEdBQUcsMEJBQTBCLHdCQUUzRCxxQ0FBd0IsRUFDeEIsU0FBUyxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsbUNBQW1DLEVBQUUsS0FBSztZQUM5QyxNQUFNLFFBQVEsR0FBRyxJQUFJLDJEQUE0QixDQUNoRCwyQkFBMkIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FDakQsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVoQixNQUFNLENBQUMsV0FBVyxDQUNqQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDdkIsU0FBUyxDQUFDLENBQUM7WUFFWixNQUFNLENBQUMsV0FBVyxDQUNqQixRQUFRLENBQUMsRUFBRSxLQUFL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