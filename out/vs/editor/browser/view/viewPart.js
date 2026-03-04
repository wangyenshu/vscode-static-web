/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/viewEventHandler"], function (require, exports, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartFingerprints = exports.PartFingerprint = exports.ViewPart = void 0;
    class ViewPart extends viewEventHandler_1.ViewEventHandler {
        constructor(context) {
            super();
            this._context = context;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
    }
    exports.ViewPart = ViewPart;
    var PartFingerprint;
    (function (PartFingerprint) {
        PartFingerprint[PartFingerprint["None"] = 0] = "None";
        PartFingerprint[PartFingerprint["ContentWidgets"] = 1] = "ContentWidgets";
        PartFingerprint[PartFingerprint["OverflowingContentWidgets"] = 2] = "OverflowingContentWidgets";
        PartFingerprint[PartFingerprint["OverflowGuard"] = 3] = "OverflowGuard";
        PartFingerprint[PartFingerprint["OverlayWidgets"] = 4] = "OverlayWidgets";
        PartFingerprint[PartFingerprint["OverflowingOverlayWidgets"] = 5] = "OverflowingOverlayWidgets";
        PartFingerprint[PartFingerprint["ScrollableElement"] = 6] = "ScrollableElement";
        PartFingerprint[PartFingerprint["TextArea"] = 7] = "TextArea";
        PartFingerprint[PartFingerprint["ViewLines"] = 8] = "ViewLines";
        PartFingerprint[PartFingerprint["Minimap"] = 9] = "Minimap";
    })(PartFingerprint || (exports.PartFingerprint = PartFingerprint = {}));
    class PartFingerprints {
        static write(target, partId) {
            target.setAttribute('data-mprt', String(partId));
        }
        static read(target) {
            const r = target.getAttribute('data-mprt');
            if (r === null) {
                return 0 /* PartFingerprint.None */;
            }
            return parseInt(r, 10);
        }
        static collect(child, stopAt) {
            const result = [];
            let resultLen = 0;
            while (child && child !== child.ownerDocument.body) {
                if (child === stopAt) {
                    break;
                }
                if (child.nodeType === child.ELEMENT_NODE) {
                    result[resultLen++] = this.read(child);
                }
                child = child.parentElement;
            }
            const r = new Uint8Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                r[i] = result[resultLen - i - 1];
            }
            return r;
        }
    }
    exports.PartFingerprints = PartFingerprints;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1BhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3L3ZpZXdQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFzQixRQUFTLFNBQVEsbUNBQWdCO1FBSXRELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBSUQ7SUFqQkQsNEJBaUJDO0lBRUQsSUFBa0IsZUFXakI7SUFYRCxXQUFrQixlQUFlO1FBQ2hDLHFEQUFJLENBQUE7UUFDSix5RUFBYyxDQUFBO1FBQ2QsK0ZBQXlCLENBQUE7UUFDekIsdUVBQWEsQ0FBQTtRQUNiLHlFQUFjLENBQUE7UUFDZCwrRkFBeUIsQ0FBQTtRQUN6QiwrRUFBaUIsQ0FBQTtRQUNqQiw2REFBUSxDQUFBO1FBQ1IsK0RBQVMsQ0FBQTtRQUNULDJEQUFPLENBQUE7SUFDUixDQUFDLEVBWGlCLGVBQWUsK0JBQWYsZUFBZSxRQVdoQztJQUVELE1BQWEsZ0JBQWdCO1FBRXJCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBMEMsRUFBRSxNQUF1QjtZQUN0RixNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRU0sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFlO1lBQ2pDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2hCLG9DQUE0QjtZQUM3QixDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQXFCLEVBQUUsTUFBZTtZQUMzRCxNQUFNLE1BQU0sR0FBc0IsRUFBRSxDQUFDO1lBQ3JDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztZQUVsQixPQUFPLEtBQUssSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxLQUFLLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ3RCLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUMzQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO2dCQUNELEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO0tBQ0Q7SUFsQ0QsNENBa0NDIn0=