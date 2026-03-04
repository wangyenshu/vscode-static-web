define(["require", "exports", "assert", "vs/base/common/hierarchicalKind", "vs/base/test/common/utils", "vs/editor/contrib/dropOrPasteInto/browser/edit"], function (require, exports, assert, hierarchicalKind_1, utils_1, edit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createTestEdit(kind, args) {
        return {
            title: '',
            insertText: '',
            kind: new hierarchicalKind_1.HierarchicalKind(kind),
            ...args,
        };
    }
    suite('sortEditsByYieldTo', () => {
        test('Should noop for empty edits', () => {
            const edits = [];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits), []);
        });
        test('Yielded to edit should get sorted after target', () => {
            const edits = [
                createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                createTestEdit('b'),
            ];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a']);
        });
        test('Should handle chain of yield to', () => {
            {
                const edits = [
                    createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('a') }] }),
                    createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                    createTestEdit('b'),
                ];
                assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a', 'c']);
            }
            {
                const edits = [
                    createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                    createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('a') }] }),
                    createTestEdit('b'),
                ];
                assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a', 'c']);
            }
        });
        test(`Should not reorder when yield to isn't used`, () => {
            const edits = [
                createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('x') }] }),
                createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('y') }] }),
                createTestEdit('b'),
            ];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['c', 'a', 'b']);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNvcnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Ryb3BPclBhc3RlSW50by90ZXN0L2Jyb3dzZXIvZWRpdFNvcnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFXQSxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQUUsSUFBZ0M7UUFDckUsT0FBTztZQUNOLEtBQUssRUFBRSxFQUFFO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxJQUFJLEVBQUUsSUFBSSxtQ0FBZ0IsQ0FBQyxJQUFJLENBQUM7WUFDaEMsR0FBRyxJQUFJO1NBQ1AsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBRWhDLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDeEMsTUFBTSxLQUFLLEdBQXVCLEVBQUUsQ0FBQztZQUVyQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEseUJBQWtCLEVBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBQzNELE1BQU0sS0FBSyxHQUF1QjtnQkFDakMsY0FBYyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksbUNBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZFLGNBQWMsQ0FBQyxHQUFHLENBQUM7YUFDbkIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSx5QkFBa0IsRUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtB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