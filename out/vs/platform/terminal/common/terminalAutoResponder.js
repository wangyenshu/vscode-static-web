/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, async_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAutoResponder = void 0;
    /**
     * Tracks a terminal process's data stream and responds immediately when a matching string is
     * received. This is done in a low overhead way and is ideally run on the same process as the
     * where the process is handled to minimize latency.
     */
    class TerminalAutoResponder extends lifecycle_1.Disposable {
        constructor(proc, matchWord, response, logService) {
            super();
            this._pointer = 0;
            this._paused = false;
            /**
             * Each reply is throttled by a second to avoid resource starvation and responding to screen
             * reprints on Winodws.
             */
            this._throttled = false;
            this._register(proc.onProcessData(e => {
                if (this._paused || this._throttled) {
                    return;
                }
                const data = typeof e === 'string' ? e : e.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i] === matchWord[this._pointer]) {
                        this._pointer++;
                    }
                    else {
                        this._reset();
                    }
                    // Auto reply and reset
                    if (this._pointer === matchWord.length) {
                        logService.debug(`Auto reply match: "${matchWord}", response: "${response}"`);
                        proc.input(response);
                        this._throttled = true;
                        (0, async_1.timeout)(1000).then(() => this._throttled = false);
                        this._reset();
                    }
                }
            }));
        }
        _reset() {
            this._pointer = 0;
        }
        /**
         * No auto response will happen after a resize on Windows in case the resize is a result of
         * reprinting the screen.
         */
        handleResize() {
            if (platform_1.isWindows) {
                this._paused = true;
            }
        }
        handleInput() {
            this._paused = false;
        }
    }
    exports.TerminalAutoResponder = TerminalAutoResponder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBdXRvUmVzcG9uZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsQXV0b1Jlc3BvbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEc7Ozs7T0FJRztJQUNILE1BQWEscUJBQXNCLFNBQVEsc0JBQVU7UUFVcEQsWUFDQyxJQUEyQixFQUMzQixTQUFpQixFQUNqQixRQUFnQixFQUNoQixVQUF1QjtZQUV2QixLQUFLLEVBQUUsQ0FBQztZQWZELGFBQVEsR0FBRyxDQUFDLENBQUM7WUFDYixZQUFPLEdBQUcsS0FBSyxDQUFDO1lBRXhCOzs7ZUFHRztZQUNLLGVBQVUsR0FBRyxLQUFLLENBQUM7WUFVMUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyQyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3RDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDMUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNqQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNmLENBQUM7b0JBQ0QsdUJBQXVCO29CQUN2QixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN4QyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixTQUFTLGlCQUFpQixRQUFRLEdBQUcsQ0FBQyxDQUFDO3dCQUM5RSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDdkIsSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUM7d0JBQ2xELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDZixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLE1BQU07WUFDYixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsWUFBWTtZQUNYLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBRUQsV0FBVztZQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLENBQUM7S0FDRDtJQTFERCxzREEwREMifQ==