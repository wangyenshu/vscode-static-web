/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionFeaturesManagementService = exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        Extensions.ExtensionFeaturesRegistry = 'workbench.registry.extensionFeatures';
    })(Extensions || (exports.Extensions = Extensions = {}));
    exports.IExtensionFeaturesManagementService = (0, instantiation_1.createDecorator)('IExtensionFeaturesManagementService');
    class ExtensionFeaturesRegistry {
        constructor() {
            this.extensionFeatures = new Map();
        }
        registerExtensionFeature(descriptor) {
            if (this.extensionFeatures.has(descriptor.id)) {
                throw new Error(`Extension feature with id '${descriptor.id}' already exists`);
            }
            this.extensionFeatures.set(descriptor.id, descriptor);
            return {
                dispose: () => this.extensionFeatures.delete(descriptor.id)
            };
        }
        getExtensionFeature(id) {
            return this.extensionFeatures.get(id);
        }
        getExtensionFeatures() {
            return Array.from(this.extensionFeatures.values());
        }
    }
    platform_1.Registry.add(Extensions.ExtensionFeaturesRegistry, new ExtensionFeaturesRegistry());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uRmVhdHVyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLElBQWlCLFVBQVUsQ0FFMUI7SUFGRCxXQUFpQixVQUFVO1FBQ2Isb0NBQXlCLEdBQUcsc0NBQXNDLENBQUM7SUFDakYsQ0FBQyxFQUZnQixVQUFVLDBCQUFWLFVBQVUsUUFFMUI7SUErRFksUUFBQSxtQ0FBbUMsR0FBRyxJQUFBLCtCQUFlLEVBQXNDLHFDQUFxQyxDQUFDLENBQUM7SUFnQi9JLE1BQU0seUJBQXlCO1FBQS9CO1lBRWtCLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUF1QyxDQUFDO1FBbUJyRixDQUFDO1FBakJBLHdCQUF3QixDQUFDLFVBQXVDO1lBQy9ELElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsVUFBVSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNoRixDQUFDO1lBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RELE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzthQUMzRCxDQUFDO1FBQ0gsQ0FBQztRQUVELG1CQUFtQixDQUFDLEVBQVU7WUFDN0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7S0FDRDtJQUVELG1CQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLHlCQUF5QixFQUFFLENBQUMsQ0FBQyJ9