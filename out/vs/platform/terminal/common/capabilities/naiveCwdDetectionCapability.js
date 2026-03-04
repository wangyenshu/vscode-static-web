/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NaiveCwdDetectionCapability = void 0;
    class NaiveCwdDetectionCapability {
        constructor(_process) {
            this._process = _process;
            this.type = 1 /* TerminalCapability.NaiveCwdDetection */;
            this._cwd = '';
            this._onDidChangeCwd = new event_1.Emitter();
            this.onDidChangeCwd = this._onDidChangeCwd.event;
        }
        async getCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            const newCwd = await this._process.getCwd();
            if (newCwd !== this._cwd) {
                this._onDidChangeCwd.fire(newCwd);
            }
            this._cwd = newCwd;
            return this._cwd;
        }
    }
    exports.NaiveCwdDetectionCapability = NaiveCwdDetectionCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFpdmVDd2REZXRlY3Rpb25DYXBhYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL2NhcGFiaWxpdGllcy9uYWl2ZUN3ZERldGVjdGlvbkNhcGFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsMkJBQTJCO1FBQ3ZDLFlBQTZCLFFBQStCO1lBQS9CLGFBQVEsR0FBUixRQUFRLENBQXVCO1lBQ25ELFNBQUksZ0RBQXdDO1lBQzdDLFNBQUksR0FBRyxFQUFFLENBQUM7WUFFRCxvQkFBZSxHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDaEQsbUJBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztRQUxXLENBQUM7UUFPakUsS0FBSyxDQUFDLE1BQU07WUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM1QyxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztZQUNuQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBbkJELGtFQW1CQyJ9