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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInputSerializer = void 0;
    let TerminalInputSerializer = class TerminalInputSerializer {
        constructor(_terminalEditorService) {
            this._terminalEditorService = _terminalEditorService;
        }
        canSerialize(editorInput) {
            return typeof editorInput.terminalInstance?.persistentProcessId === 'number' && editorInput.terminalInstance.shouldPersist;
        }
        serialize(editorInput) {
            if (!this.canSerialize(editorInput)) {
                return;
            }
            return JSON.stringify(this._toJson(editorInput.terminalInstance));
        }
        deserialize(instantiationService, serializedEditorInput) {
            const terminalInstance = JSON.parse(serializedEditorInput);
            return this._terminalEditorService.reviveInput(terminalInstance);
        }
        _toJson(instance) {
            return {
                id: instance.persistentProcessId,
                pid: instance.processId || 0,
                title: instance.title,
                titleSource: instance.titleSource,
                cwd: '',
                icon: instance.icon,
                color: instance.color,
                hasChildProcesses: instance.hasChildProcesses,
                isFeatureTerminal: instance.shellLaunchConfig.isFeatureTerminal,
                hideFromUser: instance.shellLaunchConfig.hideFromUser,
                reconnectionProperties: instance.shellLaunchConfig.reconnectionProperties,
                shellIntegrationNonce: instance.shellIntegrationNonce
            };
        }
    };
    exports.TerminalInputSerializer = TerminalInputSerializer;
    exports.TerminalInputSerializer = TerminalInputSerializer = __decorate([
        __param(0, terminal_1.ITerminalEditorService)
    ], TerminalInputSerializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JTZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEVkaXRvclNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBQ25DLFlBQzBDLHNCQUE4QztZQUE5QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1FBQ3BGLENBQUM7UUFFRSxZQUFZLENBQUMsV0FBZ0M7WUFDbkQsT0FBTyxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsS0FBSyxRQUFRLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQztRQUM1SCxDQUFDO1FBRU0sU0FBUyxDQUFDLFdBQWdDO1lBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRU0sV0FBVyxDQUFDLG9CQUEyQyxFQUFFLHFCQUE2QjtZQUM1RixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUMzRCxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRU8sT0FBTyxDQUFDLFFBQTJCO1lBQzFDLE9BQU87Z0JBQ04sRUFBRSxFQUFFLFFBQVEsQ0FBQyxtQkFBb0I7Z0JBQ2pDLEdBQUcsRUFBRSxRQUFRLENBQUMsU0FBUyxJQUFJLENBQUM7Z0JBQzVCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2dCQUNqQyxHQUFHLEVBQUUsRUFBRTtnQkFDUCxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7Z0JBQ25CLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLGlCQUFpQjtnQkFDN0MsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQjtnQkFDL0QsWUFBWSxFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZO2dCQUNyRCxzQkFBc0IsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCO2dCQUN6RSxxQkFBcUIsRUFBRSxRQUFRLENBQUMscUJBQXFCO2FBQ3JELENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQTtJQXJDWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUVqQyxXQUFBLGlDQUFzQixDQUFBO09BRlosdUJBQXVCLENBcUNuQyJ9