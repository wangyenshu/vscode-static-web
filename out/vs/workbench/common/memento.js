/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/errors"], function (require, exports, types_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Memento = void 0;
    class Memento {
        static { this.applicationMementos = new Map(); }
        static { this.profileMementos = new Map(); }
        static { this.workspaceMementos = new Map(); }
        static { this.COMMON_PREFIX = 'memento/'; }
        constructor(id, storageService) {
            this.storageService = storageService;
            this.id = Memento.COMMON_PREFIX + id;
        }
        getMemento(scope, target) {
            switch (scope) {
                case 1 /* StorageScope.WORKSPACE */: {
                    let workspaceMemento = Memento.workspaceMementos.get(this.id);
                    if (!workspaceMemento) {
                        workspaceMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.workspaceMementos.set(this.id, workspaceMemento);
                    }
                    return workspaceMemento.getMemento();
                }
                case 0 /* StorageScope.PROFILE */: {
                    let profileMemento = Memento.profileMementos.get(this.id);
                    if (!profileMemento) {
                        profileMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.profileMementos.set(this.id, profileMemento);
                    }
                    return profileMemento.getMemento();
                }
                case -1 /* StorageScope.APPLICATION */: {
                    let applicationMemento = Memento.applicationMementos.get(this.id);
                    if (!applicationMemento) {
                        applicationMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.applicationMementos.set(this.id, applicationMemento);
                    }
                    return applicationMemento.getMemento();
                }
            }
        }
        onDidChangeValue(scope, disposables) {
            return this.storageService.onDidChangeValue(scope, this.id, disposables);
        }
        saveMemento() {
            Memento.workspaceMementos.get(this.id)?.save();
            Memento.profileMementos.get(this.id)?.save();
            Memento.applicationMementos.get(this.id)?.save();
        }
        reloadMemento(scope) {
            let memento;
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    memento = Memento.applicationMementos.get(this.id);
                    break;
                case 0 /* StorageScope.PROFILE */:
                    memento = Memento.profileMementos.get(this.id);
                    break;
                case 1 /* StorageScope.WORKSPACE */:
                    memento = Memento.workspaceMementos.get(this.id);
                    break;
            }
            memento?.reload();
        }
        static clear(scope) {
            switch (scope) {
                case 1 /* StorageScope.WORKSPACE */:
                    Memento.workspaceMementos.clear();
                    break;
                case 0 /* StorageScope.PROFILE */:
                    Memento.profileMementos.clear();
                    break;
                case -1 /* StorageScope.APPLICATION */:
                    Memento.applicationMementos.clear();
                    break;
            }
        }
    }
    exports.Memento = Memento;
    class ScopedMemento {
        constructor(id, scope, target, storageService) {
            this.id = id;
            this.scope = scope;
            this.target = target;
            this.storageService = storageService;
            this.mementoObj = this.doLoad();
        }
        doLoad() {
            try {
                return this.storageService.getObject(this.id, this.scope, {});
            }
            catch (error) {
                // Seeing reports from users unable to open editors
                // from memento parsing exceptions. Log the contents
                // to diagnose further
                // https://github.com/microsoft/vscode/issues/102251
                (0, errors_1.onUnexpectedError)(`[memento]: failed to parse contents: ${error} (id: ${this.id}, scope: ${this.scope}, contents: ${this.storageService.get(this.id, this.scope)})`);
            }
            return {};
        }
        getMemento() {
            return this.mementoObj;
        }
        reload() {
            // Clear old
            for (const name of Object.getOwnPropertyNames(this.mementoObj)) {
                delete this.mementoObj[name];
            }
            // Assign new
            Object.assign(this.mementoObj, this.doLoad());
        }
        save() {
            if (!(0, types_1.isEmptyObject)(this.mementoObj)) {
                this.storageService.store(this.id, this.mementoObj, this.scope, this.target);
            }
            else {
                this.storageService.remove(this.id, this.scope);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtZW50by5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vbWVtZW50by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxPQUFPO2lCQUVLLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO2lCQUN2RCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO2lCQUNuRCxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBeUIsQ0FBQztpQkFFckQsa0JBQWEsR0FBRyxVQUFVLENBQUM7UUFJbkQsWUFBWSxFQUFVLEVBQVUsY0FBK0I7WUFBL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzlELElBQUksQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFtQixFQUFFLE1BQXFCO1lBQ3BELFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsbUNBQTJCLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM5RCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDdkIsZ0JBQWdCLEdBQUcsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDbEYsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQzFELENBQUM7b0JBRUQsT0FBTyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUs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