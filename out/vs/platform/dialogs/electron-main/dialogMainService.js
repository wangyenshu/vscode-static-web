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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/hash", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/platform", "vs/base/node/pfs", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/workspace/common/workspace"], function (require, exports, electron_1, async_1, hash_1, labels_1, lifecycle_1, normalization_1, platform_1, pfs_1, nls_1, dialogs_1, instantiation_1, log_1, productService_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogMainService = exports.IDialogMainService = void 0;
    exports.IDialogMainService = (0, instantiation_1.createDecorator)('dialogMainService');
    let DialogMainService = class DialogMainService {
        constructor(logService, productService) {
            this.logService = logService;
            this.productService = productService;
            this.windowFileDialogLocks = new Map();
            this.windowDialogQueues = new Map();
            this.noWindowDialogueQueue = new async_1.Queue();
        }
        pickFileFolder(options, window) {
            return this.doPick({ ...options, pickFolders: true, pickFiles: true, title: (0, nls_1.localize)('open', "Open") }, window);
        }
        pickFolder(options, window) {
            return this.doPick({ ...options, pickFolders: true, title: (0, nls_1.localize)('openFolder', "Open Folder") }, window);
        }
        pickFile(options, window) {
            return this.doPick({ ...options, pickFiles: true, title: (0, nls_1.localize)('openFile', "Open File") }, window);
        }
        pickWorkspace(options, window) {
            const title = (0, nls_1.localize)('openWorkspaceTitle', "Open Workspace from File");
            const buttonLabel = (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'openWorkspace', comment: ['&& denotes a mnemonic'] }, "&&Open"));
            const filters = workspace_1.WORKSPACE_FILTER;
            return this.doPick({ ...options, pickFiles: true, title, filters, buttonLabel }, window);
        }
        async doPick(options, window) {
            // Ensure dialog options
            const dialogOptions = {
                title: options.title,
                buttonLabel: options.buttonLabel,
                filters: options.filters,
                defaultPath: options.defaultPath
            };
            // Ensure properties
            if (typeof options.pickFiles === 'boolean' || typeof options.pickFolders === 'boolean') {
                dialogOptions.properties = undefined; // let it override based on the booleans
                if (options.pickFiles && options.pickFolders) {
                    dialogOptions.properties = ['multiSelections', 'openDirectory', 'openFile', 'createDirectory'];
                }
            }
            if (!dialogOptions.properties) {
                dialogOptions.properties = ['multiSelections', options.pickFolders ? 'openDirectory' : 'openFile', 'createDirectory'];
            }
            if (platform_1.isMacintosh) {
                dialogOptions.properties.push('treatPackageAsDirectory'); // always drill into .app files
            }
            // Show Dialog
            const result = await this.showOpenDialog(dialogOptions, (window || electron_1.BrowserWindow.getFocusedWindow()) ?? undefined);
            if (result && result.filePaths && result.filePaths.length > 0) {
                return result.filePaths;
            }
            return undefined;
        }
        getWindowDialogQueue(window) {
            // Queue message box requests per window so that one can show
            // after the other.
            if (window) {
                let windowDialogQueue = this.windowDialogQueues.get(window.id);
                if (!windowDialogQueue) {
                    windowDialogQueue = new async_1.Queue();
                    this.windowDialogQueues.set(window.id, windowDialogQueue);
                }
                return windowDialogQueue;
            }
            else {
                return this.noWindowDialogueQueue;
            }
        }
        showMessageBox(rawOptions, window) {
            return this.getWindowDialogQueue(window).queue(async () => {
                const { options, buttonIndeces } = (0, dialogs_1.massageMessageBoxOptions)(rawOptions, this.productService);
                let result = undefined;
                if (window) {
                    result = await electron_1.dialog.showMessageBox(window, options);
                }
                else {
                    result = await electron_1.dialog.showMessageBox(options);
                }
                return {
                    response: buttonIndeces[result.response],
                    checkboxChecked: result.checkboxChecked
                };
            });
        }
        async showSaveDialog(options, window) {
            // Prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file save dialog is already or will be showing for the window with the same configuration');
                return { canceled: true };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showSaveDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showSaveDialog(options);
                    }
                    result.filePath = this.normalizePath(result.filePath);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        normalizePath(path) {
            if (path && platform_1.isMacintosh) {
                path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
            }
            return path;
        }
        normalizePaths(paths) {
            return paths.map(path => this.normalizePath(path));
        }
        async showOpenDialog(options, window) {
            // Ensure the path exists (if provided)
            if (options.defaultPath) {
                const pathExists = await pfs_1.Promises.exists(options.defaultPath);
                if (!pathExists) {
                    options.defaultPath = undefined;
                }
            }
            // Prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file open dialog is already or will be showing for the window with the same configuration');
                return { canceled: true, filePaths: [] };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showOpenDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showOpenDialog(options);
                    }
                    result.filePaths = this.normalizePaths(result.filePaths);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        acquireFileDialogLock(options, window) {
            // If no window is provided, allow as many dialogs as
            // needed since we consider them not modal per window
            if (!window) {
                return lifecycle_1.Disposable.None;
            }
            // If a window is provided, only allow a single dialog
            // at the same time because dialogs are modal and we
            // do not want to open one dialog after the other
            // (https://github.com/microsoft/vscode/issues/114432)
            // we figure this out by `hashing` the configuration
            // options for the dialog to prevent duplicates
            this.logService.trace('[DialogMainService]: request to acquire file dialog lock', options);
            let windowFileDialogLocks = this.windowFileDialogLocks.get(window.id);
            if (!windowFileDialogLocks) {
                windowFileDialogLocks = new Set();
                this.windowFileDialogLocks.set(window.id, windowFileDialogLocks);
            }
            const optionsHash = (0, hash_1.hash)(options);
            if (windowFileDialogLocks.has(optionsHash)) {
                return undefined; // prevent duplicates, return
            }
            this.logService.trace('[DialogMainService]: new file dialog lock created', options);
            windowFileDialogLocks.add(optionsHash);
            return (0, lifecycle_1.toDisposable)(() => {
                this.logService.trace('[DialogMainService]: file dialog lock disposed', options);
                windowFileDialogLocks?.delete(optionsHash);
                // If the window has no more dialog locks, delete it from the set of locks
                if (windowFileDialogLocks?.size === 0) {
                    this.windowFileDialogLocks.delete(window.id);
                }
            });
        }
    };
    exports.DialogMainService = DialogMainService;
    exports.DialogMainService = DialogMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, productService_1.IProductService)
    ], DialogMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kaWFsb2dzL2VsZWN0cm9uLW1haW4vZGlhbG9nTWFpblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJuRixRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsbUJBQW1CLENBQUMsQ0FBQztJQXlCcEYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFRN0IsWUFDYyxVQUF3QyxFQUNwQyxjQUFnRDtZQURuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQU5qRCwwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUN2RCx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBd0YsQ0FBQztZQUNySCwwQkFBcUIsR0FBRyxJQUFJLGFBQUssRUFBeUUsQ0FBQztRQU01SCxDQUFDO1FBRUQsY0FBYyxDQUFDLE9BQWlDLEVBQUUsTUFBc0I7WUFDdkUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqSCxDQUFDO1FBRUQsVUFBVSxDQUFDLE9BQWlDLEVBQUUsTUFBc0I7WUFDbkUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxFQUFF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