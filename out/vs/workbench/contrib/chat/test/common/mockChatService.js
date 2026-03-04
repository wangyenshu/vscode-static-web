/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatService = void 0;
    class MockChatService {
        constructor() {
            this.onDidPerformUserAction = undefined;
            this.onDidDisposeSession = undefined;
        }
        isEnabled(location) {
            throw new Error('Method not implemented.');
        }
        hasSessions() {
            throw new Error('Method not implemented.');
        }
        getProviderInfos() {
            throw new Error('Method not implemented.');
        }
        startSession(location, token) {
            throw new Error('Method not implemented.');
        }
        getSession(sessionId) {
            return {};
        }
        getOrRestoreSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        loadSessionFromContent(data) {
            throw new Error('Method not implemented.');
        }
        /**
         * Returns whether the request was accepted.
         */
        sendRequest(sessionId, message) {
            throw new Error('Method not implemented.');
        }
        resendRequest(request, options) {
            throw new Error('Method not implemented.');
        }
        removeRequest(sessionid, requestId) {
            throw new Error('Method not implemented.');
        }
        cancelCurrentRequestForSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        clearSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        addCompleteRequest(sessionId, message, variableData, attempt, response) {
            throw new Error('Method not implemented.');
        }
        getHistory() {
            throw new Error('Method not implemented.');
        }
        clearAllHistoryEntries() {
            throw new Error('Method not implemented.');
        }
        removeHistoryEntry(sessionId) {
            throw new Error('Method not implemented.');
        }
        notifyUserAction(event) {
            throw new Error('Method not implemented.');
        }
        transferChatSession(transferredSessionData, toWorkspace) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockChatService = MockChatService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC90ZXN0L2NvbW1vbi9tb2NrQ2hhdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsZUFBZTtRQUE1QjtZQXdEQywyQkFBc0IsR0FBZ0MsU0FBVSxDQUFDO1lBSWpFLHdCQUFtQixHQUE2RSxTQUFVLENBQUM7UUFLNUcsQ0FBQztRQTdEQSxTQUFTLENBQUMsUUFBMkI7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxXQUFXO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxnQkFBZ0I7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFlBQVksQ0FBQyxRQUEyQixFQUFFLEtBQXdCO1lBQ2pFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsVUFBVSxDQUFDLFNBQWlCO1lBQzNCLE9BQU8sRUFBZ0IsQ0FBQztRQUN6QixDQUFDO1FBQ0QsbUJBQW1CLENBQUMsU0FBaUI7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxzQkFBc0IsQ0FBQyxJQUEyQjtZQUNqRCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNEOztXQUVHO1FBQ0gsV0FBVyxDQUFDLFNBQWlCLEVBQUUsT0FBZTtZQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGFBQWEsQ0FBQyxPQUEwQixFQUFFLE9BQTZDO1lBQ3RGLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsYUFBYSxDQUFDLFNBQWlCLEVBQUUsU0FBaUI7WUFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCw4QkFBOEIsQ0FBQyxTQUFpQjtZQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFlBQVksQ0FBQyxTQUFpQjtZQUM3QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGtCQUFrQixDQUFDLFNBQWlCLEVBQUUsT0FBb0MsRUFBRSxZQUFrRCxFQUFFLE9BQTJCLEVBQUUsUUFBK0I7WUFDM0wsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxVQUFVO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxzQkFBc0I7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxrQkFBa0IsQ0FBQyxTQUFpQjtZQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUdELGdCQUFnQixDQUFDLEtBQTJCO1lBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBR0QsbUJBQW1CLENBQUMsc0JBQW1ELEVBQUUsV0FBZ0I7WUFDeEYsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDRDtJQWpFRCwwQ0FpRUMifQ==