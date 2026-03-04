/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/viewModel/overviewZoneManager"], function (require, exports, assert, utils_1, overviewZoneManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor View - OverviewZoneManager', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('pixel ratio 1, dom height 600', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(600);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 12, but cap is at 6
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1), //
                new overviewZoneManager_1.ColorZone(120, 132, 2), // 120 -> 132
                new overviewZoneManager_1.ColorZone(360, 384, 3), // 360 -> 372 [360 -> 384]
                new overviewZoneManager_1.ColorZone(588, 600, 4), // 588 -> 600
            ]);
        });
        test('pixel ratio 1, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 6, cap is at 6
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(6, 12, 1), //
                new overviewZoneManager_1.ColorZone(60, 66, 2), // 60 -> 66
                new overviewZoneManager_1.ColorZone(180, 192, 3), // 180 -> 192
                new overviewZoneManager_1.ColorZone(294, 300, 4), // 294 -> 300
            ]);
        });
        test('pixel ratio 2, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(2);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 6, cap is at 12
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1), //
                new overviewZoneManager_1.ColorZone(120, 132, 2), // 120 -> 132
                new overviewZoneManager_1.ColorZone(360, 384, 3), // 360 -> 384
                new overviewZoneManager_1.ColorZone(588, 600, 4), // 588 -> 600
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdab25lTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL3ZpZXcvb3ZlcnZpZXdab25lTWFuYWdlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFFL0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDMUMsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLHlDQUFtQixDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFDbEYsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4QixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLE9BQU8sQ0FBQyxjQUFjLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbkMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6QixPQUFPLENBQUMsUUFBUSxDQUFDO2dCQUNoQixJQUFJLHVDQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQztnQkFDbkMsSUFBSSx1Q0FBaUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQ3JDLElBQUksdUNBQWlCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFB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