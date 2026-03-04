/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, async_1, color_1, event_1, nls, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenStylingSchemaId = exports.SemanticTokenRule = exports.TokenStyle = exports.typeAndModifierIdPattern = void 0;
    exports.parseClassifierString = parseClassifierString;
    exports.getTokenClassificationRegistry = getTokenClassificationRegistry;
    const TOKEN_TYPE_WILDCARD = '*';
    const TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR = ':';
    const CLASSIFIER_MODIFIER_SEPARATOR = '.';
    const idPattern = '\\w+[-_\\w+]*';
    exports.typeAndModifierIdPattern = `^${idPattern}$`;
    const selectorPattern = `^(${idPattern}|\\*)(\\${CLASSIFIER_MODIFIER_SEPARATOR}${idPattern})*(${TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR}${idPattern})?$`;
    const fontStylePattern = '^(\\s*(italic|bold|underline|strikethrough))*\\s*$';
    class TokenStyle {
        constructor(foreground, bold, underline, strikethrough, italic) {
            this.foreground = foreground;
            this.bold = bold;
            this.underline = underline;
            this.strikethrough = strikethrough;
            this.italic = italic;
        }
    }
    exports.TokenStyle = TokenStyle;
    (function (TokenStyle) {
        function toJSONObject(style) {
            return {
                _foreground: style.foreground === undefined ? null : color_1.Color.Format.CSS.formatHexA(style.foreground, true),
                _bold: style.bold === undefined ? null : style.bold,
                _underline: style.underline === undefined ? null : style.underline,
                _italic: style.italic === undefined ? null : style.italic,
                _strikethrough: style.strikethrough === undefined ? null : style.strikethrough,
            };
        }
        TokenStyle.toJSONObject = toJSONObject;
        function fromJSONObject(obj) {
            if (obj) {
                const boolOrUndef = (b) => (typeof b === 'boolean') ? b : undefined;
                const colorOrUndef = (s) => (typeof s === 'string') ? color_1.Color.fromHex(s) : undefined;
                return new TokenStyle(colorOrUndef(obj._foreground), boolOrUndef(obj._bold), boolOrUndef(obj._underline), boolOrUndef(obj._strikethrough), boolOrUndef(obj._italic));
            }
            return undefined;
        }
        TokenStyle.fromJSONObject = fromJSONObject;
        function equals(s1, s2) {
            if (s1 === s2) {
                return true;
            }
            return s1 !== undefined && s2 !== undefined
                && (s1.foreground instanceof color_1.Color ? s1.foreground.equals(s2.foreground) : s2.foreground === undefined)
                && s1.bold === s2.bold
                && s1.underline === s2.underline
                && s1.strikethrough === s2.strikethrough
                && s1.italic === s2.italic;
        }
        TokenStyle.equals = equals;
        function is(s) {
            return s instanceof TokenStyle;
        }
        TokenStyle.is = is;
        function fromData(data) {
            return new TokenStyle(data.foreground, data.bold, data.underline, data.strikethrough, data.italic);
        }
        TokenStyle.fromData = fromData;
        function fromSettings(foreground, fontStyle, bold, underline, strikethrough, italic) {
            let foregroundColor = undefined;
            if (foreground !== undefined) {
                foregroundColor = color_1.Color.fromHex(foreground);
            }
            if (fontStyle !== undefined) {
                bold = italic = underline = strikethrough = false;
                const expression = /italic|bold|underline|strikethrough/g;
                let match;
                while ((match = expression.exec(fontStyle))) {
                    switch (match[0]) {
                        case 'bold':
                            bold = true;
                            break;
                        case 'italic':
                            italic = true;
                            break;
                        case 'underline':
                            underline = true;
                            break;
                        case 'strikethrough':
                            strikethrough = true;
                            break;
                    }
                }
            }
            return new TokenStyle(foregroundColor, bold, underline, strikethrough, italic);
        }
        TokenStyle.fromSettings = fromSettings;
    })(TokenStyle || (exports.TokenStyle = TokenStyle = {}));
    var SemanticTokenRule;
    (function (SemanticTokenRule) {
        function fromJSONObject(registry, o) {
            if (o && typeof o._selector === 'string' && o._style) {
                const style = TokenStyle.fromJSONObject(o._style);
                if (style) {
                    try {
                        return { selector: registry.parseTokenSelector(o._selector), style };
                    }
                    catch (_ignore) {
                    }
                }
            }
            return undefined;
        }
        SemanticTokenRule.fromJSONObject = fromJSONObject;
        function toJSONObject(rule) {
            return {
                _selector: rule.selector.id,
                _style: TokenStyle.toJSONObject(rule.style)
            };
        }
        SemanticTokenRule.toJSONObject = toJSONObject;
        function equals(r1, r2) {
            if (r1 === r2) {
                return true;
            }
            return r1 !== undefined && r2 !== undefined
                && r1.selector && r2.selector && r1.selector.id === r2.selector.id
                && TokenStyle.equals(r1.style, r2.style);
        }
        SemanticTokenRule.equals = equals;
        function is(r) {
            return r && r.selector && typeof r.selector.id === 'string' && TokenStyle.is(r.style);
        }
        SemanticTokenRule.is = is;
    })(SemanticTokenRule || (exports.SemanticTokenRule = SemanticTokenRule = {}));
    // TokenStyle registry
    const Extensions = {
        TokenClassificationContribution: 'base.contributions.tokenClassification'
    };
    class TokenClassificationRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.currentTypeNumber = 0;
            this.currentModifierBit = 1;
            this.tokenStylingDefaultRules = [];
            this.tokenStylingSchema = {
                type: 'object',
                properties: {},
                patternProperties: {
                    [selectorPattern]: getStylingSchemeEntry()
                },
                //errorMessage: nls.localize('schema.token.errors', 'Valid token selectors have the form (*|tokenType)(.tokenModifier)*(:tokenLanguage)?.'),
                additionalProperties: false,
                definitions: {
                    style: {
                        type: 'object',
                        description: nls.localize('schema.token.settings', 'Colors and styles for the token.'),
                        properties: {
                            foreground: {
                                type: 'string',
                                description: nls.localize('schema.token.foreground', 'Foreground color for the token.'),
                                format: 'color-hex',
                                default: '#ff0000'
                            },
                            background: {
                                type: 'string',
                                deprecationMessage: nls.localize('schema.token.background.warning', 'Token background colors are currently not supported.')
                            },
                            fontStyle: {
                                type: 'string',
                                description: nls.localize('schema.token.fontStyle', 'Sets the all font styles of the rule: \'italic\', \'bold\', \'underline\' or \'strikethrough\' or a combination. All styles that are not listed are unset. The empty string unsets all styles.'),
                                pattern: fontStylePattern,
                                patternErrorMessage: nls.localize('schema.fontStyle.error', 'Font style must be \'italic\', \'bold\', \'underline\' or \'strikethrough\' or a combination. The empty string unsets all styles.'),
                                defaultSnippets: [
                                    { label: nls.localize('schema.token.fontStyle.none', 'None (clear inherited style)'), bodyText: '""' },
                                    { body: 'italic' },
                                    { body: 'bold' },
                                    { body: 'underline' },
                                    { body: 'strikethrough' },
                                    { body: 'italic bold' },
                                    { body: 'italic underline' },
                                    { body: 'italic strikethrough' },
                                    { body: 'bold underline' },
                                    { body: 'bold strikethrough' },
                                    { body: 'underline strikethrough' },
                                    { body: 'italic bold underline' },
                                    { body: 'italic bold strikethrough' },
                                    { body: 'italic underline strikethrough' },
                                    { body: 'bold underline strikethrough' },
                                    { body: 'italic bold underline strikethrough' }
                                ]
                            },
                            bold: {
                                type: 'boolean',
                                description: nls.localize('schema.token.bold', 'Sets or unsets the font style to bold. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            italic: {
                                type: 'boolean',
                                description: nls.localize('schema.token.italic', 'Sets or unsets the font style to italic. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            underline: {
                                type: 'boolean',
                                description: nls.localize('schema.token.underline', 'Sets or unsets the font style to underline. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            strikethrough: {
                                type: 'boolean',
                                description: nls.localize('schema.token.strikethrough', 'Sets or unsets the font style to strikethrough. Note, the presence of \'fontStyle\' overrides this setting.'),
                            }
                        },
                        defaultSnippets: [{ body: { foreground: '${1:#FF0000}', fontStyle: '${2:bold}' } }]
                    }
                }
            };
            this.tokenTypeById = Object.create(null);
            this.tokenModifierById = Object.create(null);
            this.typeHierarchy = Object.create(null);
        }
        registerTokenType(id, description, superType, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token type id.');
            }
            if (superType && !superType.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token super type id.');
            }
            const num = this.currentTypeNumber++;
            const tokenStyleContribution = { num, id, superType, description, deprecationMessage };
            this.tokenTypeById[id] = tokenStyleContribution;
            const stylingSchemeEntry = getStylingSchemeEntry(description, deprecationMessage);
            this.tokenStylingSchema.properties[id] = stylingSchemeEntry;
            this.typeHierarchy = Object.create(null);
        }
        registerTokenModifier(id, description, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token modifier id.');
            }
            const num = this.currentModifierBit;
            this.currentModifierBit = this.currentModifierBit * 2;
            const tokenStyleContribution = { num, id, description, deprecationMessage };
            this.tokenModifierById[id] = tokenStyleContribution;
            this.tokenStylingSchema.properties[`*.${id}`] = getStylingSchemeEntry(description, deprecationMessage);
        }
        parseTokenSelector(selectorString, language) {
            const selector = parseClassifierString(selectorString, language);
            if (!selector.type) {
                return {
                    match: () => -1,
                    id: '$invalid'
                };
            }
            return {
                match: (type, modifiers, language) => {
                    let score = 0;
                    if (selector.language !== undefined) {
                        if (selector.language !== language) {
                            return -1;
                        }
                        score += 10;
                    }
                    if (selector.type !== TOKEN_TYPE_WILDCARD) {
                        const hierarchy = this.getTypeHierarchy(type);
                        const level = hierarchy.indexOf(selector.type);
                        if (level === -1) {
                            return -1;
                        }
                        score += (100 - level);
                    }
                    // all selector modifiers must be present
                    for (const selectorModifier of selector.modifiers) {
                        if (modifiers.indexOf(selectorModifier) === -1) {
                            return -1;
                        }
                    }
                    return score + selector.modifiers.length * 100;
                },
                id: `${[selector.type, ...selector.modifiers.sort()].join('.')}${selector.language !== undefined ? ':' + selector.language : ''}`
            };
        }
        registerTokenStyleDefault(selector, defaults) {
            this.tokenStylingDefaultRules.push({ selector, defaults });
        }
        deregisterTokenStyleDefault(selector) {
            const selectorString = selector.id;
            this.tokenStylingDefaultRules = this.tokenStylingDefaultRules.filter(r => r.selector.id !== selectorString);
        }
        deregisterTokenType(id) {
            delete this.tokenTypeById[id];
            delete this.tokenStylingSchema.properties[id];
            this.typeHierarchy = Object.create(null);
        }
        deregisterTokenModifier(id) {
            delete this.tokenModifierById[id];
            delete this.tokenStylingSchema.properties[`*.${id}`];
        }
        getTokenTypes() {
            return Object.keys(this.tokenTypeById).map(id => this.tokenTypeById[id]);
        }
        getTokenModifiers() {
            return Object.keys(this.tokenModifierById).map(id => this.tokenModifierById[id]);
        }
        getTokenStylingSchema() {
            return this.tokenStylingSchema;
        }
        getTokenStylingDefaultRules() {
            return this.tokenStylingDefaultRules;
        }
        getTypeHierarchy(typeId) {
            let hierarchy = this.typeHierarchy[typeId];
            if (!hierarchy) {
                this.typeHierarchy[typeId] = hierarchy = [typeId];
                let type = this.tokenTypeById[typeId];
                while (type && type.superType) {
                    hierarchy.push(type.superType);
                    type = this.tokenTypeById[type.superType];
                }
            }
            return hierarchy;
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
            return Object.keys(this.tokenTypeById).sort(sorter).map(k => `- \`${k}\`: ${this.tokenTypeById[k].description}`).join('\n');
        }
    }
    const CHAR_LANGUAGE = TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR.charCodeAt(0);
    const CHAR_MODIFIER = CLASSIFIER_MODIFIER_SEPARATOR.charCodeAt(0);
    function parseClassifierString(s, defaultLanguage) {
        let k = s.length;
        let language = defaultLanguage;
        const modifiers = [];
        for (let i = k - 1; i >= 0; i--) {
            const ch = s.charCodeAt(i);
            if (ch === CHAR_LANGUAGE || ch === CHAR_MODIFIER) {
                const segment = s.substring(i + 1, k);
                k = i;
                if (ch === CHAR_LANGUAGE) {
                    language = segment;
                }
                else {
                    modifiers.push(segment);
                }
            }
        }
        const type = s.substring(0, k);
        return { type, modifiers, language };
    }
    const tokenClassificationRegistry = createDefaultTokenClassificationRegistry();
    platform.Registry.add(Extensions.TokenClassificationContribution, tokenClassificationRegistry);
    function createDefaultTokenClassificationRegistry() {
        const registry = new TokenClassificationRegistry();
        function registerTokenType(id, description, scopesToProbe = [], superType, deprecationMessage) {
            registry.registerTokenType(id, description, superType, deprecationMessage);
            if (scopesToProbe) {
                registerTokenStyleDefault(id, scopesToProbe);
            }
            return id;
        }
        function registerTokenStyleDefault(selectorString, scopesToProbe) {
            try {
                const selector = registry.parseTokenSelector(selectorString);
                registry.registerTokenStyleDefault(selector, { scopesToProbe });
            }
            catch (e) {
                console.log(e);
            }
        }
        // default token types
        registerTokenType('comment', nls.localize('comment', "Style for comments."), [['comment']]);
        registerTokenType('string', nls.localize('string', "Style for strings."), [['string']]);
        registerTokenType('keyword', nls.localize('keyword', "Style for keywords."), [['keyword.control']]);
        registerTokenType('number', nls.localize('number', "Style for numbers."), [['constant.numeric']]);
        registerTokenType('regexp', nls.localize('regexp', "Style for expressions."), [['constant.regexp']]);
        registerTokenType('operator', nls.localize('operator', "Style for operators."), [['keyword.operator']]);
        registerTokenType('namespace', nls.localize('namespace', "Style for namespaces."), [['entity.name.namespace']]);
        registerTokenType('type', nls.localize('type', "Style for types."), [['entity.name.type'], ['support.type']]);
        registerTokenType('struct', nls.localize('struct', "Style for structs."), [['entity.name.type.struct']]);
        registerTokenType('class', nls.localize('class', "Style for classes."), [['entity.name.type.class'], ['support.class']]);
        registerTokenType('interface', nls.localize('interface', "Style for interfaces."), [['entity.name.type.interface']]);
        registerTokenType('enum', nls.localize('enum', "Style for enums."), [['entity.name.type.enum']]);
        registerTokenType('typeParameter', nls.localize('typeParameter', "Style for type parameters."), [['entity.name.type.parameter']]);
        registerTokenType('function', nls.localize('function', "Style for functions"), [['entity.name.function'], ['support.function']]);
        registerTokenType('member', nls.localize('member', "Style for member functions"), [], 'method', 'Deprecated use `method` instead');
        registerTokenType('method', nls.localize('method', "Style for method (member functions)"), [['entity.name.function.member'], ['support.function']]);
        registerTokenType('macro', nls.localize('macro', "Style for macros."), [['entity.name.function.preprocessor']]);
        registerTokenType('variable', nls.localize('variable', "Style for variables."), [['variable.other.readwrite'], ['entity.name.variable']]);
        registerTokenType('parameter', nls.localize('parameter', "Style for parameters."), [['variable.parameter']]);
        registerTokenType('property', nls.localize('property', "Style for properties."), [['variable.other.property']]);
        registerTokenType('enumMember', nls.localize('enumMember', "Style for enum members."), [['variable.other.enummember']]);
        registerTokenType('event', nls.localize('event', "Style for events."), [['variable.other.event']]);
        registerTokenType('decorator', nls.localize('decorator', "Style for decorators & annotations."), [['entity.name.decorator'], ['entity.name.function']]);
        registerTokenType('label', nls.localize('labels', "Style for labels. "), undefined);
        // default token modifiers
        registry.registerTokenModifier('declaration', nls.localize('declaration', "Style for all symbol declarations."), undefined);
        registry.registerTokenModifier('documentation', nls.localize('documentation', "Style to use for references in documentation."), undefined);
        registry.registerTokenModifier('static', nls.localize('static', "Style to use for symbols that are static."), undefined);
        registry.registerTokenModifier('abstract', nls.localize('abstract', "Style to use for symbols that are abstract."), undefined);
        registry.registerTokenModifier('deprecated', nls.localize('deprecated', "Style to use for symbols that are deprecated."), undefined);
        registry.registerTokenModifier('modification', nls.localize('modification', "Style to use for write accesses."), undefined);
        registry.registerTokenModifier('async', nls.localize('async', "Style to use for symbols that are async."), undefined);
        registry.registerTokenModifier('readonly', nls.localize('readonly', "Style to use for symbols that are read-only."), undefined);
        registerTokenStyleDefault('variable.readonly', [['variable.other.constant']]);
        registerTokenStyleDefault('property.readonly', [['variable.other.constant.property']]);
        registerTokenStyleDefault('type.defaultLibrary', [['support.type']]);
        registerTokenStyleDefault('class.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('interface.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('variable.defaultLibrary', [['support.variable'], ['support.other.variable']]);
        registerTokenStyleDefault('variable.defaultLibrary.readonly', [['support.constant']]);
        registerTokenStyleDefault('property.defaultLibrary', [['support.variable.property']]);
        registerTokenStyleDefault('property.defaultLibrary.readonly', [['support.constant.property']]);
        registerTokenStyleDefault('function.defaultLibrary', [['support.function']]);
        registerTokenStyleDefault('member.defaultLibrary', [['support.function']]);
        return registry;
    }
    function getTokenClassificationRegistry() {
        return tokenClassificationRegistry;
    }
    function getStylingSchemeEntry(description, deprecationMessage) {
        return {
            description,
            deprecationMessage,
            defaultSnippets: [{ body: '${1:#ff0000}' }],
            anyOf: [
                {
                    type: 'string',
                    format: 'color-hex'
                },
                {
                    $ref: '#/definitions/style'
                }
            ]
        };
    }
    exports.tokenStylingSchemaId = 'vscode://schemas/token-styling';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.tokenStylingSchemaId, tokenClassificationRegistry.getTokenStylingSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.tokenStylingSchemaId), 200);
    tokenClassificationRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5DbGFzc2lmaWNhdGlvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvY29tbW9uL3Rva2VuQ2xhc3NpZmljYXRpb25SZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwZWhHLHNEQW1CQztJQXNGRCx3RUFFQztJQTFrQkQsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUM7SUFDaEMsTUFBTSxtQ0FBbUMsR0FBRyxHQUFHLENBQUM7SUFDaEQsTUFBTSw2QkFBNkIsR0FBRyxHQUFHLENBQUM7SUFLMUMsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDO0lBQ3JCLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSxTQUFTLEdBQUcsQ0FBQztJQUV6RCxNQUFNLGVBQWUsR0FBRyxLQUFLLFNBQVMsV0FBVyw2QkFBNkIsR0FBRyxTQUFTLE1BQU0sbUNBQW1DLEdBQUcsU0FBUyxLQUFLLENBQUM7SUFFckosTUFBTSxnQkFBZ0IsR0FBRyxvREFBb0QsQ0FBQztJQXdCOUUsTUFBYSxVQUFVO1FBQ3RCLFlBQ2lCLFVBQTZCLEVBQzdCLElBQXlCLEVBQ3pCLFNBQThCLEVBQzlCLGFBQWtDLEVBQ2xDLE1BQTJCO1lBSjNCLGVBQVUsR0FBVixVQUFVLENBQW1CO1lBQzdCLFNBQUksR0FBSixJQUFJLENBQXFCO1lBQ3pCLGNBQVMsR0FBVCxTQUFTLENBQXFCO1lBQzlCLGtCQUFhLEdBQWIsYUFBYSxDQUFxQjtZQUNsQyxXQUFNLEdBQU4sTUFBTSxDQUFxQjtRQUU1QyxDQUFDO0tBQ0Q7SUFURCxnQ0FTQztJQUVELFdBQWlCLFVBQVU7UUFDMUIsU0FBZ0IsWUFBWSxDQUFDLEtBQWlCO1lBQzdDLE9BQU87Z0JBQ04sV0FBVyxFQUFFLEtBQUssQ0FBQyxVQUFVLEtBQUssU0FB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