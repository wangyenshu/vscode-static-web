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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/date", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover"], function (require, exports, dom, async_1, date_1, htmlContent_1, lifecycle_1, nls_1, configuration_1, contextView_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDecorationHoverManager = exports.DecorationSelector = void 0;
    exports.updateLayout = updateLayout;
    var DecorationStyles;
    (function (DecorationStyles) {
        DecorationStyles[DecorationStyles["DefaultDimension"] = 16] = "DefaultDimension";
        DecorationStyles[DecorationStyles["MarginLeft"] = -17] = "MarginLeft";
    })(DecorationStyles || (DecorationStyles = {}));
    var DecorationSelector;
    (function (DecorationSelector) {
        DecorationSelector["CommandDecoration"] = "terminal-command-decoration";
        DecorationSelector["Hide"] = "hide";
        DecorationSelector["ErrorColor"] = "error";
        DecorationSelector["DefaultColor"] = "default-color";
        DecorationSelector["Default"] = "default";
        DecorationSelector["Codicon"] = "codicon";
        DecorationSelector["XtermDecoration"] = "xterm-decoration";
        DecorationSelector["OverviewRuler"] = ".xterm-decoration-overview-ruler";
        DecorationSelector["QuickFix"] = "quick-fix";
    })(DecorationSelector || (exports.DecorationSelector = DecorationSelector = {}));
    let TerminalDecorationHoverManager = class TerminalDecorationHoverManager extends lifecycle_1.Disposable {
        constructor(_hoverService, configurationService, contextMenuService) {
            super();
            this._hoverService = _hoverService;
            this._contextMenuVisible = false;
            this._register(contextMenuService.onDidShowContextMenu(() => this._contextMenuVisible = true));
            this._register(contextMenuService.onDidHideContextMenu(() => this._contextMenuVisible = false));
            this._hoverDelayer = this._register(new async_1.Delayer(configurationService.getValue('workbench.hover.delay')));
        }
        hideHover() {
            this._hoverDelayer.cancel();
            this._hoverService.hideHover();
        }
        createHover(element, command, hoverMessage) {
            return (0, lifecycle_1.combinedDisposable)(dom.addDisposableListener(element, dom.EventType.MOUSE_ENTER, () => {
                if (this._contextMenuVisible) {
                    return;
                }
                this._hoverDelayer.trigger(() => {
                    let hoverContent = `${(0, nls_1.localize)('terminalPromptContextMenu', "Show Command Actions")}`;
                    hoverContent += '\n\n---\n\n';
                    if (!command) {
                        if (hoverMessage) {
                            hoverContent = hoverMessage;
                        }
                        else {
                            return;
                        }
                    }
                    else if (command.markProperties || hoverMessage) {
                        if (command.markProperties?.hoverMessage || hoverMessage) {
                            hoverContent = command.markProperties?.hoverMessage || hoverMessage || '';
                        }
                        else {
                            return;
                        }
                    }
                    else {
                        if (command.duration) {
                            const durationText = (0, date_1.getDurationString)(command.duration);
                            if (command.exitCode) {
                                if (command.exitCode === -1) {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailed.duration', 'Command executed {0}, took {1} and failed', (0, date_1.fromNow)(command.timestamp, true), durationText);
                                }
                                else {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailedWithExitCode.duration', 'Command executed {0}, took {1} and failed (Exit Code {2})', (0, date_1.fromNow)(command.timestamp, true), durationText, command.exitCode);
                                }
                            }
                            else {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandSuccess.duration', 'Command executed {0} and took {1}', (0, date_1.fromNow)(command.timestamp, true), durationText);
                            }
                        }
                        else {
                            if (command.exitCode) {
                                if (command.exitCode === -1) {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailed', 'Command executed {0} and failed', (0, date_1.fromNow)(command.timestamp, true));
                                }
                                else {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailedWithExitCode', 'Command executed {0} and failed (Exit Code {1})', (0, date_1.fromNow)(command.timestamp, true), command.exitCode);
                                }
                            }
                            else {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandSuccess', 'Command executed {0}', (0, date_1.fromNow)(command.timestamp, true));
                            }
                        }
                    }
                    this._hoverService.showHover({ content: new htmlContent_1.MarkdownString(hoverContent), target: element });
                });
            }), dom.addDisposableListener(element, dom.EventType.MOUSE_LEAVE, () => this.hideHover()), dom.addDisposableListener(element, dom.EventType.MOUSE_OUT, () => this.hideHover()));
        }
    };
    exports.TerminalDecorationHoverManager = TerminalDecorationHoverManager;
    exports.TerminalDecorationHoverManager = TerminalDecorationHoverManager = __decorate([
        __param(0, hover_1.IHoverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, contextView_1.IContextMenuService)
    ], TerminalDecorationHoverManager);
    function updateLayout(configurationService, element) {
        if (!element) {
            return;
        }
        const fontSize = configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).value;
        const defaultFontSize = configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).defaultValue;
        const lineHeight = configurationService.inspect("terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */).value;
        if (typeof fontSize === 'number' && typeof defaultFontSize === 'number' && typeof lineHeight === 'number') {
            const scalar = (fontSize / defaultFontSize) <= 1 ? (fontSize / defaultFontSize) : 1;
            // must be inlined to override the inlined styles from xterm
            element.style.width = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
            element.style.height = `${scalar * 16 /* DecorationStyles.DefaultDimension */ * lineHeight}px`;
            element.style.fontSize = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
            element.style.marginLeft = `${scalar * -17 /* DecorationStyles.MarginLeft */}px`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvblN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIveHRlcm0vZGVjb3JhdGlvblN0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3R2hHLG9DQWVDO0lBekdELElBQVcsZ0JBR1Y7SUFIRCxXQUFXLGdCQUFnQjtRQUMxQixnRkFBcUIsQ0FBQTtRQUNyQixxRUFBZ0IsQ0FBQTtJQUNqQixDQUFDLEVBSFUsZ0JBQWdCLEtBQWhCLGdCQUFnQixRQUcxQjtJQUVELElBQWtCLGtCQVVqQjtJQVZELFdBQWtCLGtCQUFrQjtRQUNuQyx1RUFBaUQsQ0FBQTtRQUNqRCxtQ0FBYSxDQUFBO1FBQ2IsMENBQW9CLENBQUE7UUFDcEIsb0RBQThCLENBQUE7UUFDOUIseUNBQW1CLENBQUE7UUFDbkIseUNBQW1CLENBQUE7UUFDbkIsMERBQW9DLENBQUE7UUFDcEMsd0VBQWtELENBQUE7UUFDbEQsNENBQXNCLENBQUE7SUFDdkIsQ0FBQyxFQVZpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQVVuQztJQUVNLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVU7UUFJN0QsWUFBMkIsYUFBNkMsRUFDaEQsb0JBQTJDLEVBQzdDLGtCQUF1QztZQUM1RCxLQUFLLEVBQUUsQ0FBQztZQUhtQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUZoRSx3QkFBbUIsR0FBWSxLQUFLLENBQUM7WUFNNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMs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