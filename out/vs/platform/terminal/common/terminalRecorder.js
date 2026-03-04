/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalRecorder = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MaxRecorderDataSize"] = 1048576] = "MaxRecorderDataSize"; // 1MB
    })(Constants || (Constants = {}));
    class TerminalRecorder {
        constructor(cols, rows) {
            this._totalDataLength = 0;
            this._entries = [{ cols, rows, data: [] }];
        }
        handleResize(cols, rows) {
            if (this._entries.length > 0) {
                const lastEntry = this._entries[this._entries.length - 1];
                if (lastEntry.data.length === 0) {
                    // last entry is just a resize, so just remove it
                    this._entries.pop();
                }
            }
            if (this._entries.length > 0) {
                const lastEntry = this._entries[this._entries.length - 1];
                if (lastEntry.cols === cols && lastEntry.rows === rows) {
                    // nothing changed
                    return;
                }
                if (lastEntry.cols === 0 && lastEntry.rows === 0) {
                    // we finally received a good size!
                    lastEntry.cols = cols;
                    lastEntry.rows = rows;
                    return;
                }
            }
            this._entries.push({ cols, rows, data: [] });
        }
        handleData(data) {
            const lastEntry = this._entries[this._entries.length - 1];
            lastEntry.data.push(data);
            this._totalDataLength += data.length;
            while (this._totalDataLength > 1048576 /* Constants.MaxRecorderDataSize */) {
                const firstEntry = this._entries[0];
                const remainingToDelete = this._totalDataLength - 1048576 /* Constants.MaxRecorderDataSize */;
                if (remainingToDelete >= firstEntry.data[0].length) {
                    // the first data piece must be deleted
                    this._totalDataLength -= firstEntry.data[0].length;
                    firstEntry.data.shift();
                    if (firstEntry.data.length === 0) {
                        // the first entry must be deleted
                        this._entries.shift();
                    }
                }
                else {
                    // the first data piece must be partially deleted
                    firstEntry.data[0] = firstEntry.data[0].substr(remainingToDelete);
                    this._totalDataLength -= remainingToDelete;
                }
            }
        }
        generateReplayEventSync() {
            // normalize entries to one element per data array
            this._entries.forEach((entry) => {
                if (entry.data.length > 0) {
                    entry.data = [entry.data.join('')];
                }
            });
            return {
                events: this._entries.map(entry => ({ cols: entry.cols, rows: entry.rows, data: entry.data[0] ?? '' })),
                // No command restoration is needed when relaunching terminals
                commands: {
                    isWindowsPty: false,
                    commands: []
                }
            };
        }
        async generateReplayEvent() {
            return this.generateReplayEventSync();
        }
    }
    exports.TerminalRecorder = TerminalRecorder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSZWNvcmRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbFJlY29yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxJQUFXLFNBRVY7SUFGRCxXQUFXLFNBQVM7UUFDbkIsNkVBQWlDLENBQUEsQ0FBQyxNQUFNO0lBQ3pDLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQVlELE1BQWEsZ0JBQWdCO1FBSzVCLFlBQVksSUFBWSxFQUFFLElBQVk7WUFGOUIscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1lBR3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELFlBQVksQ0FBQyxJQUFZLEVBQUUsSUFBWTtZQUN0QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQyxpREFBaUQ7b0JBQ2pELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3JCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUN4RCxrQkFBa0I7b0JBQ2xCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2xELG1DQUFtQztvQkFDbkMsU0FBUyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ3RCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUN0QixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxVQUFVLENBQUMsSUFBWTtZQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTFCLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQiw4Q0FBZ0MsRUFBRSxDQUFDO2dCQUM5RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsOENBQWdDLENBQUM7Z0JBQ2hGLElBQUksaUJBQWlCLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDcEQsdUNBQXVDO29CQUN2QyxJQUFJLENBQUMsZ0JBQWdCLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7b0JBQ25ELFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3hCLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2xDLGtDQUFrQzt3QkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsaURBQWlEO29CQUNqRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQ2xFLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxpQkFBaUIsQ0FBQztnQkFDNUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsdUJBQXVCO1lBQ3RCLGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUMvQixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUMzQixLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTztnQkFDTixNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdkcsOERBQThEO2dCQUM5RCxRQUFRLEVBQUU7b0JBQ1QsWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFFBQVEsRUFBRSxFQUFFO2lCQUNaO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsbUJBQW1CO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBL0VELDRDQStFQyJ9