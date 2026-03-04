/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastDomNode = void 0;
    exports.createFastDomNode = createFastDomNode;
    class FastDomNode {
        constructor(domNode) {
            this.domNode = domNode;
            this._maxWidth = '';
            this._width = '';
            this._height = '';
            this._top = '';
            this._left = '';
            this._bottom = '';
            this._right = '';
            this._paddingTop = '';
            this._paddingLeft = '';
            this._paddingBottom = '';
            this._paddingRight = '';
            this._fontFamily = '';
            this._fontWeight = '';
            this._fontSize = '';
            this._fontStyle = '';
            this._fontFeatureSettings = '';
            this._fontVariationSettings = '';
            this._textDecoration = '';
            this._lineHeight = '';
            this._letterSpacing = '';
            this._className = '';
            this._display = '';
            this._position = '';
            this._visibility = '';
            this._color = '';
            this._backgroundColor = '';
            this._layerHint = false;
            this._contain = 'none';
            this._boxShadow = '';
        }
        setMaxWidth(_maxWidth) {
            const maxWidth = numberAsPixels(_maxWidth);
            if (this._maxWidth === maxWidth) {
                return;
            }
            this._maxWidth = maxWidth;
            this.domNode.style.maxWidth = this._maxWidth;
        }
        setWidth(_width) {
            const width = numberAsPixels(_width);
            if (this._width === width) {
                return;
            }
            this._width = width;
            this.domNode.style.width = this._width;
        }
        setHeight(_height) {
            const height = numberAsPixels(_height);
            if (this._height === height) {
                return;
            }
            this._height = height;
            this.domNode.style.height = this._height;
        }
        setTop(_top) {
            const top = numberAsPixels(_top);
            if (this._top === top) {
                return;
            }
            this._top = top;
            this.domNode.style.top = this._top;
        }
        setLeft(_left) {
            const left = numberAsPixels(_left);
            if (this._left === left) {
                return;
            }
            this._left = left;
            this.domNode.style.left = this._left;
        }
        setBottom(_bottom) {
            const bottom = numberAsPixels(_bottom);
            if (this._bottom === bottom) {
                return;
            }
            this._bottom = bottom;
            this.domNode.style.bottom = this._bottom;
        }
        setRight(_right) {
            const right = numberAsPixels(_right);
            if (this._right === right) {
                return;
            }
            this._right = right;
            this.domNode.style.right = this._right;
        }
        setPaddingTop(_paddingTop) {
            const paddingTop = numberAsPixels(_paddingTop);
            if (this._paddingTop === paddingTop) {
                return;
            }
            this._paddingTop = paddingTop;
            this.domNode.style.paddingTop = this._paddingTop;
        }
        setPaddingLeft(_paddingLeft) {
            const paddingLeft = numberAsPixels(_paddingLeft);
            if (this._paddingLeft === paddingLeft) {
                return;
            }
            this._paddingLeft = paddingLeft;
            this.domNode.style.paddingLeft = this._paddingLeft;
        }
        setPaddingBottom(_paddingBottom) {
            const paddingBottom = numberAsPixels(_paddingBottom);
            if (this._paddingBottom === paddingBottom) {
                return;
            }
            this._paddingBottom = paddingBottom;
            this.domNode.style.paddingBottom = this._paddingBottom;
        }
        setPaddingRight(_paddingRight) {
            const paddingRight = numberAsPixels(_paddingRight);
            if (this._paddingRight === paddingRight) {
                return;
            }
            this._paddingRight = paddingRight;
            this.domNode.style.paddingRight = this._paddingRight;
        }
        setFontFamily(fontFamily) {
            if (this._fontFamily === fontFamily) {
                return;
            }
            this._fontFamily = fontFamily;
            this.domNode.style.fontFamily = this._fontFamily;
        }
        setFontWeight(fontWeight) {
            if (this._fontWeight === fontWeight) {
                return;
            }
            this._fontWeight = fontWeight;
            this.domNode.style.fontWeight = this._fontWeight;
        }
        setFontSize(_fontSize) {
            const fontSize = numberAsPixels(_fontSize);
            if (this._fontSize === fontSize) {
                return;
            }
            this._fontSize = fontSize;
            this.domNode.style.fontSize = this._fontSize;
        }
        setFontStyle(fontStyle) {
            if (this._fontStyle === fontStyle) {
                return;
            }
            this._fontStyle = fontStyle;
            this.domNode.style.fontStyle = this._fontStyle;
        }
        setFontFeatureSettings(fontFeatureSettings) {
            if (this._fontFeatureSettings === fontFeatureSettings) {
                return;
            }
            this._fontFeatureSettings = fontFeatureSettings;
            this.domNode.style.fontFeatureSettings = this._fontFeatureSettings;
        }
        setFontVariationSettings(fontVariationSettings) {
            if (this._fontVariationSettings === fontVariationSettings) {
                return;
            }
            this._fontVariationSettings = fontVariationSettings;
            this.domNode.style.fontVariationSettings = this._fontVariationSettings;
        }
        setTextDecoration(textDecoration) {
            if (this._textDecoration === textDecoration) {
                return;
            }
            this._textDecoration = textDecoration;
            this.domNode.style.textDecoration = this._textDecoration;
        }
        setLineHeight(_lineHeight) {
            const lineHeight = numberAsPixels(_lineHeight);
            if (this._lineHeight === lineHeight) {
                return;
            }
            this._lineHeight = lineHeight;
            this.domNode.style.lineHeight = this._lineHeight;
        }
        setLetterSpacing(_letterSpacing) {
            const letterSpacing = numberAsPixels(_letterSpacing);
            if (this._letterSpacing === letterSpacing) {
                return;
            }
            this._letterSpacing = letterSpacing;
            this.domNode.style.letterSpacing = this._letterSpacing;
        }
        setClassName(className) {
            if (this._className === className) {
                return;
            }
            this._className = className;
            this.domNode.className = this._className;
        }
        toggleClassName(className, shouldHaveIt) {
            this.domNode.classList.toggle(className, shouldHaveIt);
            this._className = this.domNode.className;
        }
        setDisplay(display) {
            if (this._display === display) {
                return;
            }
            this._display = display;
            this.domNode.style.display = this._display;
        }
        setPosition(position) {
            if (this._position === position) {
                return;
            }
            this._position = position;
            this.domNode.style.position = this._position;
        }
        setVisibility(visibility) {
            if (this._visibility === visibility) {
                return;
            }
            this._visibility = visibility;
            this.domNode.style.visibility = this._visibility;
        }
        setColor(color) {
            if (this._color === color) {
                return;
            }
            this._color = color;
            this.domNode.style.color = this._color;
        }
        setBackgroundColor(backgroundColor) {
            if (this._backgroundColor === backgroundColor) {
                return;
            }
            this._backgroundColor = backgroundColor;
            this.domNode.style.backgroundColor = this._backgroundColor;
        }
        setLayerHinting(layerHint) {
            if (this._layerHint === layerHint) {
                return;
            }
            this._layerHint = layerHint;
            this.domNode.style.transform = this._layerHint ? 'translate3d(0px, 0px, 0px)' : '';
        }
        setBoxShadow(boxShadow) {
            if (this._boxShadow === boxShadow) {
                return;
            }
            this._boxShadow = boxShadow;
            this.domNode.style.boxShadow = boxShadow;
        }
        setContain(contain) {
            if (this._contain === contain) {
                return;
            }
            this._contain = contain;
            this.domNode.style.contain = this._contain;
        }
        setAttribute(name, value) {
            this.domNode.setAttribute(name, value);
        }
        removeAttribute(name) {
            this.domNode.removeAttribute(name);
        }
        appendChild(child) {
            this.domNode.appendChild(child.domNode);
        }
        removeChild(child) {
            this.domNode.removeChild(child.domNode);
        }
    }
    exports.FastDomNode = FastDomNode;
    function numberAsPixels(value) {
        return (typeof value === 'number' ? `${value}px` : value);
    }
    function createFastDomNode(domNode) {
        return new FastDomNode(domNode);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFzdERvbU5vZGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZmFzdERvbU5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc1RoRyw4Q0FFQztJQXRURCxNQUFhLFdBQVc7UUFnQ3ZCLFlBQ2lCLE9BQVU7WUFBVixZQUFPLEdBQVAsT0FBTyxDQUFHO1lBL0JuQixjQUFTLEdBQVcsRUFBRSxDQUFDO1lBQ3ZCLFdBQU0sR0FBVyxFQUFFLENBQUM7WUFDcEIsWUFBTyxHQUFXLEVBQUUsQ0FBQztZQUNyQixTQUFJLEdBQVcsRUFBRSxDQUFDO1lBQ2xCLFVBQUssR0FBVyxFQUFFLENBQUM7WUFDbkIsWUFBTyxHQUFXLEVBQUUsQ0FBQztZQUNyQixXQUFNLEdBQVcsRUFBRSxDQUFDO1lBQ3BCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1lBQ3pCLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1lBQzFCLG1CQUFjLEdBQVcsRUFBRSxDQUFDO1lBQzVCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1lBQzNCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1lBQ3pCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1lBQ3pCLGNBQVMsR0FBVyxFQUFFLENBQUM7WUFDdkIsZUFBVSxHQUFXLEVBQUUsQ0FBQztZQUN4Qix5QkFBb0IsR0FBVyxFQUFFLENBQUM7WUFDbEMsMkJBQXNCLEdBQVcsRUFBRSxDQUFDO1lBQ3BDLG9CQUFlLEdBQVcsRUFBRSxDQUFDO1lBQzdCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1lBQ3pCLG1CQUFjLEdBQVcsRUFBRSxDQUFDO1lBQzVCLGVBQVUsR0FBVyxFQUFFLENBQUM7WUFDeEIsYUFBUSxHQUFXLEVBQUUsQ0FBQztZQUN0QixjQUFTLEdBQVcsRUFBRSxDQUFDO1lBQ3ZCLGdCQUFXLEdBQVcs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