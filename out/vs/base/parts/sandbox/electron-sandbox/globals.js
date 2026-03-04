/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.context = exports.process = exports.webFrame = exports.ipcMessagePort = exports.ipcRenderer = void 0;
    const vscodeGlobal = globalThis.vscode;
    exports.ipcRenderer = vscodeGlobal.ipcRenderer;
    exports.ipcMessagePort = vscodeGlobal.ipcMessagePort;
    exports.webFrame = vscodeGlobal.webFrame;
    exports.process = vscodeGlobal.process;
    exports.context = vscodeGlobal.context;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvc2FuZGJveC9lbGVjdHJvbi1zYW5kYm94L2dsb2JhbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0hoRyxNQUFNLFlBQVksR0FBSSxVQUFrQixDQUFDLE1BQU0sQ0FBQztJQUNuQyxRQUFBLFdBQVcsR0FBZ0IsWUFBWSxDQUFDLFdBQVcsQ0FBQztJQUNwRCxRQUFBLGNBQWMsR0FBbUIsWUFBWSxDQUFDLGNBQWMsQ0FBQztJQUM3RCxRQUFBLFFBQVEsR0FBYSxZQUFZLENBQUMsUUFBUSxDQUFDO0lBQzNDLFFBQUEsT0FBTyxHQUF3QixZQUFZLENBQUMsT0FBTyxDQUFDO0lBQ3BELFFBQUEsT0FBTyxHQUFvQixZQUFZLENBQUMsT0FBTyxDQUFDIn0=