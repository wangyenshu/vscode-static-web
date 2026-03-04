/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation"], function (require, exports, network_1, resources_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostFileSystemInfo = exports.ExtHostFileSystemInfo = void 0;
    class ExtHostFileSystemInfo {
        constructor() {
            this._systemSchemes = new Set(Object.keys(network_1.Schemas));
            this._providerInfo = new Map();
            this.extUri = new resources_1.ExtUri(uri => {
                const capabilities = this._providerInfo.get(uri.scheme);
                if (capabilities === undefined) {
                    // default: not ignore
                    return false;
                }
                if (capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */) {
                    // configured as case sensitive
                    return false;
                }
                return true;
            });
        }
        $acceptProviderInfos(uri, capabilities) {
            if (capabilities === null) {
                this._providerInfo.delete(uri.scheme);
            }
            else {
                this._providerInfo.set(uri.scheme, capabilities);
            }
        }
        isFreeScheme(scheme) {
            return !this._providerInfo.has(scheme) && !this._systemSchemes.has(scheme);
        }
        getCapabilities(scheme) {
            return this._providerInfo.get(scheme);
        }
    }
    exports.ExtHostFileSystemInfo = ExtHostFileSystemInfo;
    exports.IExtHostFileSystemInfo = (0, instantiation_1.createDecorator)('IExtHostFileSystemInfo');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1JbmZvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEZpbGVTeXN0ZW1JbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHFCQUFxQjtRQVNqQztZQUxpQixtQkFBYyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0Msa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUsxRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksa0JBQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDOUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsc0JBQXNCO29CQUN0QixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELElBQUksWUFBWSw4REFBbUQsRUFBRSxDQUFDO29CQUNyRSwrQkFBK0I7b0JBQy9CLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxHQUFrQixFQUFFLFlBQTJCO1lBQ25FLElBQUksWUFBWSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUFZLENBQUMsTUFBYztZQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsZUFBZSxDQUFDLE1BQWM7WUFDN0IsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQ0Q7SUF2Q0Qsc0RBdUNDO0lBS1ksUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHdCQUF3QixDQUFDLENBQUMifQ==