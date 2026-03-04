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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/accessibility/common/accessibility", "vs/base/common/iconLabels", "vs/base/common/hash", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/iterator", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypes", "vs/workbench/common/theme"], function (require, exports, lifecycle_1, nls_1, instantiation_1, extensions_1, extensionsRegistry_1, statusbar_1, accessibility_1, iconLabels_1, hash_1, event_1, extensions_2, iterator_1, extensions_3, extHostTypes_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusBarItemsExtensionPoint = exports.StatusBarUpdateKind = exports.IExtensionStatusBarItemService = void 0;
    // --- service
    exports.IExtensionStatusBarItemService = (0, instantiation_1.createDecorator)('IExtensionStatusBarItemService');
    var StatusBarUpdateKind;
    (function (StatusBarUpdateKind) {
        StatusBarUpdateKind[StatusBarUpdateKind["DidDefine"] = 0] = "DidDefine";
        StatusBarUpdateKind[StatusBarUpdateKind["DidUpdate"] = 1] = "DidUpdate";
    })(StatusBarUpdateKind || (exports.StatusBarUpdateKind = StatusBarUpdateKind = {}));
    let ExtensionStatusBarItemService = class ExtensionStatusBarItemService {
        constructor(_statusbarService) {
            this._statusbarService = _statusbarService;
            this._entries = new Map();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._entries.forEach(entry => entry.accessor.dispose());
            this._entries.clear();
            this._onDidChange.dispose();
        }
        setOrUpdateEntry(entryId, id, extensionId, name, text, tooltip, command, color, backgroundColor, alignLeft, priority, accessibilityInformation) {
            // if there are icons in the text use the tooltip for the aria label
            let ariaLabel;
            let role = undefined;
            if (accessibilityInformation) {
                ariaLabel = accessibilityInformation.label;
                role = accessibilityInformation.role;
            }
            else {
                ariaLabel = (0, iconLabels_1.getCodiconAriaLabel)(text);
                if (tooltip) {
                    const tooltipString = typeof tooltip === 'string' ? tooltip : tooltip.value;
                    ariaLabel += `, ${tooltipString}`;
                }
            }
            let kind = undefined;
            switch (backgroundColor?.id) {
                case theme_1.STATUS_BAR_ERROR_ITEM_BACKGROUND:
                case theme_1.STATUS_BAR_WARNING_ITEM_BACKGROUND:
                    // override well known colors that map to status entry kinds to support associated themable hover colors
                    kind = backgroundColor.id === theme_1.STATUS_BAR_ERROR_ITEM_BACKGROUND ? 'error' : 'warning';
                    color = undefined;
                    backgroundColor = undefined;
            }
            const entry = { name, text, tooltip, command, color, backgroundColor, ariaLabel, role, kind };
            if (typeof priority === 'undefined') {
                priority = 0;
            }
            let alignment = alignLeft ? 0 /* StatusbarAlignment.LEFT */ : 1 /* StatusbarAlignment.RIGHT */;
            // alignment and priority can only be set once (at creation time)
            const existingEntry = this._entries.get(entryId);
            if (existingEntry) {
                alignment = existingEntry.alignment;
                priority = existingEntry.priority;
            }
            // Create new entry if not existing
            if (!existingEntry) {
                let entryPriority;
                if (typeof extensionId === 'string') {
                    // We cannot enforce unique priorities across all extensions, so we
                    // use the extension identifier as a secondary sort key to reduce
                    // the likelyhood of collisions.
                    // See https://github.com/microsoft/vscode/issues/177835
                    // See https://github.com/microsoft/vscode/issues/123827
                    entryPriority = { primary: priority, secondary: (0, hash_1.hash)(extensionId) };
                }
                else {
                    entryPriority = priority;
                }
                const accessor = this._statusbarService.addEntry(entry, id, alignment, entryPriority);
                this._entries.set(entryId, {
                    accessor,
                    entry,
                    alignment,
                    priority,
                    disposable: (0, lifecycle_1.toDisposable)(() => {
                        accessor.dispose();
                        this._entries.delete(entryId);
                        this._onDidChange.fire({ removed: entryId });
                    })
                });
                this._onDidChange.fire({ added: [entryId, { entry, alignment, priority }] });
                return 0 /* StatusBarUpdateKind.DidDefine */;
            }
            else {
                // Otherwise update
                existingEntry.accessor.update(entry);
                existingEntry.entry = entry;
                return 1 /* StatusBarUpdateKind.DidUpdate */;
            }
        }
        unsetEntry(entryId) {
            this._entries.get(entryId)?.disposable.dispose();
            this._entries.delete(entryId);
        }
        getEntries() {
            return this._entries.entries();
        }
    };
    ExtensionStatusBarItemService = __decorate([
        __param(0, statusbar_1.IStatusbarService)
    ], ExtensionStatusBarItemService);
    (0, extensions_2.registerSingleton)(exports.IExtensionStatusBarItemService, ExtensionStatusBarItemService, 1 /* InstantiationType.Delayed */);
    function isUserFriendlyStatusItemEntry(candidate) {
        const obj = candidate;
        return (typeof obj.id === 'string' && obj.id.length > 0)
            && typeof obj.name === 'string'
            && typeof obj.text === 'string'
            && (obj.alignment === 'left' || obj.alignment === 'right')
            && (obj.command === undefined || typeof obj.command === 'string')
            && (obj.tooltip === undefined || typeof obj.tooltip === 'string')
            && (obj.priority === undefined || typeof obj.priority === 'number')
            && (obj.accessibilityInformation === undefined || (0, accessibility_1.isAccessibilityInformation)(obj.accessibilityInformation));
    }
    const statusBarItemSchema = {
        type: 'object',
        required: ['id', 'text', 'alignment', 'name'],
        properties: {
            id: {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('id', 'The identifier of the status bar entry. Must be unique within the extension. The same value must be used when calling the `vscode.window.createStatusBarItem(id, ...)`-API')
            },
            name: {
                type: 'string',
                description: (0, nls_1.localize)('name', 'The name of the entry, like \'Python Language Indicator\', \'Git Status\' etc. Try to keep the length of the name short, yet descriptive enough that users can understand what the status bar item is about.')
            },
            text: {
                type: 'string',
                description: (0, nls_1.localize)('text', 'The text to show for the entry. You can embed icons in the text by leveraging the `$(<name>)`-syntax, like \'Hello $(globe)!\'')
            },
            tooltip: {
                type: 'string',
                description: (0, nls_1.localize)('tooltip', 'The tooltip text for the entry.')
            },
            command: {
                type: 'string',
                description: (0, nls_1.localize)('command', 'The command to execute when the status bar entry is clicked.')
            },
            alignment: {
                type: 'string',
                enum: ['left', 'right'],
                description: (0, nls_1.localize)('alignment', 'The alignment of the status bar entry.')
            },
            priority: {
                type: 'number',
                description: (0, nls_1.localize)('priority', 'The priority of the status bar entry. Higher value means the item should be shown more to the left.')
            },
            accessibilityInformation: {
                type: 'object',
                description: (0, nls_1.localize)('accessibilityInformation', 'Defines the role and aria label to be used when the status bar entry is focused.'),
                properties: {
                    role: {
                        type: 'string',
                        description: (0, nls_1.localize)('accessibilityInformation.role', 'The role of the status bar entry which defines how a screen reader interacts with it. More about aria roles can be found here https://w3c.github.io/aria/#widget_roles')
                    },
                    label: {
                        type: 'string',
                        description: (0, nls_1.localize)('accessibilityInformation.label', 'The aria label of the status bar entry. Defaults to the entry\'s text.')
                    }
                }
            }
        }
    };
    const statusBarItemsSchema = {
        description: (0, nls_1.localize)('vscode.extension.contributes.statusBarItems', "Contributes items to the status bar."),
        oneOf: [
            statusBarItemSchema,
            {
                type: 'array',
                items: statusBarItemSchema
            }
        ]
    };
    const statusBarItemsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'statusBarItems',
        jsonSchema: statusBarItemsSchema,
    });
    let StatusBarItemsExtensionPoint = class StatusBarItemsExtensionPoint {
        constructor(statusBarItemsService) {
            const contributions = new lifecycle_1.DisposableStore();
            statusBarItemsExtensionPoint.setHandler((extensions) => {
                contributions.clear();
                for (const entry of extensions) {
                    if (!(0, extensions_1.isProposedApiEnabled)(entry.description, 'contribStatusBarItems')) {
                        entry.collector.error(`The ${statusBarItemsExtensionPoint.name} is proposed API`);
                        continue;
                    }
                    const { value, collector } = entry;
                    for (const candidate of iterator_1.Iterable.wrap(value)) {
                        if (!isUserFriendlyStatusItemEntry(candidate)) {
                            collector.error((0, nls_1.localize)('invalid', "Invalid status bar item contribution."));
                            continue;
                        }
                        const fullItemId = (0, extHostTypes_1.asStatusBarItemIdentifier)(entry.description.identifier, candidate.id);
                        const kind = statusBarItemsService.setOrUpdateEntry(fullItemId, fullItemId, extensions_3.ExtensionIdentifier.toKey(entry.description.identifier), candidate.name ?? entry.description.displayName ?? entry.description.name, candidate.text, candidate.tooltip, candidate.command ? { id: candidate.command, title: candidate.name } : undefined, undefined, undefined, candidate.alignment === 'left', candidate.priority, candidate.accessibilityInformation);
                        if (kind === 0 /* StatusBarUpdateKind.DidDefine */) {
                            contributions.add((0, lifecycle_1.toDisposable)(() => statusBarItemsService.unsetEntry(fullItemId)));
                        }
                    }
                }
            });
        }
    };
    exports.StatusBarItemsExtensionPoint = StatusBarItemsExtensionPoint;
    exports.StatusBarItemsExtensionPoint = StatusBarItemsExtensionPoint = __decorate([
        __param(0, exports.IExtensionStatusBarItemService)
    ], StatusBarItemsExtensionPoint);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzQmFyRXh0ZW5zaW9uUG9pbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvc3RhdHVzQmFyRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxjQUFjO0lBRUQsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLCtCQUFlLEVBQWlDLGdDQUFnQyxDQUFDLENBQUM7SUFhaEksSUFBa0IsbUJBR2pCO0lBSEQsV0FBa0IsbUJBQW1CO1FBQ3BDLHVFQUFTLENBQUE7UUFDVCx1RUFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUhpQixtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUdwQztJQWVELElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO1FBU2xDLFlBQStCLGlCQUFxRDtZQUFwQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBTG5FLGFBQVEsR0FBbUssSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUVyTCxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFzQyxDQUFDO1lBQ3pFLGdCQUFXLEdBQThDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBRUYsQ0FBQztRQUV6RixPQUFPO1lBQ04sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxPQUFlLEVBQy9CLEVBQVUsRUFBRSxXQUErQixFQUFFLElBQVksRUFBRSxJ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