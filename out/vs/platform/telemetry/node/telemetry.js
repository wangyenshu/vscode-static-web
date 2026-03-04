/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, path_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTelemetryMessage = buildTelemetryMessage;
    async function buildTelemetryMessage(appRoot, extensionsPath) {
        const mergedTelemetry = Object.create(null);
        // Simple function to merge the telemetry into one json object
        const mergeTelemetry = (contents, dirName) => {
            const telemetryData = JSON.parse(contents);
            mergedTelemetry[dirName] = telemetryData;
        };
        if (extensionsPath) {
            const dirs = [];
            const files = await pfs_1.Promises.readdir(extensionsPath);
            for (const file of files) {
                try {
                    const fileStat = await pfs_1.Promises.stat((0, path_1.join)(extensionsPath, file));
                    if (fileStat.isDirectory()) {
                        dirs.push(file);
                    }
                }
                catch {
                    // This handles case where broken symbolic links can cause statSync to throw and error
                }
            }
            const telemetryJsonFolders = [];
            for (const dir of dirs) {
                const files = (await pfs_1.Promises.readdir((0, path_1.join)(extensionsPath, dir))).filter(file => file === 'telemetry.json');
                if (files.length === 1) {
                    telemetryJsonFolders.push(dir); // // We know it contains a telemetry.json file so we add it to the list of folders which have one
                }
            }
            for (const folder of telemetryJsonFolders) {
                const contents = (await pfs_1.Promises.readFile((0, path_1.join)(extensionsPath, folder, 'telemetry.json'))).toString();
                mergeTelemetry(contents, folder);
            }
        }
        let contents = (await pfs_1.Promises.readFile((0, path_1.join)(appRoot, 'telemetry-core.json'))).toString();
        mergeTelemetry(contents, 'vscode-core');
        contents = (await pfs_1.Promises.readFile((0, path_1.join)(appRoot, 'telemetry-extensions.json'))).toString();
        mergeTelemetry(contents, 'vscode-extensions');
        return JSON.stringify(mergedTelemetry, null, 4);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L25vZGUvdGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLHNEQTZDQztJQTdDTSxLQUFLLFVBQVUscUJBQXFCLENBQUMsT0FBZSxFQUFFLGNBQXVCO1FBQ25GLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFNUMsOERBQThEO1FBQzlELE1BQU0sY0FBYyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsRUFBRTtZQUM1RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNDLGVBQWUsQ0FBQyxPQUFPLENBQUMsR0FBRyxhQUFhLENBQUM7UUFDMUMsQ0FBQyxDQUFDO1FBRUYsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7WUFFMUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxjQUFRLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3JELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQztvQkFDSixNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7d0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2pCLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxNQUFNLENBQUM7b0JBQ1Isc0ZBQXNGO2dCQUN2RixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQWEsRUFBRSxDQUFDO1lBQzFDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBTSxjQUFRLENBQUMsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLENBQUM7Z0JBQzVHLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0dBQWtHO2dCQUNuSSxDQUFDO1lBQ0YsQ0FBQztZQUVELEtBQUssTUFBTSxNQUFNLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUFNLGNBQVEsQ0FBQyxRQUFRLENBQUMsSUFBQSxXQUFJLEVBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdEcsY0FBYyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksUUFBUSxHQUFHLENBQUMsTUFBTSxjQUFRLENBQUMsUUFBUSxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxRixjQUFjLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRXhDLFFBQVEsR0FBRyxDQUFDLE1BQU0sY0FBUSxDQUFDLFFBQVEsQ0FBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUYsY0FBYyxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRTlDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pELENBQUMifQ==