/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "path", "vs/base/common/errors", "vs/base/common/network", "vs/editor/common/diff/legacyLinesDiffComputer", "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer", "vs/base/test/common/utils"], function (require, exports, assert, fs_1, path_1, errors_1, network_1, legacyLinesDiffComputer_1, defaultLinesDiffComputer_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('diffing fixtures', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            (0, errors_1.setUnexpectedErrorHandler)(e => {
                throw e;
            });
        });
        const fixturesOutDir = network_1.FileAccess.asFileUri('vs/editor/test/node/diffing/fixtures').fsPath;
        // We want the dir in src, so we can directly update the source files if they disagree and create invalid files to capture the previous state.
        // This makes it very easy to update the fixtures.
        const fixturesSrcDir = (0, path_1.resolve)(fixturesOutDir).replaceAll('\\', '/').replace('/out/vs/editor/', '/src/vs/editor/');
        const folders = (0, fs_1.readdirSync)(fixturesSrcDir);
        function runTest(folder, diffingAlgoName) {
            const folderPath = (0, path_1.join)(fixturesSrcDir, folder);
            const files = (0, fs_1.readdirSync)(folderPath);
            const firstFileName = files.find(f => f.startsWith('1.'));
            const secondFileName = files.find(f => f.startsWith('2.'));
            const firstContent = (0, fs_1.readFileSync)((0, path_1.join)(folderPath, firstFileName), 'utf8').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
            const firstContentLines = firstContent.split(/\n/);
            const secondContent = (0, fs_1.readFileSync)((0, path_1.join)(folderPath, secondFileName), 'utf8').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
            const secondContentLines = secondContent.split(/\n/);
            const diffingAlgo = diffingAlgoName === 'legacy' ? new legacyLinesDiffComputer_1.LegacyLinesDiffComputer() : new defaultLinesDiffComputer_1.DefaultLinesDiffComputer();
            const ignoreTrimWhitespace = folder.indexOf('trimws') >= 0;
            const diff = diffingAlgo.computeDiff(firstContentLines, secondContentLines, { ignoreTrimWhitespace, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, computeMoves: true });
            function getDiffs(changes) {
                return changes.map(c => ({
                    originalRange: c.original.toString(),
                    modifiedRange: c.modified.toString(),
                    innerChanges: c.innerChanges?.map(c => ({
                        originalRange: formatRange(c.originalRange, firstContentLines),
                        modifiedRange: formatRange(c.modifiedRange, secondContentLines),
                    })) || null
                }));
            }
            function formatRange(range, lines) {
                const toLastChar = range.endColumn === lines[range.endLineNumber - 1].length + 1;
                return '[' + range.startLineNumber + ',' + range.startColumn + ' -> ' + range.endLineNumber + ',' + range.endColumn + (toLastChar ? ' EOL' : '') + ']';
            }
            const actualDiffingResult = {
                original: { content: firstContent, fileName: `./${firstFileName}` },
                modified: { content: secondContent, fileName: `./${secondFileName}` },
                diffs: getDiffs(diff.changes),
                moves: diff.moves.map(v => ({
                    originalRange: v.lineRangeMapping.original.toString(),
                    modifiedRange: v.lineRangeMapping.modified.toString(),
                    changes: getDiffs(v.changes),
                }))
            };
            if (actualDiffingResult.moves?.length === 0) {
                delete actualDiffingResult.moves;
            }
            const expectedFilePath = (0, path_1.join)(folderPath, `${diffingAlgoName}.expected.diff.json`);
            const invalidFilePath = (0, path_1.join)(folderPath, `${diffingAlgoName}.invalid.diff.json`);
            const actualJsonStr = JSON.stringify(actualDiffingResult, null, '\t');
            if (!(0, fs_1.existsSync)(expectedFilePath)) {
                // New test, create expected file
                (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                // Create invalid file so that this test fails on a re-run
                (0, fs_1.writeFileSync)(invalidFilePath, '');
                throw new Error('No expected file! Expected and invalid files were written. Delete the invalid file to make the test pass.');
            }
            if ((0, fs_1.existsSync)(invalidFilePath)) {
                const invalidJsonStr = (0, fs_1.readFileSync)(invalidFilePath, 'utf8');
                if (invalidJsonStr === '') {
                    // Update expected file
                    (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                    throw new Error(`Delete the invalid ${invalidFilePath} file to make the test pass.`);
                }
                else {
                    const expectedFileDiffResult = JSON.parse(invalidJsonStr);
                    try {
                        assert.deepStrictEqual(actualDiffingResult, expectedFileDiffResult);
                    }
                    catch (e) {
                        (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                        throw e;
                    }
                    // Test succeeded with the invalid file, restore expected file from invalid
                    (0, fs_1.writeFileSync)(expectedFilePath, invalidJsonStr);
                    (0, fs_1.rmSync)(invalidFilePath);
                }
            }
            else {
                const expectedJsonStr = (0, fs_1.readFileSync)(expectedFilePath, 'utf8');
                const expectedFileDiffResult = JSON.parse(expectedJsonStr);
                try {
                    assert.deepStrictEqual(actualDiffingResult, expectedFileDiffResult);
                }
                catch (e) {
                    // Backup expected file
                    (0, fs_1.writeFileSync)(invalidFilePath, expectedJsonStr);
                    // Update expected file
                    (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                    throw e;
                }
            }
        }
        test(`test`, () => {
            runTest('shifting-twice', 'advanced');
        });
        for (const folder of folders) {
            for (const diffingAlgoName of ['legacy', 'advanced']) {
                test(`${folder}-${diffingAlgoName}`, () => {
                    runTest(folder, diffingAlgoName);
                });
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L25vZGUvZGlmZmluZy9maXh0dXJlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFBLGtDQUF5QixFQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM3QixNQUFNLENBQUMsQ0FBQztZQUNULENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxNQUFNLGNBQWMsR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUMzRiw4SUFBOEk7UUFDOUksa0RBQWtEO1FBQ2xELE1BQU0sY0FBYyxHQUFHLElBQUEsY0FBTyxFQUFDLGNBQWMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbkgsTUFBTSxPQUFPLEdBQUcsSUFBQSxnQkFBVyxFQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTVDLFNBQVMsT0FBTyxDQUFDLE1BQWMsRUFBRSxlQUFzQztZQUN0RSxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBQSxnQkFBVyxFQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUM7WUFDM0QsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBQztZQUU1RCxNQUFNLFlBQVksR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzSCxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsTUFBTSxhQUFhLEdBQUcsSUFBQSxpQkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0gsTUFBTSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJELE1BQU0sV0FBVyxHQUFHLGVBQWUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksaURBQXVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBRWxILE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUV6SyxTQUFTLFFBQVEsQ0FBQyxPQUE0QztnQkFDN0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLGFBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtvQkFDcEMsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO29CQUNwQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM5QyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUM7d0JBQzlELGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQztxQkFDL0QsQ0FBQyxDQUFDLElBQUksSUFBSTtpQkFDWCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxTQUFTLFdBQVcsQ0FBQyxLQUFZLEVBQUUsS0FBZTtnQkFDakQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFNBQVMsS0FBSyxLQUFLLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUVqRixPQUFPLEdBQUcsR0FBRyxLQUFLLENBQUMsZUFBZSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsV0FBVyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUN4SixDQUFDO1lBRUQsTUFBTSxtQkFBbUIsR0FBa0I7Z0JBQzFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssYUFBYSxFQUFFLEVBQUU7Z0JBQ25FLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssY0FBYyxFQUFFLEVBQUU7Z0JBQ3JFLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDN0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0IsYUFBYSxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO29CQUNyRCxhQUFhLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7b0JBQ3JELE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztpQkFDNUIsQ0FBQyxDQUFDO2FBQ0gsQ0FBQztZQUNGLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsT0FBTyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFDbEMsQ0FBQztZQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLEdBQUcsZUFBZSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sZUFBZSxHQUFHLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxHQUFHLGVBQWUsb0JBQW9CLENBQUMsQ0FBQztZQUVqRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV0RSxJQUFJLENBQUMsSUFBQSxlQUFVLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxpQ0FBaUM7Z0JBQ2pDLElBQUEsa0JBQWEsRUFBQyxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDL0MsMERBQTBEO2dCQUMxRCxJQUFBLGtCQUFhLEVBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLDJHQUEyRyxDQUFDLENBQUM7WUFDOUgsQ0FBQztZQUFDLElBQUksSUFBQSxlQUFVLEVBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxjQUFjLEdBQUcsSUFBQSxpQkFBWSxFQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxjQUFjLEtBQUssRUFBRSxFQUFFLENBQUM7b0JBQzNCLHVCQUF1QjtvQkFDdkIsSUFBQSxrQkFBYSxFQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixlQUFlLDhCQUE4QixDQUFDLENBQUM7Z0JBQ3RGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLHNCQUFzQixHQUFrQixJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN6RSxJQUFJLENBQUM7d0JBQ0osTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO29CQUNyRSxDQUFDO29CQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ1osSUFBQSxrQkFBYSxFQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO3dCQUMvQyxNQUFNLENBQUMsQ0FBQztvQkFDVCxDQUFDO29CQUNELDJFQUEyRTtvQkFDM0UsSUFBQSxrQkFBYSxFQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUNoRCxJQUFBLFdBQU0sRUFBQyxlQUFlLENBQUMsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGVBQWUsR0FBRyxJQUFBLGlCQUFZLEVBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sc0JBQXNCLEdBQWtCLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzFFLElBQUksQ0FBQztvQkFDSixNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3JFLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWix1QkFBdUI7b0JBQ3ZCLElBQUEsa0JBQWEsRUFBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ2hELHVCQUF1QjtvQkFDdkIsSUFBQSxrQkFBYSxFQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUMvQyxNQUFNLENBQUMsQ0FBQztnQkFDVCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNqQixPQUFPLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzlCLEtBQUssTUFBTSxlQUFlLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFVLEVBQUUsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLEdBQUcsTUFBTSxJQUFJLGVBQWUsRUFBRSxFQUFFLEdBQUcsRUFBRTtvQkFDekMsT0FBTyxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztnQkFDbEMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDIn0=