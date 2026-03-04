/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testResult"], function (require, exports, buffer_1, lifecycle_1, types_1, uri_1, environment_1, files_1, instantiation_1, log_1, storage_1, uriIdentity_1, workspace_1, storedValue_1, testResult_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestResultStorage = exports.InMemoryResultStorage = exports.BaseTestResultStorage = exports.ITestResultStorage = exports.RETAIN_MAX_RESULTS = void 0;
    exports.RETAIN_MAX_RESULTS = 128;
    const RETAIN_MIN_RESULTS = 16;
    const RETAIN_MAX_BYTES = 1024 * 128;
    const CLEANUP_PROBABILITY = 0.2;
    exports.ITestResultStorage = (0, instantiation_1.createDecorator)('ITestResultStorage');
    /**
     * Data revision this version of VS Code deals with. Should be bumped whenever
     * a breaking change is made to the stored results, which will cause previous
     * revisions to be discarded.
     */
    const currentRevision = 1;
    let BaseTestResultStorage = class BaseTestResultStorage extends lifecycle_1.Disposable {
        constructor(uriIdentityService, storageService, logService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.storageService = storageService;
            this.logService = logService;
            this.stored = this._register(new storedValue_1.StoredValue({
                key: 'storedTestResults',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */
            }, this.storageService));
        }
        /**
         * @override
         */
        async read() {
            const results = await Promise.all(this.stored.get([]).map(async ({ id, rev }) => {
                if (rev !== currentRevision) {
                    return undefined;
                }
                try {
                    const contents = await this.readForResultId(id);
                    if (!contents) {
                        return undefined;
                    }
                    return new testResult_1.HydratedTestResult(this.uriIdentityService, contents);
                }
                catch (e) {
                    this.logService.warn(`Error deserializing stored test result ${id}`, e);
                    return undefined;
                }
            }));
            return results.filter(types_1.isDefined);
        }
        /**
         * @override
         */
        getResultOutputWriter(resultId) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            this.storeOutputForResultId(resultId, stream);
            return stream;
        }
        /**
         * @override
         */
        async persist(results) {
            const toDelete = new Map(this.stored.get([]).map(({ id, bytes }) => [id, bytes]));
            const toStore = [];
            const todo = [];
            let budget = RETAIN_MAX_BYTES;
            // Run until either:
            // 1. We store all results
            // 2. We store the max results
            // 3. We store the min results, and have no more byte budget
            for (let i = 0; i < results.length && i < exports.RETAIN_MAX_RESULTS && (budget > 0 || toStore.length < RETAIN_MIN_RESULTS); i++) {
                const result = results[i];
                const existingBytes = toDelete.get(result.id);
                if (existingBytes !== undefined) {
                    toDelete.delete(result.id);
                    toStore.push({ id: result.id, rev: currentRevision, bytes: existingBytes });
                    budget -= existingBytes;
                    continue;
                }
                const obj = result.toJSON();
                if (!obj) {
                    continue;
                }
                const contents = buffer_1.VSBuffer.fromString(JSON.stringify(obj));
                todo.push(this.storeForResultId(result.id, obj));
                toStore.push({ id: result.id, rev: currentRevision, bytes: contents.byteLength });
                budget -= contents.byteLength;
            }
            for (const id of toDelete.keys()) {
                todo.push(this.deleteForResultId(id).catch(() => undefined));
            }
            this.stored.store(toStore);
            await Promise.all(todo);
        }
    };
    exports.BaseTestResultStorage = BaseTestResultStorage;
    exports.BaseTestResultStorage = BaseTestResultStorage = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService)
    ], BaseTestResultStorage);
    class InMemoryResultStorage extends BaseTestResultStorage {
        constructor() {
            super(...arguments);
            this.cache = new Map();
        }
        async readForResultId(id) {
            return Promise.resolve(this.cache.get(id));
        }
        storeForResultId(id, contents) {
            this.cache.set(id, contents);
            return Promise.resolve();
        }
        deleteForResultId(id) {
            this.cache.delete(id);
            return Promise.resolve();
        }
        readOutputForResultId(id) {
            throw new Error('Method not implemented.');
        }
        storeOutputForResultId(id, input) {
            throw new Error('Method not implemented.');
        }
        readOutputRangeForResultId(id, offset, length) {
            throw new Error('Method not implemented.');
        }
    }
    exports.InMemoryResultStorage = InMemoryResultStorage;
    let TestResultStorage = class TestResultStorage extends BaseTestResultStorage {
        constructor(uriIdentityService, storageService, logService, workspaceContext, fileService, environmentService) {
            super(uriIdentityService, storageService, logService);
            this.fileService = fileService;
            this.directory = uri_1.URI.joinPath(environmentService.workspaceStorageHome, workspaceContext.getWorkspace().id, 'testResults');
        }
        async readForResultId(id) {
            const contents = await this.fileService.readFile(this.getResultJsonPath(id));
            return JSON.parse(contents.value.toString());
        }
        storeForResultId(id, contents) {
            return this.fileService.writeFile(this.getResultJsonPath(id), buffer_1.VSBuffer.fromString(JSON.stringify(contents)));
        }
        deleteForResultId(id) {
            return this.fileService.del(this.getResultJsonPath(id)).catch(() => undefined);
        }
        async readOutputRangeForResultId(id, offset, length) {
            try {
                const { value } = await this.fileService.readFile(this.getResultOutputPath(id), { position: offset, length });
                return value;
            }
            catch {
                return buffer_1.VSBuffer.alloc(0);
            }
        }
        async readOutputForResultId(id) {
            try {
                const { value } = await this.fileService.readFileStream(this.getResultOutputPath(id));
                return value;
            }
            catch {
                return (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.alloc(0));
            }
        }
        async storeOutputForResultId(id, input) {
            await this.fileService.createFile(this.getResultOutputPath(id), input);
        }
        /**
         * @inheritdoc
         */
        async persist(results) {
            await super.persist(results);
            if (Math.random() < CLEANUP_PROBABILITY) {
                await this.cleanupDereferenced();
            }
        }
        /**
         * Cleans up orphaned files. For instance, output can get orphaned if it's
         * written but the editor is closed before the test run is complete.
         */
        async cleanupDereferenced() {
            const { children } = await this.fileService.resolve(this.directory);
            if (!children) {
                return;
            }
            const stored = new Set(this.stored.get([]).filter(s => s.rev === currentRevision).map(s => s.id));
            await Promise.all(children
                .filter(child => !stored.has(child.name.replace(/\.[a-z]+$/, '')))
                .map(child => this.fileService.del(child.resource).catch(() => undefined)));
        }
        getResultJsonPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.json`);
        }
        getResultOutputPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.output`);
        }
    };
    exports.TestResultStorage = TestResultStorage;
    exports.TestResultStorage = TestResultStorage = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, files_1.IFileService),
        __param(5, environment_1.IEnvironmentService)
    ], TestResultStorage);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdFN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0UmVzdWx0U3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQm5GLFFBQUEsa0JBQWtCLEdBQUcsR0FBRyxDQUFDO0lBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDO0lBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUNwQyxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztJQWdCbkIsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUV4RTs7OztPQUlHO0lBQ0gsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0lBRW5CLElBQWUscUJBQXFCLEdBQXBDLE1BQWUscUJBQXNCLFNBQVEsc0JBQVU7UUFTN0QsWUFDc0Isa0JBQXdELEVBQzVELGNBQWdELEVBQ3BELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSjhCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDM0MsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFUbkMsV0FBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBVyxDQUE0RDtnQkFDckgsR0FBRyxFQUFFLG1CQUFtQjtnQkFDeEIsS0FBSyxnQ0FBd0I7Z0JBQzdCLE1BQU0sK0JBQXVCO2FBQzdCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFRekIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksS0FBSyxDQUFDLElBQUk7WUFDaEIsTUFBTSxPQUFPLEdBQUcs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