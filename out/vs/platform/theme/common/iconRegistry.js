/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/codiconsUtil", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, async_1, codicons_1, codiconsUtil_1, themables_1, event_1, types_1, uri_1, nls_1, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spinningLoading = exports.syncing = exports.gotoNextLocation = exports.gotoPreviousLocation = exports.widgetClose = exports.iconsSchemaId = exports.IconFontDefinition = exports.IconContribution = exports.Extensions = void 0;
    exports.registerIcon = registerIcon;
    exports.getIconRegistry = getIconRegistry;
    //  ------ API types
    // icon registry
    exports.Extensions = {
        IconContribution: 'base.contributions.icons'
    };
    var IconContribution;
    (function (IconContribution) {
        function getDefinition(contribution, registry) {
            let definition = contribution.defaults;
            while (themables_1.ThemeIcon.isThemeIcon(definition)) {
                const c = iconRegistry.getIcon(definition.id);
                if (!c) {
                    return undefined;
                }
                definition = c.defaults;
            }
            return definition;
        }
        IconContribution.getDefinition = getDefinition;
    })(IconContribution || (exports.IconContribution = IconContribution = {}));
    var IconFontDefinition;
    (function (IconFontDefinition) {
        function toJSONObject(iconFont) {
            return {
                weight: iconFont.weight,
                style: iconFont.style,
                src: iconFont.src.map(s => ({ format: s.format, location: s.location.toString() }))
            };
        }
        IconFontDefinition.toJSONObject = toJSONObject;
        function fromJSONObject(json) {
            const stringOrUndef = (s) => (0, types_1.isString)(s) ? s : undefined;
            if (json && Array.isArray(json.src) && json.src.every((s) => (0, types_1.isString)(s.format) && (0, types_1.isString)(s.location))) {
                return {
                    weight: stringOrUndef(json.weight),
                    style: stringOrUndef(json.style),
                    src: json.src.map((s) => ({ format: s.format, location: uri_1.URI.parse(s.location) }))
                };
            }
            return undefined;
        }
        IconFontDefinition.fromJSONObject = fromJSONObject;
    })(IconFontDefinition || (exports.IconFontDefinition = IconFontDefinition = {}));
    class IconRegistry {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.iconSchema = {
                definitions: {
                    icons: {
                        type: 'object',
                        properties: {
                            fontId: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontId', 'The id of the font to use. If not set, the font that is defined first is used.') },
                            fontCharacter: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontCharacter', 'The font character associated with the icon definition.') }
                        },
                        additionalProperties: false,
                        defaultSnippets: [{ body: { fontCharacter: '\\\\e030' } }]
                    }
                },
                type: 'object',
                properties: {}
            };
            this.iconReferenceSchema = { type: 'string', pattern: `^${themables_1.ThemeIcon.iconNameExpression}$`, enum: [], enumDescriptions: [] };
            this.iconsById = {};
            this.iconFontsById = {};
        }
        registerIcon(id, defaults, description, deprecationMessage) {
            const existing = this.iconsById[id];
            if (existing) {
                if (description && !existing.description) {
                    existing.description = description;
                    this.iconSchema.properties[id].markdownDescription = `${description} $(${id})`;
                    const enumIndex = this.iconReferenceSchema.enum.indexOf(id);
                    if (enumIndex !== -1) {
                        this.iconReferenceSchema.enumDescriptions[enumIndex] = description;
                    }
                    this._onDidChange.fire();
                }
                return existing;
            }
            const iconContribution = { id, description, defaults, deprecationMessage };
            this.iconsById[id] = iconContribution;
            const propertySchema = { $ref: '#/definitions/icons' };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            if (description) {
                propertySchema.markdownDescription = `${description}: $(${id})`;
            }
            this.iconSchema.properties[id] = propertySchema;
            this.iconReferenceSchema.enum.push(id);
            this.iconReferenceSchema.enumDescriptions.push(description || '');
            this._onDidChange.fire();
            return { id };
        }
        deregisterIcon(id) {
            delete this.iconsById[id];
            delete this.iconSchema.properties[id];
            const index = this.iconReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.iconReferenceSchema.enum.splice(index, 1);
                this.iconReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChange.fire();
        }
        getIcons() {
            return Object.keys(this.iconsById).map(id => this.iconsById[id]);
        }
        getIcon(id) {
            return this.iconsById[id];
        }
        getIconSchema() {
            return this.iconSchema;
        }
        getIconReferenceSchema() {
            return this.iconReferenceSchema;
        }
        registerIconFont(id, definition) {
            const existing = this.iconFontsById[id];
            if (existing) {
                return existing;
            }
            this.iconFontsById[id] = definition;
            this._onDidChange.fire();
            return definition;
        }
        deregisterIconFont(id) {
            delete this.iconFontsById[id];
        }
        getIconFont(id) {
            return this.iconFontsById[id];
        }
        toString() {
            const sorter = (i1, i2) => {
                return i1.id.localeCompare(i2.id);
            };
            const classNames = (i) => {
                while (themables_1.ThemeIcon.isThemeIcon(i.defaults)) {
                    i = this.iconsById[i.defaults.id];
                }
                return `codicon codicon-${i ? i.id : ''}`;
            };
            const reference = [];
            reference.push(`| preview     | identifier                        | default codicon ID                | description`);
            reference.push(`| ----------- | --------------------------------- | --------------------------------- | --------------------------------- |`);
            const contributions = Object.keys(this.iconsById).map(key => this.iconsById[key]);
            for (const i of contributions.filter(i => !!i.description).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|${themables_1.ThemeIcon.isThemeIcon(i.defaults) ? i.defaults.id : i.id}|${i.description || ''}|`);
            }
            reference.push(`| preview     | identifier                        `);
            reference.push(`| ----------- | --------------------------------- |`);
            for (const i of contributions.filter(i => !themables_1.ThemeIcon.isThemeIcon(i.defaults)).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|`);
            }
            return reference.join('\n');
        }
    }
    const iconRegistry = new IconRegistry();
    platform.Registry.add(exports.Extensions.IconContribution, iconRegistry);
    function registerIcon(id, defaults, description, deprecationMessage) {
        return iconRegistry.registerIcon(id, defaults, description, deprecationMessage);
    }
    function getIconRegistry() {
        return iconRegistry;
    }
    function initialize() {
        const codiconFontCharacters = (0, codiconsUtil_1.getCodiconFontCharacters)();
        for (const icon in codiconFontCharacters) {
            const fontCharacter = '\\' + codiconFontCharacters[icon].toString(16);
            iconRegistry.registerIcon(icon, { fontCharacter });
        }
    }
    initialize();
    exports.iconsSchemaId = 'vscode://schemas/icons';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.iconsSchemaId, iconRegistry.getIconSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.iconsSchemaId), 200);
    iconRegistry.onDidChange(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
    //setTimeout(_ => console.log(iconRegistry.toString()), 5000);
    // common icons
    exports.widgetClose = registerIcon('widget-close', codicons_1.Codicon.close, (0, nls_1.localize)('widgetClose', 'Icon for the close action in widgets.'));
    exports.gotoPreviousLocation = registerIcon('goto-previous-location', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for goto previous editor location.'));
    exports.gotoNextLocation = registerIcon('goto-next-location', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for goto next editor location.'));
    exports.syncing = themables_1.ThemeIcon.modify(codicons_1.Codicon.sync, 'spin');
    exports.spinningLoading = themables_1.ThemeIcon.modify(codicons_1.Codicon.loading, 'spin');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvY29tbW9uL2ljb25SZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnU2hHLG9DQUVDO0lBRUQsMENBRUM7SUF4UkQsb0JBQW9CO0lBR3BCLGdCQUFnQjtJQUNILFFBQUEsVUFBVSxHQUFHO1FBQ3pCLGdCQUFnQixFQUFFLDBCQUEwQjtLQUM1QyxDQUFDO0lBaUJGLElBQWlCLGdCQUFnQixDQVloQztJQVpELFdBQWlCLGdCQUFnQjtRQUNoQyxTQUFnQixhQUFhLENBQUMsWUFBOEIsRUFBRSxRQUF1QjtZQUNwRixJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO1lBQ3ZDLE9BQU8scUJBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDUixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxVQUFVLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUN6QixDQUFDO1lBQ0QsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQVZlLDhCQUFhLGdCQVU1QixDQUFBO0lBQ0YsQ0FBQyxFQVpnQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQVloQztJQWFELElBQWlCLGtCQUFrQixDQW1CbEM7SUFuQkQsV0FBaUIsa0JBQWtCO1FBQ2xDLFNBQWdCLFlBQVksQ0FBQyxRQUE0QjtZQUN4RCxPQUFPO2dCQUNOLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtnQkFDdkIsS0FBSyxFQUFFLFFB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