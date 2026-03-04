/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/memento", "vs/platform/theme/common/themeService"], function (require, exports, memento_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Component = void 0;
    class Component extends themeService_1.Themable {
        constructor(id, themeService, storageService) {
            super(themeService);
            this.id = id;
            this.memento = new memento_1.Memento(this.id, storageService);
            this._register(storageService.onWillSaveState(() => {
                // Ask the component to persist state into the memento
                this.saveState();
                // Then save the memento into storage
                this.memento.saveMemento();
            }));
        }
        getId() {
            return this.id;
        }
        getMemento(scope, target) {
            return this.memento.getMemento(scope, target);
        }
        reloadMemento(scope) {
            return this.memento.reloadMemento(scope);
        }
        onDidChangeMementoValue(scope, disposables) {
            return this.memento.onDidChangeValue(scope, disposables);
        }
        saveState() {
            // Subclasses to implement for storing state
        }
    }
    exports.Component = Component;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsU0FBVSxTQUFRLHVCQUFRO1FBSXRDLFlBQ2tCLEVBQVUsRUFDM0IsWUFBMkIsRUFDM0IsY0FBK0I7WUFFL0IsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBSkgsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQU0zQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXBELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUU7Z0JBRWxELHNEQUFzRDtnQkFDdEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUVqQixxQ0FBcUM7Z0JBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFUyxVQUFVLENBQUMsS0FBbUIsRUFBRSxNQUFxQjtZQUM5RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRVMsYUFBYSxDQUFDLEtBQW1CO1lBQzFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVTLHVCQUF1QixDQUFDLEtBQW1CLEVBQUUsV0FBNEI7WUFDbEYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRVMsU0FBUztZQUNsQiw0Q0FBNEM7UUFDN0MsQ0FBQztLQUNEO0lBMUNELDhCQTBDQyJ9