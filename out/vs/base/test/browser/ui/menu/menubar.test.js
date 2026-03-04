/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/ui/menu/menu", "vs/base/browser/ui/menu/menubar", "vs/base/test/common/utils"], function (require, exports, assert, dom_1, menu_1, menubar_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getButtonElementByAriaLabel(menubarElement, ariaLabel) {
        let i;
        for (i = 0; i < menubarElement.childElementCount; i++) {
            if (menubarElement.children[i].getAttribute('aria-label') === ariaLabel) {
                return menubarElement.children[i];
            }
        }
        return null;
    }
    function getTitleDivFromButtonDiv(menuButtonElement) {
        let i;
        for (i = 0; i < menuButtonElement.childElementCount; i++) {
            if (menuButtonElement.children[i].classList.contains('menubar-menu-title')) {
                return menuButtonElement.children[i];
            }
        }
        return null;
    }
    function getMnemonicFromTitleDiv(menuTitleDiv) {
        let i;
        for (i = 0; i < menuTitleDiv.childElementCount; i++) {
            if (menuTitleDiv.children[i].tagName.toLocaleLowerCase() === 'mnemonic') {
                return menuTitleDiv.children[i].textContent;
            }
        }
        return null;
    }
    function validateMenuBarItem(menubar, menubarContainer, label, readableLabel, mnemonic) {
        menubar.push([
            {
                actions: [],
                label: label
            }
        ]);
        const buttonElement = getButtonElementByAriaLabel(menubarContainer, readableLabel);
        assert(buttonElement !== null, `Button element not found for ${readableLabel} button.`);
        const titleDiv = getTitleDivFromButtonDiv(buttonElement);
        assert(titleDiv !== null, `Title div not found for ${readableLabel} button.`);
        const mnem = getMnemonicFromTitleDiv(titleDiv);
        assert.strictEqual(mnem, mnemonic, 'Mnemonic not correct');
    }
    suite('Menubar', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const container = (0, dom_1.$)('.container');
        const menubar = new menubar_1.MenuBar(container, {
            enableMnemonics: true,
            visibility: 'visible'
        }, menu_1.unthemedMenuStyles);
        test('English File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '&File', 'File', 'F');
        });
        test('Russian File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '&Файл', 'Файл', 'Ф');
        });
        test('Chinese File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '文件(&F)', '文件', 'F');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvbWVudS9tZW51YmFyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsU0FBUywyQkFBMkIsQ0FBQyxjQUEyQixFQUFFLFNBQWlCO1FBQ2xGLElBQUksQ0FBQyxDQUFDO1FBQ04sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUV2RCxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN6RSxPQUFPLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFnQixDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBQyxpQkFBOEI7UUFDL0QsSUFBSSxDQUFDLENBQUM7UUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDMUQsSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQzVFLE9BQU8saUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztZQUNyRCxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUMsWUFBeUI7UUFDekQsSUFBSSxDQUFDLENBQUM7UUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3JELElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDekUsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsbUJBQW1CLENBQUMsT0FBZ0IsRUFBRSxnQkFBNkIsRUFBRSxLQUFhLEVBQUUsYUFBcUIsRUFBRSxRQUFnQjtRQUNuSSxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ1o7Z0JBQ0MsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEtBQUs7YUFDWjtTQUNELENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLDJCQUEyQixDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sQ0FBQyxhQUFhLEtBQUssSUFBSSxFQUFFLGdDQUFnQyxhQUFhLFVBQVUsQ0FBQyxDQUFDO1FBRXhGLE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLDJCQUEyQixhQUFhLFVBQVUsQ0FBQyxDQUFDO1FBRTlFLE1BQU0sSUFBSSxHQUFHLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUNyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDMUMsTUFBTSxTQUFTLEdBQUcsSUFBQSxPQUFDLEVBQUMsWUFBWSxDQUFDLENBQUM7UUFFbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLFNBQVMsRUFBRTtZQUN0QyxlQUFlLEVBQUUsSUFBSTtZQUNyQixVQUFVLEVBQUUsU0FBUztTQUNyQixFQUFFLHlCQUFrQixDQUFDLENBQUM7UUFFdkIsSUFBSSxDQUFDLHFDQUFxQyxFQUFFO1lBQzNDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRTtZQUMzQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUU7WUFDM0MsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==