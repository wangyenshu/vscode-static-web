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
define(["require", "exports", "vs/base/common/event", "../common/decorations", "vs/base/common/ternarySearchTree", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/linkedList", "vs/base/browser/dom", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/strings", "vs/nls", "vs/base/common/errors", "vs/base/common/cancellation", "vs/platform/instantiation/common/extensions", "vs/base/common/hash", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/arrays", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, event_1, decorations_1, ternarySearchTree_1, lifecycle_1, async_1, linkedList_1, dom_1, themeService_1, themables_1, strings_1, nls_1, errors_1, cancellation_1, extensions_1, hash_1, uriIdentity_1, arrays_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsService = void 0;
    class DecorationRule {
        static keyOf(data) {
            if (Array.isArray(data)) {
                return data.map(DecorationRule.keyOf).join(',');
            }
            else {
                const { color, letter } = data;
                if (themables_1.ThemeIcon.isThemeIcon(letter)) {
                    return `${color}+${letter.id}`;
                }
                else {
                    return `${color}/${letter}`;
                }
            }
        }
        static { this._classNamesPrefix = 'monaco-decoration'; }
        constructor(themeService, data, key) {
            this.themeService = themeService;
            this._refCounter = 0;
            this.data = data;
            const suffix = (0, hash_1.hash)(key).toString(36);
            this.itemColorClassName = `${DecorationRule._classNamesPrefix}-itemColor-${suffix}`;
            this.itemBadgeClassName = `${DecorationRule._classNamesPrefix}-itemBadge-${suffix}`;
            this.bubbleBadgeClassName = `${DecorationRule._classNamesPrefix}-bubbleBadge-${suffix}`;
            this.iconBadgeClassName = `${DecorationRule._classNamesPrefix}-iconBadge-${suffix}`;
        }
        acquire() {
            this._refCounter += 1;
        }
        release() {
            return --this._refCounter === 0;
        }
        appendCSSRules(element) {
            if (!Array.isArray(this.data)) {
                this._appendForOne(this.data, element);
            }
            else {
                this._appendForMany(this.data, element);
            }
        }
        _appendForOne(data, element) {
            const { color, letter } = data;
            // label
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            if (themables_1.ThemeIcon.isThemeIcon(letter)) {
                this._createIconCSSRule(letter, color, element);
            }
            else if (letter) {
                (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letter}"; color: ${getColor(color)};`, element);
            }
        }
        _appendForMany(data, element) {
            // label
            const { color } = data.find(d => !!d.color) ?? data[0];
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            // badge or icon
            const letters = [];
            let icon;
            for (const d of data) {
                if (themables_1.ThemeIcon.isThemeIcon(d.letter)) {
                    icon = d.letter;
                    break;
                }
                else if (d.letter) {
                    letters.push(d.letter);
                }
            }
            if (icon) {
                this._createIconCSSRule(icon, color, element);
            }
            else {
                if (letters.length) {
                    (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letters.join(', ')}"; color: ${getColor(color)};`, element);
                }
                // bubble badge
                // TODO @misolori update bubble badge to adopt letter: ThemeIcon instead of unicode
                (0, dom_1.createCSSRule)(`.${this.bubbleBadgeClassName}::after`, `content: "\uea71"; color: ${getColor(color)}; font-family: codicon; font-size: 14px; margin-right: 14px; opacity: 0.4;`, element);
            }
        }
        _createIconCSSRule(icon, color, element) {
            const modifier = themables_1.ThemeIcon.getModifier(icon);
            if (modifier) {
                icon = themables_1.ThemeIcon.modify(icon, undefined);
            }
            const iconContribution = (0, iconRegistry_1.getIconRegistry)().getIcon(icon.id);
            if (!iconContribution) {
                return;
            }
            const definition = this.themeService.getProductIconTheme().getIcon(iconContribution);
            if (!definition) {
                return;
            }
            (0, dom_1.createCSSRule)(`.${this.iconBadgeClassName}::after`, `content: '${definition.fontCharacter}';
			color: ${icon.color ? getColor(icon.color.id) : getColor(color)};
			font-family: ${(0, dom_1.asCSSPropertyValue)(definition.font?.id ?? 'codicon')};
			font-size: 16px;
			margin-right: 14px;
			font-weight: normal;
			${modifier === 'spin' ? 'animation: codicon-spin 1.5s steps(30) infinite' : ''};
			`, element);
        }
        removeCSSRules(element) {
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemColorClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.bubbleBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.iconBadgeClassName, element);
        }
    }
    class DecorationStyles {
        constructor(_themeService) {
            this._themeService = _themeService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._styleElement = (0, dom_1.createStyleSheet)(undefined, undefined, this._dispoables);
            this._decorationRules = new Map();
        }
        dispose() {
            this._dispoables.dispose();
        }
        asDecoration(data, onlyChildren) {
            // sort by weight
            data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
            const key = DecorationRule.keyOf(data);
            let rule = this._decorationRules.get(key);
            if (!rule) {
                // new css rule
                rule = new DecorationRule(this._themeService, data, key);
                this._decorationRules.set(key, rule);
                rule.appendCSSRules(this._styleElement);
            }
            rule.acquire();
            const labelClassName = rule.itemColorClassName;
            let badgeClassName = rule.itemBadgeClassName;
            const iconClassName = rule.iconBadgeClassName;
            let tooltip = (0, arrays_1.distinct)(data.filter(d => !(0, strings_1.isFalsyOrWhitespace)(d.tooltip)).map(d => d.tooltip)).join(' • ');
            const strikethrough = data.some(d => d.strikethrough);
            if (onlyChildren) {
                // show items from its children only
                badgeClassName = rule.bubbleBadgeClassName;
                tooltip = (0, nls_1.localize)('bubbleTitle', "Contains emphasized items");
            }
            return {
                labelClassName,
                badgeClassName,
                iconClassName,
                strikethrough,
                tooltip,
                dispose: () => {
                    if (rule?.release()) {
                        this._decorationRules.delete(key);
                        rule.removeCSSRules(this._styleElement);
                        rule = undefined;
                    }
                }
            };
        }
    }
    class FileDecorationChangeEvent {
        constructor(all) {
            this._data = ternarySearchTree_1.TernarySearchTree.forUris(_uri => true); // events ignore all path casings
            this._data.fill(true, (0, arrays_1.asArray)(all));
        }
        affectsResource(uri) {
            return this._data.hasElementOrSubtree(uri);
        }
    }
    class DecorationDataRequest {
        constructor(source, thenable) {
            this.source = source;
            this.thenable = thenable;
        }
    }
    function getColor(color) {
        return color ? (0, colorRegistry_1.asCssVariable)(color) : 'inherit';
    }
    let DecorationsService = class DecorationsService {
        constructor(uriIdentityService, themeService) {
            this._onDidChangeDecorationsDelayed = new event_1.DebounceEmitter({ merge: all => all.flat() });
            this._onDidChangeDecorations = new event_1.Emitter();
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._provider = new linkedList_1.LinkedList();
            this._decorationStyles = new DecorationStyles(themeService);
            this._data = ternarySearchTree_1.TernarySearchTree.forUris(key => uriIdentityService.extUri.ignorePathCasing(key));
            this._onDidChangeDecorationsDelayed.event(event => { this._onDidChangeDecorations.fire(new FileDecorationChangeEvent(event)); });
        }
        dispose() {
            this._onDidChangeDecorations.dispose();
            this._onDidChangeDecorationsDelayed.dispose();
            this._data.clear();
        }
        registerDecorationsProvider(provider) {
            const rm = this._provider.unshift(provider);
            this._onDidChangeDecorations.fire({
                // everything might have changed
                affectsResource() { return true; }
            });
            // remove everything what came from this provider
            const removeAll = () => {
                const uris = [];
                for (const [uri, map] of this._data) {
                    if (map.delete(provider)) {
                        uris.push(uri);
                    }
                }
                if (uris.length > 0) {
                    this._onDidChangeDecorationsDelayed.fire(uris);
                }
            };
            const listener = provider.onDidChange(uris => {
                if (!uris) {
                    // flush event -> drop all data, can affect everything
                    removeAll();
                }
                else {
                    // selective changes -> drop for resource, fetch again, send event
                    for (const uri of uris) {
                        const map = this._ensureEntry(uri);
                        this._fetchData(map, uri, provider);
                    }
                }
            });
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                listener.dispose();
                removeAll();
            });
        }
        _ensureEntry(uri) {
            let map = this._data.get(uri);
            if (!map) {
                // nothing known about this uri
                map = new Map();
                this._data.set(uri, map);
            }
            return map;
        }
        getDecoration(uri, includeChildren) {
            const all = [];
            let containsChildren = false;
            const map = this._ensureEntry(uri);
            for (const provider of this._provider) {
                let data = map.get(provider);
                if (data === undefined) {
                    // sets data if fetch is sync
                    data = this._fetchData(map, uri, provider);
                }
                if (data && !(data instanceof DecorationDataRequest)) {
                    // having data
                    all.push(data);
                }
            }
            if (includeChildren) {
                // (resolved) children
                const iter = this._data.findSuperstr(uri);
                if (iter) {
                    for (const tuple of iter) {
                        for (const data of tuple[1].values()) {
                            if (data && !(data instanceof DecorationDataRequest)) {
                                if (data.bubble) {
                                    all.push(data);
                                    containsChildren = true;
                                }
                            }
                        }
                    }
                }
            }
            return all.length === 0
                ? undefined
                : this._decorationStyles.asDecoration(all, containsChildren);
        }
        _fetchData(map, uri, provider) {
            // check for pending request and cancel it
            const pendingRequest = map.get(provider);
            if (pendingRequest instanceof DecorationDataRequest) {
                pendingRequest.source.cancel();
                map.delete(provider);
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const dataOrThenable = provider.provideDecorations(uri, cts.token);
            if (!(0, async_1.isThenable)(dataOrThenable)) {
                // sync -> we have a result now
                cts.dispose();
                return this._keepItem(map, provider, uri, dataOrThenable);
            }
            else {
                // async -> we have a result soon
                const request = new DecorationDataRequest(cts, Promise.resolve(dataOrThenable).then(data => {
                    if (map.get(provider) === request) {
                        this._keepItem(map, provider, uri, data);
                    }
                }).catch(err => {
                    if (!(0, errors_1.isCancellationError)(err) && map.get(provider) === request) {
                        map.delete(provider);
                    }
                }).finally(() => {
                    cts.dispose();
                }));
                map.set(provider, request);
                return null;
            }
        }
        _keepItem(map, provider, uri, data) {
            const deco = data ? data : null;
            const old = map.get(provider);
            map.set(provider, deco);
            if (deco || old) {
                // only fire event when something changed
                this._onDidChangeDecorationsDelayed.fire(uri);
            }
            return deco;
        }
    };
    exports.DecorationsService = DecorationsService;
    exports.DecorationsService = DecorationsService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, themeService_1.IThemeService)
    ], DecorationsService);
    (0, extensions_1.registerSingleton)(decorations_1.IDecorationsService, DecorationsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2RlY29yYXRpb25zL2Jyb3dzZXIvZGVjb3JhdGlvbnNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBTSxjQUFjO1FBRW5CLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBeUM7WUFDckQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztnQkFDL0IsSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNuQyxPQUFPLEdBQUcsS0FBSyxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sR0FBRyxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztpQkFFdUIsc0JBQWlCLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO1FBVWhFLFlBQXFCLFlBQTJCLEVBQUUsSUFBeUMsRUFBRSxHQUFXO1lBQW5GLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBRnhDLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1lBRy9CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLE1BQU0sTUFBTSxHQUFHLElBQUEsV0FB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