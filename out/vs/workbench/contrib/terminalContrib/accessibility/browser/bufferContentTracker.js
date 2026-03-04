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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/terminal/common/terminal"], function (require, exports, lifecycle_1, configuration_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferContentTracker = void 0;
    let BufferContentTracker = class BufferContentTracker extends lifecycle_1.Disposable {
        get lines() { return this._lines; }
        constructor(_xterm, _logService, _configurationService) {
            super();
            this._xterm = _xterm;
            this._logService = _logService;
            this._configurationService = _configurationService;
            /**
             * The number of wrapped lines in the viewport when the last cached marker was set
             */
            this._priorEditorViewportLineCount = 0;
            this._lines = [];
            this.bufferToEditorLineMapping = new Map();
        }
        reset() {
            this._lines = [];
            this._lastCachedMarker = undefined;
            this.update();
        }
        update() {
            if (this._lastCachedMarker?.isDisposed) {
                // the terminal was cleared, reset the cache
                this._lines = [];
                this._lastCachedMarker = undefined;
            }
            this._removeViewportContent();
            this._updateCachedContent();
            this._updateViewportContent();
            this._lastCachedMarker = this._register(this._xterm.raw.registerMarker());
            this._logService.debug('Buffer content tracker: set ', this._lines.length, ' lines');
        }
        _updateCachedContent() {
            const buffer = this._xterm.raw.buffer.active;
            const start = this._lastCachedMarker?.line ? this._lastCachedMarker.line - this._xterm.raw.rows + 1 : 0;
            const end = buffer.baseY;
            if (start < 0 || start > end) {
                // in the viewport, no need to cache
                return;
            }
            // to keep the cache size down, remove any lines that are no longer in the scrollback
            const scrollback = this._configurationService.getValue("terminal.integrated.scrollback" /* TerminalSettingId.Scrollback */);
            const maxBufferSize = scrollback + this._xterm.raw.rows - 1;
            const linesToAdd = end - start;
            if (linesToAdd + this._lines.length > maxBufferSize) {
                const numToRemove = linesToAdd + this._lines.length - maxBufferSize;
                for (let i = 0; i < numToRemove; i++) {
                    this._lines.shift();
                }
                this._logService.debug('Buffer content tracker: removed ', numToRemove, ' lines from top of cached lines, now ', this._lines.length, ' lines');
            }
            // iterate through the buffer lines and add them to the editor line cache
            const cachedLines = [];
            let currentLine = '';
            for (let i = start; i < end; i++) {
                const line = buffer.getLine(i);
                if (!line) {
                    continue;
                }
                this.bufferToEditorLineMapping.set(i, this._lines.length + cachedLines.length);
                const isWrapped = buffer.getLine(i + 1)?.isWrapped;
                currentLine += line.translateToString(!isWrapped);
                if (currentLine && !isWrapped || i === (buffer.baseY + this._xterm.raw.rows - 1)) {
                    if (line.length) {
                        cachedLines.push(currentLine);
                        currentLine = '';
                    }
                }
            }
            this._logService.debug('Buffer content tracker:', cachedLines.length, ' lines cached');
            this._lines.push(...cachedLines);
        }
        _removeViewportContent() {
            if (!this._lines.length) {
                return;
            }
            // remove previous viewport content in case it has changed
            let linesToRemove = this._priorEditorViewportLineCount;
            let index = 1;
            while (linesToRemove) {
                this.bufferToEditorLineMapping.forEach((value, key) => { if (value === this._lines.length - index) {
                    this.bufferToEditorLineMapping.delete(key);
                } });
                this._lines.pop();
                index++;
                linesToRemove--;
            }
            this._logService.debug('Buffer content tracker: removed lines from viewport, now ', this._lines.length, ' lines cached');
        }
        _updateViewportContent() {
            const buffer = this._xterm.raw.buffer.active;
            this._priorEditorViewportLineCount = 0;
            let currentLine = '';
            for (let i = buffer.baseY; i < buffer.baseY + this._xterm.raw.rows; i++) {
                const line = buffer.getLine(i);
                if (!line) {
                    continue;
                }
                this.bufferToEditorLineMapping.set(i, this._lines.length);
                const isWrapped = buffer.getLine(i + 1)?.isWrapped;
                currentLine += line.translateToString(!isWrapped);
                if (currentLine && !isWrapped || i === (buffer.baseY + this._xterm.raw.rows - 1)) {
                    if (currentLine.length) {
                        this._priorEditorViewportLineCount++;
                        this._lines.push(currentLine);
                        currentLine = '';
                    }
                }
            }
            this._logService.debug('Viewport content update complete, ', this._lines.length, ' lines in the viewport');
        }
    };
    exports.BufferContentTracker = BufferContentTracker;
    exports.BufferContentTracker = BufferContentTracker = __decorate([
        __param(1, terminal_1.ITerminalLogService),
        __param(2, configuration_1.IConfigurationService)
    ], BufferContentTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyQ29udGVudFRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL2J1ZmZlckNvbnRlbnRUcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBV25ELElBQUksS0FBSyxLQUFlLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFJN0MsWUFDa0IsTUFBMkQsRUFDdkQsV0FBaUQsRUFDL0MscUJBQTZEO1lBQ3BGLEtBQUssRUFBRSxDQUFDO1lBSFMsV0FBTSxHQUFOLE1BQU0sQ0FBcUQ7WUFDdEMsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQzlCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFickY7O2VBRUc7WUFDSyxrQ0FBNkIsR0FBVyxDQUFDLENBQUM7WUFFMUMsV0FBTSxHQUFhLEVBQUUsQ0FBQztZQUc5Qiw4QkFBeUIsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU8zRCxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7WUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsNENBQTRDO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNB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