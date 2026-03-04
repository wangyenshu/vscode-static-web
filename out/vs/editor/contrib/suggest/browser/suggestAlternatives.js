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
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    var SuggestAlternatives_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestAlternatives = void 0;
    let SuggestAlternatives = class SuggestAlternatives {
        static { SuggestAlternatives_1 = this; }
        static { this.OtherSuggestions = new contextkey_1.RawContextKey('hasOtherSuggestions', false); }
        constructor(_editor, contextKeyService) {
            this._editor = _editor;
            this._index = 0;
            this._ckOtherSuggestions = SuggestAlternatives_1.OtherSuggestions.bindTo(contextKeyService);
        }
        dispose() {
            this.reset();
        }
        reset() {
            this._ckOtherSuggestions.reset();
            this._listener?.dispose();
            this._model = undefined;
            this._acceptNext = undefined;
            this._ignore = false;
        }
        set({ model, index }, acceptNext) {
            // no suggestions -> nothing to do
            if (model.items.length === 0) {
                this.reset();
                return;
            }
            // no alternative suggestions -> nothing to do
            const nextIndex = SuggestAlternatives_1._moveIndex(true, model, index);
            if (nextIndex === index) {
                this.reset();
                return;
            }
            this._acceptNext = acceptNext;
            this._model = model;
            this._index = index;
            this._listener = this._editor.onDidChangeCursorPosition(() => {
                if (!this._ignore) {
                    this.reset();
                }
            });
            this._ckOtherSuggestions.set(true);
        }
        static _moveIndex(fwd, model, index) {
            let newIndex = index;
            for (let rounds = model.items.length; rounds > 0; rounds--) {
                newIndex = (newIndex + model.items.length + (fwd ? +1 : -1)) % model.items.length;
                if (newIndex === index) {
                    break;
                }
                if (!model.items[newIndex].completion.additionalTextEdits) {
                    break;
                }
            }
            return newIndex;
        }
        next() {
            this._move(true);
        }
        prev() {
            this._move(false);
        }
        _move(fwd) {
            if (!this._model) {
                // nothing to reason about
                return;
            }
            try {
                this._ignore = true;
                this._index = SuggestAlternatives_1._moveIndex(fwd, this._model, this._index);
                this._acceptNext({ index: this._index, item: this._model.items[this._index], model: this._model });
            }
            finally {
                this._ignore = false;
            }
        }
    };
    exports.SuggestAlternatives = SuggestAlternatives;
    exports.SuggestAlternatives = SuggestAlternatives = SuggestAlternatives_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SuggestAlternatives);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdEFsdGVybmF0aXZlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0QWx0ZXJuYXRpdmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7O2lCQUVmLHFCQUFnQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQUFBM0QsQ0FBNEQ7UUFVNUYsWUFDa0IsT0FBb0IsRUFDakIsaUJBQXFDO1lBRHhDLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFQOUIsV0FBTSxHQUFXLENBQUMsQ0FBQztZQVUxQixJQUFJLENBQUMsbUJBQW1CLEdBQUcscUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUF1QixFQUFFLFVBQWtEO1lBRTVGLGtDQUFrQztZQUNsQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxD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