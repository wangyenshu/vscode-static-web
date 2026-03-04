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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/platform/terminal/common/terminal", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, pickerQuickAccess_1, filters_1, terminal_1, commands_1, themeService_1, themables_1, terminalIcons_1, terminalIcon_1, terminalStrings_1, terminal_2, editorService_1, instantiation_1) {
    "use strict";
    var TerminalQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickAccessProvider = void 0;
    let terminalPicks = [];
    let TerminalQuickAccessProvider = class TerminalQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { TerminalQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'term '; }
        constructor(_editorService, _terminalService, _terminalEditorService, _terminalGroupService, _commandService, _themeService, _instantiationService) {
            super(TerminalQuickAccessProvider_1.PREFIX, { canAcceptInBackground: true });
            this._editorService = _editorService;
            this._terminalService = _terminalService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalGroupService = _terminalGroupService;
            this._commandService = _commandService;
            this._themeService = _themeService;
            this._instantiationService = _instantiationService;
        }
        _getPicks(filter) {
            terminalPicks = [];
            terminalPicks.push({ type: 'separator', label: 'panel' });
            const terminalGroups = this._terminalGroupService.groups;
            for (let groupIndex = 0; groupIndex < terminalGroups.length; groupIndex++) {
                const terminalGroup = terminalGroups[groupIndex];
                for (let terminalIndex = 0; terminalIndex < terminalGroup.terminalInstances.length; terminalIndex++) {
                    const terminal = terminalGroup.terminalInstances[terminalIndex];
                    const pick = this._createPick(terminal, terminalIndex, filter, { groupIndex, groupSize: terminalGroup.terminalInstances.length });
                    if (pick) {
                        terminalPicks.push(pick);
                    }
                }
            }
            if (terminalPicks.length > 0) {
                terminalPicks.push({ type: 'separator', label: 'editor' });
            }
            const terminalEditors = this._terminalEditorService.instances;
            for (let editorIndex = 0; editorIndex < terminalEditors.length; editorIndex++) {
                const term = terminalEditors[editorIndex];
                term.target = terminal_2.TerminalLocation.Editor;
                const pick = this._createPick(term, editorIndex, filter);
                if (pick) {
                    terminalPicks.push(pick);
                }
            }
            if (terminalPicks.length > 0) {
                terminalPicks.push({ type: 'separator' });
            }
            const createTerminalLabel = (0, nls_1.localize)("workbench.action.terminal.newplus", "Create New Terminal");
            terminalPicks.push({
                label: `$(plus) ${createTerminalLabel}`,
                ariaLabel: createTerminalLabel,
                accept: () => this._commandService.executeCommand("workbench.action.terminal.new" /* TerminalCommandId.New */)
            });
            const createWithProfileLabel = (0, nls_1.localize)("workbench.action.terminal.newWithProfilePlus", "Create New Terminal With Profile...");
            terminalPicks.push({
                label: `$(plus) ${createWithProfileLabel}`,
                ariaLabel: createWithProfileLabel,
                accept: () => this._commandService.executeCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */)
            });
            return terminalPicks;
        }
        _createPick(terminal, terminalIndex, filter, groupInfo) {
            const iconId = this._instantiationService.invokeFunction(terminalIcon_1.getIconId, terminal);
            const index = groupInfo
                ? (groupInfo.groupSize > 1
                    ? `${groupInfo.groupIndex + 1}.${terminalIndex + 1}`
                    : `${groupInfo.groupIndex + 1}`)
                : `${terminalIndex + 1}`;
            const label = `$(${iconId}) ${index}: ${terminal.title}`;
            const iconClasses = [];
            const colorClass = (0, terminalIcon_1.getColorClass)(terminal);
            if (colorClass) {
                iconClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(terminal, this._themeService.getColorTheme().type);
            if (uriClasses) {
                iconClasses.push(...uriClasses);
            }
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    description: terminal.description,
                    highlights: { label: highlights },
                    buttons: [
                        {
                            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.renameTerminalIcon),
                            tooltip: (0, nls_1.localize)('renameTerminal', "Rename Terminal")
                        },
                        {
                            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.killTerminalIcon),
                            tooltip: terminalStrings_1.terminalStrings.kill.value
                        }
                    ],
                    iconClasses,
                    trigger: buttonIndex => {
                        switch (buttonIndex) {
                            case 0:
                                this._commandService.executeCommand("workbench.action.terminal.rename" /* TerminalCommandId.Rename */, terminal);
                                return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                            case 1:
                                this._terminalService.safeDisposeTerminal(terminal);
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                        }
                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                    },
                    accept: (keyMod, event) => {
                        if (terminal.target === terminal_2.TerminalLocation.Editor) {
                            const existingEditors = this._editorService.findEditors(terminal.resource);
                            this._terminalEditorService.openEditor(terminal, { viewColumn: existingEditors?.[0].groupId });
                            this._terminalEditorService.setActiveInstance(terminal);
                        }
                        else {
                            this._terminalGroupService.showPanel(!event.inBackground);
                            this._terminalGroupService.setActiveInstance(terminal);
                        }
                    }
                };
            }
            return undefined;
        }
    };
    exports.TerminalQuickAccessProvider = TerminalQuickAccessProvider;
    exports.TerminalQuickAccessProvider = TerminalQuickAccessProvider = TerminalQuickAccessProvider_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalEditorService),
        __param(3, terminal_1.ITerminalGroupService),
        __param(4, commands_1.ICommandService),
        __param(5, themeService_1.IThemeService),
        __param(6, instantiation_1.IInstantiationService)
    ], TerminalQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxJQUFJLGFBQWEsR0FBd0QsRUFBRSxDQUFDO0lBRXJFLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsNkNBQWlEOztpQkFFMUYsV0FBTSxHQUFHLE9BQU8sQUFBVixDQUFXO1FBRXhCLFlBQ2tDLGNBQThCLEVBQzVCLGdCQUFrQyxFQUM1QixzQkFBOEMsRUFDL0MscUJBQTRDLEVBQ2xELGVBQWdDLEVBQ2xDLGFBQTRCLEVBQ3BCLHFCQUE0QztZQUVwRixLQUFLLENBQUMsNkJBQTJCLENBQUMsTUFBTSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQVIxQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDNUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUM1QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQy9DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDbEQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2xDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3BCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7UUFHckYsQ0FBQztRQUNTLFNBQVMsQ0FBQyxNQUFjO1lBQ2pDLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDbkIsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDMUQsTUFBTSxjQUFjLEdBQUcs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