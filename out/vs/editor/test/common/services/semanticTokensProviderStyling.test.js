/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/test/common/testTextModel", "vs/platform/theme/common/themeService", "vs/editor/common/languages/language", "vs/base/test/common/utils"], function (require, exports, assert, lifecycle_1, sparseMultilineTokens_1, semanticTokensProviderStyling_1, testTextModel_1, themeService_1, language_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ModelService', () => {
        let disposables;
        let instantiationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #134973: invalid semantic tokens should be handled better', () => {
            const languageId = 'java';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7', 'st8', 'st9', 'st10'],
                tokenModifiers: []
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 13, 16, 1, 0,
                    1, 2, 6, 2, 0,
                    0, 7, 6, 3, 0,
                    0, 15, 8, 4, 0,
                    0, 17, 1, 5, 0,
                    0, 7, 5, 6, 0,
                    1, 12, 8, 7, 0,
                    0, 19, 5, 8, 0,
                    0, 7, 1, 9, 0,
                    0, 4294967294, 5, 10, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 13, 29, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 2, 8, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 9, 15, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 24, 32, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 41, 42, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (5 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 48, 53, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (6 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 12, 20, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (7 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 31, 36, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (8 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 38, 39, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (9 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
        test('issue #148651: VSCode UI process can hang if a semantic token with negative values is returned by language service', () => {
            const languageId = 'dockerfile';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7', 'st8', 'st9'],
                tokenModifiers: ['stm0', 'stm1', 'stm2']
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 0, 3, 0, 0,
                    0, 4, 2, 2, 0,
                    0, 2, 3, 8, 0,
                    0, 3, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 4, 8, 0,
                    0, 4, 4294967292, 2, 0,
                    0, 4294967292, 4294967294, 8, 0,
                    0, 4294967294, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 3, 8, 0,
                    0, 3, 4294967291, 8, 0,
                    0, 4294967291, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 4, 8, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 4, 6, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 6, 9, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 9, 10, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 11, 15, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
        test('issue #149130: vscode freezes because of Bracket Pair Colorization', () => {
            const languageId = 'q';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5'],
                tokenModifiers: ['stm0', 'stm1', 'stm2']
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 11, 1, 1, 0,
                    0, 4, 1, 1, 0,
                    0, 4294967289, 1, 1, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 11, 12, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 15, 16, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNQcm92aWRlclN0eWxpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9zZW1hbnRpY1Rva2Vuc1Byb3ZpZGVyU3R5bGluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzFCLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksZUFBaUMsQ0FBQztRQUV0QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFvQixHQUFHLElBQUEsbUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDeEQsZUFBZSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1lBQzVFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztZQUMxQixXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2QsVUFBVSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFB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