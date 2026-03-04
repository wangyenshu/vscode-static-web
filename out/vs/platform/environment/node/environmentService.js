/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/platform/environment/common/environmentService", "vs/platform/environment/node/userDataPath"], function (require, exports, os_1, environmentService_1, userDataPath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeEnvironmentService = void 0;
    exports.parsePtyHostDebugPort = parsePtyHostDebugPort;
    exports.parseSharedProcessDebugPort = parseSharedProcessDebugPort;
    class NativeEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        constructor(args, productService) {
            super(args, {
                homeDir: (0, os_1.homedir)(),
                tmpDir: (0, os_1.tmpdir)(),
                userDataDir: (0, userDataPath_1.getUserDataPath)(args, productService.nameShort)
            }, productService);
        }
    }
    exports.NativeEnvironmentService = NativeEnvironmentService;
    function parsePtyHostDebugPort(args, isBuilt) {
        return (0, environmentService_1.parseDebugParams)(args['inspect-ptyhost'], args['inspect-brk-ptyhost'], 5877, isBuilt, args.extensionEnvironment);
    }
    function parseSharedProcessDebugPort(args, isBuilt) {
        return (0, environmentService_1.parseDebugParams)(args['inspect-sharedprocess'], args['inspect-brk-sharedprocess'], 5879, isBuilt, args.extensionEnvironment);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvbm9kZS9lbnZpcm9ubWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxzREFFQztJQUVELGtFQUVDO0lBakJELE1BQWEsd0JBQXlCLFNBQVEscURBQWdDO1FBRTdFLFlBQVksSUFBc0IsRUFBRSxjQUErQjtZQUNsRSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNYLE9BQU8sRUFBRSxJQUFBLFlBQU8sR0FBRTtnQkFDbEIsTUFBTSxFQUFFLElBQUEsV0FBTSxHQUFFO2dCQUNoQixXQUFXLEVBQUUsSUFBQSw4QkFBZSxFQUFDLElBQUksRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDO2FBQzVELEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBVEQsNERBU0M7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxJQUFzQixFQUFFLE9BQWdCO1FBQzdFLE9BQU8sSUFBQSxxQ0FBZ0IsRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3pILENBQUM7SUFFRCxTQUFnQiwyQkFBMkIsQ0FBQyxJQUFzQixFQUFFLE9BQWdCO1FBQ25GLE9BQU8sSUFBQSxxQ0FBZ0IsRUFBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3JJLENBQUMifQ==