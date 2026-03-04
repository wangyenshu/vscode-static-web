/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/base/test/common/utils", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry"], function (require, exports, color_1, utils_1, platform_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ColorRegistry', () => {
        if (process.env.VSCODE_COLOR_REGISTRY_EXPORT) {
            test('exports', () => {
                const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
                const colors = themingRegistry.getColors();
                const replacer = (_key, value) => value instanceof color_1.Color ? color_1.Color.Format.CSS.formatHexA(value) : value;
                console.log(`#colors:${JSON.stringify(colors, replacer)}\n`);
            });
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JSZWdpc3RyeUV4cG9ydC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGhlbWVzL3Rlc3Qvbm9kZS9jb2xvclJlZ2lzdHJ5RXhwb3J0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BCLE1BQU0sZUFBZSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQiwwQkFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFZLEVBQUUsS0FBYyxFQUFFLEVBQUUsQ0FDakQsS0FBSyxZQUFZLGFBQUssQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=