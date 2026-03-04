/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, assert_1, async_1, color_1, event_1, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workbenchColorsSchemaId = exports.Extensions = exports.ColorTransformType = void 0;
    exports.asCssVariableName = asCssVariableName;
    exports.asCssVariable = asCssVariable;
    exports.asCssVariableWithDefault = asCssVariableWithDefault;
    exports.registerColor = registerColor;
    exports.getColorRegistry = getColorRegistry;
    exports.executeTransform = executeTransform;
    exports.darken = darken;
    exports.lighten = lighten;
    exports.transparent = transparent;
    exports.opaque = opaque;
    exports.oneOf = oneOf;
    exports.ifDefinedThenElse = ifDefinedThenElse;
    exports.lessProminent = lessProminent;
    exports.resolveColorValue = resolveColorValue;
    /**
     * Returns the css variable name for the given color identifier. Dots (`.`) are replaced with hyphens (`-`) and
     * everything is prefixed with `--vscode-`.
     *
     * @sample `editorSuggestWidget.background` is `--vscode-editorSuggestWidget-background`.
     */
    function asCssVariableName(colorIdent) {
        return `--vscode-${colorIdent.replace(/\./g, '-')}`;
    }
    function asCssVariable(color) {
        return `var(${asCssVariableName(color)})`;
    }
    function asCssVariableWithDefault(color, defaultCssValue) {
        return `var(${asCssVariableName(color)}, ${defaultCssValue})`;
    }
    var ColorTransformType;
    (function (ColorTransformType) {
        ColorTransformType[ColorTransformType["Darken"] = 0] = "Darken";
        ColorTransformType[ColorTransformType["Lighten"] = 1] = "Lighten";
        ColorTransformType[ColorTransformType["Transparent"] = 2] = "Transparent";
        ColorTransformType[ColorTransformType["Opaque"] = 3] = "Opaque";
        ColorTransformType[ColorTransformType["OneOf"] = 4] = "OneOf";
        ColorTransformType[ColorTransformType["LessProminent"] = 5] = "LessProminent";
        ColorTransformType[ColorTransformType["IfDefinedThenElse"] = 6] = "IfDefinedThenElse";
    })(ColorTransformType || (exports.ColorTransformType = ColorTransformType = {}));
    // color registry
    exports.Extensions = {
        ColorContribution: 'base.contributions.colors'
    };
    class ColorRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.colorSchema = { type: 'object', properties: {} };
            this.colorReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.colorsById = {};
        }
        registerColor(id, defaults, description, needsTransparency = false, deprecationMessage) {
            const colorContribution = { id, description, defaults, needsTransparency, deprecationMessage };
            this.colorsById[id] = colorContribution;
            const propertySchema = { type: 'string', description, format: 'color-hex', defaultSnippets: [{ body: '${1:#ff0000}' }] };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            if (needsTransparency) {
                propertySchema.pattern = '^#(?:(?<rgba>[0-9a-fA-f]{3}[0-9a-eA-E])|(?:[0-9a-fA-F]{6}(?:(?![fF]{2})(?:[0-9a-fA-F]{2}))))?$';
                propertySchema.patternErrorMessage = 'This color must be transparent or it will obscure content';
            }
            this.colorSchema.properties[id] = propertySchema;
            this.colorReferenceSchema.enum.push(id);
            this.colorReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return id;
        }
        deregisterColor(id) {
            delete this.colorsById[id];
            delete this.colorSchema.properties[id];
            const index = this.colorReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.colorReferenceSchema.enum.splice(index, 1);
                this.colorReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getColors() {
            return Object.keys(this.colorsById).map(id => this.colorsById[id]);
        }
        resolveDefaultColor(id, theme) {
            const colorDesc = this.colorsById[id];
            if (colorDesc && colorDesc.defaults) {
                const colorValue = colorDesc.defaults[theme.type];
                return resolveColorValue(colorValue, theme);
            }
            return undefined;
        }
        getColorSchema() {
            return this.colorSchema;
        }
        getColorReferenceSchema() {
            return this.colorReferenceSchema;
        }
        toString() {
            const sorter = (a, b) => {
                const cat1 = a.indexOf('.') === -1 ? 0 : 1;
                const cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.colorsById).sort(sorter).map(k => `- \`${k}\`: ${this.colorsById[k].description}`).join('\n');
        }
    }
    const colorRegistry = new ColorRegistry();
    platform.Registry.add(exports.Extensions.ColorContribution, colorRegistry);
    function registerColor(id, defaults, description, needsTransparency, deprecationMessage) {
        return colorRegistry.registerColor(id, defaults, description, needsTransparency, deprecationMessage);
    }
    function getColorRegistry() {
        return colorRegistry;
    }
    // ----- color functions
    function executeTransform(transform, theme) {
        switch (transform.op) {
            case 0 /* ColorTransformType.Darken */:
                return resolveColorValue(transform.value, theme)?.darken(transform.factor);
            case 1 /* ColorTransformType.Lighten */:
                return resolveColorValue(transform.value, theme)?.lighten(transform.factor);
            case 2 /* ColorTransformType.Transparent */:
                return resolveColorValue(transform.value, theme)?.transparent(transform.factor);
            case 3 /* ColorTransformType.Opaque */: {
                const backgroundColor = resolveColorValue(transform.background, theme);
                if (!backgroundColor) {
                    return resolveColorValue(transform.value, theme);
                }
                return resolveColorValue(transform.value, theme)?.makeOpaque(backgroundColor);
            }
            case 4 /* ColorTransformType.OneOf */:
                for (const candidate of transform.values) {
                    const color = resolveColorValue(candidate, theme);
                    if (color) {
                        return color;
                    }
                }
                return undefined;
            case 6 /* ColorTransformType.IfDefinedThenElse */:
                return resolveColorValue(theme.defines(transform.if) ? transform.then : transform.else, theme);
            case 5 /* ColorTransformType.LessProminent */: {
                const from = resolveColorValue(transform.value, theme);
                if (!from) {
                    return undefined;
                }
                const backgroundColor = resolveColorValue(transform.background, theme);
                if (!backgroundColor) {
                    return from.transparent(transform.factor * transform.transparency);
                }
                return from.isDarkerThan(backgroundColor)
                    ? color_1.Color.getLighterColor(from, backgroundColor, transform.factor).transparent(transform.transparency)
                    : color_1.Color.getDarkerColor(from, backgroundColor, transform.factor).transparent(transform.transparency);
            }
            default:
                throw (0, assert_1.assertNever)(transform);
        }
    }
    function darken(colorValue, factor) {
        return { op: 0 /* ColorTransformType.Darken */, value: colorValue, factor };
    }
    function lighten(colorValue, factor) {
        return { op: 1 /* ColorTransformType.Lighten */, value: colorValue, factor };
    }
    function transparent(colorValue, factor) {
        return { op: 2 /* ColorTransformType.Transparent */, value: colorValue, factor };
    }
    function opaque(colorValue, background) {
        return { op: 3 /* ColorTransformType.Opaque */, value: colorValue, background };
    }
    function oneOf(...colorValues) {
        return { op: 4 /* ColorTransformType.OneOf */, values: colorValues };
    }
    function ifDefinedThenElse(ifArg, thenArg, elseArg) {
        return { op: 6 /* ColorTransformType.IfDefinedThenElse */, if: ifArg, then: thenArg, else: elseArg };
    }
    function lessProminent(colorValue, backgroundColorValue, factor, transparency) {
        return { op: 5 /* ColorTransformType.LessProminent */, value: colorValue, background: backgroundColorValue, factor, transparency };
    }
    // ----- implementation
    /**
     * @param colorValue Resolve a color value in the context of a theme
     */
    function resolveColorValue(colorValue, theme) {
        if (colorValue === null) {
            return undefined;
        }
        else if (typeof colorValue === 'string') {
            if (colorValue[0] === '#') {
                return color_1.Color.fromHex(colorValue);
            }
            return theme.getColor(colorValue);
        }
        else if (colorValue instanceof color_1.Color) {
            return colorValue;
        }
        else if (typeof colorValue === 'object') {
            return executeTransform(colorValue, theme);
        }
        return undefined;
    }
    exports.workbenchColorsSchemaId = 'vscode://schemas/workbench-colors';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.workbenchColorsSchemaId, colorRegistry.getColorSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.workbenchColorsSchemaId), 200);
    colorRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
