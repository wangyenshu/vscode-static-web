/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/commands/common/commands", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/linkedList"], function (require, exports, keybindings_1, platform_1, commands_1, platform_2, lifecycle_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = exports.KeybindingsRegistry = exports.KeybindingWeight = void 0;
    var KeybindingWeight;
    (function (KeybindingWeight) {
        KeybindingWeight[KeybindingWeight["EditorCore"] = 0] = "EditorCore";
        KeybindingWeight[KeybindingWeight["EditorContrib"] = 100] = "EditorContrib";
        KeybindingWeight[KeybindingWeight["WorkbenchContrib"] = 200] = "WorkbenchContrib";
        KeybindingWeight[KeybindingWeight["BuiltinExtension"] = 300] = "BuiltinExtension";
        KeybindingWeight[KeybindingWeight["ExternalExtension"] = 400] = "ExternalExtension";
    })(KeybindingWeight || (exports.KeybindingWeight = KeybindingWeight = {}));
    /**
     * Stores all built-in and extension-provided keybindings (but not ones that user defines themselves)
     */
    class KeybindingsRegistryImpl {
        constructor() {
            this._coreKeybindings = new linkedList_1.LinkedList();
            this._extensionKeybindings = [];
            this._cachedMergedKeybindings = null;
        }
        /**
         * Take current platform into account and reduce to primary & secondary.
         */
        static bindToCurrentPlatform(kb) {
            if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
                if (kb && kb.win) {
                    return kb.win;
                }
            }
            else if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
                if (kb && kb.mac) {
                    return kb.mac;
                }
            }
            else {
                if (kb && kb.linux) {
                    return kb.linux;
                }
            }
            return kb;
        }
        registerKeybindingRule(rule) {
            const actualKb = KeybindingsRegistryImpl.bindToCurrentPlatform(rule);
            const result = new lifecycle_1.DisposableStore();
            if (actualKb && actualKb.primary) {
                const kk = (0, keybindings_1.decodeKeybinding)(actualKb.primary, platform_1.OS);
                if (kk) {
                    result.add(this._registerDefaultKeybinding(kk, rule.id, rule.args, rule.weight, 0, rule.when));
                }
            }
            if (actualKb && Array.isArray(actualKb.secondary)) {
                for (let i = 0, len = actualKb.secondary.length; i < len; i++) {
                    const k = actualKb.secondary[i];
                    const kk = (0, keybindings_1.decodeKeybinding)(k, platform_1.OS);
                    if (kk) {
                        result.add(this._registerDefaultKeybinding(kk, rule.id, rule.args, rule.weight, -i - 1, rule.when));
                    }
                }
            }
            return result;
        }
        setExtensionKeybindings(rules) {
            const result = [];
            let keybindingsLen = 0;
            for (const rule of rules) {
                if (rule.keybinding) {
                    result[keybindingsLen++] = {
                        keybinding: rule.keybinding,
                        command: rule.id,
                        commandArgs: rule.args,
                        when: rule.when,
                        weight1: rule.weight,
                        weight2: 0,
                        extensionId: rule.extensionId || null,
                        isBuiltinExtension: rule.isBuiltinExtension || false
                    };
                }
            }
            this._extensionKeybindings = result;
            this._cachedMergedKeybindings = null;
        }
        registerCommandAndKeybindingRule(desc) {
            return (0, lifecycle_1.combinedDisposable)(this.registerKeybindingRule(desc), commands_1.CommandsRegistry.registerCommand(desc));
        }
        _registerDefaultKeybinding(keybinding, commandId, commandArgs, weight1, weight2, when) {
            const remove = this._coreKeybindings.push({
                keybinding: keybinding,
                command: commandId,
                commandArgs: commandArgs,
                when: when,
                weight1: weight1,
                weight2: weight2,
                extensionId: null,
                isBuiltinExtension: false
            });
            this._cachedMergedKeybindings = null;
            return (0, lifecycle_1.toDisposable)(() => {
                remove();
                this._cachedMergedKeybindings = null;
            });
        }
        getDefaultKeybindings() {
            if (!this._cachedMergedKeybindings) {
                this._cachedMergedKeybindings = Array.from(this._coreKeybindings).concat(this._extensionKeybindings);
                this._cachedMergedKeybindings.sort(sorter);
            }
            return this._cachedMergedKeybindings.slice(0);
        }
    }
    exports.KeybindingsRegistry = new KeybindingsRegistryImpl();
    // Define extension point ids
    exports.Extensions = {
        EditorModes: 'platform.keybindingsRegistry'
    };
    platform_2.Registry.add(exports.Extensions.EditorModes, exports.KeybindingsRegistry);
    function sorter(a, b) {
        if (a.weight1 !== b.weight1) {
            return a.weight1 - b.weight1;
        }
        if (a.command && b.command) {
            if (a.command < b.command) {
                return -1;
            }
            if (a.command > b.command) {
                return 1;
            }
        }
        return a.weight2 - b.weight2;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NSZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJpbmRpbmcvY29tbW9uL2tleWJpbmRpbmdzUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdURoRyxJQUFrQixnQkFNakI7SUFORCxXQUFrQixnQkFBZ0I7UUFDakMsbUVBQWMsQ0FBQTtRQUNkLDJFQUFtQixDQUFBO1FBQ25CLGlGQUFzQixDQUFBO1FBQ3RCLGlGQUFzQixDQUFBO1FBQ3RCLG1GQUF1QixDQUFBO0lBQ3hCLENBQUMsRUFOaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFNakM7SUFjRDs7T0FFRztJQUNILE1BQU0sdUJBQXVCO1FBTTVCO1lBQ0MsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksdUJBQVUsRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztRQUN0QyxDQUFDO1FBRUQ7O1dBRUc7UUFDSyxNQUFNLENBQUMscUJBQXFCLENBQUMsRUFBZ0I7WUFDcEQsSUFBSSxhQUFFLG9DQUE0QixFQUFFLENBQUM7Z0JBQ3BDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDbEIsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksYUFBRSxzQ0FBOEIsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUks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