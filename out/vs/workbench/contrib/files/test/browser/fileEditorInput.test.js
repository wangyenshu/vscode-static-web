/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/async", "vs/editor/common/languages/modesRegistry", "vs/base/common/lifecycle", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/browser/editors/fileEditorHandler", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/workbench/services/textfile/common/textEditorService"], function (require, exports, assert, uri_1, utils_1, fileEditorInput_1, workbenchTestServices_1, editor_1, textfiles_1, files_1, textFileEditorModel_1, async_1, modesRegistry_1, lifecycle_1, binaryEditorModel_1, platform_1, fileEditorHandler_1, inMemoryFilesystemProvider_1, textEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - FileEditorInput', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        function createFileInput(resource, preferredResource, preferredLanguageId, preferredName, preferredDescription, preferredContents) {
            return disposables.add(instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, undefined, preferredLanguageId, preferredContents));
        }
        class TestTextEditorService extends textEditorService_1.TextEditorService {
            createTextEditor(input) {
                return createFileInput(input.resource);
            }
            async resolveTextEditor(input) {
                return createFileInput(input.resource);
            }
        }
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                textEditorService: instantiationService => instantiationService.createInstance(TestTextEditorService)
            }, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.clear();
        });
        test('Basics', async function () {
            let input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            const otherInput = createFileInput(utils_1.toResource.call(this, 'foo/bar/otherfile.js'));
            const otherInputSame = createFileInput(utils_1.toResource.call(this, 'foo/bar/file.js'));
            assert(input.matches(input));
            assert(input.matches(otherInputSame));
            assert(!input.matches(otherInput));
            assert.ok(input.getName());
            assert.ok(input.getDescription());
            assert.ok(input.getTitle(0 /* Verbosity.SHORT */));
            assert.ok(!input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input.isReadonly());
            assert.ok(!input.hasCapability(8 /* EditorInputCapabilities.Singleton */));
            assert.ok(!input.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */));
            const untypedInput = input.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.resource.toString(), input.resource.toString());
            assert.strictEqual('file.js', input.getName());
            assert.strictEqual(utils_1.toResource.call(this, '/foo/bar/file.js').fsPath, input.resource.fsPath);
            assert(input.resource instanceof uri_1.URI);
            input = createFileInput(utils_1.toResource.call(this, '/foo/bar.html'));
            const inputToResolve = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            const sameOtherInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            let resolved = await inputToResolve.resolve();
            assert.ok(inputToResolve.isResolved());
            const resolvedModelA = resolved;
            resolved = await inputToResolve.resolve();
            assert(resolvedModelA === resolved); // OK: Resolved Model cached globally per input
            try {
                lifecycle_1.DisposableStore.DISABLE_DISPOSED_WARNING = true; // prevent unwanted warning output from occurring
                const otherResolved = await sameOtherInput.resolve();
                assert(otherResolved === resolvedModelA); // OK: Resolved Model cached globally per input
                inputToResolve.dispose();
                resolved = await inputToResolve.resolve();
                assert(resolvedModelA === resolved); // Model is still the same because we had 2 clients
                inputToResolve.dispose();
                sameOtherInput.dispose();
                resolvedModelA.dispose();
                resolved = await inputToResolve.resolve();
                assert(resolvedModelA !== resolved); // Different instance, because input got disposed
                const stat = (0, workbenchTestServices_1.getLastResolvedFileStat)(resolved);
                resolved = await inputToResolve.resolve();
                await (0, async_1.timeout)(0);
                assert(stat !== (0, workbenchTestServices_1.getLastResolvedFileStat)(resolved)); // Different stat, because resolve always goes to the server for refresh
            }
            finally {
                lifecycle_1.DisposableStore.DISABLE_DISPOSED_WARNING = false;
            }
        });
        test('reports as untitled without supported file scheme', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js').with({ scheme: 'someTestingScheme' }));
            assert.ok(input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input.isReadonly());
        });
        test('reports as readonly with readonly file scheme', async function () {
            const inMemoryFilesystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            inMemoryFilesystemProvider.setReadOnly(true);
            disposables.add(accessor.fileService.registerProvider('someTestingReadonlyScheme', inMemoryFilesystemProvider));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js').with({ scheme: 'someTestingReadonlyScheme' }));
            assert.ok(!input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(input.isReadonly());
        });
        test('preferred resource', function () {
            const resource = utils_1.toResource.call(this, '/foo/bar/updatefile.js');
            const preferredResource = utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js');
            const inputWithoutPreferredResource = createFileInput(resource);
            assert.strictEqual(inputWithoutPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithoutPreferredResource.preferredResource.toString(), resource.toString());
            const inputWithPreferredResource = createFileInput(resource, preferredResource);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), preferredResource.toString());
            let didChangeLabel = false;
            disposables.add(inputWithPreferredResource.onDidChangeLabel(e => {
                didChangeLabel = true;
            }));
            assert.strictEqual(inputWithPreferredResource.getName(), 'UPDATEFILE.js');
            const otherPreferredResource = utils_1.toResource.call(this, '/FOO/BAR/updateFILE.js');
            inputWithPreferredResource.setPreferredResource(otherPreferredResource);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), otherPreferredResource.toString());
            assert.strictEqual(inputWithPreferredResource.getName(), 'updateFILE.js');
            assert.strictEqual(didChangeLabel, true);
        });
        test('preferred language', async function () {
            const languageId = 'file-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: languageId,
            }));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, languageId);
            assert.strictEqual(input.getPreferredLanguageId(), languageId);
            const model = disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel.getLanguageId(), languageId);
            input.setLanguageId('text');
            assert.strictEqual(input.getPreferredLanguageId(), 'text');
            assert.strictEqual(model.textEditorModel.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            input2.setPreferredLanguageId(languageId);
            const model2 = disposables.add(await input2.resolve());
            assert.strictEqual(model2.textEditorModel.getLanguageId(), languageId);
        });
        test('preferred contents', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined, undefined, undefined, 'My contents');
            const model = disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel.getValue(), 'My contents');
            assert.strictEqual(input.isDirty(), true);
            const untypedInput = input.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.contents, 'My contents');
            const untypedInputWithoutContents = input.toUntyped();
            assert.strictEqual(untypedInputWithoutContents.contents, undefined);
            input.setPreferredContents('Other contents');
            await input.resolve();
            assert.strictEqual(model.textEditorModel.getValue(), 'Other contents');
            model.textEditorModel?.setValue('Changed contents');
            await input.resolve();
            assert.strictEqual(model.textEditorModel.getValue(), 'Changed contents'); // preferred contents only used once
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            input2.setPreferredContents('My contents');
            const model2 = await input2.resolve();
            assert.strictEqual(model2.textEditorModel.getValue(), 'My contents');
            assert.strictEqual(input2.isDirty(), true);
        });
        test('matches', function () {
            const input1 = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const input3 = createFileInput(utils_1.toResource.call(this, '/foo/bar/other.js'));
            const input2Upper = createFileInput(utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js'));
            assert.strictEqual(input1.matches(input1), true);
            assert.strictEqual(input1.matches(input2), true);
            assert.strictEqual(input1.matches(input3), false);
            assert.strictEqual(input1.matches(input2Upper), false);
        });
        test('getEncoding/setEncoding', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            await input.setEncoding('utf16', 0 /* EncodingMode.Encode */);
            assert.strictEqual(input.getEncoding(), 'utf16');
            const resolved = disposables.add(await input.resolve());
            assert.strictEqual(input.getEncoding(), resolved.getEncoding());
        });
        test('save', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const resolved = disposables.add(await input.resolve());
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            assert.ok(input.isModified());
            await input.save(0);
            assert.ok(!input.isDirty());
            assert.ok(!input.isModified());
        });
        test('revert', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const resolved = disposables.add(await input.resolve());
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            assert.ok(input.isModified());
            await input.revert(0);
            assert.ok(!input.isDirty());
            assert.ok(!input.isModified());
            input.dispose();
            assert.ok(input.isDisposed());
        });
        test('resolve handles binary files', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            accessor.textFileService.setReadStreamErrorOnce(new textfiles_1.TextFileOperationError('error', 0 /* TextFileOperationResult.FILE_IS_BINARY */));
            const resolved = disposables.add(await input.resolve());
            assert.ok(resolved);
        });
        test('resolve throws for too large files', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let e = undefined;
            accessor.textFileService.setReadStreamErrorOnce(new files_1.TooLargeFileOperationError('error', 7 /* FileOperationResult.FILE_TOO_LARGE */, 1000));
            try {
                await input.resolve();
            }
            catch (error) {
                e = error;
            }
            assert.ok(e);
        });
        test('attaches to model when created and reports dirty', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let listenerCount = 0;
            disposables.add(input.onDidChangeDirty(() => {
                listenerCount++;
            }));
            // instead of going through file input resolve method
            // we resolve the model directly through the service
            const model = disposables.add(await accessor.textFileService.files.resolve(input.resource));
            model.textEditorModel?.setValue('hello world');
            assert.strictEqual(listenerCount, 1);
            assert.ok(input.isDirty());
        });
        test('force open text/binary', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            input.setForceOpenAsBinary();
            let resolved = disposables.add(await input.resolve());
            assert.ok(resolved instanceof binaryEditorModel_1.BinaryEditorModel);
            input.setForceOpenAsText();
            resolved = disposables.add(await input.resolve());
            assert.ok(resolved instanceof textFileEditorModel_1.TextFileEditorModel);
        });
        test('file editor serializer', async function () {
            instantiationService.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            disposables.add(platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer('workbench.editors.files.fileEditorInput', fileEditorHandler_1.FileEditorInputSerializer));
            const editorSerializer = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getEditorSerializer(input.typeId);
            if (!editorSerializer) {
                assert.fail('File Editor Input Serializer missing');
            }
            assert.strictEqual(editorSerializer.canSerialize(input), true);
            const inputSerialized = editorSerializer.serialize(input);
            if (!inputSerialized) {
                assert.fail('Unexpected serialized file input');
            }
            const inputDeserialized = editorSerializer.deserialize(instantiationService, inputSerialized);
            assert.strictEqual(inputDeserialized ? input.matches(inputDeserialized) : false, true);
            const preferredResource = utils_1.toResource.call(this, '/foo/bar/UPDATEfile.js');
            const inputWithPreferredResource = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'), preferredResource);
            const inputWithPreferredResourceSerialized = editorSerializer.serialize(inputWithPreferredResource);
            if (!inputWithPreferredResourceSerialized) {
                assert.fail('Unexpected serialized file input');
            }
            const inputWithPreferredResourceDeserialized = editorSerializer.deserialize(instantiationService, inputWithPreferredResourceSerialized);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), inputWithPreferredResourceDeserialized.resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), inputWithPreferredResourceDeserialized.preferredResource.toString());
        });
        test('preferred name/description', async function () {
            // Works with custom file input
            const customFileInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js').with({ scheme: 'test-custom' }), undefined, undefined, 'My Name', 'My Description');
            let didChangeLabelCounter = 0;
            disposables.add(customFileInput.onDidChangeLabel(() => {
                didChangeLabelCounter++;
            }));
            assert.strictEqual(customFileInput.getName(), 'My Name');
            assert.strictEqual(customFileInput.getDescription(), 'My Description');
            customFileInput.setPreferredName('My Name 2');
            customFileInput.setPreferredDescription('My Description 2');
            assert.strictEqual(customFileInput.getName(), 'My Name 2');
            assert.strictEqual(customFileInput.getDescription(), 'My Description 2');
            assert.strictEqual(didChangeLabelCounter, 2);
            customFileInput.dispose();
            // Disallowed with local file input
            const fileInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined, 'My Name', 'My Description');
            didChangeLabelCounter = 0;
            disposables.add(fileInput.onDidChangeLabel(() => {
                didChangeLabelCounter++;
            }));
            assert.notStrictEqual(fileInput.getName(), 'My Name');
            assert.notStrictEqual(fileInput.getDescription(), 'My Description');
            fileInput.setPreferredName('My Name 2');
            fileInput.setPreferredDescription('My Description 2');
            assert.notStrictEqual(fileInput.getName(), 'My Name 2');
            assert.notStrictEqual(fileInput.getDescription(), 'My Description 2');
            assert.strictEqual(didChangeLabelCounter, 0);
        });
        test('reports readonly changes', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let listenerCount = 0;
            disposables.add(input.onDidChangeCapabilities(() => {
                listenerCount++;
            }));
            const model = disposables.add(await accessor.textFileService.files.resolve(input.resource));
            assert.strictEqual(model.isReadonly(), false);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            const stat = await accessor.fileService.resolve(input.resource, { resolveMetadata: true });
            try {
                accessor.fileService.readShouldThrowError = new files_1.NotModifiedSinceFileOperationError('file not modified since', { ...stat, readonly: true });
                await input.resolve();
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
            assert.strictEqual(!!model.isReadonly(), true);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), true);
            assert.strictEqual(!!input.isReadonly(), true);
            assert.strictEqual(listenerCount, 1);
            try {
                accessor.fileService.readShouldThrowError = new files_1.NotModifiedSinceFileOperationError('file not modified since', { ...stat, readonly: false });
                await input.resolve();
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
            assert.strictEqual(model.isReadonly(), false);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            assert.strictEqual(listenerCount, 2);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUVkaXRvcklucHV0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy90ZXN0L2Jyb3dzZXIvZmlsZUVkaXRvcklucHV0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFFckMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsSUFBSSxvQkFBMkMsQ0FBQztRQUNoRCxJQUFJLFFBQTZCLENBQUM7UUFFbEMsU0FBUyxlQUFlLENBQUMsUUFBYSxFQUFFLGlCQUF1QixFQUFFLG1CQUE0QixFQUFFLGFBQXNCLEVBQUUsb0JBQTZCLEVBQUUsaUJBQTBCO1lBQy9LLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUNBQWUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDbk0sQ0FBQztRQUVELE1BQU0scUJBQXNCLFNBQVEscUNBQWlCO1lBQzNDLGdCQUFnQixDQUFDLEtBQTJCO2dCQUNwRCxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUVRLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUEyQjtnQkFDM0QsT0FBTyxlQUFlLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7U0FDRDtRQUVELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDO2dCQUNwRCxpQkFBaUIsRUFBRSxv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