/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onObservableChange = onObservableChange;
    function onObservableChange(observable, callback) {
        const o = {
            beginUpdate() { },
            endUpdate() { },
            handlePossibleChange(observable) {
                observable.reportChanges();
            },
            handleChange(_observable, change) {
                callback(change);
            }
        };
        observable.addObserver(o);
        return {
            dispose() {
                observable.removeObserver(o);
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZVV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vb2JzZXJ2YWJsZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLGdEQWtCQztJQWxCRCxTQUFnQixrQkFBa0IsQ0FBSSxVQUFtQyxFQUFFLFFBQTRCO1FBQ3RHLE1BQU0sQ0FBQyxHQUFjO1lBQ3BCLFdBQVcsS0FBSyxDQUFDO1lBQ2pCLFNBQVMsS0FBSyxDQUFDO1lBQ2Ysb0JBQW9CLENBQUMsVUFBVTtnQkFDOUIsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFDRCxZQUFZLENBQWMsV0FBcUMsRUFBRSxNQUFlO2dCQUMvRSxRQUFRLENBQUMsTUFBa0IsQ0FBQyxDQUFDO1lBQzlCLENBQUM7U0FDRCxDQUFDO1FBRUYsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixPQUFPO1lBQ04sT0FBTztnQkFDTixVQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQyJ9