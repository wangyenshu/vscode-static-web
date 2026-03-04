/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/date", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/workbench/contrib/comments/common/commentsConfiguration"], function (require, exports, dom, hoverDelegateFactory_1, date_1, lifecycle_1, platform_1, commentsConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimestampWidget = void 0;
    class TimestampWidget extends lifecycle_1.Disposable {
        constructor(configurationService, hoverService, container, timeStamp) {
            super();
            this.configurationService = configurationService;
            this._date = dom.append(container, dom.$('span.timestamp'));
            this._date.style.display = 'none';
            this._useRelativeTime = this.useRelativeTimeSetting;
            this.hover = this._register(hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this._date, ''));
            this.setTimestamp(timeStamp);
        }
        get useRelativeTimeSetting() {
            return this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).useRelativeTime;
        }
        async setTimestamp(timestamp) {
            if ((timestamp !== this._timestamp) || (this.useRelativeTimeSetting !== this._useRelativeTime)) {
                this.updateDate(timestamp);
            }
            this._timestamp = timestamp;
            this._useRelativeTime = this.useRelativeTimeSetting;
        }
        updateDate(timestamp) {
            if (!timestamp) {
                this._date.textContent = '';
                this._date.style.display = 'none';
            }
            else if ((timestamp !== this._timestamp)
                || (this.useRelativeTimeSetting !== this._useRelativeTime)) {
                this._date.style.display = '';
                let textContent;
                let tooltip;
                if (this.useRelativeTimeSetting) {
                    textContent = this.getRelative(timestamp);
                    tooltip = this.getDateString(timestamp);
                }
                else {
                    textContent = this.getDateString(timestamp);
                }
                this._date.textContent = textContent;
                this.hover.update(tooltip ?? '');
            }
        }
        getRelative(date) {
            return (0, date_1.fromNow)(date, true, true);
        }
        getDateString(date) {
            return date.toLocaleString(platform_1.language);
        }
    }
    exports.TimestampWidget = TimestampWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXN0YW1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci90aW1lc3RhbXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQU85QyxZQUNTLG9CQUEyQyxFQUNuRCxZQUEyQixFQUMzQixTQUFzQixFQUN0QixTQUFnQjtZQUVoQixLQUFLLEVBQUUsQ0FBQztZQUxBLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFNbkQsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUM7WUFDcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFBLDhDQUF1QixFQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFZLHNCQUFzQjtZQUNqQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQXlCLHdDQUFnQixDQUFDLENBQUMsZUFBZSxDQUFDO1FBQ3JHLENBQUM7UUFFTSxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQTJCO1lBQ3BELElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUM7UUFDckQsQ0FBQztRQUVPLFVBQVUsQ0FBQyxTQUFnQjtZQUNsQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUNuQyxDQUFDO2lCQUFNLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQzttQkFDdEMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEtBQUssSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxXQUFtQixDQUFDO2dCQUN4QixJQUFJLE9BQTJCLENBQUM7Z0JBQ2hDLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQ2pDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMxQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFdBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUVELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztnQkFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUFDLElBQVU7WUFDN0IsT0FBTyxJQUFBLGNBQU8sRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFTyxhQUFhLENBQUMsSUFBVTtZQUMvQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQTdERCwwQ0E2REMifQ==