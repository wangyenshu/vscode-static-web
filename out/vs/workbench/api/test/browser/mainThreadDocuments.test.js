/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocuments", "vs/base/common/async", "vs/base/common/uri", "vs/base/common/resources", "vs/base/test/common/utils"], function (require, exports, assert, mainThreadDocuments_1, async_1, uri_1, resources_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BoundModelReferenceCollection', function () {
        let col;
        setup(function () {
            col = new mainThreadDocuments_1.BoundModelReferenceCollection(resources_1.extUri, 15, 75);
        });
        teardown(function () {
            col.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('max age', async function () {
            let didDispose = false;
            col.add(uri_1.URI.parse('test://farboo'), {
                object: {},
                dispose() {
                    didDispose = true;
                }
            });
            await (0, async_1.timeout)(30);
            assert.strictEqual(didDispose, true);
        });
        test('max size', function () {
            const disposed = [];
            col.add(uri_1.URI.parse('test://farboo'), {
                object: {},
                dispose() {
                    disposed.push(0);
                }
            }, 6);
            col.add(uri_1.URI.parse('test://boofar'), {
                object: {},
                dispose() {
                    disposed.push(1);
                }
            }, 6);
            col.add(uri_1.URI.parse('test://xxxxxxx'), {
                object: {},
                dispose() {
                    disposed.push(2);
                }
            }, 70);
            assert.deepStrictEqual(disposed, [0, 1]);
        });
        test('max count', function () {
            col.dispose();
            col = new mainThreadDocuments_1.BoundModelReferenceCollection(resources_1.extUri, 10000, 10000, 2);
            const disposed = [];
            col.add(uri_1.URI.parse('test://xxxxxxx'), {
                object: {},
                dispose() {
                    disposed.push(0);
                }
            });
            col.add(uri_1.URI.parse('test://xxxxxxx'), {
                object: {},
                dispose() {
                    disposed.push(1);
                }
            });
            col.add(uri_1.URI.parse('test://xxxxxxx'), {
                object: {},
                dispose() {
                    disposed.push(2);
                }
            });
            assert.deepStrictEqual(disposed, [0]);
        });
        test('dispose uri', function () {
            let disposed = [];
            col.add(uri_1.URI.parse('test:///farboo'), {
                object: {},
                dispose() {
                    disposed.push(0);
                }
            });
            col.add(uri_1.URI.parse('test:///boofar'), {
                object: {},
                dispose() {
                    disposed.push(1);
                }
            });
            col.add(uri_1.URI.parse('test:///boo/far1'), {
                object: {},
                dispose() {
                    disposed.push(2);
                }
            });
            col.add(uri_1.URI.parse('test:///boo/far2'), {
                object: {},
                dispose() {
                    disposed.push(3);
                }
            });
            col.add(uri_1.URI.parse('test:///boo1/far'), {
                object: {},
                dispose() {
                    disposed.push(4);
                }
            });
            col.remove(uri_1.URI.parse('test:///unknown'));
            assert.strictEqual(disposed.length, 0);
            col.remove(uri_1.URI.parse('test:///farboo'));
            assert.deepStrictEqual(disposed, [0]);
            disposed = [];
            col.remove(uri_1.URI.parse('test:///boo'));
            assert.deepStrictEqual(disposed, [2, 3]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvbWFpblRocmVhZERvY3VtZW50cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQywrQkFBK0IsRUFBRTtRQUV0QyxJQUFJLEdBQWtDLENBQUM7UUFFdkMsS0FBSyxDQUFDO1lBQ0wsR0FBRyxHQUFHLElBQUksbURBQTZCLENBQUMsa0JBQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUM7WUFDUixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUs7WUFFcEIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBRXZCLEdBQUcsQ0FBQyxHQUFHLENBQ04sU0FBRyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFDMUI7Z0JBQ0MsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsT0FBTztvQkFDTixVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUosTUFBTSxJQUFBLGVBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUU7WUFFaEIsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBRTlCLEdBQUcsQ0FBQyxHQUFHLENBQ04sU0FBRyxDQUFDLEtB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