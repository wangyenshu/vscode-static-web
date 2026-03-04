/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/themes/common/colorThemeData", "assert", "vs/platform/theme/common/tokenClassificationRegistry", "vs/base/common/color", "vs/base/common/types", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/platform/extensionResourceLoader/common/extensionResourceLoaderService", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, colorThemeData_1, assert, tokenClassificationRegistry_1, color_1, types_1, fileService_1, log_1, diskFileSystemProvider_1, network_1, extensionResourceLoaderService_1, workbenchTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const undefinedStyle = { bold: undefined, underline: undefined, italic: undefined };
    const unsetStyle = { bold: false, underline: false, italic: false };
    function ts(foreground, styleFlags) {
        const foregroundColor = (0, types_1.isString)(foreground) ? color_1.Color.fromHex(foreground) : undefined;
        return new tokenClassificationRegistry_1.TokenStyle(foregroundColor, styleFlags?.bold, styleFlags?.underline, styleFlags?.strikethrough, styleFlags?.italic);
    }
    function tokenStyleAsString(ts) {
        if (!ts) {
            return 'tokenstyle-undefined';
        }
        let str = ts.foreground ? ts.foreground.toString() : 'no-foreground';
        if (ts.bold !== undefined) {
            str += ts.bold ? '+B' : '-B';
        }
        if (ts.underline !== undefined) {
            str += ts.underline ? '+U' : '-U';
        }
        if (ts.italic !== undefined) {
            str += ts.italic ? '+I' : '-I';
        }
        return str;
    }
    function assertTokenStyle(actual, expected, message) {
        assert.strictEqual(tokenStyleAsString(actual), tokenStyleAsString(expected), message);
    }
    function assertTokenStyleMetaData(colorIndex, actual, expected, message = '') {
        if (expected === undefined || expected === null || actual === undefined) {
            assert.strictEqual(actual, expected, message);
            return;
        }
        assert.strictEqual(actual.bold, expected.bold, 'bold ' + message);
        assert.strictEqual(actual.italic, expected.italic, 'italic ' + message);
        assert.strictEqual(actual.underline, expected.underline, 'underline ' + message);
        const actualForegroundIndex = actual.foreground;
        if (actualForegroundIndex && expected.foreground) {
            assert.strictEqual(colorIndex[actualForegroundIndex], color_1.Color.Format.CSS.formatHexA(expected.foreground, true).toUpperCase(), 'foreground ' + message);
        }
        else {
            assert.strictEqual(actualForegroundIndex, expected.foreground || 0, 'foreground ' + message);
        }
    }
    function assertTokenStyles(themeData, expected, language = 'typescript') {
        const colorIndex = themeData.tokenColorMap;
        for (const qualifiedClassifier in expected) {
            const [type, ...modifiers] = qualifiedClassifier.split('.');
            const expectedTokenStyle = expected[qualifiedClassifier];
            const tokenStyleMetaData = themeData.getTokenStyleMetadata(type, modifiers, language);
            assertTokenStyleMetaData(colorIndex, tokenStyleMetaData, expectedTokenStyle, qualifiedClassifier);
        }
    }
    suite('Themes - TokenStyleResolving', () => {
        const fileService = new fileService_1.FileService(new log_1.NullLogService());
        const requestService = new ((0, workbenchTestServices_1.mock)())();
        const storageService = new ((0, workbenchTestServices_1.mock)())();
        const environmentService = new ((0, workbenchTestServices_1.mock)())();
        const configurationService = new ((0, workbenchTestServices_1.mock)())();
        const extensionResourceLoaderService = new extensionResourceLoaderService_1.ExtensionResourceLoaderService(fileService, storageService, workbenchTestServices_1.TestProductService, environmentService, configurationService, requestService);
        const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService());
        fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        teardown(() => {
            diskFileSystemProvider.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('color defaults', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createUnloadedTheme('foo');
            themeData.location = network_1.FileAccess.asFileUri('vs/workbench/services/themes/test/node/color-theme.json');
            await themeData.ensureLoaded(extensionResourceLoaderService);
            assert.strictEqual(themeData.isLoaded, true);
            assertTokenStyles(themeData, {
                'comment': ts('#000000', undefinedStyle),
                'variable': ts('#111111', unsetStyle),
                'type': ts('#333333', { bold: false, underline: true, italic: false }),
                'function': ts('#333333', unsetStyle),
                'string': ts('#444444', undefinedStyle),
                'number': ts('#555555', undefinedStyle),
                'keyword': ts('#666666', undefinedStyle)
            });
        });
        test('resolveScopes', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            const customTokenColors = {
                textMateRules: [
                    {
                        scope: 'variable',
                        settings: {
                            fontStyle: '',
                            foreground: '#F8F8F2'
                        }
                    },
                    {
                        scope: 'keyword.operator',
                        settings: {
                            fontStyle: 'italic bold underline',
                            foreground: '#F92672'
                        }
                    },
                    {
                        scope: 'storage',
                        settings: {
                            fontStyle: 'italic',
                            foreground: '#F92672'
                        }
                    },
                    {
                        scope: ['storage.type', 'meta.structure.dictionary.json string.quoted.double.json'],
                        settings: {
                            foreground: '#66D9EF'
                        }
                    },
                    {
                        scope: 'entity.name.type, entity.name.class, entity.name.namespace, entity.name.scope-resolution',
                        settings: {
                            fontStyle: 'underline',
                            foreground: '#A6E22E'
                        }
                    },
                ]
            };
            themeData.setCustomTokenColors(customTokenColors);
            let tokenStyle;
            const defaultTokenStyle = undefined;
            tokenStyle = themeData.resolveScopes([['variable']]);
            assertTokenStyle(tokenStyle, ts('#F8F8F2', unsetStyle), 'variable');
            tokenStyle = themeData.resolveScopes([['keyword.operator']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: true, underline: true }), 'keyword');
            tokenStyle = themeData.resolveScopes([['keyword']]);
            assertTokenStyle(tokenStyle, defaultTokenStyle, 'keyword');
            tokenStyle = themeData.resolveScopes([['keyword.operator']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: true, underline: true }), 'keyword.operator');
            tokenStyle = themeData.resolveScopes([['keyword.operators']]);
            assertTokenStyle(tokenStyle, defaultTokenStyle, 'keyword.operators');
            tokenStyle = themeData.resolveScopes([['storage']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: false, underline: false }), 'storage');
            tokenStyle = themeData.resolveScopes([['storage.type']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', { italic: true, bold: false, underline: false }), 'storage.type');
            tokenStyle = themeData.resolveScopes([['entity.name.class']]);
            assertTokenStyle(tokenStyle, ts('#A6E22E', { italic: false, bold: false, underline: true }), 'entity.name.class');
            tokenStyle = themeData.resolveScopes([['meta.structure.dictionary.json', 'string.quoted.double.json']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', undefined), 'json property');
            tokenStyle = themeData.resolveScopes([['keyword'], ['storage.type'], ['entity.name.class']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', { italic: true, bold: false, underline: false }), 'storage.type');
        });
        test('resolveScopes - match most specific', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            const customTokenColors = {
                textMateRules: [
                    {
                        scope: 'entity.name.type',
                        settings: {
                            fontStyle: 'underline',
                            foreground: '#A6E22E'
                        }
                    },
                    {
                        scope: 'entity.name.type.class',
                        settings: {
                            foreground: '#FF00FF'
                        }
                    },
                    {
                        scope: 'entity.name',
                        settings: {
                            foreground: '#FFFFFF'
                        }
                    },
                ]
            };
            themeData.setCustomTokenColors(customTokenColors);
            const tokenStyle = themeData.resolveScopes([['entity.name.type.class']]);
            assertTokenStyle(tokenStyle, ts('#FF00FF', { italic: false, bold: false, underline: true }), 'entity.name.type.class');
        });
        test('rule matching', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            themeData.setCustomColors({ 'editor.foreground': '#000000' });
            themeData.setCustomSemanticTokenColors({
                enabled: true,
                rules: {
                    'type': '#ff0000',
                    'class': { foreground: '#0000ff', italic: true },
                    '*.static': { bold: true },
                    '*.declaration': { italic: true },
                    '*.async.static': { italic: true, underline: true },
                    '*.async': { foreground: '#000fff', underline: true }
                }
            });
            assertTokenStyles(themeData, {
                'type': ts('#ff0000', undefinedStyle),
                'type.static': ts('#ff0000', { bold: true }),
                'type.static.declaration': ts('#ff0000', { bold: true, italic: true }),
                'class': ts('#0000ff', { italic: true }),
                'class.static.declaration': ts('#0000ff', { bold: true, italic: true, }),
                'class.declaration': ts('#0000ff', { italic: true }),
                'class.declaration.async': ts('#000fff', { underline: true, italic: true }),
                'class.declaration.async.static': ts('#000fff', { italic: true, underline: true, bold: true }),
            });
        });
        test('super type', async () => {
            const registry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
            registry.registerTokenType('myTestInterface', 'A type just for testing', 'interface');
            registry.registerTokenType('myTestSubInterface', 'A type just for testing', 'myTestInterface');
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#ff0000',
                        'myTestInterface': { italic: true },
                        'interface.static': { bold: true }
                    }
                });
                assertTokenStyles(themeData, { 'myTestSubInterface': ts('#ff0000', { italic: true }) });
                assertTokenStyles(themeData, { 'myTestSubInterface.static': ts('#ff0000', { italic: true, bold: true }) });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#ff0000',
                        'myTestInterface': { foreground: '#ff00ff', italic: true }
                    }
                });
                assertTokenStyles(themeData, { 'myTestSubInterface': ts('#ff00ff', { italic: true }) });
            }
            finally {
                registry.deregisterTokenType('myTestInterface');
                registry.deregisterTokenType('myTestSubInterface');
            }
        });
        test('language', async () => {
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#fff000',
                        'interface:java': '#ff0000',
                        'interface.static': { bold: true },
                        'interface.static:typescript': { italic: true }
                    }
                });
                assertTokenStyles(themeData, { 'interface': ts('#ff0000', undefined) }, 'java');
                assertTokenStyles(themeData, { 'interface': ts('#fff000', undefined) }, 'typescript');
                assertTokenStyles(themeData, { 'interface.static': ts('#ff0000', { bold: true }) }, 'java');
                assertTokenStyles(themeData, { 'interface.static': ts('#fff000', { bold: true, italic: true }) }, 'typescript');
            }
            finally {
            }
        });
        test('language - scope resolving', async () => {
            const registry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
            const numberOfDefaultRules = registry.getTokenStylingDefaultRules().length;
            registry.registerTokenStyleDefault(registry.parseTokenSelector('type', 'typescript1'), { scopesToProbe: [['entity.name.type.ts1']] });
            registry.registerTokenStyleDefault(registry.parseTokenSelector('type:javascript1'), { scopesToProbe: [['entity.name.type.js1']] });
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomTokenColors({
                    textMateRules: [
                        {
                            scope: 'entity.name.type',
                            settings: { foreground: '#aa0000' }
                        },
                        {
                            scope: 'entity.name.type.ts1',
                            settings: { foreground: '#bb0000' }
                        }
                    ]
                });
                assertTokenStyles(themeData, { 'type': ts('#aa0000', undefined) }, 'javascript1');
                assertTokenStyles(themeData, { 'type': ts('#bb0000', undefined) }, 'typescript1');
            }
            finally {
                registry.deregisterTokenStyleDefault(registry.parseTokenSelector('type', 'typescript1'));
                registry.deregisterTokenStyleDefault(registry.parseTokenSelector('type:javascript1'));
                assert.strictEqual(registry.getTokenStylingDefaultRules().length, numberOfDefaultRules);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5TdHlsZVJlc29sdmluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy90ZXN0L25vZGUvdG9rZW5TdHlsZVJlc29sdmluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyxNQUFNLGNBQWMsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDcEYsTUFBTSxVQUFVLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBRXBFLFNBQVMsRUFBRSxDQUFDLFVBQThCLEVBQUUsVUFBMEc7UUFDckosTUFBTSxlQUFlLEdBQUcsSUFBQSxnQkFBUSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDckYsT0FBTyxJQUFJLHdDQUFVLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNoSSxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxFQUFpQztRQUM1RCxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDVCxPQUFPLHNCQUFzQixDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMs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