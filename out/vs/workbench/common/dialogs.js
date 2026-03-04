/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogsModel = void 0;
    class DialogsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.dialogs = [];
            this._onWillShowDialog = this._register(new event_1.Emitter());
            this.onWillShowDialog = this._onWillShowDialog.event;
            this._onDidShowDialog = this._register(new event_1.Emitter());
            this.onDidShowDialog = this._onDidShowDialog.event;
        }
        show(dialog) {
            const promise = new async_1.DeferredPromise();
            const item = {
                args: dialog,
                close: result => {
                    this.dialogs.splice(0, 1);
                    if (result instanceof Error) {
                        promise.error(result);
                    }
                    else {
                        promise.complete(result);
                    }
                    this._onDidShowDialog.fire();
                }
            };
            this.dialogs.push(item);
            this._onWillShowDialog.fire();
            return {
                item,
                result: promise.p
            };
        }
    }
    exports.DialogsModel = DialogsModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9ncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZGlhbG9ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLE1BQWEsWUFBYSxTQUFRLHNCQUFVO1FBQTVDOztZQUVVLFlBQU8sR0FBc0IsRUFBRSxDQUFDO1lBRXhCLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2hFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0Qsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1FBMEJ4RCxDQUFDO1FBeEJBLElBQUksQ0FBQyxNQUFtQjtZQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLHVCQUFlLEVBQTZCLENBQUM7WUFFakUsTUFBTSxJQUFJLEdBQW9CO2dCQUM3QixJQUFJLEVBQUUsTUFBTTtnQkFDWixLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUU7b0JBQ2YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMxQixJQUFJLE1BQU0sWUFBWSxLQUFLLEVBQUUsQ0FBQzt3QkFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDdkIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzFCLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM5QixDQUFDO2FBQ0QsQ0FBQztZQUVGLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUU5QixPQUFPO2dCQUNOLElBQUk7Z0JBQ0osTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ2pCLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFsQ0Qsb0NBa0NDIn0=