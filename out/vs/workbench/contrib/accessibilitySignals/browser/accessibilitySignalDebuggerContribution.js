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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/debug/common/debug"], function (require, exports, lifecycle_1, observable_1, accessibilitySignalService_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilitySignalLineDebuggerContribution = void 0;
    let AccessibilitySignalLineDebuggerContribution = class AccessibilitySignalLineDebuggerContribution extends lifecycle_1.Disposable {
        constructor(debugService, accessibilitySignalService) {
            super();
            this.accessibilitySignalService = accessibilitySignalService;
            const isEnabled = (0, observable_1.observableFromEvent)(accessibilitySignalService.onSoundEnabledChanged(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak), () => accessibilitySignalService.isSoundEnabled(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description subscribe to debug sessions */
                if (!isEnabled.read(reader)) {
                    return;
                }
                const sessionDisposables = new Map();
                store.add((0, lifecycle_1.toDisposable)(() => {
                    sessionDisposables.forEach(d => d.dispose());
                    sessionDisposables.clear();
                }));
                store.add(debugService.onDidNewSession((session) => sessionDisposables.set(session, this.handleSession(session))));
                store.add(debugService.onDidEndSession(({ session }) => {
                    sessionDisposables.get(session)?.dispose();
                    sessionDisposables.delete(session);
                }));
                debugService
                    .getModel()
                    .getSessions()
                    .forEach((session) => sessionDisposables.set(session, this.handleSession(session)));
            }));
        }
        handleSession(session) {
            return session.onDidChangeState(e => {
                const stoppedDetails = session.getStoppedDetails();
                const BREAKPOINT_STOP_REASON = 'breakpoint';
                if (stoppedDetails && stoppedDetails.reason === BREAKPOINT_STOP_REASON) {
                    this.accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak);
                }
            });
        }
    };
    exports.AccessibilitySignalLineDebuggerContribution = AccessibilitySignalLineDebuggerContribution;
    exports.AccessibilitySignalLineDebuggerContribution = AccessibilitySignalLineDebuggerContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, accessibilitySignalService_1.IAccessibilitySignalService)
    ], AccessibilitySignalLineDebuggerContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbERlYnVnZ2VyQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjZXNzaWJpbGl0eVNpZ25hbHMvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5U2lnbmFsRGVidWdnZXJDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sMkNBQTJDLEdBQWpELE1BQU0sMkNBQ1osU0FBUSxzQkFBVTtRQUdsQixZQUNnQixZQUEyQixFQUNJLDBCQUFzRDtZQUVwRyxLQUFLLEVBQUUsQ0FBQztZQUZzQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTRCO1lBSXBHLE1BQU0sU0FBUyxHQUFHLElBQUEsZ0NBQW1CLEVBQ3BDLDBCQUEwQixDQUFDLHFCQUFxQixDQUFDLGdEQUFtQixDQUFDLFlBQVksQ0FBQyxFQUNsRixHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLENBQUMsZ0RBQW1CLENBQUMsWUFBWSxDQUFDLENBQ2pGLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsNkJBQWdCLEVBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2pELCtDQUErQztnQkFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDN0IsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7Z0JBQ2pFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtvQkFDM0Isa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQzdDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLEtBQUssQ0FBQyxHQUFHLENBQ1IsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ3hDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUM1RCxDQUNELENBQUM7Z0JBRUYsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO29CQUN0RCxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQzNDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixZQUFZO3FCQUNWLFFBQVEsRUFBRTtxQkFDVixXQUFXLEVBQUU7cUJBQ2IsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDcEIsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQzVELENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGFBQWEsQ0FBQyxPQUFzQjtZQUMzQyxPQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ25ELE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDO2dCQUM1QyxJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLHNCQUFzQixFQUFFLENBQUM7b0JBQ3hFLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsZ0RBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzlFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBdkRZLGtHQUEyQzswREFBM0MsMkNBQTJDO1FBS3JELFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsd0RBQTJCLENBQUE7T0FOakIsMkNBQTJDLENBdUR2RCJ9