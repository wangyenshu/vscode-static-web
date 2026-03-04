/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, network_1, uri_1, utils_1, editor_1, diffEditorInput_1, editorInput_1, textResourceEditorInput_1, fileEditorInput_1, mergeEditorInput_1, untitledTextEditorInput_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorInput', () => {
        let instantiationService;
        let accessor;
        const disposables = new lifecycle_1.DisposableStore();
        const testResource = uri_1.URI.from({ scheme: 'random', path: '/path' });
        const untypedResourceEditorInput = { resource: testResource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedTextResourceEditorInput = { resource: testResource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceSideBySideEditorInput = { primary: untypedResourceEditorInput, secondary: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedUntitledResourceEditorinput = { resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: '/path' }), options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceDiffEditorInput = { original: untypedResourceEditorInput, modified: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceMergeEditorInput = { base: untypedResourceEditorInput, input1: untypedResourceEditorInput, input2: untypedResourceEditorInput, result: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        // Function to easily remove the overrides from the untyped inputs
        const stripOverrides = () => {
            if (!untypedResourceEditorInput.options ||
                !untypedTextResourceEditorInput.options ||
                !untypedUntitledResourceEditorinput.options ||
                !untypedResourceDiffEditorInput.options ||
                !untypedResourceMergeEditorInput.options) {
                throw new Error('Malformed options on untyped inputs');
            }
            // Some of the tests mutate the overrides so we want to reset them on each test
            untypedResourceEditorInput.options.override = undefined;
            untypedTextResourceEditorInput.options.override = undefined;
            untypedUntitledResourceEditorinput.options.override = undefined;
            untypedResourceDiffEditorInput.options.override = undefined;
            untypedResourceMergeEditorInput.options.override = undefined;
        };
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            if (!untypedResourceEditorInput.options ||
                !untypedTextResourceEditorInput.options ||
                !untypedUntitledResourceEditorinput.options ||
                !untypedResourceDiffEditorInput.options ||
                !untypedResourceMergeEditorInput.options) {
                throw new Error('Malformed options on untyped inputs');
            }
            // Some of the tests mutate the overrides so we want to reset them on each test
            untypedResourceEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedTextResourceEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedUntitledResourceEditorinput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedResourceDiffEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedResourceMergeEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        });
        teardown(() => {
            disposables.clear();
        });
        class MyEditorInput extends editorInput_1.EditorInput {
            constructor() {
                super(...arguments);
                this.resource = undefined;
            }
            get typeId() { return 'myEditorInput'; }
            resolve() { return null; }
        }
        test('basics', () => {
            let counter = 0;
            const input = disposables.add(new MyEditorInput());
            const otherInput = disposables.add(new MyEditorInput());
            assert.ok((0, editor_1.isEditorInput)(input));
            assert.ok(!(0, editor_1.isEditorInput)(undefined));
            assert.ok(!(0, editor_1.isEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok(!(0, editor_1.isEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isUntitledResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceMergeEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)(input));
            assert(input.matches(input));
            assert(!input.matches(otherInput));
            assert(input.getName());
            disposables.add(input.onWillDispose(() => {
                assert(true);
                counter++;
            }));
            input.dispose();
            assert.strictEqual(counter, 1);
        });
        test('untyped matches', () => {
            const testInputID = 'untypedMatches';
            const testInputResource = uri_1.URI.file('/fake');
            const testInput = disposables.add(new workbenchTestServices_1.TestEditorInput(testInputResource, testInputID));
            const testUntypedInput = { resource: testInputResource, options: { override: testInputID } };
            const tetUntypedInputWrongResource = { resource: uri_1.URI.file('/incorrectFake'), options: { override: testInputID } };
            const testUntypedInputWrongId = { resource: testInputResource, options: { override: 'wrongId' } };
            const testUntypedInputWrong = { resource: uri_1.URI.file('/incorrectFake'), options: { override: 'wrongId' } };
            assert(testInput.matches(testUntypedInput));
            assert.ok(!testInput.matches(tetUntypedInputWrongResource));
            assert.ok(!testInput.matches(testUntypedInputWrongId));
            assert.ok(!testInput.matches(testUntypedInputWrong));
        });
        test('Untpyed inputs properly match TextResourceEditorInput', () => {
            const textResourceEditorInput = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, testResource, undefined, undefined, undefined, undefined);
            assert.ok(textResourceEditorInput.matches(untypedResourceEditorInput));
            assert.ok(textResourceEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceMergeEditorInput));
            textResourceEditorInput.dispose();
        });
        test('Untyped inputs properly match FileEditorInput', () => {
            const fileEditorInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            assert.ok(fileEditorInput.matches(untypedResourceEditorInput));
            assert.ok(fileEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!fileEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!fileEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceMergeEditorInput));
            // Now we remove the override on the untyped to ensure that FileEditorInput supports lightweight resource matching
            stripOverrides();
            assert.ok(fileEditorInput.matches(untypedResourceEditorInput));
            assert.ok(fileEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!fileEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!fileEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceMergeEditorInput));
            fileEditorInput.dispose();
        });
        test('Untyped inputs properly match MergeEditorInput', () => {
            const mergeData = { uri: testResource, description: undefined, detail: undefined, title: undefined };
            const mergeEditorInput = instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, testResource, mergeData, mergeData, testResource);
            assert.ok(!mergeEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!mergeEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(mergeEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!mergeEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!mergeEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(mergeEditorInput.matches(untypedResourceMergeEditorInput));
            mergeEditorInput.dispose();
        });
        test('Untyped inputs properly match UntitledTextEditorInput', () => {
            const untitledModel = accessor.untitledTextEditorService.create({ associatedResource: { authority: '', path: '/path', fragment: '', query: '' } });
            const untitledTextEditorInput = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel);
            assert.ok(!untitledTextEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(untitledTextEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!untitledTextEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(untitledTextEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceMergeEditorInput));
            untitledTextEditorInput.dispose();
        });
        test('Untyped inputs properly match DiffEditorInput', () => {
            const fileEditorInput1 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            const fileEditorInput2 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            const diffEditorInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, undefined, undefined, fileEditorInput1, fileEditorInput2, false);
            assert.ok(!diffEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!diffEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(diffEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!diffEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!diffEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(diffEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceMergeEditorInput));
            diffEditorInput.dispose();
            fileEditorInput1.dispose();
            fileEditorInput2.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9ySW5wdXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvcklucHV0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBRXpCLElBQUksb0JBQTJDLENBQUM7UUFDaEQsSUFBSSxRQUE2QixDQUFDO1FBQ2xDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLE1BQU0sWUFBWSxHQUFRLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sMEJBQTBCLEdBQXlCLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsbUNBQTBCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMxSSxNQUFNLDhCQUE4QixHQUE2QixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLG1DQUEwQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDbEosTUFBTSxvQ0FBb0MsR0FBbUMsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsU0FBUyxFQUFFLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxtQ0FBMEIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ2xOLE1BQU0sa0NBQWtDLEdBQXFDLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9B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