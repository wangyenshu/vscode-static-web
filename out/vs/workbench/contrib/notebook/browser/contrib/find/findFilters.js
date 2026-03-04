/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindFilters = void 0;
    class NotebookFindFilters extends lifecycle_1.Disposable {
        get markupInput() {
            return this._markupInput;
        }
        set markupInput(value) {
            if (this._markupInput !== value) {
                this._markupInput = value;
                this._onDidChange.fire({ markupInput: value });
            }
        }
        get markupPreview() {
            return this._markupPreview;
        }
        set markupPreview(value) {
            if (this._markupPreview !== value) {
                this._markupPreview = value;
                this._onDidChange.fire({ markupPreview: value });
            }
        }
        get codeInput() {
            return this._codeInput;
        }
        set codeInput(value) {
            if (this._codeInput !== value) {
                this._codeInput = value;
                this._onDidChange.fire({ codeInput: value });
            }
        }
        get codeOutput() {
            return this._codeOutput;
        }
        set codeOutput(value) {
            if (this._codeOutput !== value) {
                this._codeOutput = value;
                this._onDidChange.fire({ codeOutput: value });
            }
        }
        constructor(markupInput, markupPreview, codeInput, codeOutput) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._markupInput = true;
            this._markupPreview = true;
            this._codeInput = true;
            this._codeOutput = true;
            this._markupInput = markupInput;
            this._markupPreview = markupPreview;
            this._codeInput = codeInput;
            this._codeOutput = codeOutput;
            this._initialMarkupInput = markupInput;
            this._initialMarkupPreview = markupPreview;
            this._initialCodeInput = codeInput;
            this._initialCodeOutput = codeOutput;
        }
        isModified() {
            return (this._markupInput !== this._initialMarkupInput
                || this._markupPreview !== this._initialMarkupPreview
                || this._codeInput !== this._initialCodeInput
                || this._codeOutput !== this._initialCodeOutput);
        }
        update(v) {
            this._markupInput = v.markupInput;
            this._markupPreview = v.markupPreview;
            this._codeInput = v.codeInput;
            this._codeOutput = v.codeOutput;
        }
    }
    exports.NotebookFindFilters = NotebookFindFilters;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZEZpbHRlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZmluZC9maW5kRmlsdGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxtQkFBb0IsU0FBUSxzQkFBVTtRQU1sRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksV0FBVyxDQUFDLEtBQWM7WUFDN0IsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztRQUlELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksYUFBYSxDQUFDLEtBQWM7WUFDL0IsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUdELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxTQUFTLENBQUMsS0FBYztZQUMzQixJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDRixDQUFDO1FBSUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxLQUFjO1lBQzVCLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFRRCxZQUNDLFdBQW9CLEVBQ3BCLGFBQXNCLEVBQ3RCLFNBQWtCLEVBQ2xCLFVBQW1CO1lBRW5CLEtBQUssRUFBRSxDQUFDO1lBbEVRLGlCQUFZLEdBQTZDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUNoSSxnQkFBVyxHQUEyQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUUvRSxpQkFBWSxHQUFZLElBQUksQ0FBQztZQWE3QixtQkFBYyxHQUFZLElBQUksQ0FBQztZQVkvQixlQUFVLEdBQVksSUFBSSxDQUFDO1lBYTNCLGdCQUFXLEdBQVksSUFBSSxDQUFDO1lBMkJuQyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUU5QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsV0FBVyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxhQUFhLENBQUM7WUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztZQUNuQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxDQUNOLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLG1CQUFtQjttQkFDM0MsSUFBSSxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUMscUJBQXFCO21CQUNsRCxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxpQkFBaUI7bUJBQzFDLElBQUksQ0FBQyxXQUFXLEtBQUssSUFBSSxDQUFDLGtCQUFrQixDQUMvQyxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFzQjtZQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFDbEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBL0ZELGtEQStGQyJ9