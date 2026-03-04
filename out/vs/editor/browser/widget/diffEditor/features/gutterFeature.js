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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/browser/widget/diffEditor/utils/editorGutter", "vs/editor/browser/widget/multiDiffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/core/range", "vs/editor/common/core/textEdit", "vs/editor/common/diff/rangeMapping", "vs/editor/common/model/textModelText", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom_1, lifecycle_1, observable_1, utils_1, editorGutter_1, utils_2, lineRange_1, offsetRange_1, range_1, textEdit_1, rangeMapping_1, textModelText_1, toolbar_1, actions_1, contextkey_1, hover_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorGutter = void 0;
    const emptyArr = [];
    const width = 35;
    let DiffEditorGutter = class DiffEditorGutter extends lifecycle_1.Disposable {
        constructor(diffEditorRoot, _diffModel, _editors, _instantiationService, _contextKeyService, _menuService) {
            super();
            this._diffModel = _diffModel;
            this._editors = _editors;
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this._menu = this._register(this._menuService.createMenu(actions_1.MenuId.DiffEditorHunkToolbar, this._contextKeyService));
            this._actions = (0, observable_1.observableFromEvent)(this._menu.onDidChange, () => this._menu.getActions());
            this._hasActions = this._actions.map(a => a.length > 0);
            this.width = (0, observable_1.derived)(this, reader => this._hasActions.read(reader) ? width : 0);
            this.elements = (0, dom_1.h)('div.gutter@gutter', { style: { position: 'absolute', height: '100%', width: width + 'px' } }, []);
            this._currentDiff = (0, observable_1.derived)(this, (reader) => {
                const model = this._diffModel.read(reader);
                if (!model) {
                    return undefined;
                }
                const mappings = model.diff.read(reader)?.mappings;
                const cursorPosition = this._editors.modifiedCursor.read(reader);
                if (!cursorPosition) {
                    return undefined;
                }
                return mappings?.find(m => m.lineRangeMapping.modified.contains(cursorPosition.lineNumber));
            });
            this._selectedDiffs = (0, observable_1.derived)(this, (reader) => {
                /** @description selectedDiffs */
                const model = this._diffModel.read(reader);
                const diff = model?.diff.read(reader);
                // Return `emptyArr` because it is a constant. [] is always a new array and would trigger a change.
                if (!diff) {
                    return emptyArr;
                }
                const selections = this._editors.modifiedSelections.read(reader);
                if (selections.every(s => s.isEmpty())) {
                    return emptyArr;
                }
                const selectedLineNumbers = new lineRange_1.LineRangeSet(selections.map(s => lineRange_1.LineRange.fromRangeInclusive(s)));
                const selectedMappings = diff.mappings.filter(m => m.lineRangeMapping.innerChanges && selectedLineNumbers.intersects(m.lineRangeMapping.modified));
                const result = selectedMappings.map(mapping => ({
                    mapping,
                    rangeMappings: mapping.lineRangeMapping.innerChanges.filter(c => selections.some(s => range_1.Range.areIntersecting(c.modifiedRange, s)))
                }));
                if (result.length === 0 || result.every(r => r.rangeMappings.length === 0)) {
                    return emptyArr;
                }
                return result;
            });
            this._register((0, utils_1.prependRemoveOnDispose)(diffEditorRoot, this.elements.root));
            this._register((0, dom_1.addDisposableListener)(this.elements.root, 'click', () => {
                this._editors.modified.focus();
            }));
            this._register((0, utils_1.applyStyle)(this.elements.root, { display: this._hasActions.map(a => a ? 'block' : 'none') }));
            this._register(new editorGutter_1.EditorGutter(this._editors.modified, this.elements.root, {
                getIntersectingGutterItems: (range, reader) => {
                    const model = this._diffModel.read(reader);
                    if (!model) {
                        return [];
                    }
                    const diffs = model.diff.read(reader);
                    if (!diffs) {
                        return [];
                    }
                    const selection = this._selectedDiffs.read(reader);
                    if (selection.length > 0) {
                        const m = rangeMapping_1.DetailedLineRangeMapping.fromRangeMappings(selection.flatMap(s => s.rangeMappings));
                        return [
                            new DiffGutterItem(m, true, actions_1.MenuId.DiffEditorSelectionToolbar, undefined, model.model.original.uri, model.model.modified.uri)
                        ];
                    }
                    const currentDiff = this._currentDiff.read(reader);
                    return diffs.mappings.map(m => new DiffGutterItem(m.lineRangeMapping.withInnerChangesFromLineRanges(), m.lineRangeMapping === currentDiff?.lineRangeMapping, actions_1.MenuId.DiffEditorHunkToolbar, undefined, model.model.original.uri, model.model.modified.uri));
                },
                createView: (item, target) => {
                    return this._instantiationService.createInstance(DiffToolBar, item, target, this);
                },
            }));
            this._register((0, dom_1.addDisposableListener)(this.elements.gutter, dom_1.EventType.MOUSE_WHEEL, (e) => {
                if (this._editors.modified.getOption(103 /* EditorOption.scrollbar */).handleMouseWheel) {
                    this._editors.modified.delegateScrollFromMouseWheelEvent(e);
                }
            }, { passive: false }));
        }
        computeStagedValue(mapping) {
            const c = mapping.innerChanges ?? [];
            const modified = new textModelText_1.TextModelText(this._editors.modifiedModel.get());
            const original = new textModelText_1.TextModelText(this._editors.original.getModel());
            const edit = new textEdit_1.TextEdit(c.map(c => c.toTextEdit(modified)));
            const value = edit.apply(original);
            return value;
        }
        layout(left) {
            this.elements.gutter.style.left = left + 'px';
        }
    };
    exports.DiffEditorGutter = DiffEditorGutter;
    exports.DiffEditorGutter = DiffEditorGutter = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_1.IMenuService)
    ], DiffEditorGutter);
    class DiffGutterItem {
        constructor(mapping, showAlways, menuId, rangeOverride, originalUri, modifiedUri) {
            this.mapping = mapping;
            this.showAlways = showAlways;
            this.menuId = menuId;
            this.rangeOverride = rangeOverride;
            this.originalUri = originalUri;
            this.modifiedUri = modifiedUri;
        }
        get id() { return this.mapping.modified.toString(); }
        get range() { return this.rangeOverride ?? this.mapping.modified; }
    }
    let DiffToolBar = class DiffToolBar extends lifecycle_1.Disposable {
        constructor(_item, target, gutter, instantiationService) {
            super();
            this._item = _item;
            this._elements = (0, dom_1.h)('div.gutterItem', { style: { height: '20px', width: '34px' } }, [
                (0, dom_1.h)('div.background@background', {}, []),
                (0, dom_1.h)('div.buttons@buttons', {}, []),
            ]);
            this._showAlways = this._item.map(this, item => item.showAlways);
            this._menuId = this._item.map(this, item => item.menuId);
            this._isSmall = (0, observable_1.observableValue)(this, false);
            this._lastItemRange = undefined;
            this._lastViewRange = undefined;
            const hoverDelegate = this._register(instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'element', true, { position: { hoverPosition: 1 /* HoverPosition.RIGHT */ } }));
            this._register((0, utils_1.appendRemoveOnDispose)(target, this._elements.root));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update showAlways */
                const showAlways = this._showAlways.read(reader);
                this._elements.root.classList.toggle('noTransition', true);
                this._elements.root.classList.toggle('showAlways', showAlways);
                setTimeout(() => {
                    this._elements.root.classList.toggle('noTransition', false);
                }, 0);
            }));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                this._elements.buttons.replaceChildren();
                const i = store.add(instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this._elements.buttons, this._menuId.read(reader), {
                    orientation: 1 /* ActionsOrientation.VERTICAL */,
                    hoverDelegate,
                    toolbarOptions: {
                        primaryGroup: g => g.startsWith('primary'),
                    },
                    overflowBehavior: { maxItems: this._isSmall.read(reader) ? 1 : 3 },
                    hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                    actionRunner: new utils_2.ActionRunnerWithContext(() => {
                        const item = this._item.get();
                        const mapping = item.mapping;
                        return {
                            mapping,
                            originalWithModifiedChanges: gutter.computeStagedValue(mapping),
                            originalUri: item.originalUri,
                            modifiedUri: item.modifiedUri,
                        };
                    }),
                    menuOptions: {
                        shouldForwardArgs: true,
                    },
                }));
                store.add(i.onDidChangeMenuItems(() => {
                    if (this._lastItemRange) {
                        this.layout(this._lastItemRange, this._lastViewRange);
                    }
                }));
            }));
        }
        layout(itemRange, viewRange) {
            this._lastItemRange = itemRange;
            this._lastViewRange = viewRange;
            let itemHeight = this._elements.buttons.clientHeight;
            this._isSmall.set(this._item.get().mapping.original.startLineNumber === 1 && itemRange.length < 30, undefined);
            // Item might have changed
            itemHeight = this._elements.buttons.clientHeight;
            this._elements.root.style.top = itemRange.start + 'px';
            this._elements.root.style.height = itemRange.length + 'px';
            const middleHeight = itemRange.length / 2 - itemHeight / 2;
            const margin = itemHeight;
            let effectiveCheckboxTop = itemRange.start + middleHeight;
            const preferredViewPortRange = offsetRange_1.OffsetRange.tryCreate(margin, viewRange.endExclusive - margin - itemHeight);
            const preferredParentRange = offsetRange_1.OffsetRange.tryCreate(itemRange.start + margin, itemRange.endExclusive - itemHeight - margin);
            if (preferredParentRange && preferredViewPortRange && preferredParentRange.start < preferredParentRange.endExclusive) {
                effectiveCheckboxTop = preferredViewPortRange.clip(effectiveCheckboxTop);
                effectiveCheckboxTop = preferredParentRange.clip(effectiveCheckboxTop);
            }
            this._elements.buttons.style.top = `${effectiveCheckboxTop - itemRange.start}px`;
        }
    };
    DiffToolBar = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], DiffToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3V0dGVyRmVhdHVyZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2ZlYXR1cmVzL2d1dHRlckZlYXR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJoRyxNQUFNLFFBQVEsR0FBWSxFQUFFLENBQUM7SUFDN0IsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBRVYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQVMvQyxZQUNDLGNBQThCLEVBQ2IsVUFBd0QsRUFDeEQsUUFBMkIsRUFDckIscUJBQTZELEVBQ2hFLGtCQUF1RCxFQUM3RCxZQUEyQztZQUV6RCxLQUFLLEVBQUUsQ0FBQztZQU5TLGVBQVUsR0FBVixVQUFVLENBQThDO1lBQ3hELGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQ0osMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzVDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBZHpDLFVBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLGdCQUFNLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUM1RyxhQUFRLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDdEYsZ0JBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENB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