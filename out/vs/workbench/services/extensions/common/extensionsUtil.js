/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/nls", "vs/base/common/semver/semver"], function (require, exports, extensions_1, nls_1, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dedupExtensions = dedupExtensions;
    // TODO: @sandy081 merge this with deduping in extensionsScannerService.ts
    function dedupExtensions(system, user, development, logService) {
        const result = new extensions_1.ExtensionIdentifierMap();
        system.forEach((systemExtension) => {
            const extension = result.get(systemExtension.identifier);
            if (extension) {
                logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, systemExtension.extensionLocation.fsPath));
            }
            result.set(systemExtension.identifier, systemExtension);
        });
        user.forEach((userExtension) => {
            const extension = result.get(userExtension.identifier);
            if (extension) {
                if (extension.isBuiltin) {
                    if (semver.gte(extension.version, userExtension.version)) {
                        logService.warn(`Skipping extension ${userExtension.extensionLocation.path} in favour of the builtin extension ${extension.extensionLocation.path}.`);
                        return;
                    }
                    // Overwriting a builtin extension inherits the `isBuiltin` property and it doesn't show a warning
                    userExtension.isBuiltin = true;
                }
                else {
                    logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, userExtension.extensionLocation.fsPath));
                }
            }
            else if (userExtension.isBuiltin) {
                logService.warn(`Skipping obsolete builtin extension ${userExtension.extensionLocation.path}`);
                return;
            }
            result.set(userExtension.identifier, userExtension);
        });
        development.forEach(developedExtension => {
            logService.info((0, nls_1.localize)('extensionUnderDevelopment', "Loading development extension at {0}", developedExtension.extensionLocation.fsPath));
            const extension = result.get(developedExtension.identifier);
            if (extension) {
                if (extension.isBuiltin) {
                    // Overwriting a builtin extension inherits the `isBuiltin` property
                    developedExtension.isBuiltin = true;
                }
            }
            result.set(developedExtension.identifier, developedExtension);
        });
        return Array.from(result.values());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1V0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uc1V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsMENBd0NDO0lBekNELDBFQUEwRTtJQUMxRSxTQUFnQixlQUFlLENBQUMsTUFBK0IsRUFBRSxJQUE2QixFQUFFLFdBQW9DLEVBQUUsVUFBdUI7UUFDNUosTUFBTSxNQUFNLEdBQUcsSUFBSSxtQ0FBc0IsRUFBeUIsQ0FBQztRQUNuRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUU7WUFDbEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDekQsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHFDQUFxQyxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEssQ0FBQztZQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxhQUFhLEVBQUUsRUFBRTtZQUM5QixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2RCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN6QixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDMUQsVUFBVSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsYUFBYSxDQUFDLGlCQUFpQixDQUFDLElBQUksdUNBQXVDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO3dCQUN0SixPQUFPO29CQUNSLENBQUM7b0JBQ0Qsa0dBQWtHO29CQUNuRSxhQUFjLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDaEUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUscUNBQXFDLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDdEssQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxJQUFJLENBQUMsdUNBQXVDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNILFdBQVcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRTtZQUN4QyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHNDQUFzQyxFQUFFLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDNUksTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM1RCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN6QixvRUFBb0U7b0JBQ3JDLGtCQUFtQixDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3JFLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNwQyxDQUFDIn0=