/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/platform/theme/common/iconRegistry"], function (require, exports, dom_1, event_1, lifecycle_1, themables_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnthemedProductIconTheme = void 0;
    exports.getIconsStyleSheet = getIconsStyleSheet;
    function getIconsStyleSheet(themeService) {
        const disposable = new lifecycle_1.DisposableStore();
        const onDidChangeEmmiter = disposable.add(new event_1.Emitter());
        const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
        disposable.add(iconRegistry.onDidChange(() => onDidChangeEmmiter.fire()));
        if (themeService) {
            disposable.add(themeService.onDidProductIconThemeChange(() => onDidChangeEmmiter.fire()));
        }
        return {
            dispose: () => disposable.dispose(),
            onDidChange: onDidChangeEmmiter.event,
            getCSS() {
                const productIconTheme = themeService ? themeService.getProductIconTheme() : new UnthemedProductIconTheme();
                const usedFontIds = {};
                const rules = [];
                const rootAttribs = [];
                for (const contribution of iconRegistry.getIcons()) {
                    const definition = productIconTheme.getIcon(contribution);
                    if (!definition) {
                        continue;
                    }
                    const fontContribution = definition.font;
                    const fontFamilyVar = `--vscode-icon-${contribution.id}-font-family`;
                    const contentVar = `--vscode-icon-${contribution.id}-content`;
                    if (fontContribution) {
                        usedFontIds[fontContribution.id] = fontContribution.definition;
                        rootAttribs.push(`${fontFamilyVar}: ${(0, dom_1.asCSSPropertyValue)(fontContribution.id)};`, `${contentVar}: '${definition.fontCharacter}';`);
                        rules.push(`.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; font-family: ${(0, dom_1.asCSSPropertyValue)(fontContribution.id)}; }`);
                    }
                    else {
                        rootAttribs.push(`${contentVar}: '${definition.fontCharacter}'; ${fontFamilyVar}: 'codicon';`);
                        rules.push(`.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; }`);
                    }
                }
                for (const id in usedFontIds) {
                    const definition = usedFontIds[id];
                    const fontWeight = definition.weight ? `font-weight: ${definition.weight};` : '';
                    const fontStyle = definition.style ? `font-style: ${definition.style};` : '';
                    const src = definition.src.map(l => `${(0, dom_1.asCSSUrl)(l.location)} format('${l.format}')`).join(', ');
                    rules.push(`@font-face { src: ${src}; font-family: ${(0, dom_1.asCSSPropertyValue)(id)};${fontWeight}${fontStyle} font-display: block; }`);
                }
                rules.push(`:root { ${rootAttribs.join(' ')} }`);
                return rules.join('\n');
            }
        };
    }
    class UnthemedProductIconTheme {
        getIcon(contribution) {
            const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
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
    }
    exports.UnthemedProductIconTheme = UnthemedProductIconTheme;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbnNTdHlsZVNoZWV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvYnJvd3Nlci9pY29uc1N0eWxlU2hlZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLGdEQXNEQztJQXRERCxTQUFnQixrQkFBa0IsQ0FBQyxZQUF1QztRQUN6RSxNQUFNLFVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUV6QyxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sWUFBWSxHQUFHLElBQUEsOEJBQWUsR0FBRSxDQUFDO1FBQ3ZDLFVBQVUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsS0FBSztZQUNyQyxNQUFNO2dCQUNMLE1BQU0sZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO2dCQUM1RyxNQUFNLFdBQVcsR0FBeUMsRUFBRSxDQUFDO2dCQUU3RCxNQUFNLEtB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