/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugCompoundRoot = void 0;
    class DebugCompoundRoot {
        constructor() {
            this.stopped = false;
            this.stopEmitter = new event_1.Emitter();
            this.onDidSessionStop = this.stopEmitter.event;
        }
        sessionStopped() {
            if (!this.stopped) { // avoid sending extranous terminate events
                this.stopped = true;
                this.stopEmitter.fire();
            }
        }
    }
    exports.DebugCompoundRoot = DebugCompoundRoot;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb21wb3VuZFJvb3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdDb21wb3VuZFJvb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQWEsaUJBQWlCO1FBQTlCO1lBQ1MsWUFBTyxHQUFHLEtBQUssQ0FBQztZQUNoQixnQkFBVyxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFFMUMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFRM0MsQ0FBQztRQU5BLGNBQWM7WUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsMkNBQTJDO2dCQUMvRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6QixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBWkQsOENBWUMifQ==