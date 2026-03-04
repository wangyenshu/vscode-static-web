/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/common/arrays", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, mouseEvent_1, actions_1, arrays_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContextActionRunner = exports.InstanceContext = void 0;
    exports.openContextMenu = openContextMenu;
    /**
     * A context that is passed to actions as arguments to represent the terminal instance(s) being
     * acted upon.
     */
    class InstanceContext {
        constructor(instance) {
            // Only store the instance to avoid contexts holding on to disposed instances.
            this.instanceId = instance.instanceId;
        }
        toJSON() {
            return {
                $mid: 15 /* MarshalledId.TerminalContext */,
                instanceId: this.instanceId
            };
        }
    }
    exports.InstanceContext = InstanceContext;
    class TerminalContextActionRunner extends actions_1.ActionRunner {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        async runAction(action, context) {
            if (Array.isArray(context) && context.every(e => e instanceof InstanceContext)) {
                // arg1: The (first) focused instance
                // arg2: All selected instances
                await action.run(context?.[0], context);
                return;
            }
            return super.runAction(action, context);
        }
    }
    exports.TerminalContextActionRunner = TerminalContextActionRunner;
    function openContextMenu(targetWindow, event, contextInstances, menu, contextMenuService, extraActions) {
        const standardEvent = new mouseEvent_1.StandardMouseEvent(targetWindow, event);
        const actions = [];
        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, actions);
        if (extraActions) {
            actions.push(...extraActions);
        }
        const context = contextInstances ? (0, arrays_1.asArray)(contextInstances).map(e => new InstanceContext(e)) : [];
        contextMenuService.showContextMenu({
            actionRunner: new TerminalContextActionRunner(),
            getAnchor: () => standardEvent,
            getActions: () => actions,
            getActionsContext: () => context,
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb250ZXh0TWVudS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxDb250ZXh0TWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQ2hHLDBDQW1CQztJQXJERDs7O09BR0c7SUFDSCxNQUFhLGVBQWU7UUFHM0IsWUFBWSxRQUEyQjtZQUN0Qyw4RUFBOEU7WUFDOUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxNQUFNO1lBQ0wsT0FBTztnQkFDTixJQUFJLHVDQUE4QjtnQkFDbEMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2FBQzNCLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFkRCwwQ0FjQztJQUVELE1BQWEsMkJBQTRCLFNBQVEsc0JBQVk7UUFFNUQsZ0VBQWdFO1FBQzdDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBZSxFQUFFLE9BQTZDO1lBQ2hHLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hGLHFDQUFxQztnQkFDckMsK0JBQStCO2dCQUMvQixNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3hDLE9BQU87WUFDUixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUFaRCxrRUFZQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxZQUFvQixFQUFFLEtBQWlCLEVBQUUsZ0JBQTZELEVBQUUsSUFBVyxFQUFFLGtCQUF1QyxFQUFFLFlBQXdCO1FBQ3JOLE1BQU0sYUFBYSxHQUFHLElBQUksK0JBQWtCLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxFLE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztRQUU5QixJQUFBLDJEQUFpQyxFQUFDLElBQUksRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTlFLElBQUksWUFBWSxFQUFFLENBQUM7WUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBc0IsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0JBQU8sRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUV0SCxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7WUFDbEMsWUFBWSxFQUFFLElBQUksMkJBQTJCLEVBQUU7WUFDL0MsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWE7WUFDOUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU87WUFDekIsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTztTQUNoQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=