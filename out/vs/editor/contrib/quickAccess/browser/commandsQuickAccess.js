/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iconLabels", "vs/platform/action/common/action", "vs/platform/quickinput/browser/commandsQuickAccess"], function (require, exports, iconLabels_1, action_1, commandsQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorCommandsQuickAccessProvider = void 0;
    class AbstractEditorCommandsQuickAccessProvider extends commandsQuickAccess_1.AbstractCommandsQuickAccessProvider {
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, dialogService) {
            super(options, instantiationService, keybindingService, commandService, telemetryService, dialogService);
        }
        getCodeEditorCommandPicks() {
            const activeTextEditorControl = this.activeTextEditorControl;
            if (!activeTextEditorControl) {
                return [];
            }
            const editorCommandPicks = [];
            for (const editorAction of activeTextEditorControl.getSupportedActions()) {
                let commandDescription;
                if (editorAction.metadata?.description) {
                    if ((0, action_1.isLocalizedString)(editorAction.metadata.description)) {
                        commandDescription = editorAction.metadata.description;
                    }
                    else {
                        commandDescription = { original: editorAction.metadata.description, value: editorAction.metadata.description };
                    }
                }
                editorCommandPicks.push({
                    commandId: editorAction.id,
                    commandAlias: editorAction.alias,
                    commandDescription,
                    label: (0, iconLabels_1.stripIcons)(editorAction.label) || editorAction.id,
                });
            }
            return editorCommandPicks;
        }
    }
    exports.AbstractEditorCommandsQuickAccessProvider = AbstractEditorCommandsQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHNRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3F1aWNrQWNjZXNzL2Jyb3dzZXIvY29tbWFuZHNRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBc0IseUNBQTBDLFNBQVEseURBQW1DO1FBRTFHLFlBQ0MsT0FBb0MsRUFDcEMsb0JBQTJDLEVBQzNDLGlCQUFxQyxFQUNyQyxjQUErQixFQUMvQixnQkFBbUMsRUFDbkMsYUFBNkI7WUFFN0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQU9TLHlCQUF5QjtZQUNsQyxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztZQUM3RCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsTUFBTSxrQkFBa0IsR0FBd0IsRUFBRSxDQUFDO1lBQ25ELEtBQUssTUFBTSxZQUFZLElBQUksdUJBQXVCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO2dCQUMxRSxJQUFJLGtCQUFnRCxDQUFDO2dCQUNyRCxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQUM7b0JBQ3hDLElBQUksSUFBQSwwQkFBaUIsRUFBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7d0JBQzFELGtCQUFrQixHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO29CQUN4RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1Asa0JBQWtCLEdBQUcsRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2hILENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZCLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRTtvQkFDMUIsWUFBWSxFQUFFLFlBQVksQ0FBQyxLQUFLO29CQUNoQyxrQkFBa0I7b0JBQ2xCLEtBQUssRUFBRSxJQUFBLHVCQUFVLEVBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFO2lCQUN4RCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO0tBQ0Q7SUE1Q0QsOEZBNENDIn0=