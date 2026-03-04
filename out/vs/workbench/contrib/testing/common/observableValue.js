/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MutableObservableValue = exports.staticObservableValue = void 0;
    const staticObservableValue = (value) => ({
        onDidChange: event_1.Event.None,
        value,
    });
    exports.staticObservableValue = staticObservableValue;
    class MutableObservableValue extends lifecycle_1.Disposable {
        get value() {
            return this._value;
        }
        set value(v) {
            if (v !== this._value) {
                this._value = v;
                this.changeEmitter.fire(v);
            }
        }
        static stored(stored, defaultValue) {
            const o = new MutableObservableValue(stored.get(defaultValue));
            o._register(stored);
            o._register(o.onDidChange(value => stored.store(value)));
            return o;
        }
        constructor(_value) {
            super();
            this._value = _value;
            this.changeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.changeEmitter.event;
        }
    }
    exports.MutableObservableValue = MutableObservableValue;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZVZhbHVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vb2JzZXJ2YWJsZVZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVd6RixNQUFNLHFCQUFxQixHQUFHLENBQUksS0FBUSxFQUF1QixFQUFFLENBQUMsQ0FBQztRQUMzRSxXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUk7UUFDdkIsS0FBSztLQUNMLENBQUMsQ0FBQztJQUhVLFFBQUEscUJBQXFCLHlCQUcvQjtJQUVILE1BQWEsc0JBQTBCLFNBQVEsc0JBQVU7UUFLeEQsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFXLEtBQUssQ0FBQyxDQUFJO1lBQ3BCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBSSxNQUFzQixFQUFFLFlBQWU7WUFDOUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFRCxZQUFvQixNQUFTO1lBQzVCLEtBQUssRUFBRSxDQUFDO1lBRFcsV0FBTSxHQUFOLE1BQU0sQ0FBRztZQXRCWixrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQUssQ0FBQyxDQUFDO1lBRWxELGdCQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFzQnZELENBQUM7S0FDRDtJQTFCRCx3REEwQkMifQ==