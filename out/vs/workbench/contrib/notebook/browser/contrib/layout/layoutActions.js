/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, configuration_1, coreActions_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCellToolbarPositionAction = void 0;
    const TOGGLE_CELL_TOOLBAR_POSITION = 'notebook.toggleCellToolbarPosition';
    class ToggleCellToolbarPositionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: TOGGLE_CELL_TOOLBAR_POSITION,
                title: (0, nls_1.localize2)('notebook.toggleCellToolbarPosition', 'Toggle Cell Toolbar Position'),
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, context) {
            const editor = context && context.ui ? context.notebookEditor : undefined;
            if (editor && editor.hasModel()) {
                // from toolbar
                const viewType = editor.textModel.viewType;
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const toolbarPosition = configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation);
                const newConfig = this.togglePosition(viewType, toolbarPosition);
                await configurationService.updateValue(notebookCommon_1.NotebookSetting.cellToolbarLocation, newConfig);
            }
        }
        togglePosition(viewType, toolbarPosition) {
            if (typeof toolbarPosition === 'string') {
                // legacy
                if (['left', 'right', 'hidden'].indexOf(toolbarPosition) >= 0) {
                    // valid position
                    const newViewValue = toolbarPosition === 'right' ? 'left' : 'right';
                    const config = {
                        default: toolbarPosition
                    };
                    config[viewType] = newViewValue;
                    return config;
                }
                else {
                    // invalid position
                    const config = {
                        default: 'right',
                    };
                    config[viewType] = 'left';
                    return config;
                }
            }
            else {
                const oldValue = toolbarPosition[viewType] ?? toolbarPosition['default'] ?? 'right';
                const newViewValue = oldValue === 'right' ? 'left' : 'right';
                const newConfig = {
                    ...toolbarPosition
                };
                newConfig[viewType] = newViewValue;
                return newConfig;
            }
        }
    }
    exports.ToggleCellToolbarPositionAction = ToggleCellToolbarPositionAction;
    (0, actions_1.registerAction2)(ToggleCellToolbarPositionAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9sYXlvdXQvbGF5b3V0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBTSw0QkFBNEIsR0FBRyxvQ0FBb0MsQ0FBQztJQUUxRSxNQUFhLCtCQUFnQyxTQUFRLGlCQUFPO1FBQzNEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQ2hDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQ0FBb0MsRUFBRSw4QkFBOEIsQ0FBQztnQkFDdEYsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsaUJBQWlCO3dCQUM1QixLQUFLLEVBQUUsTUFBTTt3QkFDYixLQUFLLEVBQUUsQ0FBQztxQkFDUixDQUFDO2dCQUNGLFFBQVEsRUFBRSx1Q0FBeUI7Z0JBQ25DLEVBQUUsRUFBRSxLQUFLO2FBQ1QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUFZO1lBQ2pELE1BQU0sTUFBTSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxPQUFrQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3RHLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUNqQyxlQUFlO2dCQUNmLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO2dCQUMzQyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztnQkFDakUsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFxQyxnQ0FBZSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQy9ILE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxnQ0FBZSxDQUFDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7UUFDRixDQUFDO1FBRUQsY0FBYyxDQUFDLFFBQWdCLEVBQUUsZUFBbUQ7WUFDbkYsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsU0FBUztnQkFDVCxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQy9ELGlCQUFpQjtvQkFDakIsTUFBTSxZQUFZLEdBQUcsZUFBZSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ3BFLE1BQU0sTUFBTSxHQUE4Qjt3QkFDekMsT0FBTyxFQUFFLGVBQWU7cUJBQ3hCLENBQUM7b0JBQ0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFlBQVksQ0FBQztvQkFDaEMsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLG1CQUFtQjtvQkFDbkIsTUFBTSxNQUFNLEdBQThCO3dCQUN6QyxPQUFPLEVBQUUsT0FBTztxQkFDaEIsQ0FBQztvQkFDRixNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDO29CQUMxQixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDO2dCQUNwRixNQUFNLFlBQVksR0FBRyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDN0QsTUFBTSxTQUFTLEdBQUc7b0JBQ2pCLEdBQUcsZUFBZTtpQkFDbEIsQ0FBQztnQkFDRixTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsWUFBWSxDQUFDO2dCQUNuQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBRUYsQ0FBQztLQUNEO0lBekRELDBFQXlEQztJQUNELElBQUEseUJBQWUsRUFBQywrQkFBK0IsQ0FBQyxDQUFDIn0=