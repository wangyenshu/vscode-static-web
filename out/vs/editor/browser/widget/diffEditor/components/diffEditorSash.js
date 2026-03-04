/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/sash/sash", "vs/base/common/lifecycle", "vs/base/common/observable"], function (require, exports, sash_1, lifecycle_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorSash = void 0;
    class DiffEditorSash extends lifecycle_1.Disposable {
        constructor(_options, _domNode, _dimensions, _sashes) {
            super();
            this._options = _options;
            this._domNode = _domNode;
            this._dimensions = _dimensions;
            this._sashes = _sashes;
            this._sashRatio = (0, observable_1.observableValue)(this, undefined);
            this.sashLeft = (0, observable_1.derived)(this, reader => {
                const ratio = this._sashRatio.read(reader) ?? this._options.splitViewDefaultRatio.read(reader);
                return this._computeSashLeft(ratio, reader);
            });
            this._sash = this._register(new sash_1.Sash(this._domNode, {
                getVerticalSashTop: (_sash) => 0,
                getVerticalSashLeft: (_sash) => this.sashLeft.get(),
                getVerticalSashHeight: (_sash) => this._dimensions.height.get(),
            }, { orientation: 0 /* Orientation.VERTICAL */ }));
            this._startSashPosition = undefined;
            this._register(this._sash.onDidStart(() => {
                this._startSashPosition = this.sashLeft.get();
            }));
            this._register(this._sash.onDidChange((e) => {
                const contentWidth = this._dimensions.width.get();
                const sashPosition = this._computeSashLeft((this._startSashPosition + (e.currentX - e.startX)) / contentWidth, undefined);
                this._sashRatio.set(sashPosition / contentWidth, undefined);
            }));
            this._register(this._sash.onDidEnd(() => this._sash.layout()));
            this._register(this._sash.onDidReset(() => this._sashRatio.set(undefined, undefined)));
            this._register((0, observable_1.autorun)(reader => {
                const sashes = this._sashes.read(reader);
                if (sashes) {
                    this._sash.orthogonalEndSash = sashes.bottom;
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description DiffEditorSash.layoutSash */
                const enabled = this._options.enableSplitViewResizing.read(reader);
                this._sash.state = enabled ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
                this.sashLeft.read(reader);
                this._dimensions.height.read(reader);
                this._sash.layout();
            }));
        }
        /** @pure */
        _computeSashLeft(desiredRatio, reader) {
            const contentWidth = this._dimensions.width.read(reader);
            const midPoint = Math.floor(this._options.splitViewDefaultRatio.read(reader) * contentWidth);
            const sashLeft = this._options.enableSplitViewResizing.read(reader) ? Math.floor(desiredRatio * contentWidth) : midPoint;
            const MINIMUM_EDITOR_WIDTH = 100;
            if (contentWidth <= MINIMUM_EDITOR_WIDTH * 2) {
                return midPoint;
            }
            if (sashLeft < MINIMUM_EDITOR_WIDTH) {
                return MINIMUM_EDITOR_WIDTH;
            }
            if (sashLeft > contentWidth - MINIMUM_EDITOR_WIDTH) {
                return contentWidth - MINIMUM_EDITOR_WIDTH;
            }
            return sashLeft;
        }
    }
    exports.DiffEditorSash = DiffEditorSash;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclNhc2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2RpZmZFZGl0b3JTYXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLGNBQWUsU0FBUSxzQkFBVTtRQWdCN0MsWUFDa0IsUUFBMkIsRUFDM0IsUUFBcUIsRUFDckIsV0FBd0UsRUFDeEUsT0FBdUQ7WUFFeEUsS0FBSyxFQUFFLENBQUM7WUFMUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUE2RDtZQUN4RSxZQUFPLEdBQVAsT0FBTyxDQUFnRDtZQW5CeEQsZUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBcUIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRW5FLGFBQVEsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNqRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0YsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1lBRWMsVUFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxXQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDL0Qsa0JBQWtCLEVBQUUsQ0FBQyxLQUFXLEVBQVUsRUFBRSxDQUFDLENBQUM7Z0JBQzlDLG1CQUFtQixF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