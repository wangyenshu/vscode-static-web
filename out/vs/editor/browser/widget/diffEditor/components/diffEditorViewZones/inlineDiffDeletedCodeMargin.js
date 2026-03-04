/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/themables", "vs/nls"], function (require, exports, dom_1, actions_1, codicons_1, lifecycle_1, platform_1, themables_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineDiffDeletedCodeMargin = void 0;
    class InlineDiffDeletedCodeMargin extends lifecycle_1.Disposable {
        get visibility() {
            return this._visibility;
        }
        set visibility(_visibility) {
            if (this._visibility !== _visibility) {
                this._visibility = _visibility;
                this._diffActions.style.visibility = _visibility ? 'visible' : 'hidden';
            }
        }
        constructor(_getViewZoneId, _marginDomNode, _modifiedEditor, _diff, _editor, _viewLineCounts, _originalTextModel, _contextMenuService, _clipboardService) {
            super();
            this._getViewZoneId = _getViewZoneId;
            this._marginDomNode = _marginDomNode;
            this._modifiedEditor = _modifiedEditor;
            this._diff = _diff;
            this._editor = _editor;
            this._viewLineCounts = _viewLineCounts;
            this._originalTextModel = _originalTextModel;
            this._contextMenuService = _contextMenuService;
            this._clipboardService = _clipboardService;
            this._visibility = false;
            // make sure the diff margin shows above overlay.
            this._marginDomNode.style.zIndex = '10';
            this._diffActions = document.createElement('div');
            this._diffActions.className = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.lightBulb) + ' lightbulb-glyph';
            this._diffActions.style.position = 'absolute';
            const lineHeight = this._modifiedEditor.getOption(67 /* EditorOption.lineHeight */);
            this._diffActions.style.right = '0px';
            this._diffActions.style.visibility = 'hidden';
            this._diffActions.style.height = `${lineHeight}px`;
            this._diffActions.style.lineHeight = `${lineHeight}px`;
            this._marginDomNode.appendChild(this._diffActions);
            let currentLineNumberOffset = 0;
            const useShadowDOM = _modifiedEditor.getOption(127 /* EditorOption.useShadowDOM */) && !platform_1.isIOS; // Do not use shadow dom on IOS #122035
            const showContextMenu = (x, y) => {
                this._contextMenuService.showContextMenu({
                    domForShadowRoot: useShadowDOM ? _modifiedEditor.getDomNode() ?? undefined : undefined,
                    getAnchor: () => ({ x, y }),
                    getActions: () => {
                        const actions = [];
                        const isDeletion = _diff.modified.isEmpty;
                        // default action
                        actions.push(new actions_1.Action('diff.clipboard.copyDeletedContent', isDeletion
                            ? (_diff.original.length > 1
                                ? (0, nls_1.localize)('diff.clipboard.copyDeletedLinesContent.label', "Copy deleted lines")
                                : (0, nls_1.localize)('diff.clipboard.copyDeletedLinesContent.single.label', "Copy deleted line"))
                            : (_diff.original.length > 1
                                ? (0, nls_1.localize)('diff.clipboard.copyChangedLinesContent.label', "Copy changed lines")
                                : (0, nls_1.localize)('diff.clipboard.copyChangedLinesContent.single.label', "Copy changed line")), undefined, true, async () => {
                            const originalText = this._originalTextModel.getValueInRange(_diff.original.toExclusiveRange());
                            await this._clipboardService.writeText(originalText);
                        }));
                        if (_diff.original.length > 1) {
                            actions.push(new actions_1.Action('diff.clipboard.copyDeletedLineContent', isDeletion
                                ? (0, nls_1.localize)('diff.clipboard.copyDeletedLineContent.label', "Copy deleted line ({0})", _diff.original.startLineNumber + currentLineNumberOffset)
                                : (0, nls_1.localize)('diff.clipboard.copyChangedLineContent.label', "Copy changed line ({0})", _diff.original.startLineNumber + currentLineNumberOffset), undefined, true, async () => {
                                let lineContent = this._originalTextModel.getLineContent(_diff.original.startLineNumber + currentLineNumberOffset);
                                if (lineContent === '') {
                                    // empty line -> new line
                                    const eof = this._originalTextModel.getEndOfLineSequence();
                                    lineContent = eof === 0 /* EndOfLineSequence.LF */ ? '\n' : '\r\n';
                                }
                                await this._clipboardService.writeText(lineContent);
                            }));
                        }
                        const readOnly = _modifiedEditor.getOption(91 /* EditorOption.readOnly */);
                        if (!readOnly) {
                            actions.push(new actions_1.Action('diff.inline.revertChange', (0, nls_1.localize)('diff.inline.revertChange.label', "Revert this change"), undefined, true, async () => {
                                this._editor.revert(this._diff);
                            }));
                        }
                        return actions;
                    },
                    autoSelectFirstItem: true
                });
            };
            this._register((0, dom_1.addStandardDisposableListener)(this._diffActions, 'mousedown', e => {
                if (!e.leftButton) {
                    return;
                }
                const { top, height } = (0, dom_1.getDomNodePagePosition)(this._diffActions);
                const pad = Math.floor(lineHeight / 3);
                e.preventDefault();
                showContextMenu(e.posx, top + height + pad);
            }));
            this._register(_modifiedEditor.onMouseMove((e) => {
                if ((e.target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || e.target.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) && e.target.detail.viewZoneId === this._getViewZoneId()) {
                    currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                    this.visibility = true;
                }
                else {
                    this.visibility = false;
                }
            }));
            this._register(_modifiedEditor.onMouseDown((e) => {
                if (!e.event.leftButton) {
                    return;
                }
                if (e.target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || e.target.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                    const viewZoneId = e.target.detail.viewZoneId;
                    if (viewZoneId === this._getViewZoneId()) {
                        e.event.preventDefault();
                        currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                        showContextMenu(e.event.posx, e.event.posy + lineHeight);
                    }
                }
            }));
        }
        _updateLightBulbPosition(marginDomNode, y, lineHeight) {
            const { top } = (0, dom_1.getDomNodePagePosition)(marginDomNode);
            const offset = y - top;
            const lineNumberOffset = Math.floor(offset / lineHeight);
            const newTop = lineNumberOffset * lineHeight;
            this._diffActions.style.top = `${newTop}px`;
            if (this._viewLineCounts) {
                let acc = 0;
                for (let i = 0; i < this._viewLineCounts.length; i++) {
                    acc += this._viewLineCounts[i];
                    if (lineNumberOffset < acc) {
                        return i;
                    }
                }
            }
            return lineNumberOffset;
        }
    }
    exports.InlineDiffDeletedCodeMargin = InlineDiffDeletedCodeMargin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRGlmZkRlbGV0ZWRDb2RlTWFyZ2luLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvY29tcG9uZW50cy9kaWZmRWRpdG9yVmlld1pvbmVzL2lubGluZURpZmZEZWxldGVkQ29kZU1hcmdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEsMkJBQTRCLFNBQVEsc0JBQVU7UUFLMUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxXQUFvQjtZQUNsQyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO2dCQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUN6RSxDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQ2tCLGNBQTRCLEVBQzVCLGNBQTJCLEVBQzNCLGVBQWlDLEVBQ2pDLEtBQStCLEVBQy9CLE9BQXlCLEVBQ3pCLGVBQXlCLEVBQ3pCLGtCQUE4QixFQUM5QixtQkFBd0MsRUFDeEMsaUJBQW9DO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBVlMsbUJBQWMsR0FBZCxjQUFjLENBQWM7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQWE7WUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2pDLFVBQUssR0FBTCxLQUFLLENBQTBCO1lBQy9CLFlBQU8sR0FBUCxPQUFPLENBQWtCO1lBQ3pCLG9CQUFlLEdBQWYsZUFBZSxDQUFVO1lBQ3pC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