// setTimeout(_ => console.log(colorRegistry.toString()), 5000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RoZW1lL2NvbW1vbi9jb2xvclV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTZCaEcsOENBRUM7SUFFRCxzQ0FFQztJQUVELDREQUVDO0lBbUtELHNDQUVDO0lBRUQsNENBRUM7SUFJRCw0Q0FpREM7SUFFRCx3QkFFQztJQUVELDBCQUVDO0lBRUQsa0NBRUM7SUFFRCx3QkFFQztJQUVELHNCQUVDO0lBRUQsOENBRUM7SUFFRCxzQ0FFQztJQU9ELDhDQWNDO0lBL1JEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsVUFBMkI7UUFDNUQsT0FBTyxZQUFZLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDckQsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FBQyxLQUFzQjtRQUNuRCxPQUFPLE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUMzQyxDQUFDO0lBRUQsU0FBZ0Isd0JBQXdCLENBQUMsS0FBc0IsRUFBRSxlQUF1QjtRQUN2RixPQUFPLE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDLEtBQUssZUFBZSxHQUFHLENBQUM7SUFDL0QsQ0FBQztJQUVELElBQWtCLGtCQVFqQjtJQVJELFdBQWtCLGtCQUFrQjtRQUNuQywrREFBTSxDQUFBO1FBQ04saUVBQU8sQ0FBQTtRQUNQLHlFQUFXLENBQUE7UUFDWCwrREFBTSxDQUFBO1FBQ04sNkRBQUssQ0FBQTtRQUNMLDZFQUFhLENBQUE7UUFDYixxRkFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBUmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBUW5DO0lBd0JELGlCQUFpQjtJQUNKLFFBQUEsVUFB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