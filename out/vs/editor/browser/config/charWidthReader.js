/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/config/domFontInfo"], function (require, exports, domFontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharWidthRequest = exports.CharWidthRequestType = void 0;
    exports.readCharWidths = readCharWidths;
    var CharWidthRequestType;
    (function (CharWidthRequestType) {
        CharWidthRequestType[CharWidthRequestType["Regular"] = 0] = "Regular";
        CharWidthRequestType[CharWidthRequestType["Italic"] = 1] = "Italic";
        CharWidthRequestType[CharWidthRequestType["Bold"] = 2] = "Bold";
    })(CharWidthRequestType || (exports.CharWidthRequestType = CharWidthRequestType = {}));
    class CharWidthRequest {
        constructor(chr, type) {
            this.chr = chr;
            this.type = type;
            this.width = 0;
        }
        fulfill(width) {
            this.width = width;
        }
    }
    exports.CharWidthRequest = CharWidthRequest;
    class DomCharWidthReader {
        constructor(bareFontInfo, requests) {
            this._bareFontInfo = bareFontInfo;
            this._requests = requests;
            this._container = null;
            this._testElements = null;
        }
        read(targetWindow) {
            // Create a test container with all these test elements
            this._createDomElements();
            // Add the container to the DOM
            targetWindow.document.body.appendChild(this._container);
            // Read character widths
            this._readFromDomElements();
            // Remove the container from the DOM
            targetWindow.document.body.removeChild(this._container);
            this._container = null;
            this._testElements = null;
        }
        _createDomElements() {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '-50000px';
            container.style.width = '50000px';
            const regularDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(regularDomNode, this._bareFontInfo);
            container.appendChild(regularDomNode);
            const boldDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(boldDomNode, this._bareFontInfo);
            boldDomNode.style.fontWeight = 'bold';
            container.appendChild(boldDomNode);
            const italicDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(italicDomNode, this._bareFontInfo);
            italicDomNode.style.fontStyle = 'italic';
            container.appendChild(italicDomNode);
            const testElements = [];
            for (const request of this._requests) {
                let parent;
                if (request.type === 0 /* CharWidthRequestType.Regular */) {
                    parent = regularDomNode;
                }
                if (request.type === 2 /* CharWidthRequestType.Bold */) {
                    parent = boldDomNode;
                }
                if (request.type === 1 /* CharWidthRequestType.Italic */) {
                    parent = italicDomNode;
                }
                parent.appendChild(document.createElement('br'));
                const testElement = document.createElement('span');
                DomCharWidthReader._render(testElement, request);
                parent.appendChild(testElement);
                testElements.push(testElement);
            }
            this._container = container;
            this._testElements = testElements;
        }
        static _render(testElement, request) {
            if (request.chr === ' ') {
                let htmlString = '\u00a0';
                // Repeat character 256 (2^8) times
                for (let i = 0; i < 8; i++) {
                    htmlString += htmlString;
                }
                testElement.innerText = htmlString;
            }
            else {
                let testString = request.chr;
                // Repeat character 256 (2^8) times
                for (let i = 0; i < 8; i++) {
                    testString += testString;
                }
                testElement.textContent = testString;
            }
        }
        _readFromDomElements() {
            for (let i = 0, len = this._requests.length; i < len; i++) {
                const request = this._requests[i];
                const testElement = this._testElements[i];
                request.fulfill(testElement.offsetWidth / 256);
            }
        }
    }
    function readCharWidths(targetWindow, bareFontInfo, requests) {
        const reader = new DomCharWidthReader(bareFontInfo, requests);
        reader.read(targetWindow);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcldpZHRoUmVhZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29uZmlnL2NoYXJXaWR0aFJlYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3SWhHLHdDQUdDO0lBdElELElBQWtCLG9CQUlqQjtJQUpELFdBQWtCLG9CQUFvQjtRQUNyQyxxRUFBVyxDQUFBO1FBQ1gsbUVBQVUsQ0FBQTtRQUNWLCtEQUFRLENBQUE7SUFDVCxDQUFDLEVBSmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSXJDO0lBRUQsTUFBYSxnQkFBZ0I7UUFNNUIsWUFBWSxHQUFXLEVBQUUsSUFBMEI7WUFDbEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNoQixDQUFDO1FBRU0sT0FBTyxDQUFDLEtBQWE7WUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBZkQsNENBZUM7SUFFRCxNQUFNLGtCQUFrQjtRQVF2QixZQUFZLFlBQTBCLEVBQUUsUUFBNEI7WUFDbkUsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFFMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUVNLElBQUksQ0FBQyxZQUFvQjtZQUMvQix1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFFMUIsK0JBQStCO1lBQy9CLFlBQVksQ0FBQyxR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