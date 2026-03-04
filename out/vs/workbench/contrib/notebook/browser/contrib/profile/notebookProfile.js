/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, configuration_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookProfileType = void 0;
    var NotebookProfileType;
    (function (NotebookProfileType) {
        NotebookProfileType["default"] = "default";
        NotebookProfileType["jupyter"] = "jupyter";
        NotebookProfileType["colab"] = "colab";
    })(NotebookProfileType || (exports.NotebookProfileType = NotebookProfileType = {}));
    const profiles = {
        [NotebookProfileType.default]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'both',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        },
        [NotebookProfileType.jupyter]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'notebookToolbar',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'left' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: false,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: true
        },
        [NotebookProfileType.colab]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'border',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'betweenCells',
            [notebookCommon_1.NotebookSetting.globalToolbar]: false,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: false,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'hidden',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        }
    };
    async function applyProfile(configService, profile) {
        const promises = [];
        for (const settingKey in profile) {
            promises.push(configService.updateValue(settingKey, profile[settingKey]));
        }
        await Promise.all(promises);
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.setProfile',
                title: (0, nls_1.localize)('setProfileTitle', "Set Profile")
            });
        }
        async run(accessor, args) {
            if (!isSetProfileArgs(args)) {
                return;
            }
            const configService = accessor.get(configuration_1.IConfigurationService);
            return applyProfile(configService, profiles[args.profile]);
        }
    });
    function isSetProfileArgs(args) {
        const setProfileArgs = args;
        return setProfileArgs.profile === NotebookProfileType.colab ||
            setProfileArgs.profile === NotebookProfileType.default ||
            setProfileArgs.profile === NotebookProfileType.jupyter;
    }
});
// export class NotebookProfileContribution extends Disposable {
// 	static readonly ID = 'workbench.contrib.notebookProfile';
// 	constructor(@IConfigurationService configService: IConfigurationService, @IWorkbenchAssignmentService private readonly experimentService: IWorkbenchAssignmentService) {
// 		super();
// 		if (this.experimentService) {
// 			this.experimentService.getTreatment<NotebookProfileType.default | NotebookProfileType.jupyter | NotebookProfileType.colab>('notebookprofile').then(treatment => {
// 				if (treatment === undefined) {
// 					return;
// 				} else {
// 					// check if settings are already modified
// 					const focusIndicator = configService.getValue(NotebookSetting.focusIndicator);
// 					const insertToolbarPosition = configService.getValue(NotebookSetting.insertToolbarLocation);
// 					const globalToolbar = configService.getValue(NotebookSetting.globalToolbar);
// 					// const cellToolbarLocation = configService.getValue(NotebookSetting.cellToolbarLocation);
// 					const compactView = configService.getValue(NotebookSetting.compactView);
// 					const showCellStatusBar = configService.getValue(NotebookSetting.showCellStatusBar);
// 					const consolidatedRunButton = configService.getValue(NotebookSetting.consolidatedRunButton);
// 					if (focusIndicator === 'border'
// 						&& insertToolbarPosition === 'both'
// 						&& globalToolbar === false
// 						// && cellToolbarLocation === undefined
// 						&& compactView === true
// 						&& showCellStatusBar === 'visible'
// 						&& consolidatedRunButton === true
// 					) {
// 						applyProfile(configService, profiles[treatment] ?? profiles[NotebookProfileType.default]);
// 					}
// 				}
// 			});
// 		}
// 	}
// }
// registerWorkbenchContribution2(NotebookProfileContribution.ID, NotebookProfileContribution, WorkbenchPhase.BlockRestore);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL3Byb2ZpbGUvbm90ZWJvb2tQcm9maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxJQUFZLG1CQUlYO0lBSkQsV0FBWSxtQkFBbUI7UUFDOUIsMENBQW1CLENBQUE7UUFDbkIsMENBQW1CLENBQUE7UUFDbkIsc0NBQWUsQ0FBQTtJQUNoQixDQUFDLEVBSlcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFJOUI7SUFFRCxNQUFNLFFBQVEsR0FBRztRQUNoQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzlCLENBQUMsZ0NBQWUsQ0FBQyxjQUFjLENBQUMsRUFBRSxRQUFRO1lBQzFDLENBQUMsZ0NBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE1BQU07WUFDL0MsQ0FBQyxnQ0FBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUk7WUFDckMsQ0FBQyxnQ0FBZSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO1lBQzNELENBQUMsZ0NBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJO1lBQ25DLENBQUMsZ0NBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFNBQVM7WUFDOUMsQ0FBQyxnQ0FBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsSUFBSTtZQUM3QyxDQUFDLGdDQUFlLENBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSztTQUN4QztRQUNELENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDOUIsQ0FBQyxnQ0FBZSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVE7WUFDMUMsQ0FBQyxnQ0FBZSxD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