/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/layout/layoutActions"], function (require, exports, assert, utils_1, layoutActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Layout Actions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Toggle Cell Toolbar Position', async function () {
            const action = new layoutActions_1.ToggleCellToolbarPositionAction();
            // "notebook.cellToolbarLocation": "right"
            assert.deepStrictEqual(action.togglePosition('test-nb', 'right'), {
                default: 'right',
                'test-nb': 'left'
            });
            // "notebook.cellToolbarLocation": "left"
            assert.deepStrictEqual(action.togglePosition('test-nb', 'left'), {
                default: 'left',
                'test-nb': 'right'
            });
            // "notebook.cellToolbarLocation": "hidden"
            assert.deepStrictEqual(action.togglePosition('test-nb', 'hidden'), {
                default: 'hidden',
                'test-nb': 'right'
            });
            // invalid
            assert.deepStrictEqual(action.togglePosition('test-nb', ''), {
                default: 'right',
                'test-nb': 'left'
            });
            // no user config, default value
            assert.deepStrictEqual(action.togglePosition('test-nb', {
                default: 'right'
            }), {
                default: 'right',
                'test-nb': 'left'
            });
            // user config, default to left
            assert.deepStrictEqual(action.togglePosition('test-nb', {
                default: 'left'
            }), {
                default: 'left',
                'test-nb': 'right'
            });
            // user config, default to hidden
            assert.deepStrictEqual(action.togglePosition('test-nb', {
                default: 'hidden'
            }), {
                default: 'hidden',
                'test-nb': 'right'
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL2NvbnRyaWIvbGF5b3V0QWN0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxLQUFLO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksK0NBQStCLEVBQUUsQ0FBQztZQUVyRCwwQ0FBMEM7WUFDMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRTtnQkFDakUsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFNBQVMsRUFBRSxNQUFNO2FBQ2pCLENBQUMsQ0FBQztZQUVILHlDQUF5QztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNoRSxPQUFPLEVBQUUsTUFBTTtnQkFDZixTQUFTLEVBQUUsT0FBTzthQUNsQixDQUFDLENBQUM7WUFFSCwyQ0FBMkM7WUFDM0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDbEUsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFNBQVMsRUFBRSxPQUFPO2FBQ2xCLENBQUMsQ0FBQztZQUVILFVBQVU7WUFDVixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUM1RCxPQUFPLEVBQUUsT0FBTztnQkFDaEIsU0FBUyxFQUFFLE1BQU07YUFDakIsQ0FBQyxDQUFDO1lBRUgsZ0NBQWdDO1lBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUU7Z0JBQ3ZELE9BQU8sRUFBRSxPQUFPO2FBQ2hCLENBQUMsRUFBRTtnQkFDSCxPQUFPLEVBQUUsT0FBTztnQkFDaEIsU0FBUyxFQUFFLE1BQU07YUFDakIsQ0FBQyxDQUFDO1lBRUgsK0JBQStCO1lBQy9CLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUU7Z0JBQ3ZELE9BQU8sRUFBRSxNQUFNO2FBQ2YsQ0FBQyxFQUFFO2dCQUNILE9BQU8sRUFBRSxNQUFNO2dCQUNmLFNBQVMsRUFBRSxPQUFPO2FBQ2xCLENBQUMsQ0FBQztZQUVILGlDQUFpQztZQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFO2dCQUN2RCxPQUFPLEVBQUUsUUFBUTthQUNqQixDQUFDLEVBQUU7Z0JBQ0gsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFNBQVMsRUFBRSxPQUFPO2FBQ2xCLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==