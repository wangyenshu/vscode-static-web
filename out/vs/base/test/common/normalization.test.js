/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/normalization", "vs/base/test/common/utils"], function (require, exports, assert, normalization_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Normalization', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('removeAccents', function () {
            assert.strictEqual((0, normalization_1.removeAccents)('joào'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joáo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joâo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joäo'), 'joao');
            // assert.strictEqual(strings.removeAccents('joæo'), 'joao'); // not an accent
            assert.strictEqual((0, normalization_1.removeAccents)('joão'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joåo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joåo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joāo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('fôo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('föo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fòo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fóo'), 'foo');
            // assert.strictEqual(strings.removeAccents('fœo'), 'foo');
            // assert.strictEqual(strings.removeAccents('føo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fōo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fõo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('andrè'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andré'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrê'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrë'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrē'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrė'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrę'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('hvîc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvïc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvíc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvīc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvįc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvìc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('ûdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('üdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('ùdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('údo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('ūdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('heÿ'), 'hey');
            // assert.strictEqual(strings.removeAccents('gruß'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('gruś'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('gruš'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('çool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('ćool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('čool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('ñice'), 'nice');
            assert.strictEqual((0, normalization_1.removeAccents)('ńice'), 'nice');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXphdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9ub3JtYWxpemF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDckIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsOEVBQThFO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELDJEQUEyRDtZQUMzRCwyREFBMkQ7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsNkRBQTZEO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==