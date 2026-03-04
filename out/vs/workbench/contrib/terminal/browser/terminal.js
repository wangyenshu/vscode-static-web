/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDataTransfers = exports.LinuxDistro = exports.XtermTerminalConstants = exports.terminalEditorId = exports.TerminalLinkQuickPickEvent = exports.isDetachedTerminalInstance = exports.TerminalConnectionState = exports.Direction = exports.ITerminalInstanceService = exports.ITerminalGroupService = exports.ITerminalEditorService = exports.ITerminalConfigurationService = exports.ITerminalService = void 0;
    exports.ITerminalService = (0, instantiation_1.createDecorator)('terminalService');
    exports.ITerminalConfigurationService = (0, instantiation_1.createDecorator)('terminalConfigurationService');
    exports.ITerminalEditorService = (0, instantiation_1.createDecorator)('terminalEditorService');
    exports.ITerminalGroupService = (0, instantiation_1.createDecorator)('terminalGroupService');
    exports.ITerminalInstanceService = (0, instantiation_1.createDecorator)('terminalInstanceService');
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Up"] = 2] = "Up";
        Direction[Direction["Down"] = 3] = "Down";
    })(Direction || (exports.Direction = Direction = {}));
    var TerminalConnectionState;
    (function (TerminalConnectionState) {
        TerminalConnectionState[TerminalConnectionState["Connecting"] = 0] = "Connecting";
        TerminalConnectionState[TerminalConnectionState["Connected"] = 1] = "Connected";
    })(TerminalConnectionState || (exports.TerminalConnectionState = TerminalConnectionState = {}));
    const isDetachedTerminalInstance = (t) => typeof t.instanceId !== 'number';
    exports.isDetachedTerminalInstance = isDetachedTerminalInstance;
    class TerminalLinkQuickPickEvent extends MouseEvent {
    }
    exports.TerminalLinkQuickPickEvent = TerminalLinkQuickPickEvent;
    exports.terminalEditorId = 'terminalEditor';
    var XtermTerminalConstants;
    (function (XtermTerminalConstants) {
        XtermTerminalConstants[XtermTerminalConstants["SearchHighlightLimit"] = 1000] = "SearchHighlightLimit";
    })(XtermTerminalConstants || (exports.XtermTerminalConstants = XtermTerminalConstants = {}));
    var LinuxDistro;
    (function (LinuxDistro) {
        LinuxDistro[LinuxDistro["Unknown"] = 1] = "Unknown";
        LinuxDistro[LinuxDistro["Fedora"] = 2] = "Fedora";
        LinuxDistro[LinuxDistro["Ubuntu"] = 3] = "Ubuntu";
    })(LinuxDistro || (exports.LinuxDistro = LinuxDistro = {}));
    var TerminalDataTransfers;
    (function (TerminalDataTransfers) {
        TerminalDataTransfers["Terminals"] = "Terminals";
    })(TerminalDataTransfers || (exports.TerminalDataTransfers = TerminalDataTransfers = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThCbkYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLCtCQUFlLEVBQW1CLGlCQUFpQixDQUFDLENBQUM7SUFDeEUsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLDhCQUE4QixDQUFDLENBQUM7SUFDL0csUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHVCQUF1QixDQUFDLENBQUM7SUFDMUYsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFDdkYsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLHlCQUF5QixDQUFDLENBQUM7SUFxRDdHLElBQWtCLFNBS2pCO0lBTEQsV0FBa0IsU0FBUztRQUMxQix5Q0FBUSxDQUFBO1FBQ1IsMkNBQVMsQ0FBQTtRQUNULHFDQUFNLENBQUE7UUFDTix5Q0FBUSxDQUFBO0lBQ1QsQ0FBQyxFQUxpQixTQUFTLHlCQUFULFNBQVMsUUFLMUI7SUFxREQsSUFBa0IsdUJBR2pCO0lBSEQsV0FBa0IsdUJBQXVCO1FBQ3hDLGlGQUFVLENBQUE7UUFDViwrRUFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUhpQix1QkFBdUIsdUNBQXZCLHVCQUF1QixRQUd4QztJQW1GTSxNQUFNLDBCQUEwQixHQUFHLENBQUMsQ0FBZ0QsRUFBa0MsRUFBRSxDQUFDLE9BQVEsQ0FBdUIsQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDO0lBQTNLLFFBQUEsMEJBQTBCLDhCQUFpSjtJQXNJeEwsTUFBYSwwQkFBMkIsU0FBUSxVQUFVO0tBRXpEO0lBRkQsZ0VBRUM7SUF3QlksUUFBQSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQW1vQmpELElBQWtCLHNCQUVqQjtJQUZELFdBQWtCLHNCQUFzQjtRQUN2QyxzR0FBMkIsQ0FBQTtJQUM1QixDQUFDLEVBRmlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBRXZDO0lBaU1ELElBQWtCLFdBSWpCO0lBSkQsV0FBa0IsV0FBVztRQUM1QixtREFBVyxDQUFBO1FBQ1gsaURBQVUsQ0FBQTtRQUNWLGlEQUFVLENBQUE7SUFDWCxDQUFDLEVBSmlCLFdBQVcsMkJBQVgsV0FBVyxRQUk1QjtJQUVELElBQWtCLHFCQUVqQjtJQUZELFdBQWtCLHFCQUFxQjtRQUN0QyxnREFBdUIsQ0FBQTtJQUN4QixDQUFDLEVBRmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBRXRDIn0=