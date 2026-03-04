define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReentrancyBarrier = void 0;
    /*
     * This file contains helper classes to manage control flow.
    */
    /**
     * Prevents code from being re-entrant.
    */
    class ReentrancyBarrier {
        constructor() {
            this._isOccupied = false;
        }
        /**
         * Calls `runner` if the barrier is not occupied.
         * During the call, the barrier becomes occupied.
         */
        runExclusivelyOrSkip(runner) {
            if (this._isOccupied) {
                return;
            }
            this._isOccupied = true;
            try {
                runner();
            }
            finally {
                this._isOccupied = false;
            }
        }
        /**
         * Calls `runner`. If the barrier is occupied, throws an error.
         * During the call, the barrier becomes active.
         */
        runExclusivelyOrThrow(runner) {
            if (this._isOccupied) {
                throw new errors_1.BugIndicatingError(`ReentrancyBarrier: reentrant call detected!`);
            }
            this._isOccupied = true;
            try {
                runner();
            }
            finally {
                this._isOccupied = false;
            }
        }
        /**
         * Indicates if some runner occupies this barrier.
        */
        get isOccupied() {
            return this._isOccupied;
        }
        makeExclusiveOrSkip(fn) {
            return ((...args) => {
                if (this._isOccupied) {
                    return;
                }
                this._isOccupied = true;
                try {
                    return fn(...args);
                }
                finally {
                    this._isOccupied = false;
                }
            });
        }
    }
    exports.ReentrancyBarrier = ReentrancyBarrier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbEZsb3cuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9jb250cm9sRmxvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBTUE7O01BRUU7SUFFRjs7TUFFRTtJQUNGLE1BQWEsaUJBQWlCO1FBQTlCO1lBQ1MsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFzRDdCLENBQUM7UUFwREE7OztXQUdHO1FBQ0ksb0JBQW9CLENBQUMsTUFBa0I7WUFDN0MsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sRUFBRSxDQUFDO1lBQ1YsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQ7OztXQUdHO1FBQ0kscUJBQXFCLENBQUMsTUFBa0I7WUFDOUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUM7Z0JBQ0osTUFBTSxFQUFFLENBQUM7WUFDVixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFFRDs7VUFFRTtRQUNGLElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVNLG1CQUFtQixDQUE2QixFQUFhO1lBQ25FLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUU7Z0JBQzFCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN0QixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQztvQkFDSixPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUNwQixDQUFDO3dCQUFTLENBQUM7b0JBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQzFCLENBQUM7WUFDRixDQUFDLENBQVEsQ0FBQztRQUNYLENBQUM7S0FDRDtJQXZERCw4Q0F1REMifQ==