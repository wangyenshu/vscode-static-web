/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model"], function (require, exports, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlyphMarginLanesModel = void 0;
    const MAX_LANE = model_1.GlyphMarginLane.Right;
    class GlyphMarginLanesModel {
        constructor(maxLine) {
            this.persist = 0;
            this._requiredLanes = 1; // always render at least one lane
            this.lanes = new Uint8Array(Math.ceil(((maxLine + 1) * MAX_LANE) / 8));
        }
        reset(maxLine) {
            const bytes = Math.ceil(((maxLine + 1) * MAX_LANE) / 8);
            if (this.lanes.length < bytes) {
                this.lanes = new Uint8Array(bytes);
            }
            else {
                this.lanes.fill(0);
            }
            this._requiredLanes = 1;
        }
        get requiredLanes() {
            return this._requiredLanes;
        }
        push(lane, range, persist) {
            if (persist) {
                this.persist |= (1 << (lane - 1));
            }
            for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
                const bit = (MAX_LANE * i) + (lane - 1);
                this.lanes[bit >>> 3] |= (1 << (bit % 8));
                this._requiredLanes = Math.max(this._requiredLanes, this.countAtLine(i));
            }
        }
        getLanesAtLine(lineNumber) {
            const lanes = [];
            let bit = MAX_LANE * lineNumber;
            for (let i = 0; i < MAX_LANE; i++) {
                if (this.persist & (1 << i) || this.lanes[bit >>> 3] & (1 << (bit % 8))) {
                    lanes.push(i + 1);
                }
                bit++;
            }
            return lanes.length ? lanes : [model_1.GlyphMarginLane.Center];
        }
        countAtLine(lineNumber) {
            let bit = MAX_LANE * lineNumber;
            let count = 0;
            for (let i = 0; i < MAX_LANE; i++) {
                if (this.persist & (1 << i) || this.lanes[bit >>> 3] & (1 << (bit % 8))) {
                    count++;
                }
                bit++;
            }
            return count;
        }
    }
    exports.GlyphMarginLanesModel = GlyphMarginLanesModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhMYW5lc01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvZ2x5cGhMYW5lc01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFNLFFBQVEsR0FBRyx1QkFBZSxDQUFDLEtBQUssQ0FBQztJQUV2QyxNQUFhLHFCQUFxQjtRQUtqQyxZQUFZLE9BQWU7WUFIbkIsWUFBTyxHQUFHLENBQUMsQ0FBQztZQUNaLG1CQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0NBQWtDO1lBRzdELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN4RCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVELElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUks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