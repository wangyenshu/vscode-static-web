/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/console"], function (require, exports, console_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logRemoteEntry = logRemoteEntry;
    exports.logRemoteEntryIfError = logRemoteEntryIfError;
    function logRemoteEntry(logService, entry, label = null) {
        const args = (0, console_1.parse)(entry).args;
        let firstArg = args.shift();
        if (typeof firstArg !== 'string') {
            return;
        }
        if (!entry.severity) {
            entry.severity = 'info';
        }
        if (label) {
            if (!/^\[/.test(label)) {
                label = `[${label}]`;
            }
            if (!/ $/.test(label)) {
                label = `${label} `;
            }
            firstArg = label + firstArg;
        }
        switch (entry.severity) {
            case 'log':
            case 'info':
                logService.info(firstArg, ...args);
                break;
            case 'warn':
                logService.warn(firstArg, ...args);
                break;
            case 'error':
                logService.error(firstArg, ...args);
                break;
        }
    }
    function logRemoteEntryIfError(logService, entry, label) {
        const args = (0, console_1.parse)(entry).args;
        const firstArg = args.shift();
        if (typeof firstArg !== 'string' || entry.severity !== 'error') {
            return;
        }
        if (!/^\[/.test(label)) {
            label = `[${label}]`;
        }
        if (!/ $/.test(label)) {
            label = `${label} `;
        }
        logService.error(label + firstArg, ...args);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQ29uc29sZVV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vcmVtb3RlQ29uc29sZVV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsd0NBaUNDO0lBRUQsc0RBZUM7SUFsREQsU0FBZ0IsY0FBYyxDQUFDLFVBQXVCLEVBQUUsS0FBd0IsRUFBRSxRQUF1QixJQUFJO1FBQzVHLE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBSyxFQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMvQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxPQUFPO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckIsS0FBSyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksS0FBSyxFQUFFLENBQUM7WUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QixLQUFLLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQztZQUN0QixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsS0FBSyxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUM7WUFDckIsQ0FBQztZQUNELFFBQVEsR0FBRyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQzdCLENBQUM7UUFFRCxRQUFRLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssTUFBTTtnQkFDVixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxNQUFNO1lBQ1AsS0FBSyxNQUFNO2dCQUNWLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLE1BQU07WUFDUCxLQUFLLE9BQU87Z0JBQ1gsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsTUFBTTtRQUNSLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IscUJBQXFCLENBQUMsVUFBdUIsRUFBRSxLQUF3QixFQUFFLEtBQWE7UUFDckcsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFLLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQy9CLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ2hFLE9BQU87UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QixLQUFLLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQztRQUN0QixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixLQUFLLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQztRQUNyQixDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDN0MsQ0FBQyJ9