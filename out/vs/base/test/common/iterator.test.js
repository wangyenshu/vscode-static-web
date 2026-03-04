/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iterator", "vs/base/test/common/utils"], function (require, exports, assert, iterator_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Iterable', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const customIterable = new class {
            *[Symbol.iterator]() {
                yield 'one';
                yield 'two';
                yield 'three';
            }
        };
        test('first', function () {
            assert.strictEqual(iterator_1.Iterable.first([]), undefined);
            assert.strictEqual(iterator_1.Iterable.first([1]), 1);
            assert.strictEqual(iterator_1.Iterable.first(customIterable), 'one');
            assert.strictEqual(iterator_1.Iterable.first(customIterable), 'one'); // fresh
        });
        test('wrap', function () {
            assert.deepStrictEqual([...iterator_1.Iterable.wrap(1)], [1]);
            assert.deepStrictEqual([...iterator_1.Iterable.wrap([1, 2, 3])], [1, 2, 3]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3IudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vaXRlcmF0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsVUFBVSxFQUFFO1FBRWpCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLGNBQWMsR0FBRyxJQUFJO1lBRTFCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUNqQixNQUFNLEtBQUssQ0FBQztnQkFDWixNQUFNLEtBQUssQ0FBQztnQkFDWixNQUFNLE9BQU8sQ0FBQztZQUNmLENBQUM7U0FDRCxDQUFDO1FBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUViLE1BQU0sQ0FBQyxXQUFXLENBQUMsbUJBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLG1CQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUNwRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxtQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxtQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==