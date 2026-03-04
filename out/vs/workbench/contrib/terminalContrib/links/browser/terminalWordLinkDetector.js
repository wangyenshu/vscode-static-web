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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/base/common/network", "vs/platform/product/common/productService", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, lifecycle_1, strings_1, uri_1, configuration_1, network_1, productService_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWordLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
    })(Constants || (Constants = {}));
    let TerminalWordLinkDetector = class TerminalWordLinkDetector extends lifecycle_1.Disposable {
        static { this.id = 'word'; }
        constructor(xterm, _configurationService, _productService) {
            super();
            this.xterm = xterm;
            this._configurationService = _configurationService;
            this._productService = _productService;
            // Word links typically search the workspace so it makes sense that their maximum link length is
            // quite small.
            this.maxLinkLength = 100;
            this._refreshSeparatorCodes();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.wordSeparators" /* TerminalSettingId.WordSeparators */)) {
                    this._refreshSeparatorCodes();
                }
            }));
        }
        detect(lines, startLine, endLine) {
            const links = [];
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            // Parse out all words from the wrapped line
            const words = this._parseWords(text);
            // Map the words to ITerminalLink objects
            for (const word of words) {
                if (word.text === '') {
                    continue;
                }
                if (word.text.length > 0 && word.text.charAt(word.text.length - 1) === ':') {
                    word.text = word.text.slice(0, -1);
                    word.endIndex--;
                }
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: word.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: word.endIndex + 1,
                    endLineNumber: 1
                }, startLine);
                // Support this product's URL protocol
                if ((0, network_1.matchesScheme)(word.text, this._productService.urlProtocol)) {
                    const uri = uri_1.URI.parse(word.text);
                    if (uri) {
                        links.push({
                            text: word.text,
                            uri,
                            bufferRange,
                            type: "Url" /* TerminalBuiltinLinkType.Url */
                        });
                    }
                    continue;
                }
                // Search links
                links.push({
                    text: word.text,
                    bufferRange,
                    type: "Search" /* TerminalBuiltinLinkType.Search */,
                    contextLine: text
                });
            }
            return links;
        }
        _parseWords(text) {
            const words = [];
            const splitWords = text.split(this._separatorRegex);
            let runningIndex = 0;
            for (let i = 0; i < splitWords.length; i++) {
                words.push({
                    text: splitWords[i],
                    startIndex: runningIndex,
                    endIndex: runningIndex + splitWords[i].length
                });
                runningIndex += splitWords[i].length + 1;
            }
            return words;
        }
        _refreshSeparatorCodes() {
            const separators = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).wordSeparators;
            let powerlineSymbols = '';
            for (let i = 0xe0b0; i <= 0xe0bf; i++) {
                powerlineSymbols += String.fromCharCode(i);
            }
            this._separatorRegex = new RegExp(`[${(0, strings_1.escapeRegExpCharacters)(separators)}${powerlineSymbols}]`, 'g');
        }
    };
    exports.TerminalWordLinkDetector = TerminalWordLinkDetector;
    exports.TerminalWordLinkDetector = TerminalWordLinkDetector = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService)
    ], TerminalWordLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxXb3JkTGlua0RldGVjdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxXb3JkTGlua0RldGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxJQUFXLFNBS1Y7SUFMRCxXQUFXLFNBQVM7UUFDbkI7O1dBRUc7UUFDSCw4REFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBTFUsU0FBUyxLQUFULFNBQVMsUUFLbkI7SUFRTSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO2lCQUNoRCxPQUFFLEdBQUcsTUFBTSxBQUFULENBQVU7UUFRbkIsWUFDVSxLQUFlLEVBQ0QscUJBQTZELEVBQ25FLGVBQWlEO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBSkMsVUFBSyxHQUFMLEtBQUssQ0FBVTtZQUNnQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQVRuRSxnR0FBZ0c7WUFDaEcsZUFBZTtZQUNOLGtCQUFhLEdBQUcsR0FBRyxDQUFDO1lBVzVCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsNkVBQWtDLEVBQUUsQ0FBQztvQkFDOUQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFvQixFQUFF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