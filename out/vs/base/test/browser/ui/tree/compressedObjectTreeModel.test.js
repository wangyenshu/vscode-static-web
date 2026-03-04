/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/compressedObjectTreeModel", "vs/base/common/iterator", "vs/base/test/common/utils"], function (require, exports, assert, compressedObjectTreeModel_1, iterator_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function resolve(treeElement) {
        const result = { element: treeElement.element };
        const children = Array.from(iterator_1.Iterable.from(treeElement.children), resolve);
        if (treeElement.incompressible) {
            result.incompressible = true;
        }
        if (children.length > 0) {
            result.children = children;
        }
        return result;
    }
    suite('CompressedObjectTree', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('compress & decompress', function () {
            test('small', function () {
                const decompressed = { element: 1 };
                const compressed = { element: { elements: [1], incompressible: false } };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('no compression', function () {
                const decompressed = {
                    element: 1, children: [
                        { element: 11 },
                        { element: 12 },
                        { element: 13 }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        { element: { elements: [11], incompressible: false } },
                        { element: { elements: [12], incompressible: false } },
                        { element: { elements: [13], incompressible: false } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('single hierarchy', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111, 1111], incompressible: false }
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 },
                                        { element: 1112 },
                                        { element: 1113 },
                                        { element: 1114 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: false } },
                        { element: { elements: [1112], incompressible: false } },
                        { element: { elements: [1113], incompressible: false } },
                        { element: { elements: [1114], incompressible: false } },
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('double deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1112 },
                                        { element: 1113 },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 12, children: [
                                {
                                    element: 121, children: [
                                        { element: 1212 },
                                        { element: 1213 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11, 111], incompressible: false },
                            children: [
                                { element: { elements: [1112], incompressible: false } },
                                { element: { elements: [1113], incompressible: false } },
                            ]
                        },
                        {
                            element: { elements: [12, 121], incompressible: false },
                            children: [
                                { element: { elements: [1212], incompressible: false } },
                                { element: { elements: [1213], incompressible: false } },
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible leaf', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: true } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible branch', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        { element: { elements: [111, 1111], incompressible: true } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible chain', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        {
                            element: { elements: [111], incompressible: true },
                            children: [
                                { element: { elements: [1111], incompressible: true } }
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible tree', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, incompressible: true, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11], incompressible: true },
                            children: [
                                {
                                    element: { elements: [111], incompressible: true },
                                    children: [
                                        { element: { elements: [1111], incompressible: true } }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
        });
        function toList(arr) {
            return {
                splice(start, deleteCount, elements) {
                    arr.splice(start, deleteCount, ...elements);
                },
                updateElementHeight() { }
            };
        }
        function toArray(list) {
            return list.map(i => i.element.elements);
        }
        suite('CompressedObjectTreeModel', function () {
            /**
             * Calls that test function twice, once with an empty options and
             * once with `diffIdentityProvider`.
             */
            function withSmartSplice(fn) {
                fn({});
                fn({ diffIdentityProvider: { getId: n => String(n) } });
            }
            test('ctor', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                assert(model);
                assert.strictEqual(list.length, 0);
                assert.strictEqual(model.size, 0);
            });
            test('flat', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    { element: 0 },
                    { element: 1 },
                    { element: 2 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [1], [2]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [
                    { element: 3 },
                    { element: 4 },
                    { element: 5 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[3], [4], [5]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [], options);
                assert.deepStrictEqual(toArray(list), []);
                assert.strictEqual(model.size, 0);
            }));
            test('nested', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    {
                        element: 0, children: [
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ]
                    },
                    { element: 1 },
                    { element: 2 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [10], [11], [12], [1], [2]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(12, [
                    { element: 120 },
                    { element: 121 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [10], [11], [12], [120], [121], [1], [2]]);
                assert.strictEqual(model.size, 8);
                model.setChildren(0, [], options);
                assert.deepStrictEqual(toArray(list), [[0], [1], [2]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [], options);
                assert.deepStrictEqual(toArray(list), []);
                assert.strictEqual(model.size, 0);
            }));
            test('compressed', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    {
                        element: 1, children: [{
                                element: 11, children: [{
                                        element: 111, children: [
                                            { element: 1111 },
                                            { element: 1112 },
                                            { element: 1113 },
                                        ]
                                    }]
                            }]
                    }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11, 111], [1111], [1112], [1113]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(11, [
                    { element: 111 },
                    { element: 112 },
                    { element: 113 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113]]);
                assert.strictEqual(model.size, 5);
                model.setChildren(113, [
                    { element: 1131 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(1131, [
                    { element: 1132 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131, 1132]]);
                assert.strictEqual(model.size, 7);
                model.setChildren(1131, [
                    { element: 1132 },
                    { element: 1133 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131], [1132], [1133]]);
                assert.strictEqual(model.size, 8);
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHJlc3NlZE9iamVjdFRyZWVNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvdHJlZS9jb21wcmVzc2VkT2JqZWN0VHJlZU1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsU0FBUyxPQUFPLENBQUksV0FBc0M7UUFDekQsTUFBTSxNQUFNLEdBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsbUJBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTFFLElBQUksV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDekIsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELEtBQUssQ0FBQyxzQkFBc0IsRUFBRTtRQUU3QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFO1lBRTlCLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2IsTUFBTSxZQUFZLEdBQW1DLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNwRSxNQUFNLFVBQVUsR0FDZixFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsRUFB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