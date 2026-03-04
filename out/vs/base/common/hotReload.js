/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isHotReloadEnabled = isHotReloadEnabled;
    exports.registerHotReloadHandler = registerHotReloadHandler;
    function isHotReloadEnabled() {
        return process_1.env && !!process_1.env['VSCODE_DEV'];
    }
    function registerHotReloadHandler(handler) {
        if (!isHotReloadEnabled()) {
            return { dispose() { } };
        }
        else {
            const handlers = registerGlobalHotReloadHandler();
            handlers.add(handler);
            return {
                dispose() { handlers.delete(handler); }
            };
        }
    }
    function registerGlobalHotReloadHandler() {
        if (!hotReloadHandlers) {
            hotReloadHandlers = new Set();
        }
        const g = globalThis;
        if (!g.$hotReload_applyNewExports) {
            g.$hotReload_applyNewExports = args => {
                const args2 = { config: { mode: undefined }, ...args };
                for (const h of hotReloadHandlers) {
                    const result = h(args2);
                    if (result) {
                        return result;
                    }
                }
                return undefined;
            };
        }
        return hotReloadHandlers;
    }
    let hotReloadHandlers = undefined;
    if (isHotReloadEnabled()) {
        // This code does not run in production.
        registerHotReloadHandler(({ oldExports, newSrc, config }) => {
            if (config.mode !== 'patch-prototype') {
                return undefined;
            }
            return newExports => {
                for (const key in newExports) {
                    const exportedItem = newExports[key];
                    console.log(`[hot-reload] Patching prototype methods of '${key}'`, { exportedItem });
                    if (typeof exportedItem === 'function' && exportedItem.prototype) {
                        const oldExportedItem = oldExports[key];
                        if (oldExportedItem) {
                            for (const prop of Object.getOwnPropertyNames(exportedItem.prototype)) {
                                const descriptor = Object.getOwnPropertyDescriptor(exportedItem.prototype, prop);
                                const oldDescriptor = Object.getOwnPropertyDescriptor(oldExportedItem.prototype, prop);
                                if (descriptor?.value?.toString() !== oldDescriptor?.value?.toString()) {
                                    console.log(`[hot-reload] Patching prototype method '${key}.${prop}'`);
                                }
                                Object.defineProperty(oldExportedItem.prototype, prop, descriptor);
                            }
                            newExports[key] = oldExportedItem;
                        }
                    }
                }
                return true;
            };
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG90UmVsb2FkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vaG90UmVsb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLGdEQUVDO0lBQ0QsNERBVUM7SUFiRCxTQUFnQixrQkFBa0I7UUFDakMsT0FBTyxhQUFHLElBQUksQ0FBQyxDQUFDLGFBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBQ0QsU0FBZ0Isd0JBQXdCLENBQUMsT0FBeUI7UUFDakUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQztZQUMzQixPQUFPLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzFCLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsOEJBQThCLEVBQUUsQ0FBQztZQUNsRCxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLE9BQU87Z0JBQ04sT0FBTyxLQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3ZDLENBQUM7UUFDSCxDQUFDO0lBQ0YsQ0FBQztJQVlELFNBQVMsOEJBQThCO1FBQ3RDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3hCLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFHLFVBQTJDLENBQUM7UUFDdEQsSUFBSSxDQUFDLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ25DLENBQUMsQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsRUFBRTtnQkFDckMsTUFBTSxLQUFLLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQztnQkFFdkQsS0FBSyxNQUFNLENBQUMsSUFBSSxpQkFBa0IsRUFBRSxDQUFDO29CQUNwQyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3hCLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQUMsT0FBTyxNQUFNLENBQUM7b0JBQUMsQ0FBQztnQkFDL0IsQ0FBQztnQkFDRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxpQkFBaUIsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxpQkFBaUIsR0FBZ0osU0FBUyxDQUFDO0lBWS9LLElBQUksa0JBQWtCLEVBQUUsRUFBRSxDQUFDO1FBQzFCLHdDQUF3QztRQUN4Qyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO1lBQzNELElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxVQUFVLENBQUMsRUFBRTtnQkFDbkIsS0FBSyxNQUFNLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDOUIsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxHQUFHLEdBQUcsRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBQ3JGLElBQUksT0FBTyxZQUFZLEtBQUssVUFBVSxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDbEUsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUN4QyxJQUFJLGVBQWUsRUFBRSxDQUFDOzRCQUNyQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQ0FDdkUsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0NBQ2xGLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBRSxlQUF1QixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQ0FFaEcsSUFBSSxVQUFVLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLGFBQWEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQ0FDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQ0FBMkMsR0FBRyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7Z0NBQ3hFLENBQUM7Z0NBRUQsTUFBTSxDQUFDLGNBQWMsQ0FBRSxlQUF1QixDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQzdFLENBQUM7NEJBQ0QsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQzt3QkFDbkMsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==