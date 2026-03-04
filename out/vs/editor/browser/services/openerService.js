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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/editor/common/editor", "vs/platform/opener/common/opener"], function (require, exports, dom, window_1, cancellation_1, linkedList_1, map_1, marshalling_1, network_1, resources_1, uri_1, codeEditorService_1, commands_1, editor_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerService = void 0;
    let CommandOpener = class CommandOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(target, options) {
            if (!(0, network_1.matchesScheme)(target, network_1.Schemas.command)) {
                return false;
            }
            if (!options?.allowCommands) {
                // silently ignore commands when command-links are disabled, also
                // suppress other openers by returning TRUE
                return true;
            }
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            if (Array.isArray(options.allowCommands)) {
                // Only allow specific commands
                if (!options.allowCommands.includes(target.path)) {
                    // Suppress other openers by returning TRUE
                    return true;
                }
            }
            // execute as command
            let args = [];
            try {
                args = (0, marshalling_1.parse)(decodeURIComponent(target.query));
            }
            catch {
                // ignore and retry
                try {
                    args = (0, marshalling_1.parse)(target.query);
                }
                catch {
                    // ignore error
                }
            }
            if (!Array.isArray(args)) {
                args = [args];
            }
            await this._commandService.executeCommand(target.path, ...args);
            return true;
        }
    };
    CommandOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], CommandOpener);
    let EditorOpener = class EditorOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(target, options) {
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            const { selection, uri } = (0, opener_1.extractSelection)(target);
            target = uri;
            if (target.scheme === network_1.Schemas.file) {
                target = (0, resources_1.normalizePath)(target); // workaround for non-normalized paths (https://github.com/microsoft/vscode/issues/12954)
            }
            await this._editorService.openCodeEditor({
                resource: target,
                options: {
                    selection,
                    source: options?.fromUserGesture ? editor_1.EditorOpenSource.USER : editor_1.EditorOpenSource.API,
                    ...options?.editorOptions
                }
            }, this._editorService.getFocusedCodeEditor(), options?.openToSide);
            return true;
        }
    };
    EditorOpener = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorOpener);
    let OpenerService = class OpenerService {
        constructor(editorService, commandService) {
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
            this._resolvers = new linkedList_1.LinkedList();
            this._resolvedUriTargets = new map_1.ResourceMap(uri => uri.with({ path: null, fragment: null, query: null }).toString());
            this._externalOpeners = new linkedList_1.LinkedList();
            // Default external opener is going through window.open()
            this._defaultExternalOpener = {
                openExternal: async (href) => {
                    // ensure to open HTTP/HTTPS links into new windows
                    // to not trigger a navigation. Any other link is
                    // safe to be set as HREF to prevent a blank window
                    // from opening.
                    if ((0, network_1.matchesSomeScheme)(href, network_1.Schemas.http, network_1.Schemas.https)) {
                        dom.windowOpenNoOpener(href);
                    }
                    else {
                        window_1.mainWindow.location.href = href;
                    }
                    return true;
                }
            };
            // Default opener: any external, maito, http(s), command, and catch-all-editors
            this._openers.push({
                open: async (target, options) => {
                    if (options?.openExternal || (0, network_1.matchesSomeScheme)(target, network_1.Schemas.mailto, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.vsls)) {
                        // open externally
                        await this._doOpenExternal(target, options);
                        return true;
                    }
                    return false;
                }
            });
            this._openers.push(new CommandOpener(commandService));
            this._openers.push(new EditorOpener(editorService));
        }
        registerOpener(opener) {
            const remove = this._openers.unshift(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        registerExternalUriResolver(resolver) {
            const remove = this._resolvers.push(resolver);
            return { dispose: remove };
        }
        setDefaultExternalOpener(externalOpener) {
            this._defaultExternalOpener = externalOpener;
        }
        registerExternalOpener(opener) {
            const remove = this._externalOpeners.push(opener);
            return { dispose: remove };
        }
        async open(target, options) {
            // check with contributed validators
            const targetURI = typeof target === 'string' ? uri_1.URI.parse(target) : target;
            // validate against the original URI that this URI resolves to, if one exists
            const validationTarget = this._resolvedUriTargets.get(targetURI) ?? target;
            for (const validator of this._validators) {
                if (!(await validator.shouldOpen(validationTarget, options))) {
                    return false;
                }
            }
            // check with contributed openers
            for (const opener of this._openers) {
                const handled = await opener.open(target, options);
                if (handled) {
                    return true;
                }
            }
            return false;
        }
        async resolveExternalUri(resource, options) {
            for (const resolver of this._resolvers) {
                try {
                    const result = await resolver.resolveExternalUri(resource, options);
                    if (result) {
                        if (!this._resolvedUriTargets.has(result.resolved)) {
                            this._resolvedUriTargets.set(result.resolved, resource);
                        }
                        return result;
                    }
                }
                catch {
                    // noop
                }
            }
            throw new Error('Could not resolve external URI: ' + resource.toString());
        }
        async _doOpenExternal(resource, options) {
            //todo@jrieken IExternalUriResolver should support `uri: URI | string`
            const uri = typeof resource === 'string' ? uri_1.URI.parse(resource) : resource;
            let externalUri;
            try {
                externalUri = (await this.resolveExternalUri(uri, options)).resolved;
            }
            catch {
                externalUri = uri;
            }
            let href;
            if (typeof resource === 'string' && uri.toString() === externalUri.toString()) {
                // open the url-string AS IS
                href = resource;
            }
            else {
                // open URI using the toString(noEncode)+encodeURI-trick
                href = encodeURI(externalUri.toString(true));
            }
            if (options?.allowContributedOpeners) {
                const preferredOpenerId = typeof options?.allowContributedOpeners === 'string' ? options?.allowContributedOpeners : undefined;
                for (const opener of this._externalOpeners) {
                    const didOpen = await opener.openExternal(href, {
                        sourceUri: uri,
                        preferredOpenerId,
                    }, cancellation_1.CancellationToken.None);
                    if (didOpen) {
                        return true;
                    }
                }
            }
            return this._defaultExternalOpener.openExternal(href, { sourceUri: uri }, cancellation_1.CancellationToken.None);
        }
        dispose() {
            this._validators.clear();
        }
    };
    exports.OpenerService = OpenerService;
    exports.OpenerService = OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3NlcnZpY2VzL29wZW5lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhO1FBRWxCLFlBQThDLGVBQWdDO1lBQWhDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUFJLENBQUM7UUFFbkYsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFvQixFQUFFLE9BQXFCO1lBQ3JELElBQUksQ0FBQyxJQUFBLHVCQUFhLEVBQUMsTUFBTSxFQUFFLGlCQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztnQkFDN0IsaUVBQWlFO2dCQUNqRSwyQ0FBMkM7Z0JBQzNDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLCtCQUErQjtnQkFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNsRCwyQ0FBMkM7b0JBQzNDLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBRUQscUJBQXFCO1lBQ3JCLElBQUksSUFBSSxH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