/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDecorations = void 0;
    class CellDecorations extends cellPart_1.CellContentPart {
        constructor(rootContainer, decorationContainer) {
            super();
            this.rootContainer = rootContainer;
            this.decorationContainer = decorationContainer;
        }
        didRenderCell(element) {
            const removedClassNames = [];
            this.rootContainer.classList.forEach(className => {
                if (/^nb\-.*$/.test(className)) {
                    removedClassNames.push(className);
                }
            });
            removedClassNames.forEach(className => {
                this.rootContainer.classList.remove(className);
            });
            this.decorationContainer.innerText = '';
            const generateCellTopDecorations = () => {
                this.decorationContainer.innerText = '';
                element.getCellDecorations().filter(options => options.topClassName !== undefined).forEach(options => {
                    this.decorationContainer.append(DOM.$(`.${options.topClassName}`));
                });
            };
            this.cellDisposables.add(element.onCellDecorationsChanged((e) => {
                const modified = e.added.find(e => e.topClassName) || e.removed.find(e => e.topClassName);
                if (modified) {
                    generateCellTopDecorations();
                }
            }));
            generateCellTopDecorations();
        }
    }
    exports.CellDecorations = CellDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsRGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsZUFBZ0IsU0FBUSwwQkFBZTtRQUNuRCxZQUNVLGFBQTBCLEVBQzFCLG1CQUFnQztZQUV6QyxLQUFLLEVBQUUsQ0FBQztZQUhDLGtCQUFhLEdBQWIsYUFBYSxDQUFhO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBYTtRQUcxQyxDQUFDO1FBRVEsYUFBYSxDQUFDLE9BQXVCO1lBQzdDLE1BQU0saUJBQWlCLEdBQWEsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDaEQsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUV4QyxNQUFNLDBCQUEwQixHQUFHLEdBQUcsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBRXhDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNwRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMvRCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFMUYsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCwwQkFBMEIsRUFBRSxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDBCQUEwQixFQUFFLENBQUM7UUFDOUIsQ0FBQztLQUNEO0lBeENELDBDQXdDQyJ9