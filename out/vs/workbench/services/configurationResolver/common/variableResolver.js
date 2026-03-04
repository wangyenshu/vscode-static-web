/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/process", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/labels", "vs/nls", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/base/common/strings"], function (require, exports, paths, process, types, objects, platform_1, labels_1, nls_1, configurationResolver_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractVariableResolverService = void 0;
    class AbstractVariableResolverService {
        static { this.VARIABLE_LHS = '${'; }
        static { this.VARIABLE_REGEXP = /\$\{(.*?)\}/g; }
        constructor(_context, _labelService, _userHomePromise, _envVariablesPromise) {
            this._contributedVariables = new Map();
            this._context = _context;
            this._labelService = _labelService;
            this._userHomePromise = _userHomePromise;
            if (_envVariablesPromise) {
                this._envVariablesPromise = _envVariablesPromise.then(envVariables => {
                    return this.prepareEnv(envVariables);
                });
            }
        }
        prepareEnv(envVariables) {
            // windows env variables are case insensitive
            if (platform_1.isWindows) {
                const ev = Object.create(null);
                Object.keys(envVariables).forEach(key => {
                    ev[key.toLowerCase()] = envVariables[key];
                });
                return ev;
            }
            return envVariables;
        }
        resolveWithEnvironment(environment, root, value) {
            return this.recursiveResolve({ env: this.prepareEnv(environment), userHome: undefined }, root ? root.uri : undefined, value);
        }
        async resolveAsync(root, value) {
            const environment = {
                env: await this._envVariablesPromise,
                userHome: await this._userHomePromise
            };
            return this.recursiveResolve(environment, root ? root.uri : undefined, value);
        }
        async resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables) {
            const result = objects.deepClone(config);
            // hoist platform specific attributes to top level
            if (platform_1.isWindows && result.windows) {
                Object.keys(result.windows).forEach(key => result[key] = result.windows[key]);
            }
            else if (platform_1.isMacintosh && result.osx) {
                Object.keys(result.osx).forEach(key => result[key] = result.osx[key]);
            }
            else if (platform_1.isLinux && result.linux) {
                Object.keys(result.linux).forEach(key => result[key] = result.linux[key]);
            }
            // delete all platform specific sections
            delete result.windows;
            delete result.osx;
            delete result.linux;
            // substitute all variables recursively in string values
            const environmentPromises = {
                env: await this._envVariablesPromise,
                userHome: await this._userHomePromise
            };
            return this.recursiveResolve(environmentPromises, workspaceFolder ? workspaceFolder.uri : undefined, result, commandValueMapping, resolvedVariables);
        }
        async resolveAnyAsync(workspaceFolder, config, commandValueMapping) {
            return this.resolveAnyBase(workspaceFolder, config, commandValueMapping);
        }
        async resolveAnyMap(workspaceFolder, config, commandValueMapping) {
            const resolvedVariables = new Map();
            const newConfig = await this.resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables);
            return { newConfig, resolvedVariables };
        }
        resolveWithInteractionReplace(folder, config, section, variables) {
            throw new Error('resolveWithInteractionReplace not implemented.');
        }
        resolveWithInteraction(folder, config, section, variables) {
            throw new Error('resolveWithInteraction not implemented.');
        }
        contributeVariable(variable, resolution) {
            if (this._contributedVariables.has(variable)) {
                throw new Error('Variable ' + variable + ' is contributed twice.');
            }
            else {
                this._contributedVariables.set(variable, resolution);
            }
        }
        async recursiveResolve(environment, folderUri, value, commandValueMapping, resolvedVariables) {
            if (types.isString(value)) {
                return this.resolveString(environment, folderUri, value, commandValueMapping, resolvedVariables);
            }
            else if (Array.isArray(value)) {
                return Promise.all(value.map(s => this.recursiveResolve(environment, folderUri, s, commandValueMapping, resolvedVariables)));
            }
            else if (types.isObject(value)) {
                const result = Object.create(null);
                const replaced = await Promise.all(Object.keys(value).map(async (key) => {
                    const replaced = await this.resolveString(environment, folderUri, key, commandValueMapping, resolvedVariables);
                    return [replaced, await this.recursiveResolve(environment, folderUri, value[key], commandValueMapping, resolvedVariables)];
                }));
                // two step process to preserve object key order
                for (const [key, value] of replaced) {
                    result[key] = value;
                }
                return result;
            }
            return value;
        }
        resolveString(environment, folderUri, value, commandValueMapping, resolvedVariables) {
            // loop through all variables occurrences in 'value'
            return (0, strings_1.replaceAsync)(value, AbstractVariableResolverService.VARIABLE_REGEXP, async (match, variable) => {
                // disallow attempted nesting, see #77289. This doesn't exclude variables that resolve to other variables.
                if (variable.includes(AbstractVariableResolverService.VARIABLE_LHS)) {
                    return match;
                }
                let resolvedValue = await this.evaluateSingleVariable(environment, match, variable, folderUri, commandValueMapping);
                resolvedVariables?.set(variable, resolvedValue);
                if ((resolvedValue !== match) && types.isString(resolvedValue) && resolvedValue.match(AbstractVariableResolverService.VARIABLE_REGEXP)) {
                    resolvedValue = await this.resolveString(environment, folderUri, resolvedValue, commandValueMapping, resolvedVariables);
                }
                return resolvedValue;
            });
        }
        fsPath(displayUri) {
            return this._labelService ? this._labelService.getUriLabel(displayUri, { noPrefix: true }) : displayUri.fsPath;
        }
        async evaluateSingleVariable(environment, match, variable, folderUri, commandValueMapping) {
            // try to separate variable arguments from variable name
            let argument;
            const parts = variable.split(':');
            if (parts.length > 1) {
                variable = parts[0];
                argument = parts[1];
            }
            // common error handling for all variables that require an open editor
            const getFilePath = (variableKind) => {
                const filePath = this._context.getFilePath();
                if (filePath) {
                    return (0, labels_1.normalizeDriveLetter)(filePath);
                }
                throw new configurationResolver_1.VariableError(variableKind, ((0, nls_1.localize)('canNotResolveFile', "Variable {0} can not be resolved. Please open an editor.", match)));
            };
            // common error handling for all variables that require an open editor
            const getFolderPathForFile = (variableKind) => {
                const filePath = getFilePath(variableKind); // throws error if no editor open
                if (this._context.getWorkspaceFolderPathForFile) {
                    const folderPath = this._context.getWorkspaceFolderPathForFile();
                    if (folderPath) {
                        return (0, labels_1.normalizeDriveLetter)(folderPath);
                    }
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveFolderForFile', "Variable {0}: can not find workspace folder of '{1}'.", match, paths.basename(filePath)));
            };
            // common error handling for all variables that require an open folder and accept a folder name argument
            const getFolderUri = (variableKind) => {
                if (argument) {
                    const folder = this._context.getFolderUri(argument);
                    if (folder) {
                        return folder;
                    }
                    throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotFindFolder', "Variable {0} can not be resolved. No such folder '{1}'.", match, argument));
                }
                if (folderUri) {
                    return folderUri;
                }
                if (this._context.getWorkspaceFolderCount() > 1) {
                    throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveWorkspaceFolderMultiRoot', "Variable {0} can not be resolved in a multi folder workspace. Scope this variable using ':' and a workspace folder name.", match));
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveWorkspaceFolder', "Variable {0} can not be resolved. Please open a folder.", match));
            };
            switch (variable) {
                case 'env':
                    if (argument) {
                        if (environment.env) {
                            // Depending on the source of the environment, on Windows, the values may all be lowercase.
                            const env = environment.env[platform_1.isWindows ? argument.toLowerCase() : argument];
                            if (types.isString(env)) {
                                return env;
                            }
                        }
                        // For `env` we should do the same as a normal shell does - evaluates undefined envs to an empty string #46436
                        return '';
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Env, (0, nls_1.localize)('missingEnvVarName', "Variable {0} can not be resolved because no environment variable name is given.", match));
                case 'config':
                    if (argument) {
                        const config = this._context.getConfigurationValue(folderUri, argument);
                        if (types.isUndefinedOrNull(config)) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('configNotFound', "Variable {0} can not be resolved because setting '{1}' not found.", match, argument));
                        }
                        if (types.isObject(config)) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('configNoString', "Variable {0} can not be resolved because '{1}' is a structured value.", match, argument));
                        }
                        return config;
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('missingConfigName', "Variable {0} can not be resolved because no settings name is given.", match));
                case 'command':
                    return this.resolveFromMap(configurationResolver_1.VariableKind.Command, match, argument, commandValueMapping, 'command');
                case 'input':
                    return this.resolveFromMap(configurationResolver_1.VariableKind.Input, match, argument, commandValueMapping, 'input');
                case 'extensionInstallFolder':
                    if (argument) {
                        const ext = await this._context.getExtension(argument);
                        if (!ext) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.ExtensionInstallFolder, (0, nls_1.localize)('extensionNotInstalled', "Variable {0} can not be resolved because the extension {1} is not installed.", match, argument));
                        }
                        return this.fsPath(ext.extensionLocation);
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.ExtensionInstallFolder, (0, nls_1.localize)('missingExtensionName', "Variable {0} can not be resolved because no extension name is given.", match));
                default: {
                    switch (variable) {
                        case 'workspaceRoot':
                        case 'workspaceFolder':
                            return (0, labels_1.normalizeDriveLetter)(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.WorkspaceFolder)));
                        case 'cwd':
                            return ((folderUri || argument) ? (0, labels_1.normalizeDriveLetter)(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.Cwd))) : process.cwd());
                        case 'workspaceRootFolderName':
                        case 'workspaceFolderBasename':
                            return (0, labels_1.normalizeDriveLetter)(paths.basename(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.WorkspaceFolderBasename))));
                        case 'userHome': {
                            if (environment.userHome) {
                                return environment.userHome;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.UserHome, (0, nls_1.localize)('canNotResolveUserHome', "Variable {0} can not be resolved. UserHome path is not defined", match));
                        }
                        case 'lineNumber': {
                            const lineNumber = this._context.getLineNumber();
                            if (lineNumber) {
                                return lineNumber;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.LineNumber, (0, nls_1.localize)('canNotResolveLineNumber', "Variable {0} can not be resolved. Make sure to have a line selected in the active editor.", match));
                        }
                        case 'selectedText': {
                            const selectedText = this._context.getSelectedText();
                            if (selectedText) {
                                return selectedText;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.SelectedText, (0, nls_1.localize)('canNotResolveSelectedText', "Variable {0} can not be resolved. Make sure to have some text selected in the active editor.", match));
                        }
                        case 'file':
                            return getFilePath(configurationResolver_1.VariableKind.File);
                        case 'fileWorkspaceFolder':
                            return getFolderPathForFile(configurationResolver_1.VariableKind.FileWorkspaceFolder);
                        case 'fileWorkspaceFolderBasename':
                            return paths.basename(getFolderPathForFile(configurationResolver_1.VariableKind.FileWorkspaceFolderBasename));
                        case 'relativeFile':
                            if (folderUri || argument) {
                                return paths.relative(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.RelativeFile)), getFilePath(configurationResolver_1.VariableKind.RelativeFile));
                            }
                            return getFilePath(configurationResolver_1.VariableKind.RelativeFile);
                        case 'relativeFileDirname': {
                            const dirname = paths.dirname(getFilePath(configurationResolver_1.VariableKind.RelativeFileDirname));
                            if (folderUri || argument) {
                                const relative = paths.relative(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.RelativeFileDirname)), dirname);
                                return relative.length === 0 ? '.' : relative;
                            }
                            return dirname;
                        }
                        case 'fileDirname':
                            return paths.dirname(getFilePath(configurationResolver_1.VariableKind.FileDirname));
                        case 'fileExtname':
                            return paths.extname(getFilePath(configurationResolver_1.VariableKind.FileExtname));
                        case 'fileBasename':
                            return paths.basename(getFilePath(configurationResolver_1.VariableKind.FileBasename));
                        case 'fileBasenameNoExtension': {
                            const basename = paths.basename(getFilePath(configurationResolver_1.VariableKind.FileBasenameNoExtension));
                            return (basename.slice(0, basename.length - paths.extname(basename).length));
                        }
                        case 'fileDirnameBasename':
                            return paths.basename(paths.dirname(getFilePath(configurationResolver_1.VariableKind.FileDirnameBasename)));
                        case 'execPath': {
                            const ep = this._context.getExecPath();
                            if (ep) {
                                return ep;
                            }
                            return match;
                        }
                        case 'execInstallFolder': {
                            const ar = this._context.getAppRoot();
                            if (ar) {
                                return ar;
                            }
                            return match;
                        }
                        case 'pathSeparator':
                        case '/':
                            return paths.sep;
                        default:
                            try {
                                const key = argument ? `${variable}:${argument}` : variable;
                                return this.resolveFromMap(configurationResolver_1.VariableKind.Unknown, match, key, commandValueMapping, undefined);
                            }
                            catch (error) {
                                return match;
                            }
                    }
                }
            }
        }
        resolveFromMap(variableKind, match, argument, commandValueMapping, prefix) {
            if (argument && commandValueMapping) {
                const v = (prefix === undefined) ? commandValueMapping[argument] : commandValueMapping[prefix + ':' + argument];
                if (typeof v === 'string') {
                    return v;
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('noValueForCommand', "Variable {0} can not be resolved because the command has no value.", match));
            }
            return match;
        }
    }
    exports.AbstractVariableResolverService = AbstractVariableResolverService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFyaWFibGVSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uUmVzb2x2ZXIvY29tbW9uL3ZhcmlhYmxlUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0JoRyxNQUFhLCtCQUErQjtpQkFFM0IsaUJBQVksR0FBRyxJQUFJLEFBQVAsQ0FBUTtpQkFDcEIsb0JBQWUsR0FBRyxjQUFjLEFBQWpCLENBQWtCO1FBVWpELFlBQVksUUFBaUMsRUFBRSxhQUE2QixFQUFFLGdCQUFrQyxFQUFFLG9CQUFtRDtZQUYzSiwwQkFBcUIsR0FBbUQsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUczRixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7WUFDekMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO29CQUNwRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFFTyxVQUFVLENBQUMsWUFBaUM7WUFDbkQsNkNBQTZDO1lBQzdDLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLE1BQU0sRUFBRSxHQUF3QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFB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