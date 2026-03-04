/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/terminal/browser/terminalActions"], function (require, exports, assert_1, uri_1, utils_1, terminalActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeFakeFolder(name, uri) {
        return {
            name,
            uri,
            index: 0,
            toResource: () => uri,
        };
    }
    function makePair(folder, cwd, isAbsolute) {
        return {
            folder,
            cwd: !cwd ? folder.uri : (cwd instanceof uri_1.URI ? cwd : cwd.uri),
            isAbsolute: !!isAbsolute,
            isOverridden: !!cwd && cwd.toString() !== folder.uri.toString(),
        };
    }
    suite('terminalActions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const root = uri_1.URI.file('/some-root');
        const a = makeFakeFolder('a', uri_1.URI.joinPath(root, 'a'));
        const b = makeFakeFolder('b', uri_1.URI.joinPath(root, 'b'));
        const c = makeFakeFolder('c', uri_1.URI.joinPath(root, 'c'));
        const d = makeFakeFolder('d', uri_1.URI.joinPath(root, 'd'));
        suite('shrinkWorkspaceFolderCwdPairs', () => {
            test('should return empty when given array is empty', () => {
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([]), []);
            });
            test('should return the only single pair when given argument is a single element array', () => {
                const pairs = [makePair(a)];
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)(pairs), pairs);
            });
            test('should return all pairs when no repeated cwds', () => {
                const pairs = [makePair(a), makePair(b), makePair(c)];
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)(pairs), pairs);
            });
            suite('should select the pair that has the same URI when repeated cwds exist', () => {
                test('all repeated', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c, a); // CWD points to A
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC]), [pairA]);
                });
                test('two repeated + one different', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC]), [pairA, pairC]);
                });
                test('two repeated + two repeated', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c);
                    const pairD = makePair(d, c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC, pairD]), [pairA, pairC]);
                });
                test('two repeated + two repeated (reverse order)', () => {
                    const pairB = makePair(b, a); // CWD points to A
                    const pairA = makePair(a);
                    const pairD = makePair(d, c);
                    const pairC = makePair(c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC, pairD]), [pairA, pairC]);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY3Rpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvdGVybWluYWxBY3Rpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLEdBQVE7UUFDN0MsT0FBTztZQUNOLElBQUk7WUFDSixHQUFHO1lBQ0gsS0FBSyxFQUFFLENBQUM7WUFDUixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRztTQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFDLE1BQXdCLEVBQUUsR0FBNEIsRUFBRSxVQUFvQjtRQUM3RixPQUFPO1lBQ04sTUFBTTtZQUNOLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksU0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7WUFDN0QsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVO1lBQ3hCLFlBQVksRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtTQUMvRCxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sSUFBSSxHQUFRLFNBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsY0FBYyxDQUFDLEdBQUcs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