/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/css!./media/stickyScroll"], function (require, exports, color_1, nls_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStickyScrollHoverBackground = exports.terminalStickyScrollBackground = void 0;
    exports.terminalStickyScrollBackground = (0, colorRegistry_1.registerColor)('terminalStickyScroll.background', {
        light: null,
        dark: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('terminalStickyScroll.background', 'The background color of the sticky scroll overlay in the terminal.'));
    exports.terminalStickyScrollHoverBackground = (0, colorRegistry_1.registerColor)('terminalStickyScrollHover.background', {
        dark: '#2A2D2E',
        light: '#F0F0F0',
        hcDark: null,
        hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.1)
    }, (0, nls_1.localize)('terminalStickyScrollHover.background', 'The background color of the sticky scroll overlay in the terminal when hovered.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxDb2xvclJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3N0aWNreVNjcm9sbC9icm93c2VyL3Rlcm1pbmFsU3RpY2t5U2Nyb2xsQ29sb3JSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPbkYsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsaUNBQWlDLEVBQUU7UUFDOUYsS0FBSyxFQUFFLElBQUk7UUFDWCxJQUFJLEVBQUUsSUFBSTtRQUNWLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7S0FDYixFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLG9FQUFvRSxDQUFDLENBQUMsQ0FBQztJQUV6RyxRQUFBLG1DQUFtQyxHQUFHLElBQUEsNkJBQWEsRUFBQyxzQ0FBc0MsRUFBRTtRQUN4RyxJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLGFBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztLQUNsRCxFQUFFLElBQUEsY0FBUSxFQUFDLHNDQUFzQyxFQUFFLGlGQUFpRixDQUFDLENBQUMsQ0FBQyJ9