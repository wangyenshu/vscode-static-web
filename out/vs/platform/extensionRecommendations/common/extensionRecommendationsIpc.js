/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationNotificationServiceChannel = exports.ExtensionRecommendationNotificationServiceChannelClient = void 0;
    class ExtensionRecommendationNotificationServiceChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get ignoredRecommendations() { throw new Error('not supported'); }
        promptImportantExtensionsInstallNotification(extensionRecommendations) {
            return this.channel.call('promptImportantExtensionsInstallNotification', [extensionRecommendations]);
        }
        promptWorkspaceRecommendations(recommendations) {
            throw new Error('not supported');
        }
        hasToIgnoreRecommendationNotifications() {
            throw new Error('not supported');
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannelClient = ExtensionRecommendationNotificationServiceChannelClient;
    class ExtensionRecommendationNotificationServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, args) {
            switch (command) {
                case 'promptImportantExtensionsInstallNotification': return this.service.promptImportantExtensionsInstallNotification(args[0]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannel = ExtensionRecommendationNotificationServiceChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zL2NvbW1vbi9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnNJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsdURBQXVEO1FBSW5FLFlBQTZCLE9BQWlCO1lBQWpCLFlBQU8sR0FBUCxPQUFPLENBQVU7UUFBSSxDQUFDO1FBRW5ELElBQUksc0JBQXNCLEtBQWUsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUUsNENBQTRDLENBQUMsd0JBQW1EO1lBQy9GLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsOENBQThDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELDhCQUE4QixDQUFDLGVBQXlCO1lBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELHNDQUFzQztZQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7S0FFRDtJQXBCRCwwSEFvQkM7SUFFRCxNQUFhLGlEQUFpRDtRQUU3RCxZQUFvQixPQUFvRDtZQUFwRCxZQUFPLEdBQVAsT0FBTyxDQUE2QztRQUFJLENBQUM7UUFFN0UsTUFBTSxDQUFDLENBQVUsRUFBRSxLQUFhO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFVLEVBQUUsT0FBZSxFQUFFLElBQVU7WUFDM0MsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyw4Q0FBOEMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyw0Q0FBNEMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoSSxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0Q7SUFmRCw4R0FlQyJ9