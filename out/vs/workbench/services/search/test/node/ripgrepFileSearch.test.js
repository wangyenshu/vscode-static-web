/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/test/common/utils", "vs/workbench/services/search/node/ripgrepFileSearch"], function (require, exports, assert, platform, utils_1, ripgrepFileSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepFileSearch - etc', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testGetAbsGlob(params) {
            const [folder, glob, expectedResult] = params;
            assert.strictEqual((0, ripgrepFileSearch_1.fixDriveC)((0, ripgrepFileSearch_1.getAbsoluteGlob)(folder, glob)), expectedResult, JSON.stringify(params));
        }
        (!platform.isWindows ? test.skip : test)('getAbsoluteGlob_win', () => {
            [
                ['C:/foo/bar', 'glob/**', '/foo\\bar\\glob\\**'],
                ['c:/', 'glob/**', '/glob\\**'],
                ['C:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\', 'glob\\**', '/glob\\**'],
                ['\\\\localhost\\c$\\foo\\bar', 'glob/**', '\\\\localhost\\c$\\foo\\bar\\glob\\**'],
                // absolute paths are not resolved further
                ['c:/foo/bar', '/path/something', '/path/something'],
                ['c:/foo/bar', 'c:\\project\\folder', '/project\\folder']
            ].forEach(testGetAbsGlob);
        });
        (platform.isWindows ? test.skip : test)('getAbsoluteGlob_posix', () => {
            [
                ['/foo/bar', 'glob/**', '/foo/bar/glob/**'],
                ['/', 'glob/**', '/glob/**'],
                // absolute paths are not resolved further
                ['/', '/project/folder', '/project/folder'],
            ].forEach(testGetAbsGlob);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcEZpbGVTZWFyY2gudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9ub2RlL3JpcGdyZXBGaWxlU2VhcmNoLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUNyQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDMUMsU0FBUyxjQUFjLENBQUMsTUFBZ0I7WUFDdkMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLEdBQUcsTUFBTSxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBUyxFQUFDLElBQUEsbUNBQWUsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7UUFFRCxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ3BFO2dCQUNDLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQztnQkFDaEQsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQztnQkFDL0IsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixDQUFDO2dCQUNuRCxDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUscUJBQXFCLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUM7Z0JBQ2pDLENBQUMsNkJBQTZCLEVBQUUsU0FBUyxFQUFFLHVDQUF1QyxDQUFDO2dCQUVuRiwwQ0FBMEM7Z0JBQzFDLENBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO2dCQUNwRCxDQUFDLFlBQVksRUFBRSxxQkFBcUIsRUFBRSxrQkFBa0IsQ0FBQzthQUN6RCxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ3JFO2dCQUNDLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQztnQkFDM0MsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQztnQkFFNUIsMENBQTBDO2dCQUMxQyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQzthQUMzQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=