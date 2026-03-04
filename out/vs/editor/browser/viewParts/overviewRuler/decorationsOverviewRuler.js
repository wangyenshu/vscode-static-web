/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/color", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/viewModel", "vs/base/common/arrays"], function (require, exports, fastDomNode_1, color_1, viewPart_1, position_1, languages_1, editorColorRegistry_1, viewModel_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsOverviewRuler = void 0;
    class Settings {
        constructor(config, theme) {
            const options = config.options;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.pixelRatio = options.get(143 /* EditorOption.pixelRatio */);
            this.overviewRulerLanes = options.get(83 /* EditorOption.overviewRulerLanes */);
            this.renderBorder = options.get(82 /* EditorOption.overviewRulerBorder */);
            const borderColor = theme.getColor(editorColorRegistry_1.editorOverviewRulerBorder);
            this.borderColor = borderColor ? borderColor.toString() : null;
            this.hideCursor = options.get(59 /* EditorOption.hideCursorInOverviewRuler */);
            const cursorColorSingle = theme.getColor(editorColorRegistry_1.editorCursorForeground);
            this.cursorColorSingle = cursorColorSingle ? cursorColorSingle.transparent(0.7).toString() : null;
            const cursorColorPrimary = theme.getColor(editorColorRegistry_1.editorMultiCursorPrimaryForeground);
            this.cursorColorPrimary = cursorColorPrimary ? cursorColorPrimary.transparent(0.7).toString() : null;
            const cursorColorSecondary = theme.getColor(editorColorRegistry_1.editorMultiCursorSecondaryForeground);
            this.cursorColorSecondary = cursorColorSecondary ? cursorColorSecondary.transparent(0.7).toString() : null;
            this.themeType = theme.type;
            const minimapOpts = options.get(73 /* EditorOption.minimap */);
            const minimapEnabled = minimapOpts.enabled;
            const minimapSide = minimapOpts.side;
            const themeColor = theme.getColor(editorColorRegistry_1.editorOverviewRulerBackground);
            const defaultBackground = languages_1.TokenizationRegistry.getDefaultBackground();
            if (themeColor) {
                this.backgroundColor = themeColor;
            }
            else if (minimapEnabled && minimapSide === 'right') {
                this.backgroundColor = defaultBackground;
            }
            else {
                this.backgroundColor = null;
            }
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const position = layoutInfo.overviewRuler;
            this.top = position.top;
            this.right = position.right;
            this.domWidth = position.width;
            this.domHeight = position.height;
            if (this.overviewRulerLanes === 0) {
                // overview ruler is off
                this.canvasWidth = 0;
                this.canvasHeight = 0;
            }
            else {
                this.canvasWidth = (this.domWidth * this.pixelRatio) | 0;
                this.canvasHeight = (this.domHeight * this.pixelRatio) | 0;
            }
            const [x, w] = this._initLanes(1, this.canvasWidth, this.overviewRulerLanes);
            this.x = x;
            this.w = w;
        }
        _initLanes(canvasLeftOffset, canvasWidth, laneCount) {
            const remainingWidth = canvasWidth - canvasLeftOffset;
            if (laneCount >= 3) {
                const leftWidth = Math.floor(remainingWidth / 3);
                const rightWidth = Math.floor(remainingWidth / 3);
                const centerWidth = remainingWidth - leftWidth - rightWidth;
                const leftOffset = canvasLeftOffset;
                const centerOffset = leftOffset + leftWidth;
                const rightOffset = leftOffset + leftWidth + centerWidth;
                return [
                    [
                        0,
                        leftOffset, // Left
                        centerOffset, // Center
                        leftOffset, // Left | Center
                        rightOffset, // Right
                        leftOffset, // Left | Right
                        centerOffset, // Center | Right
                        leftOffset, // Left | Center | Right
                    ], [
                        0,
                        leftWidth, // Left
                        centerWidth, // Center
                        leftWidth + centerWidth, // Left | Center
                        rightWidth, // Right
                        leftWidth + centerWidth + rightWidth, // Left | Right
                        centerWidth + rightWidth, // Center | Right
                        leftWidth + centerWidth + rightWidth, // Left | Center | Right
                    ]
                ];
            }
            else if (laneCount === 2) {
                const leftWidth = Math.floor(remainingWidth / 2);
                const rightWidth = remainingWidth - leftWidth;
                const leftOffset = canvasLeftOffset;
                const rightOffset = leftOffset + leftWidth;
                return [
                    [
                        0,
                        leftOffset, // Left
                        leftOffset, // Center
                        leftOffset, // Left | Center
                        rightOffset, // Right
                        leftOffset, // Left | Right
                        leftOffset, // Center | Right
                        leftOffset, // Left | Center | Right
                    ], [
                        0,
                        leftWidth, // Left
                        leftWidth, // Center
                        leftWidth, // Left | Center
                        rightWidth, // Right
                        leftWidth + rightWidth, // Left | Right
                        leftWidth + rightWidth, // Center | Right
                        leftWidth + rightWidth, // Left | Center | Right
                    ]
                ];
            }
            else {
                const offset = canvasLeftOffset;
                const width = remainingWidth;
                return [
                    [
                        0,
                        offset, // Left
                        offset, // Center
                        offset, // Left | Center
                        offset, // Right
                        offset, // Left | Right
                        offset, // Center | Right
                        offset, // Left | Center | Right
                    ], [
                        0,
                        width, // Left
                        width, // Center
                        width, // Left | Center
                        width, // Right
                        width, // Left | Right
                        width, // Center | Right
                        width, // Left | Center | Right
                    ]
                ];
            }
        }
        equals(other) {
            return (this.lineHeight === other.lineHeight
                && this.pixelRatio === other.pixelRatio
                && this.overviewRulerLanes === other.overviewRulerLanes
                && this.renderBorder === other.renderBorder
                && this.borderColor === other.borderColor
                && this.hideCursor === other.hideCursor
                && this.cursorColorSingle === other.cursorColorSingle
                && this.cursorColorPrimary === other.cursorColorPrimary
                && this.cursorColorSecondary === other.cursorColorSecondary
                && this.themeType === other.themeType
                && color_1.Color.equals(this.backgroundColor, other.backgroundColor)
                && this.top === other.top
                && this.right === other.right
                && this.domWidth === other.domWidth
                && this.domHeight === other.domHeight
                && this.canvasWidth === other.canvasWidth
                && this.canvasHeight === other.canvasHeight);
        }
    }
    var Constants;
    (function (Constants) {
        Constants[Constants["MIN_DECORATION_HEIGHT"] = 6] = "MIN_DECORATION_HEIGHT";
    })(Constants || (Constants = {}));
    var OverviewRulerLane;
    (function (OverviewRulerLane) {
        OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
        OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
        OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
        OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
    })(OverviewRulerLane || (OverviewRulerLane = {}));
    var ShouldRenderValue;
    (function (ShouldRenderValue) {
        ShouldRenderValue[ShouldRenderValue["NotNeeded"] = 0] = "NotNeeded";
        ShouldRenderValue[ShouldRenderValue["Maybe"] = 1] = "Maybe";
        ShouldRenderValue[ShouldRenderValue["Needed"] = 2] = "Needed";
    })(ShouldRenderValue || (ShouldRenderValue = {}));
    class DecorationsOverviewRuler extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._actualShouldRender = 0 /* ShouldRenderValue.NotNeeded */;
            this._renderedDecorations = [];
            this._renderedCursorPositions = [];
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setClassName('decorationsOverviewRuler');
            this._domNode.setPosition('absolute');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._updateSettings(false);
            this._tokensColorTrackerListener = languages_1.TokenizationRegistry.onDidChange((e) => {
                if (e.changedColorMap) {
                    this._updateSettings(true);
                }
            });
            this._cursorPositions = [{ position: new position_1.Position(1, 1), color: this._settings.cursorColorSingle }];
        }
        dispose() {
            super.dispose();
            this._tokensColorTrackerListener.dispose();
        }
        _updateSettings(renderNow) {
            const newSettings = new Settings(this._context.configuration, this._context.theme);
            if (this._settings && this._settings.equals(newSettings)) {
                // nothing to do
                return false;
            }
            this._settings = newSettings;
            this._domNode.setTop(this._settings.top);
            this._domNode.setRight(this._settings.right);
            this._domNode.setWidth(this._settings.domWidth);
            this._domNode.setHeight(this._settings.domHeight);
            this._domNode.domNode.width = this._settings.canvasWidth;
            this._domNode.domNode.height = this._settings.canvasHeight;
            if (renderNow) {
                this._render();
            }
            return true;
        }
        // ---- begin view event handlers
        _markRenderingIsNeeded() {
            this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            return true;
        }
        _markRenderingIsMaybeNeeded() {
            this._actualShouldRender = 1 /* ShouldRenderValue.Maybe */;
            return true;
        }
        onConfigurationChanged(e) {
            return this._updateSettings(false) ? this._markRenderingIsNeeded() : false;
        }
        onCursorStateChanged(e) {
            this._cursorPositions = [];
            for (let i = 0, len = e.selections.length; i < len; i++) {
                let color = this._settings.cursorColorSingle;
                if (len > 1) {
                    color = i === 0 ? this._settings.cursorColorPrimary : this._settings.cursorColorSecondary;
                }
                this._cursorPositions.push({ position: e.selections[i].getPosition(), color });
            }
            this._cursorPositions.sort((a, b) => position_1.Position.compare(a.position, b.position));
            return this._markRenderingIsMaybeNeeded();
        }
        onDecorationsChanged(e) {
            if (e.affectsOverviewRuler) {
                return this._markRenderingIsMaybeNeeded();
            }
            return false;
        }
        onFlushed(e) {
            return this._markRenderingIsNeeded();
        }
        onScrollChanged(e) {
            return e.scrollHeightChanged ? this._markRenderingIsNeeded() : false;
        }
        onZonesChanged(e) {
            return this._markRenderingIsNeeded();
        }
        onThemeChanged(e) {
            return this._updateSettings(false) ? this._markRenderingIsNeeded() : false;
        }
        // ---- end view event handlers
        getDomNode() {
            return this._domNode.domNode;
        }
        prepareRender(ctx) {
            // Nothing to read
        }
        render(editorCtx) {
            this._render();
            this._actualShouldRender = 0 /* ShouldRenderValue.NotNeeded */;
        }
        _render() {
            const backgroundColor = this._settings.backgroundColor;
            if (this._settings.overviewRulerLanes === 0) {
                // overview ruler is off
                this._domNode.setBackgroundColor(backgroundColor ? color_1.Color.Format.CSS.formatHexA(backgroundColor) : '');
                this._domNode.setDisplay('none');
                return;
            }
            const decorations = this._context.viewModel.getAllOverviewRulerDecorations(this._context.theme);
            decorations.sort(viewModel_1.OverviewRulerDecorationsGroup.compareByRenderingProps);
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */ && !viewModel_1.OverviewRulerDecorationsGroup.equalsArr(this._renderedDecorations, decorations)) {
                this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            }
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */ && !(0, arrays_1.equals)(this._renderedCursorPositions, this._cursorPositions, (a, b) => a.position.lineNumber === b.position.lineNumber && a.color === b.color)) {
                this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            }
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */) {
                // both decorations and cursor positions are unchanged, nothing to do
                return;
            }
            this._renderedDecorations = decorations;
            this._renderedCursorPositions = this._cursorPositions;
            this._domNode.setDisplay('block');
            const canvasWidth = this._settings.canvasWidth;
            const canvasHeight = this._settings.canvasHeight;
            const lineHeight = this._settings.lineHeight;
            const viewLayout = this._context.viewLayout;
            const outerHeight = this._context.viewLayout.getScrollHeight();
            const heightRatio = canvasHeight / outerHeight;
            const minDecorationHeight = (6 /* Constants.MIN_DECORATION_HEIGHT */ * this._settings.pixelRatio) | 0;
            const halfMinDecorationHeight = (minDecorationHeight / 2) | 0;
            const canvasCtx = this._domNode.domNode.getContext('2d');
            if (backgroundColor) {
                if (backgroundColor.isOpaque()) {
                    // We have a background color which is opaque, we can just paint the entire surface with it
                    canvasCtx.fillStyle = color_1.Color.Format.CSS.formatHexA(backgroundColor);
                    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                }
                else {
                    // We have a background color which is transparent, we need to first clear the surface and
                    // then fill it
                    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                    canvasCtx.fillStyle = color_1.Color.Format.CSS.formatHexA(backgroundColor);
                    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                }
            }
            else {
                // We don't have a background color
                canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            }
            const x = this._settings.x;
            const w = this._settings.w;
            for (const decorationGroup of decorations) {
                const color = decorationGroup.color;
                const decorationGroupData = decorationGroup.data;
                canvasCtx.fillStyle = color;
                let prevLane = 0;
                let prevY1 = 0;
                let prevY2 = 0;
                for (let i = 0, len = decorationGroupData.length / 3; i < len; i++) {
                    const lane = decorationGroupData[3 * i];
                    const startLineNumber = decorationGroupData[3 * i + 1];
                    const endLineNumber = decorationGroupData[3 * i + 2];
                    let y1 = (viewLayout.getVerticalOffsetForLineNumber(startLineNumber) * heightRatio) | 0;
                    let y2 = ((viewLayout.getVerticalOffsetForLineNumber(endLineNumber) + lineHeight) * heightRatio) | 0;
                    const height = y2 - y1;
                    if (height < minDecorationHeight) {
                        let yCenter = ((y1 + y2) / 2) | 0;
                        if (yCenter < halfMinDecorationHeight) {
                            yCenter = halfMinDecorationHeight;
                        }
                        else if (yCenter + halfMinDecorationHeight > canvasHeight) {
                            yCenter = canvasHeight - halfMinDecorationHeight;
                        }
                        y1 = yCenter - halfMinDecorationHeight;
                        y2 = yCenter + halfMinDecorationHeight;
                    }
                    if (y1 > prevY2 + 1 || lane !== prevLane) {
                        // flush prev
                        if (i !== 0) {
                            canvasCtx.fillRect(x[prevLane], prevY1, w[prevLane], prevY2 - prevY1);
                        }
                        prevLane = lane;
                        prevY1 = y1;
                        prevY2 = y2;
                    }
                    else {
                        // merge into prev
                        if (y2 > prevY2) {
                            prevY2 = y2;
                        }
                    }
                }
                canvasCtx.fillRect(x[prevLane], prevY1, w[prevLane], prevY2 - prevY1);
            }
            // Draw cursors
            if (!this._settings.hideCursor) {
                const cursorHeight = (2 * this._settings.pixelRatio) | 0;
                const halfCursorHeight = (cursorHeight / 2) | 0;
                const cursorX = this._settings.x[7 /* OverviewRulerLane.Full */];
                const cursorW = this._settings.w[7 /* OverviewRulerLane.Full */];
                let prevY1 = -100;
                let prevY2 = -100;
                let prevColor = null;
                for (let i = 0, len = this._cursorPositions.length; i < len; i++) {
                    const color = this._cursorPositions[i].color;
                    if (!color) {
                        continue;
                    }
                    const cursor = this._cursorPositions[i].position;
                    let yCenter = (viewLayout.getVerticalOffsetForLineNumber(cursor.lineNumber) * heightRatio) | 0;
                    if (yCenter < halfCursorHeight) {
                        yCenter = halfCursorHeight;
                    }
                    else if (yCenter + halfCursorHeight > canvasHeight) {
                        yCenter = canvasHeight - halfCursorHeight;
                    }
                    const y1 = yCenter - halfCursorHeight;
                    const y2 = y1 + cursorHeight;
                    if (y1 > prevY2 + 1 || color !== prevColor) {
                        // flush prev
                        if (i !== 0 && prevColor) {
                            canvasCtx.fillRect(cursorX, prevY1, cursorW, prevY2 - prevY1);
                        }
                        prevY1 = y1;
                        prevY2 = y2;
                    }
                    else {
                        // merge into prev
                        if (y2 > prevY2) {
                            prevY2 = y2;
                        }
                    }
                    prevColor = color;
                    canvasCtx.fillStyle = color;
                }
                if (prevColor) {
                    canvasCtx.fillRect(cursorX, prevY1, cursorW, prevY2 - prevY1);
                }
            }
            if (this._settings.renderBorder && this._settings.borderColor && this._settings.overviewRulerLanes > 0) {
                canvasCtx.beginPath();
                canvasCtx.lineWidth = 1;
                canvasCtx.strokeStyle = this._settings.borderColor;
                canvasCtx.moveTo(0, 0);
                canvasCtx.lineTo(0, canvasHeight);
                canvasCtx.stroke();
                canvasCtx.moveTo(0, 0);
                canvasCtx.lineTo(canvasWidth, 0);
                canvasCtx.stroke();
            }
        }
    }
    exports.DecorationsOverviewRuler = DecorationsOverviewRuler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnNPdmVydmlld1J1bGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL292ZXJ2aWV3UnVsZXIvZGVjb3JhdGlvbnNPdmVydmlld1J1bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBTSxRQUFRO1FBMkJiLFlBQVksTUFBNEIsRUFBRSxLQUFrQjtZQUMzRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQy9CLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsa0NBQXlCLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUN2RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLEdBQUcsMENBQWlDLENBQUM7WUFFdkUsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRywyQ0FBa0MsQ0FBQztZQUNsRSxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLCtDQUF5QixDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRS9ELElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsaURBQXdDLENBQUM7WUFDdEUsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLDRDQUFzQixDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMs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