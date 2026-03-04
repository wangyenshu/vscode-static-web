/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/terminal/common/environmentVariable"], function (require, exports, platform_1, environmentVariable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergedEnvironmentVariableCollection = void 0;
    const mutatorTypeToLabelMap = new Map([
        [environmentVariable_1.EnvironmentVariableMutatorType.Append, 'APPEND'],
        [environmentVariable_1.EnvironmentVariableMutatorType.Prepend, 'PREPEND'],
        [environmentVariable_1.EnvironmentVariableMutatorType.Replace, 'REPLACE']
    ]);
    class MergedEnvironmentVariableCollection {
        constructor(collections) {
            this.collections = collections;
            this.map = new Map();
            this.descriptionMap = new Map();
            collections.forEach((collection, extensionIdentifier) => {
                this.populateDescriptionMap(collection, extensionIdentifier);
                const it = collection.map.entries();
                let next = it.next();
                while (!next.done) {
                    const mutator = next.value[1];
                    const key = next.value[0];
                    let entry = this.map.get(key);
                    if (!entry) {
                        entry = [];
                        this.map.set(key, entry);
                    }
                    // If the first item in the entry is replace ignore any other entries as they would
                    // just get replaced by this one.
                    if (entry.length > 0 && entry[0].type === environmentVariable_1.EnvironmentVariableMutatorType.Replace) {
                        next = it.next();
                        continue;
                    }
                    const extensionMutator = {
                        extensionIdentifier,
                        value: mutator.value,
                        type: mutator.type,
                        scope: mutator.scope,
                        variable: mutator.variable,
                        options: mutator.options
                    };
                    if (!extensionMutator.scope) {
                        delete extensionMutator.scope; // Convenient for tests
                    }
                    // Mutators get applied in the reverse order than they are created
                    entry.unshift(extensionMutator);
                    next = it.next();
                }
            });
        }
        async applyToProcessEnvironment(env, scope, variableResolver) {
            let lowerToActualVariableNames;
            if (platform_1.isWindows) {
                lowerToActualVariableNames = {};
                Object.keys(env).forEach(e => lowerToActualVariableNames[e.toLowerCase()] = e);
            }
            for (const [variable, mutators] of this.getVariableMap(scope)) {
                const actualVariable = platform_1.isWindows ? lowerToActualVariableNames[variable.toLowerCase()] || variable : variable;
                for (const mutator of mutators) {
                    const value = variableResolver ? await variableResolver(mutator.value) : mutator.value;
                    // Default: true
                    if (mutator.options?.applyAtProcessCreation ?? true) {
                        switch (mutator.type) {
                            case environmentVariable_1.EnvironmentVariableMutatorType.Append:
                                env[actualVariable] = (env[actualVariable] || '') + value;
                                break;
                            case environmentVariable_1.EnvironmentVariableMutatorType.Prepend:
                                env[actualVariable] = value + (env[actualVariable] || '');
                                break;
                            case environmentVariable_1.EnvironmentVariableMutatorType.Replace:
                                env[actualVariable] = value;
                                break;
                        }
                    }
                    // Default: false
                    if (mutator.options?.applyAtShellIntegration ?? false) {
                        const key = `VSCODE_ENV_${mutatorTypeToLabelMap.get(mutator.type)}`;
                        env[key] = (env[key] ? env[key] + ':' : '') + variable + '=' + this._encodeColons(value);
                    }
                }
            }
        }
        _encodeColons(value) {
            return value.replaceAll(':', '\\x3a');
        }
        diff(other, scope) {
            const added = new Map();
            const changed = new Map();
            const removed = new Map();
            // Find added
            other.getVariableMap(scope).forEach((otherMutators, variable) => {
                const currentMutators = this.getVariableMap(scope).get(variable);
                const result = getMissingMutatorsFromArray(otherMutators, currentMutators);
                if (result) {
                    added.set(variable, result);
                }
            });
            // Find removed
            this.getVariableMap(scope).forEach((currentMutators, variable) => {
                const otherMutators = other.getVariableMap(scope).get(variable);
                const result = getMissingMutatorsFromArray(currentMutators, otherMutators);
                if (result) {
                    removed.set(variable, result);
                }
            });
            // Find changed
            this.getVariableMap(scope).forEach((currentMutators, variable) => {
                const otherMutators = other.getVariableMap(scope).get(variable);
                const result = getChangedMutatorsFromArray(currentMutators, otherMutators);
                if (result) {
                    changed.set(variable, result);
                }
            });
            if (added.size === 0 && changed.size === 0 && removed.size === 0) {
                return undefined;
            }
            return { added, changed, removed };
        }
        getVariableMap(scope) {
            const result = new Map();
            for (const mutators of this.map.values()) {
                const filteredMutators = mutators.filter(m => filterScope(m, scope));
                if (filteredMutators.length > 0) {
                    // All of these mutators are for the same variable because they are in the same scope, hence choose anyone to form a key.
                    result.set(filteredMutators[0].variable, filteredMutators);
                }
            }
            return result;
        }
        getDescriptionMap(scope) {
            const result = new Map();
            for (const mutators of this.descriptionMap.values()) {
                const filteredMutators = mutators.filter(m => filterScope(m, scope, true));
                for (const mutator of filteredMutators) {
                    result.set(mutator.extensionIdentifier, mutator.description);
                }
            }
            return result;
        }
        populateDescriptionMap(collection, extensionIdentifier) {
            if (!collection.descriptionMap) {
                return;
            }
            const it = collection.descriptionMap.entries();
            let next = it.next();
            while (!next.done) {
                const mutator = next.value[1];
                const key = next.value[0];
                let entry = this.descriptionMap.get(key);
                if (!entry) {
                    entry = [];
                    this.descriptionMap.set(key, entry);
                }
                const extensionMutator = {
                    extensionIdentifier,
                    scope: mutator.scope,
                    description: mutator.description
                };
                if (!extensionMutator.scope) {
                    delete extensionMutator.scope; // Convenient for tests
                }
                entry.push(extensionMutator);
                next = it.next();
            }
        }
    }
    exports.MergedEnvironmentVariableCollection = MergedEnvironmentVariableCollection;
    /**
     * Returns whether a mutator matches with the scope provided.
     * @param mutator Mutator to filter
     * @param scope Scope to be used for querying
     * @param strictFilter If true, mutators with global scope is not returned when querying for workspace scope.
     * i.e whether mutator scope should always exactly match with query scope.
     */
    function filterScope(mutator, scope, strictFilter = false) {
        if (!mutator.scope) {
            if (strictFilter) {
                return scope === mutator.scope;
            }
            return true;
        }
        // If a mutator is scoped to a workspace folder, only apply it if the workspace
        // folder matches.
        if (mutator.scope.workspaceFolder && scope?.workspaceFolder && mutator.scope.workspaceFolder.index === scope.workspaceFolder.index) {
            return true;
        }
        return false;
    }
    function getMissingMutatorsFromArray(current, other) {
        // If it doesn't exist, all are removed
        if (!other) {
            return current;
        }
        // Create a map to help
        const otherMutatorExtensions = new Set();
        other.forEach(m => otherMutatorExtensions.add(m.extensionIdentifier));
        // Find entries removed from other
        const result = [];
        current.forEach(mutator => {
            if (!otherMutatorExtensions.has(mutator.extensionIdentifier)) {
                result.push(mutator);
            }
        });
        return result.length === 0 ? undefined : result;
    }
    function getChangedMutatorsFromArray(current, other) {
        // If it doesn't exist, none are changed (they are removed)
        if (!other) {
            return undefined;
        }
        // Create a map to help
        const otherMutatorExtensions = new Map();
        other.forEach(m => otherMutatorExtensions.set(m.extensionIdentifier, m));
        // Find entries that exist in both but are not equal
        const result = [];
        current.forEach(mutator => {
            const otherMutator = otherMutatorExtensions.get(mutator.extensionIdentifier);
            if (otherMutator && (mutator.type !== otherMutator.type || mutator.value !== otherMutator.value || mutator.scope?.workspaceFolder?.index !== otherMutator.scope?.workspaceFolder?.index)) {
                // Return the new result, not the old one
                result.push(otherMutator);
            }
        });
        return result.length === 0 ? undefined : result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZUNvbGxlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vZW52aXJvbm1lbnRWYXJpYWJsZUNvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQU0scUJBQXFCLEdBQWdELElBQUksR0FBRyxDQUFDO1FBQ2xGLENBQUMsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztRQUNqRCxDQUFDLG9EQUE4QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDbkQsQ0FBQyxvREFBOEIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDO0tBQ25ELENBQUMsQ0FBQztJQUVILE1BQWEsbUNBQW1DO1FBSS9DLFlBQ1UsV0FBZ0U7WUFBaEUsZ0JBQVcsR0FBWCxXQUFXLENBQXFEO1lBSnpELFFBQUcsR0FBNkQsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMxRSxtQkFBYyxHQUFnRSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBS3hHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsRUFBRTtnQkFDdkQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ25CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sR0FB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