/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferMarkCapability = void 0;
    /**
     * Manages "marks" in the buffer which are lines that are tracked when lines are added to or removed
     * from the buffer.
     */
    class BufferMarkCapability extends lifecycle_1.Disposable {
        constructor(_terminal) {
            super();
            this._terminal = _terminal;
            this.type = 4 /* TerminalCapability.BufferMarkDetection */;
            this._idToMarkerMap = new Map();
            this._anonymousMarkers = new Map();
            this._onMarkAdded = this._register(new event_1.Emitter());
            this.onMarkAdded = this._onMarkAdded.event;
        }
        *markers() {
            for (const m of this._idToMarkerMap.values()) {
                yield m;
            }
            for (const m of this._anonymousMarkers.values()) {
                yield m;
            }
        }
        addMark(properties) {
            const marker = properties?.marker || this._terminal.registerMarker();
            const id = properties?.id;
            if (!marker) {
                return;
            }
            if (id) {
                this._idToMarkerMap.set(id, marker);
                marker.onDispose(() => this._idToMarkerMap.delete(id));
            }
            else {
                this._anonymousMarkers.set(marker.id, marker);
                marker.onDispose(() => this._anonymousMarkers.delete(marker.id));
            }
            this._onMarkAdded.fire({ marker, id, hidden: properties?.hidden, hoverMessage: properties?.hoverMessage });
        }
        getMark(id) {
            return this._idToMarkerMap.get(id);
        }
    }
    exports.BufferMarkCapability = BufferMarkCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyTWFya0NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL2J1ZmZlck1hcmtDYXBhYmlsaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRzs7O09BR0c7SUFDSCxNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBVW5ELFlBQ2tCLFNBQW1CO1lBRXBDLEtBQUssRUFBRSxDQUFDO1lBRlMsY0FBUyxHQUFULFNBQVMsQ0FBVTtZQVQ1QixTQUFJLGtEQUEwQztZQUUvQyxtQkFBYyxHQUF5QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2pELHNCQUFpQixHQUF5QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRTNDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUIsQ0FBQyxDQUFDO1lBQ3RFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFNL0MsQ0FBQztRQUVELENBQUMsT0FBTztZQUNQLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLENBQUMsQ0FBQztZQUNULENBQUM7WUFDRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLENBQUMsQ0FBQztZQUNULENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxDQUFDLFVBQTRCO1lBQ25DLE1BQU0sTUFBTSxHQUFHLFVBQVUsRUFBRSxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNyRSxNQUFNLEVBQUUsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFFRCxPQUFPLENBQUMsRUFBVTtZQUNqQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7S0FDRDtJQTVDRCxvREE0Q0MifQ==