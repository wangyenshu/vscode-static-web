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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/resources", "vs/workbench/contrib/files/common/explorerFileNestingTrie", "vs/base/common/types"], function (require, exports, uri_1, extpath_1, path_1, map_1, strings_1, arrays_1, lifecycle_1, decorators_1, event_1, resources_1, explorerFileNestingTrie_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewExplorerItem = exports.ExplorerItem = exports.ExplorerModel = void 0;
    class ExplorerModel {
        constructor(contextService, uriIdentityService, fileService, configService, filesConfigService) {
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeRoots = new event_1.Emitter();
            const setRoots = () => this._roots = this.contextService.getWorkspace().folders
                .map(folder => new ExplorerItem(folder.uri, fileService, configService, filesConfigService, undefined, true, false, false, false, folder.name));
            setRoots();
            this._listener = this.contextService.onDidChangeWorkspaceFolders(() => {
                setRoots();
                this._onDidChangeRoots.fire();
            });
        }
        get roots() {
            return this._roots;
        }
        get onDidChangeRoots() {
            return this._onDidChangeRoots.event;
        }
        /**
         * Returns an array of child stat from this stat that matches with the provided path.
         * Starts matching from the first root.
         * Will return empty array in case the FileStat does not exist.
         */
        findAll(resource) {
            return (0, arrays_1.coalesce)(this.roots.map(root => root.find(resource)));
        }
        /**
         * Returns a FileStat that matches the passed resource.
         * In case multiple FileStat are matching the resource (same folder opened multiple times) returns the FileStat that has the closest root.
         * Will return undefined in case the FileStat does not exist.
         */
        findClosest(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            if (folder) {
                const root = this.roots.find(r => this.uriIdentityService.extUri.isEqual(r.resource, folder.uri));
                if (root) {
                    return root.find(resource);
                }
            }
            return null;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._listener);
        }
    }
    exports.ExplorerModel = ExplorerModel;
    class ExplorerItem {
        constructor(resource, fileService, configService, filesConfigService, _parent, _isDirectory, _isSymbolicLink, _readonly, _locked, _name = (0, resources_1.basenameOrAuthority)(resource), _mtime, _unknown = false) {
            this.resource = resource;
            this.fileService = fileService;
            this.configService = configService;
            this.filesConfigService = filesConfigService;
            this._parent = _parent;
            this._isDirectory = _isDirectory;
            this._isSymbolicLink = _isSymbolicLink;
            this._readonly = _readonly;
            this._locked = _locked;
            this._name = _name;
            this._mtime = _mtime;
            this._unknown = _unknown;
            this.error = undefined;
            this._isExcluded = false;
            this._isDirectoryResolved = false;
        }
        get isExcluded() {
            if (this._isExcluded) {
                return true;
            }
            if (!this._parent) {
                return false;
            }
            return this._parent.isExcluded;
        }
        set isExcluded(value) {
            this._isExcluded = value;
        }
        hasChildren(filter) {
            if (this.hasNests) {
                return this.nestedChildren?.some(c => filter(c)) ?? false;
            }
            else {
                return this.isDirectory;
            }
        }
        get hasNests() {
            return !!(this.nestedChildren?.length);
        }
        get isDirectoryResolved() {
            return this._isDirectoryResolved;
        }
        get isSymbolicLink() {
            return !!this._isSymbolicLink;
        }
        get isDirectory() {
            return !!this._isDirectory;
        }
        get isReadonly() {
            return this.filesConfigService.isReadonly(this.resource, { resource: this.resource, name: this.name, readonly: this._readonly, locked: this._locked });
        }
        get mtime() {
            return this._mtime;
        }
        get name() {
            return this._name;
        }
        get isUnknown() {
            return this._unknown;
        }
        get parent() {
            return this._parent;
        }
        get root() {
            if (!this._parent) {
                return this;
            }
            return this._parent.root;
        }
        get children() {
            return new Map();
        }
        updateName(value) {
            // Re-add to parent since the parent has a name map to children and the name might have changed
            this._parent?.removeChild(this);
            this._name = value;
            this._parent?.addChild(this);
        }
        getId() {
            return this.root.resource.toString() + '::' + this.resource.toString();
        }
        toString() {
            return `ExplorerItem: ${this.name}`;
        }
        get isRoot() {
            return this === this.root;
        }
        static create(fileService, configService, filesConfigService, raw, parent, resolveTo) {
            const stat = new ExplorerItem(raw.resource, fileService, configService, filesConfigService, parent, raw.isDirectory, raw.isSymbolicLink, raw.readonly, raw.locked, raw.name, raw.mtime, !raw.isFile && !raw.isDirectory);
            // Recursively add children if present
            if (stat.isDirectory) {
                // isDirectoryResolved is a very important indicator in the stat model that tells if the folder was fully resolved
                // the folder is fully resolved if either it has a list of children or the client requested this by using the resolveTo
                // array of resource path to resolve.
                stat._isDirectoryResolved = !!raw.children || (!!resolveTo && resolveTo.some((r) => {
                    return (0, resources_1.isEqualOrParent)(r, stat.resource);
                }));
                // Recurse into children
                if (raw.children) {
                    for (let i = 0, len = raw.children.length; i < len; i++) {
                        const child = ExplorerItem.create(fileService, configService, filesConfigService, raw.children[i], stat, resolveTo);
                        stat.addChild(child);
                    }
                }
            }
            return stat;
        }
        /**
         * Merges the stat which was resolved from the disk with the local stat by copying over properties
         * and children. The merge will only consider resolved stat elements to avoid overwriting data which
         * exists locally.
         */
        static mergeLocalWithDisk(disk, local) {
            if (disk.resource.toString() !== local.resource.toString()) {
                return; // Merging only supported for stats with the same resource
            }
            // Stop merging when a folder is not resolved to avoid loosing local data
            const mergingDirectories = disk.isDirectory || local.isDirectory;
            if (mergingDirectories && local._isDirectoryResolved && !disk._isDirectoryResolved) {
                return;
            }
            // Properties
            local.resource = disk.resource;
            if (!local.isRoot) {
                local.updateName(disk.name);
            }
            local._isDirectory = disk.isDirectory;
            local._mtime = disk.mtime;
            local._isDirectoryResolved = disk._isDirectoryResolved;
            local._isSymbolicLink = disk.isSymbolicLink;
            local.error = disk.error;
            // Merge Children if resolved
            if (mergingDirectories && disk._isDirectoryResolved) {
                // Map resource => stat
                const oldLocalChildren = new map_1.ResourceMap();
                local.children.forEach(child => {
                    oldLocalChildren.set(child.resource, child);
                });
                // Clear current children
                local.children.clear();
                // Merge received children
                disk.children.forEach(diskChild => {
                    const formerLocalChild = oldLocalChildren.get(diskChild.resource);
                    // Existing child: merge
                    if (formerLocalChild) {
                        ExplorerItem.mergeLocalWithDisk(diskChild, formerLocalChild);
                        local.addChild(formerLocalChild);
                        oldLocalChildren.delete(diskChild.resource);
                    }
                    // New child: add
                    else {
                        local.addChild(diskChild);
                    }
                });
                oldLocalChildren.forEach(oldChild => {
                    if (oldChild instanceof NewExplorerItem) {
                        local.addChild(oldChild);
                    }
                });
            }
        }
        /**
         * Adds a child element to this folder.
         */
        addChild(child) {
            // Inherit some parent properties to child
            child._parent = this;
            child.updateResource(false);
            this.children.set(this.getPlatformAwareName(child.name), child);
        }
        getChild(name) {
            return this.children.get(this.getPlatformAwareName(name));
        }
        fetchChildren(sortOrder) {
            const nestingConfig = this.configService.getValue({ resource: this.root.resource }).explorer.fileNesting;
            // fast path when the children can be resolved sync
            if (nestingConfig.enabled && this.nestedChildren) {
                return this.nestedChildren;
            }
            return (async () => {
                if (!this._isDirectoryResolved) {
                    // Resolve metadata only when the mtime is needed since this can be expensive
                    // Mtime is only used when the sort order is 'modified'
                    const resolveMetadata = sortOrder === "modified" /* SortOrder.Modified */;
                    this.error = undefined;
                    try {
                        const stat = await this.fileService.resolve(this.resource, { resolveSingleChildDescendants: true, resolveMetadata });
                        const resolved = ExplorerItem.create(this.fileService, this.configService, this.filesConfigService, stat, this);
                        ExplorerItem.mergeLocalWithDisk(resolved, this);
                    }
                    catch (e) {
                        this.error = e;
                        throw e;
                    }
                    this._isDirectoryResolved = true;
                }
                const items = [];
                if (nestingConfig.enabled) {
                    const fileChildren = [];
                    const dirChildren = [];
                    for (const child of this.children.entries()) {
                        child[1].nestedParent = undefined;
                        if (child[1].isDirectory) {
                            dirChildren.push(child);
                        }
                        else {
                            fileChildren.push(child);
                        }
                    }
                    const nested = this.fileNester.nest(fileChildren.map(([name]) => name), this.getPlatformAwareName(this.name));
                    for (const [fileEntryName, fileEntryItem] of fileChildren) {
                        const nestedItems = nested.get(fileEntryName);
                        if (nestedItems !== undefined) {
                            fileEntryItem.nestedChildren = [];
                            for (const name of nestedItems.keys()) {
                                const child = (0, types_1.assertIsDefined)(this.children.get(name));
                                fileEntryItem.nestedChildren.push(child);
                                child.nestedParent = fileEntryItem;
                            }
                            items.push(fileEntryItem);
                        }
                        else {
                            fileEntryItem.nestedChildren = undefined;
                        }
                    }
                    for (const [_, dirEntryItem] of dirChildren.values()) {
                        items.push(dirEntryItem);
                    }
                }
                else {
                    this.children.forEach(child => {
                        items.push(child);
                    });
                }
                return items;
            })();
        }
        get fileNester() {
            if (!this.root._fileNester) {
                const nestingConfig = this.configService.getValue({ resource: this.root.resource }).explorer.fileNesting;
                const patterns = Object.entries(nestingConfig.patterns)
                    .filter(entry => typeof (entry[0]) === 'string' && typeof (entry[1]) === 'string' && entry[0] && entry[1])
                    .map(([parentPattern, childrenPatterns]) => [
                    this.getPlatformAwareName(parentPattern.trim()),
                    childrenPatterns.split(',').map(p => this.getPlatformAwareName(p.trim().replace(/\u200b/g, '').trim()))
                        .filter(p => p !== '')
                ]);
                this.root._fileNester = new explorerFileNestingTrie_1.ExplorerFileNestingTrie(patterns);
            }
            return this.root._fileNester;
        }
        /**
         * Removes a child element from this folder.
         */
        removeChild(child) {
            this.nestedChildren = undefined;
            this.children.delete(this.getPlatformAwareName(child.name));
        }
        forgetChildren() {
            this.children.clear();
            this.nestedChildren = undefined;
            this._isDirectoryResolved = false;
            this._fileNester = undefined;
        }
        getPlatformAwareName(name) {
            return this.fileService.hasCapability(this.resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */) ? name : name.toLowerCase();
        }
        /**
         * Moves this element under a new parent element.
         */
        move(newParent) {
            this.nestedParent?.removeChild(this);
            this._parent?.removeChild(this);
            newParent.removeChild(this); // make sure to remove any previous version of the file if any
            newParent.addChild(this);
            this.updateResource(true);
        }
        updateResource(recursive) {
            if (this._parent) {
                this.resource = (0, resources_1.joinPath)(this._parent.resource, this.name);
            }
            if (recursive) {
                if (this.isDirectory) {
                    this.children.forEach(child => {
                        child.updateResource(true);
                    });
                }
            }
        }
        /**
         * Tells this stat that it was renamed. This requires changes to all children of this stat (if any)
         * so that the path property can be updated properly.
         */
        rename(renamedStat) {
            // Merge a subset of Properties that can change on rename
            this.updateName(renamedStat.name);
            this._mtime = renamedStat.mtime;
            // Update Paths including children
            this.updateResource(true);
        }
        /**
         * Returns a child stat from this stat that matches with the provided path.
         * Will return "null" in case the child does not exist.
         */
        find(resource) {
            // Return if path found
            // For performance reasons try to do the comparison as fast as possible
            const ignoreCase = !this.fileService.hasCapability(resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (resource && this.resource.scheme === resource.scheme && (0, strings_1.equalsIgnoreCase)(this.resource.authority, resource.authority) &&
                (ignoreCase ? (0, strings_1.startsWithIgnoreCase)(resource.path, this.resource.path) : resource.path.startsWith(this.resource.path))) {
                return this.findByPath((0, strings_1.rtrim)(resource.path, path_1.posix.sep), this.resource.path.length, ignoreCase);
            }
            return null; //Unable to find
        }
        findByPath(path, index, ignoreCase) {
            if ((0, extpath_1.isEqual)((0, strings_1.rtrim)(this.resource.path, path_1.posix.sep), path, ignoreCase)) {
                return this;
            }
            if (this.isDirectory) {
                // Ignore separtor to more easily deduct the next name to search
                while (index < path.length && path[index] === path_1.posix.sep) {
                    index++;
                }
                let indexOfNextSep = path.indexOf(path_1.posix.sep, index);
                if (indexOfNextSep === -1) {
                    // If there is no separator take the remainder of the path
                    indexOfNextSep = path.length;
                }
                // The name to search is between two separators
                const name = path.substring(index, indexOfNextSep);
                const child = this.children.get(this.getPlatformAwareName(name));
                if (child) {
                    // We found a child with the given name, search inside it
                    return child.findByPath(path, indexOfNextSep, ignoreCase);
                }
            }
            return null;
        }
    }
    exports.ExplorerItem = ExplorerItem;
    __decorate([
        decorators_1.memoize
    ], ExplorerItem.prototype, "children", null);
    class NewExplorerItem extends ExplorerItem {
        constructor(fileService, configService, filesConfigService, parent, isDirectory) {
            super(uri_1.URI.file(''), fileService, configService, filesConfigService, parent, isDirectory);
            this._isDirectoryResolved = true;
        }
    }
    exports.NewExplorerItem = NewExplorerItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2NvbW1vbi9leHBsb3Jlck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQXNCaEcsTUFBYSxhQUFhO1FBTXpCLFlBQ2tCLGNBQXdDLEVBQ3hDLGtCQUF1QyxFQUN4RCxXQUF5QixFQUN6QixhQUFvQyxFQUNwQyxrQkFBOEM7WUFKN0IsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ3hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFKeEMsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQVN4RCxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTztpQkFDN0UsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDakosUUFBUSxFQUFFLENBQUM7WUFFWCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFO2dCQUNyRSxRQUFRLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJ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