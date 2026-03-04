/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.explorerFileContribRegistry = exports.ExplorerExtensions = void 0;
    var ExplorerExtensions;
    (function (ExplorerExtensions) {
        ExplorerExtensions["FileContributionRegistry"] = "workbench.registry.explorer.fileContributions";
    })(ExplorerExtensions || (exports.ExplorerExtensions = ExplorerExtensions = {}));
    class ExplorerFileContributionRegistry {
        constructor() {
            this.descriptors = [];
        }
        /** @inheritdoc */
        register(descriptor) {
            this.descriptors.push(descriptor);
        }
        /**
         * Creates a new instance of all registered contributions.
         */
        create(insta, container, store) {
            return this.descriptors.map(d => {
                const i = d.create(insta, container);
                store.add(i);
                return i;
            });
        }
    }
    exports.explorerFileContribRegistry = new ExplorerFileContributionRegistry();
    platform_1.Registry.add("workbench.registry.explorer.fileContributions" /* ExplorerExtensions.FileContributionRegistry */, exports.explorerFileContribRegistry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlQ29udHJpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvZXhwbG9yZXJGaWxlQ29udHJpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsSUFBa0Isa0JBRWpCO0lBRkQsV0FBa0Isa0JBQWtCO1FBQ25DLGdHQUEwRSxDQUFBO0lBQzNFLENBQUMsRUFGaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFFbkM7SUF5QkQsTUFBTSxnQ0FBZ0M7UUFBdEM7WUFDa0IsZ0JBQVcsR0FBMEMsRUFBRSxDQUFDO1FBaUIxRSxDQUFDO1FBZkEsa0JBQWtCO1FBQ1gsUUFBUSxDQUFDLFVBQStDO1lBQzlELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxLQUE0QixFQUFFLFNBQXNCLEVBQUUsS0FBc0I7WUFDekYsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQUVZLFFBQUEsMkJBQTJCLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO0lBQ2xGLG1CQUFRLENBQUMsR0FBRyxvR0FBOEMsbUNBQTJCLENBQUMsQ0FBQyJ9