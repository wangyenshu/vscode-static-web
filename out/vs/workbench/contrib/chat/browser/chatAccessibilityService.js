/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/accessibilitySignal/browser/progressAccessibilitySignalScheduler"], function (require, exports, aria_1, lifecycle_1, accessibilitySignalService_1, instantiation_1, progressAccessibilitySignalScheduler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAccessibilityService = void 0;
    const CHAT_RESPONSE_PENDING_ALLOWANCE_MS = 4000;
    let ChatAccessibilityService = class ChatAccessibilityService extends lifecycle_1.Disposable {
        constructor(_accessibilitySignalService, _instantiationService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._instantiationService = _instantiationService;
            this._pendingSignalMap = this._register(new lifecycle_1.DisposableMap());
            this._requestId = 0;
        }
        acceptRequest() {
            this._requestId++;
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.chatRequestSent, { allowManyInParallel: true });
            this._pendingSignalMap.set(this._requestId, this._instantiationService.createInstance(progressAccessibilitySignalScheduler_1.AccessibilityProgressSignalScheduler, CHAT_RESPONSE_PENDING_ALLOWANCE_MS, undefined));
            return this._requestId;
        }
        acceptResponse(response, requestId) {
            this._pendingSignalMap.deleteAndDispose(requestId);
            const isPanelChat = typeof response !== 'string';
            const responseContent = typeof response === 'string' ? response : response?.response.asString();
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.chatResponseReceived, { allowManyInParallel: true });
            if (!response) {
                return;
            }
            const errorDetails = isPanelChat && response.errorDetails ? ` ${response.errorDetails.message}` : '';
            (0, aria_1.status)(responseContent + errorDetails);
        }
    };
    exports.ChatAccessibilityService = ChatAccessibilityService;
    exports.ChatAccessibilityService = ChatAccessibilityService = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(1, instantiation_1.IInstantiationService)
    ], ChatAccessibilityService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRBY2Nlc3NpYmlsaXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7SUFDekMsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQVF2RCxZQUF5QywyQkFBeUUsRUFBeUIscUJBQTZEO1lBQ3ZNLEtBQUssRUFBRSxDQUFDO1lBRGlELGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFBMEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUpoTSxzQkFBaUIsR0FBZ0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQUUsQ0FBQyxDQUFDO1lBRXJILGVBQVUsR0FBVyxDQUFDLENBQUM7UUFJL0IsQ0FBQztRQUNELGFBQWE7WUFDWixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFVBQVUsQ0FBQyxnREFBbUIsQ0FBQyxlQUFlLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2hILElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLDJFQUFvQyxFQUFFLGtDQUFrQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDNUssT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxjQUFjLENBQUMsUUFBcUQsRUFBRSxTQUFpQjtZQUN0RixJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDO1lBQ2pELE1BQU0sZUFBZSxHQUFHLE9BQU8sUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLENBQUMsZ0RBQW1CLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3JILElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLFdBQVcsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyRyxJQUFBLGFBQU0sRUFBQyxlQUFlLEdBQUcsWUFBWSxDQUFDLENBQUM7UUFDeEMsQ0FBQztLQUNELENBQUE7SUE1QlksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFRdkIsV0FBQSx3REFBMkIsQ0FBQTtRQUE2RSxXQUFBLHFDQUFxQixDQUFBO09BUjlILHdCQUF3QixDQTRCcEMifQ==