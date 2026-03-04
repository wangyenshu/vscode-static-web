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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/severity", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/platform/undoRedo/common/undoRedo"], function (require, exports, errors_1, lifecycle_1, network_1, severity_1, nls, dialogs_1, extensions_1, notification_1, undoRedo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoService = void 0;
    const DEBUG = false;
    function getResourceLabel(resource) {
        return resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
    }
    let stackElementCounter = 0;
    class ResourceStackElement {
        constructor(actual, resourceLabel, strResource, groupId, groupOrder, sourceId, sourceOrder) {
            this.id = (++stackElementCounter);
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.actual = actual;
            this.label = actual.label;
            this.confirmBeforeUndo = actual.confirmBeforeUndo || false;
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this.resourceLabels = [this.resourceLabel];
            this.strResources = [this.strResource];
            this.groupId = groupId;
            this.groupOrder = groupOrder;
            this.sourceId = sourceId;
            this.sourceOrder = sourceOrder;
            this.isValid = true;
        }
        setValid(isValid) {
            this.isValid = isValid;
        }
        toString() {
            return `[id:${this.id}] [group:${this.groupId}] [${this.isValid ? '  VALID' : 'INVALID'}] ${this.actual.constructor.name} - ${this.actual}`;
        }
    }
    var RemovedResourceReason;
    (function (RemovedResourceReason) {
        RemovedResourceReason[RemovedResourceReason["ExternalRemoval"] = 0] = "ExternalRemoval";
        RemovedResourceReason[RemovedResourceReason["NoParallelUniverses"] = 1] = "NoParallelUniverses";
    })(RemovedResourceReason || (RemovedResourceReason = {}));
    class ResourceReasonPair {
        constructor(resourceLabel, reason) {
            this.resourceLabel = resourceLabel;
            this.reason = reason;
        }
    }
    class RemovedResources {
        constructor() {
            this.elements = new Map();
        }
        createMessage() {
            const externalRemoval = [];
            const noParallelUniverses = [];
            for (const [, element] of this.elements) {
                const dest = (element.reason === 0 /* RemovedResourceReason.ExternalRemoval */
                    ? externalRemoval
                    : noParallelUniverses);
                dest.push(element.resourceLabel);
            }
            const messages = [];
            if (externalRemoval.length > 0) {
                messages.push(nls.localize({ key: 'externalRemoval', comment: ['{0} is a list of filenames'] }, "The following files have been closed and modified on disk: {0}.", externalRemoval.join(', ')));
            }
            if (noParallelUniverses.length > 0) {
                messages.push(nls.localize({ key: 'noParallelUniverses', comment: ['{0} is a list of filenames'] }, "The following files have been modified in an incompatible way: {0}.", noParallelUniverses.join(', ')));
            }
            return messages.join('\n');
        }
        get size() {
            return this.elements.size;
        }
        has(strResource) {
            return this.elements.has(strResource);
        }
        set(strResource, value) {
            this.elements.set(strResource, value);
        }
        delete(strResource) {
            return this.elements.delete(strResource);
        }
    }
    class WorkspaceStackElement {
        constructor(actual, resourceLabels, strResources, groupId, groupOrder, sourceId, sourceOrder) {
            this.id = (++stackElementCounter);
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this.actual = actual;
            this.label = actual.label;
            this.confirmBeforeUndo = actual.confirmBeforeUndo || false;
            this.resourceLabels = resourceLabels;
            this.strResources = strResources;
            this.groupId = groupId;
            this.groupOrder = groupOrder;
            this.sourceId = sourceId;
            this.sourceOrder = sourceOrder;
            this.removedResources = null;
            this.invalidatedResources = null;
        }
        canSplit() {
            return (typeof this.actual.split === 'function');
        }
        removeResource(resourceLabel, strResource, reason) {
            if (!this.removedResources) {
                this.removedResources = new RemovedResources();
            }
            if (!this.removedResources.has(strResource)) {
                this.removedResources.set(strResource, new ResourceReasonPair(resourceLabel, reason));
            }
        }
        setValid(resourceLabel, strResource, isValid) {
            if (isValid) {
                if (this.invalidatedResources) {
                    this.invalidatedResources.delete(strResource);
                    if (this.invalidatedResources.size === 0) {
                        this.invalidatedResources = null;
                    }
                }
            }
            else {
                if (!this.invalidatedResources) {
                    this.invalidatedResources = new RemovedResources();
                }
                if (!this.invalidatedResources.has(strResource)) {
                    this.invalidatedResources.set(strResource, new ResourceReasonPair(resourceLabel, 0 /* RemovedResourceReason.ExternalRemoval */));
                }
            }
        }
        toString() {
            return `[id:${this.id}] [group:${this.groupId}] [${this.invalidatedResources ? 'INVALID' : '  VALID'}] ${this.actual.constructor.name} - ${this.actual}`;
        }
    }
    class ResourceEditStack {
        constructor(resourceLabel, strResource) {
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this._past = [];
            this._future = [];
            this.locked = false;
            this.versionId = 1;
        }
        dispose() {
            for (const element of this._past) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            this.versionId++;
        }
        toString() {
            const result = [];
            result.push(`* ${this.strResource}:`);
            for (let i = 0; i < this._past.length; i++) {
                result.push(`   * [UNDO] ${this._past[i]}`);
            }
            for (let i = this._future.length - 1; i >= 0; i--) {
                result.push(`   * [REDO] ${this._future[i]}`);
            }
            return result.join('\n');
        }
        flushAllElements() {
            this._past = [];
            this._future = [];
            this.versionId++;
        }
        setElementsIsValid(isValid) {
            for (const element of this._past) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
        }
        _setElementValidFlag(element, isValid) {
            if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                element.setValid(this.resourceLabel, this.strResource, isValid);
            }
            else {
                element.setValid(isValid);
            }
        }
        setElementsValidFlag(isValid, filter) {
            for (const element of this._past) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
            for (const element of this._future) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
        }
        pushElement(element) {
            // remove the future
            for (const futureElement of this._future) {
                if (futureElement.type === 1 /* UndoRedoElementType.Workspace */) {
                    futureElement.removeResource(this.resourceLabel, this.strResource, 1 /* RemovedResourceReason.NoParallelUniverses */);
                }
            }
            this._future = [];
            this._past.push(element);
            this.versionId++;
        }
        createSnapshot(resource) {
            const elements = [];
            for (let i = 0, len = this._past.length; i < len; i++) {
                elements.push(this._past[i].id);
            }
            for (let i = this._future.length - 1; i >= 0; i--) {
                elements.push(this._future[i].id);
            }
            return new undoRedo_1.ResourceEditStackSnapshot(resource, elements);
        }
        restoreSnapshot(snapshot) {
            const snapshotLength = snapshot.elements.length;
            let isOK = true;
            let snapshotIndex = 0;
            let removePastAfter = -1;
            for (let i = 0, len = this._past.length; i < len; i++, snapshotIndex++) {
                const element = this._past[i];
                if (isOK && (snapshotIndex >= snapshotLength || element.id !== snapshot.elements[snapshotIndex])) {
                    isOK = false;
                    removePastAfter = 0;
                }
                if (!isOK && element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            let removeFutureBefore = -1;
            for (let i = this._future.length - 1; i >= 0; i--, snapshotIndex++) {
                const element = this._future[i];
                if (isOK && (snapshotIndex >= snapshotLength || element.id !== snapshot.elements[snapshotIndex])) {
                    isOK = false;
                    removeFutureBefore = i;
                }
                if (!isOK && element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            if (removePastAfter !== -1) {
                this._past = this._past.slice(0, removePastAfter);
            }
            if (removeFutureBefore !== -1) {
                this._future = this._future.slice(removeFutureBefore + 1);
            }
            this.versionId++;
        }
        getElements() {
            const past = [];
            const future = [];
            for (const element of this._past) {
                past.push(element.actual);
            }
            for (const element of this._future) {
                future.push(element.actual);
            }
            return { past, future };
        }
        getClosestPastElement() {
            if (this._past.length === 0) {
                return null;
            }
            return this._past[this._past.length - 1];
        }
        getSecondClosestPastElement() {
            if (this._past.length < 2) {
                return null;
            }
            return this._past[this._past.length - 2];
        }
        getClosestFutureElement() {
            if (this._future.length === 0) {
                return null;
            }
            return this._future[this._future.length - 1];
        }
        hasPastElements() {
            return (this._past.length > 0);
        }
        hasFutureElements() {
            return (this._future.length > 0);
        }
        splitPastWorkspaceElement(toRemove, individualMap) {
            for (let j = this._past.length - 1; j >= 0; j--) {
                if (this._past[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._past[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._past.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        splitFutureWorkspaceElement(toRemove, individualMap) {
            for (let j = this._future.length - 1; j >= 0; j--) {
                if (this._future[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._future[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._future.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        moveBackward(element) {
            this._past.pop();
            this._future.push(element);
            this.versionId++;
        }
        moveForward(element) {
            this._future.pop();
            this._past.push(element);
            this.versionId++;
        }
    }
    class EditStackSnapshot {
        constructor(editStacks) {
            this.editStacks = editStacks;
            this._versionIds = [];
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                this._versionIds[i] = this.editStacks[i].versionId;
            }
        }
        isValid() {
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                if (this._versionIds[i] !== this.editStacks[i].versionId) {
                    return false;
                }
            }
            return true;
        }
    }
    const missingEditStack = new ResourceEditStack('', '');
    missingEditStack.locked = true;
    let UndoRedoService = class UndoRedoService {
        constructor(_dialogService, _notificationService) {
            this._dialogService = _dialogService;
            this._notificationService = _notificationService;
            this._editStacks = new Map();
            this._uriComparisonKeyComputers = [];
        }
        registerUriComparisonKeyComputer(scheme, uriComparisonKeyComputer) {
            this._uriComparisonKeyComputers.push([scheme, uriComparisonKeyComputer]);
            return {
                dispose: () => {
                    for (let i = 0, len = this._uriComparisonKeyComputers.length; i < len; i++) {
                        if (this._uriComparisonKeyComputers[i][1] === uriComparisonKeyComputer) {
                            this._uriComparisonKeyComputers.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getUriComparisonKey(resource) {
            for (const uriComparisonKeyComputer of this._uriComparisonKeyComputers) {
                if (uriComparisonKeyComputer[0] === resource.scheme) {
                    return uriComparisonKeyComputer[1].getComparisonKey(resource);
                }
            }
            return resource.toString();
        }
        _print(label) {
            console.log(`------------------------------------`);
            console.log(`AFTER ${label}: `);
            const str = [];
            for (const element of this._editStacks) {
                str.push(element[1].toString());
            }
            console.log(str.join('\n'));
        }
        pushElement(element, group = undoRedo_1.UndoRedoGroup.None, source = undoRedo_1.UndoRedoSource.None) {
            if (element.type === 0 /* UndoRedoElementType.Resource */) {
                const resourceLabel = getResourceLabel(element.resource);
                const strResource = this.getUriComparisonKey(element.resource);
                this._pushElement(new ResourceStackElement(element, resourceLabel, strResource, group.id, group.nextOrder(), source.id, source.nextOrder()));
            }
            else {
                const seen = new Set();
                const resourceLabels = [];
                const strResources = [];
                for (const resource of element.resources) {
                    const resourceLabel = getResourceLabel(resource);
                    const strResource = this.getUriComparisonKey(resource);
                    if (seen.has(strResource)) {
                        continue;
                    }
                    seen.add(strResource);
                    resourceLabels.push(resourceLabel);
                    strResources.push(strResource);
                }
                if (resourceLabels.length === 1) {
                    this._pushElement(new ResourceStackElement(element, resourceLabels[0], strResources[0], group.id, group.nextOrder(), source.id, source.nextOrder()));
                }
                else {
                    this._pushElement(new WorkspaceStackElement(element, resourceLabels, strResources, group.id, group.nextOrder(), source.id, source.nextOrder()));
                }
            }
            if (DEBUG) {
                this._print('pushElement');
            }
        }
        _pushElement(element) {
            for (let i = 0, len = element.strResources.length; i < len; i++) {
                const resourceLabel = element.resourceLabels[i];
                const strResource = element.strResources[i];
                let editStack;
                if (this._editStacks.has(strResource)) {
                    editStack = this._editStacks.get(strResource);
                }
                else {
                    editStack = new ResourceEditStack(resourceLabel, strResource);
                    this._editStacks.set(strResource, editStack);
                }
                editStack.pushElement(element);
            }
        }
        getLastElement(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                if (editStack.hasFutureElements()) {
                    return null;
                }
                const closestPastElement = editStack.getClosestPastElement();
                return closestPastElement ? closestPastElement.actual : null;
            }
            return null;
        }
        _splitPastWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource, 0, 0, 0, 0);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitPastWorkspaceElement(toRemove, individualMap);
            }
        }
        _splitFutureWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource, 0, 0, 0, 0);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitFutureWorkspaceElement(toRemove, individualMap);
            }
        }
        removeElements(resource) {
            const strResource = typeof resource === 'string' ? resource : this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.dispose();
                this._editStacks.delete(strResource);
            }
            if (DEBUG) {
                this._print('removeElements');
            }
        }
        setElementsValidFlag(resource, isValid, filter) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.setElementsValidFlag(isValid, filter);
            }
            if (DEBUG) {
                this._print('setElementsValidFlag');
            }
        }
        hasElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return (editStack.hasPastElements() || editStack.hasFutureElements());
            }
            return false;
        }
        createSnapshot(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.createSnapshot(resource);
            }
            return new undoRedo_1.ResourceEditStackSnapshot(resource, []);
        }
        restoreSnapshot(snapshot) {
            const strResource = this.getUriComparisonKey(snapshot.resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.restoreSnapshot(snapshot);
                if (!editStack.hasPastElements() && !editStack.hasFutureElements()) {
                    // the edit stack is now empty, just remove it entirely
                    editStack.dispose();
                    this._editStacks.delete(strResource);
                }
            }
            if (DEBUG) {
                this._print('restoreSnapshot');
            }
        }
        getElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.getElements();
            }
            return { past: [], future: [] };
        }
        _findClosestUndoElementWithSource(sourceId) {
            if (!sourceId) {
                return [null, null];
            }
            // find an element with the sourceId and with the highest sourceOrder ready to be undone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestPastElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.sourceId === sourceId) {
                    if (!matchedElement || candidate.sourceOrder > matchedElement.sourceOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        canUndo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestUndoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? true : false;
            }
            const strResource = this.getUriComparisonKey(resourceOrSource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasPastElements();
            }
            return false;
        }
        _onError(err, element) {
            (0, errors_1.onUnexpectedError)(err);
            // An error occurred while undoing or redoing => drop the undo/redo stack for all affected resources
            for (const strResource of element.strResources) {
                this.removeElements(strResource);
            }
            this._notificationService.error(err);
        }
        _acquireLocks(editStackSnapshot) {
            // first, check if all locks can be acquired
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    throw new Error('Cannot acquire edit stack lock');
                }
            }
            // can acquire all locks
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.locked = true;
            }
            return () => {
                // release all locks
                for (const editStack of editStackSnapshot.editStacks) {
                    editStack.locked = false;
                }
            };
        }
        _safeInvokeWithLocks(element, invoke, editStackSnapshot, cleanup, continuation) {
            const releaseLocks = this._acquireLocks(editStackSnapshot);
            let result;
            try {
                result = invoke();
            }
            catch (err) {
                releaseLocks();
                cleanup.dispose();
                return this._onError(err, element);
            }
            if (result) {
                // result is Promise<void>
                return result.then(() => {
                    releaseLocks();
                    cleanup.dispose();
                    return continuation();
                }, (err) => {
                    releaseLocks();
                    cleanup.dispose();
                    return this._onError(err, element);
                });
            }
            else {
                // result is void
                releaseLocks();
                cleanup.dispose();
                return continuation();
            }
        }
        async _invokeWorkspacePrepare(element) {
            if (typeof element.actual.prepareUndoRedo === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            const result = element.actual.prepareUndoRedo();
            if (typeof result === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            return result;
        }
        _invokeResourcePrepare(element, callback) {
            if (element.actual.type !== 1 /* UndoRedoElementType.Workspace */ || typeof element.actual.prepareUndoRedo === 'undefined') {
                // no preparation needed
                return callback(lifecycle_1.Disposable.None);
            }
            const r = element.actual.prepareUndoRedo();
            if (!r) {
                // nothing to clean up
                return callback(lifecycle_1.Disposable.None);
            }
            if ((0, lifecycle_1.isDisposable)(r)) {
                return callback(r);
            }
            return r.then((disposable) => {
                return callback(disposable);
            });
        }
        _getAffectedEditStacks(element) {
            const affectedEditStacks = [];
            for (const strResource of element.strResources) {
                affectedEditStacks.push(this._editStacks.get(strResource) || missingEditStack);
            }
            return new EditStackSnapshot(affectedEditStacks);
        }
        _tryToSplitAndUndo(strResource, element, ignoreResources, message) {
            if (element.canSplit()) {
                this._splitPastWorkspaceElement(element, ignoreResources);
                this._notificationService.warn(message);
                return new WorkspaceVerificationError(this._undo(strResource, 0, true));
            }
            else {
                // Cannot safely split this workspace element => flush all undo/redo stacks
                for (const strResource of element.strResources) {
                    this.removeElements(strResource);
                }
                this._notificationService.warn(message);
                return new WorkspaceVerificationError();
            }
        }
        _checkWorkspaceUndo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                return this._tryToSplitAndUndo(strResource, element, element.removedResources, nls.localize({ key: 'cannotWorkspaceUndo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not undo '{0}' across all files. {1}", element.label, element.removedResources.createMessage()));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                return this._tryToSplitAndUndo(strResource, element, element.invalidatedResources, nls.localize({ key: 'cannotWorkspaceUndo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not undo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage()));
            }
            // this must be the last past element in all the impacted resources!
            const cannotUndoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestPastElement() !== element) {
                    cannotUndoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotUndoDueToResources.length > 0) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToChanges', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because changes were made to {1}", element.label, cannotUndoDueToResources.join(', ')));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', ')));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToInMeantimeUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label));
            }
            return null;
        }
        _workspaceUndo(strResource, element, undoConfirmed) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceUndo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._confirmAndExecuteWorkspaceUndo(strResource, element, affectedEditStacks, undoConfirmed);
        }
        _isPartOfUndoGroup(element) {
            if (!element.groupId) {
                return false;
            }
            // check that there is at least another element with the same groupId ready to be undone
            for (const [, editStack] of this._editStacks) {
                const pastElement = editStack.getClosestPastElement();
                if (!pastElement) {
                    continue;
                }
                if (pastElement === element) {
                    const secondPastElement = editStack.getSecondClosestPastElement();
                    if (secondPastElement && secondPastElement.groupId === element.groupId) {
                        // there is another element with the same group id in the same stack!
                        return true;
                    }
                }
                if (pastElement.groupId === element.groupId) {
                    // there is another element with the same group id in another stack!
                    return true;
                }
            }
            return false;
        }
        async _confirmAndExecuteWorkspaceUndo(strResource, element, editStackSnapshot, undoConfirmed) {
            if (element.canSplit() && !this._isPartOfUndoGroup(element)) {
                // this element can be split
                let UndoChoice;
                (function (UndoChoice) {
                    UndoChoice[UndoChoice["All"] = 0] = "All";
                    UndoChoice[UndoChoice["This"] = 1] = "This";
                    UndoChoice[UndoChoice["Cancel"] = 2] = "Cancel";
                })(UndoChoice || (UndoChoice = {}));
                const { result } = await this._dialogService.prompt({
                    type: severity_1.default.Info,
                    message: nls.localize('confirmWorkspace', "Would you like to undo '{0}' across all files?", element.label),
                    buttons: [
                        {
                            label: nls.localize({ key: 'ok', comment: ['{0} denotes a number that is > 1, && denotes a mnemonic'] }, "&&Undo in {0} Files", editStackSnapshot.editStacks.length),
                            run: () => UndoChoice.All
                        },
                        {
                            label: nls.localize({ key: 'nok', comment: ['&& denotes a mnemonic'] }, "Undo this &&File"),
                            run: () => UndoChoice.This
                        }
                    ],
                    cancelButton: {
                        run: () => UndoChoice.Cancel
                    }
                });
                if (result === UndoChoice.Cancel) {
                    // choice: cancel
                    return;
                }
                if (result === UndoChoice.This) {
                    // choice: undo this file
                    this._splitPastWorkspaceElement(element, null);
                    return this._undo(strResource, 0, true);
                }
                // choice: undo in all files
                // At this point, it is possible that the element has been made invalid in the meantime (due to the confirmation await)
                const verificationError1 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*invalidated resources will be checked after the prepare call*/ false);
                if (verificationError1) {
                    return verificationError1.returnValue;
                }
                undoConfirmed = true;
            }
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError2 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError2) {
                cleanup.dispose();
                return verificationError2.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveBackward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.undo(), editStackSnapshot, cleanup, () => this._continueUndoInGroup(element.groupId, undoConfirmed));
        }
        _resourceUndo(editStack, element, undoConfirmed) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize({ key: 'cannotResourceUndoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation.'] }, "Could not undo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.warn(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveBackward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.undo(), new EditStackSnapshot([editStack]), cleanup, () => this._continueUndoInGroup(element.groupId, undoConfirmed));
            });
        }
        _findClosestUndoElementInGroup(groupId) {
            if (!groupId) {
                return [null, null];
            }
            // find another element with the same groupId and with the highest groupOrder ready to be undone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestPastElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.groupId === groupId) {
                    if (!matchedElement || candidate.groupOrder > matchedElement.groupOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        _continueUndoInGroup(groupId, undoConfirmed) {
            if (!groupId) {
                return;
            }
            const [, matchedStrResource] = this._findClosestUndoElementInGroup(groupId);
            if (matchedStrResource) {
                return this._undo(matchedStrResource, 0, undoConfirmed);
            }
        }
        undo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestUndoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? this._undo(matchedStrResource, resourceOrSource.id, false) : undefined;
            }
            if (typeof resourceOrSource === 'string') {
                return this._undo(resourceOrSource, 0, false);
            }
            return this._undo(this.getUriComparisonKey(resourceOrSource), 0, false);
        }
        _undo(strResource, sourceId = 0, undoConfirmed) {
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestPastElement();
            if (!element) {
                return;
            }
            if (element.groupId) {
                // this element is a part of a group, we need to make sure undoing in a group is in order
                const [matchedElement, matchedStrResource] = this._findClosestUndoElementInGroup(element.groupId);
                if (element !== matchedElement && matchedStrResource) {
                    // there is an element in the same group that should be undone before this one
                    return this._undo(matchedStrResource, sourceId, undoConfirmed);
                }
            }
            const shouldPromptForConfirmation = (element.sourceId !== sourceId || element.confirmBeforeUndo);
            if (shouldPromptForConfirmation && !undoConfirmed) {
                // Hit a different source or the element asks for prompt before undo, prompt for confirmation
                return this._confirmAndContinueUndo(strResource, sourceId, element);
            }
            try {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    return this._workspaceUndo(strResource, element, undoConfirmed);
                }
                else {
                    return this._resourceUndo(editStack, element, undoConfirmed);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('undo');
                }
            }
        }
        async _confirmAndContinueUndo(strResource, sourceId, element) {
            const result = await this._dialogService.confirm({
                message: nls.localize('confirmDifferentSource', "Would you like to undo '{0}'?", element.label),
                primaryButton: nls.localize({ key: 'confirmDifferentSource.yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                cancelButton: nls.localize('confirmDifferentSource.no', "No")
            });
            if (!result.confirmed) {
                return;
            }
            return this._undo(strResource, sourceId, true);
        }
        _findClosestRedoElementWithSource(sourceId) {
            if (!sourceId) {
                return [null, null];
            }
            // find an element with sourceId and with the lowest sourceOrder ready to be redone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestFutureElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.sourceId === sourceId) {
                    if (!matchedElement || candidate.sourceOrder < matchedElement.sourceOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        canRedo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestRedoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? true : false;
            }
            const strResource = this.getUriComparisonKey(resourceOrSource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasFutureElements();
            }
            return false;
        }
        _tryToSplitAndRedo(strResource, element, ignoreResources, message) {
            if (element.canSplit()) {
                this._splitFutureWorkspaceElement(element, ignoreResources);
                this._notificationService.warn(message);
                return new WorkspaceVerificationError(this._redo(strResource));
            }
            else {
                // Cannot safely split this workspace element => flush all undo/redo stacks
                for (const strResource of element.strResources) {
                    this.removeElements(strResource);
                }
                this._notificationService.warn(message);
                return new WorkspaceVerificationError();
            }
        }
        _checkWorkspaceRedo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                return this._tryToSplitAndRedo(strResource, element, element.removedResources, nls.localize({ key: 'cannotWorkspaceRedo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not redo '{0}' across all files. {1}", element.label, element.removedResources.createMessage()));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                return this._tryToSplitAndRedo(strResource, element, element.invalidatedResources, nls.localize({ key: 'cannotWorkspaceRedo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not redo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage()));
            }
            // this must be the last future element in all the impacted resources!
            const cannotRedoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestFutureElement() !== element) {
                    cannotRedoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotRedoDueToResources.length > 0) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToChanges', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because changes were made to {1}", element.label, cannotRedoDueToResources.join(', ')));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', ')));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToInMeantimeUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label));
            }
            return null;
        }
        _workspaceRedo(strResource, element) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceRedo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._executeWorkspaceRedo(strResource, element, affectedEditStacks);
        }
        async _executeWorkspaceRedo(strResource, element, editStackSnapshot) {
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError = this._checkWorkspaceRedo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError) {
                cleanup.dispose();
                return verificationError.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveForward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.redo(), editStackSnapshot, cleanup, () => this._continueRedoInGroup(element.groupId));
        }
        _resourceRedo(editStack, element) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize({ key: 'cannotResourceRedoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation.'] }, "Could not redo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.warn(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveForward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.redo(), new EditStackSnapshot([editStack]), cleanup, () => this._continueRedoInGroup(element.groupId));
            });
        }
        _findClosestRedoElementInGroup(groupId) {
            if (!groupId) {
                return [null, null];
            }
            // find another element with the same groupId and with the lowest groupOrder ready to be redone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestFutureElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.groupId === groupId) {
                    if (!matchedElement || candidate.groupOrder < matchedElement.groupOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        _continueRedoInGroup(groupId) {
            if (!groupId) {
                return;
            }
            const [, matchedStrResource] = this._findClosestRedoElementInGroup(groupId);
            if (matchedStrResource) {
                return this._redo(matchedStrResource);
            }
        }
        redo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestRedoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? this._redo(matchedStrResource) : undefined;
            }
            if (typeof resourceOrSource === 'string') {
                return this._redo(resourceOrSource);
            }
            return this._redo(this.getUriComparisonKey(resourceOrSource));
        }
        _redo(strResource) {
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestFutureElement();
            if (!element) {
                return;
            }
            if (element.groupId) {
                // this element is a part of a group, we need to make sure redoing in a group is in order
                const [matchedElement, matchedStrResource] = this._findClosestRedoElementInGroup(element.groupId);
                if (element !== matchedElement && matchedStrResource) {
                    // there is an element in the same group that should be redone before this one
                    return this._redo(matchedStrResource);
                }
            }
            try {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    return this._workspaceRedo(strResource, element);
                }
                else {
                    return this._resourceRedo(editStack, element);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('redo');
                }
            }
        }
    };
    exports.UndoRedoService = UndoRedoService;
    exports.UndoRedoService = UndoRedoService = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, notification_1.INotificationService)
    ], UndoRedoService);
    class WorkspaceVerificationError {
        constructor(returnValue) {
            this.returnValue = returnValue;
        }
    }
    (0, extensions_1.registerSingleton)(undoRedo_1.IUndoRedoService, UndoRedoService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kb1JlZG9TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdW5kb1JlZG8vY29tbW9uL3VuZG9SZWRvU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhaEcsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBRXBCLFNBQVMsZ0JBQWdCLENBQUMsUUFBYTtRQUN0QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDM0UsQ0FBQztJQUVELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBRTVCLE1BQU0sb0JBQW9CO1FBaUJ6QixZQUFZLE1BQXdCLEVBQUUsYUFBcUIsRUFBRSxXQUFtQixFQUFFLE9BQWUsRUFBRSxVQUFrQixFQUFFLFFBQWdCLEVBQUUsV0FBbUI7WUFoQjVJLE9BQUUsR0FBRyxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUM3QixTQUFJLHdDQUFnQztZQWdCbkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1lBQzNELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFlBQVksR0FB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