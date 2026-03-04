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
    var WordContextKey_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordContextKey = void 0;
    let WordContextKey = class WordContextKey {
        static { WordContextKey_1 = this; }
        static { this.AtEnd = new contextkey_1.RawContextKey('atEndOfWord', false); }
        constructor(_editor, contextKeyService) {
            this._editor = _editor;
            this._enabled = false;
            this._ckAtEnd = WordContextKey_1.AtEnd.bindTo(contextKeyService);
            this._configListener = this._editor.onDidChangeConfiguration(e => e.hasChanged(123 /* EditorOption.tabCompletion */) && this._update());
            this._update();
        }
        dispose() {
            this._configListener.dispose();
            this._selectionListener?.dispose();
            this._ckAtEnd.reset();
        }
        _update() {
            // only update this when tab completions are enabled
            const enabled = this._editor.getOption(123 /* EditorOption.tabCompletion */) === 'on';
            if (this._enabled === enabled) {
                return;
            }
            this._enabled = enabled;
            if (this._enabled) {
                const checkForWordEnd = () => {
                    if (!this._editor.hasModel()) {
                        this._ckAtEnd.set(false);
                        return;
                    }
                    const model = this._editor.getModel();
                    const selection = this._editor.getSelection();
                    const word = model.getWordAtPosition(selection.getStartPosition());
                    if (!word) {
                        this._ckAtEnd.set(false);
                        return;
                    }
                    this._ckAtEnd.set(word.endColumn === selection.getStartPosition().column);
                };
                this._selectionListener = this._editor.onDidChangeCursorSelection(checkForWordEnd);
                checkForWordEnd();
            }
            else if (this._selectionListener) {
                this._ckAtEnd.reset();
                this._selectionListener.dispose();
                this._selectionListener = undefined;
            }
        }
    };
    exports.WordContextKey = WordContextKey;
    exports.WordContextKey = WordContextKey = WordContextKey_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], WordContextKey);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZENvbnRleHRLZXkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvd29yZENvbnRleHRLZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFjOztpQkFFVixVQUFLLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGFBQWEsRUFBRSxLQUFLLENBQUMsQUFBbkQsQ0FBb0Q7UUFRekUsWUFDa0IsT0FBb0IsRUFDakIsaUJBQXFDO1lBRHhDLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFKOUIsYUFBUSxHQUFZLEtBQUssQ0FBQztZQVFqQyxJQUFJLENBQUMsUUFBUSxHQUFHLGdCQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLHNDQUE0QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzlILElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVPLE9BQU87WUFDZCxvREFBb0Q7WUFDcEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLHNDQUE0QixLQUFLLElBQUksQ0FBQztZQUM1RSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFFeEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRTtvQkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3pCLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUM5QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztvQkFDbkUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNYLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUN6QixPQUFPO29CQUNSLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0UsQ0FBQyxDQUFDO2dCQUNGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuRixlQUFlLEVBQUUsQ0FBQztZQUVuQixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQzs7SUF6RFcsd0NBQWM7NkJBQWQsY0FBYztRQVl4QixXQUFBLCtCQUFrQixDQUFBO09BWlIsY0FBYyxDQTBEMUIifQ==