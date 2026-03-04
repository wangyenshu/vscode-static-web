/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/textfile/test/common/fixtures/files", "vs/workbench/services/textfile/test/common/textFileService.io.test", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/test/common/utils"], function (require, exports, workbenchTestServices_1, log_1, fileService_1, network_1, lifecycle_1, serviceCollection_1, files_1, uri_1, path_1, encoding_1, buffer_1, files_2, textFileService_io_test_1, platform_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // optimization: we don't need to run this suite in native environment,
    // because we have nativeTextFileService.io.test.ts for it,
    // so our tests run faster
    if (platform_1.isWeb) {
        suite('Files - BrowserTextFileService i/o', function () {
            const disposables = new lifecycle_1.DisposableStore();
            let service;
            let fileProvider;
            const testDir = 'test';
            (0, textFileService_io_test_1.default)({
                setup: async () => {
                    const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
                    const logService = new log_1.NullLogService();
                    const fileService = disposables.add(new fileService_1.FileService(logService));
                    fileProvider = disposables.add(new workbenchTestServices_1.TestInMemoryFileSystemProvider());
                    disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
                    const collection = new serviceCollection_1.ServiceCollection();
                    collection.set(files_1.IFileService, fileService);
                    collection.set(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(new workingCopyFileService_1.WorkingCopyFileService(fileService, disposables.add(new workingCopyService_1.WorkingCopyService()), instantiationService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)))));
                    service = disposables.add(instantiationService.createChild(collection).createInstance(workbenchTestServices_1.TestBrowserTextFileServiceWithEncodingOverrides));
                    disposables.add(service.files);
                    await fileProvider.mkdir(uri_1.URI.file(testDir));
                    for (const fileName in files_2.default) {
                        await fileProvider.writeFile(uri_1.URI.file((0, path_1.join)(testDir, fileName)), files_2.default[fileName], { create: true, overwrite: false, unlock: false, atomic: false });
                    }
                    return { service, testDir };
                },
                teardown: async () => {
                    disposables.clear();
                },
                exists,
                stat,
                readFile,
                detectEncodingByBOM
            });
            async function exists(fsPath) {
                try {
                    await fileProvider.readFile(uri_1.URI.file(fsPath));
                    return true;
                }
                catch (e) {
                    return false;
                }
            }
            async function readFile(fsPath, encoding) {
                const file = await fileProvider.readFile(uri_1.URI.file(fsPath));
                if (!encoding) {
                    return buffer_1.VSBuffer.wrap(file);
                }
                return new TextDecoder((0, encoding_1.toCanonicalName)(encoding)).decode(file);
            }
            async function stat(fsPath) {
                return fileProvider.stat(uri_1.URI.file(fsPath));
            }
            async function detectEncodingByBOM(fsPath) {
                try {
                    const buffer = await readFile(fsPath);
                    return (0, encoding_1.detectEncodingByBOMFromBuffer)(buffer.slice(0, 3), 3);
                }
                catch (error) {
                    return null; // ignore errors (like file not found)
                }
            }
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclRleHRGaWxlU2VydmljZS5pby50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL3Rlc3QvYnJvd3Nlci9icm93c2VyVGV4dEZpbGVTZXJ2aWNlLmlvLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLHVFQUF1RTtJQUN2RSwyREFBMkQ7SUFDM0QsMEJBQTBCO0lBQzFCLElBQUksZ0JBQUssRUFBRSxDQUFDO1FBQ1gsS0FBSyxDQUFDLG9DQUFvQyxFQUFFO1lBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLElBQUksT0FBeUIsQ0FBQztZQUM5QixJQUFJLFlBQTRDLENBQUM7WUFDakQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBRXZCLElBQUEsaUNBQVcsRUFBQztnQkFDWCxLQUFLLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ2pCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBRW5GLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO29CQUN4QyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUVqRSxZQUFZLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNEQUE4QixFQUFFLENBQUMsQ0FBQztvQkFDckUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFFMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FB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