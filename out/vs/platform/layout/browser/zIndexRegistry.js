/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async"], function (require, exports, dom_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZIndex = void 0;
    exports.registerZIndex = registerZIndex;
    var ZIndex;
    (function (ZIndex) {
        ZIndex[ZIndex["Base"] = 0] = "Base";
        ZIndex[ZIndex["Sash"] = 35] = "Sash";
        ZIndex[ZIndex["SuggestWidget"] = 40] = "SuggestWidget";
        ZIndex[ZIndex["Hover"] = 50] = "Hover";
        ZIndex[ZIndex["DragImage"] = 1000] = "DragImage";
        ZIndex[ZIndex["MenubarMenuItemsHolder"] = 2000] = "MenubarMenuItemsHolder";
        ZIndex[ZIndex["ContextView"] = 2500] = "ContextView";
        ZIndex[ZIndex["ModalDialog"] = 2600] = "ModalDialog";
        ZIndex[ZIndex["PaneDropOverlay"] = 10000] = "PaneDropOverlay";
    })(ZIndex || (exports.ZIndex = ZIndex = {}));
    const ZIndexValues = Object.keys(ZIndex).filter(key => !isNaN(Number(key))).map(key => Number(key)).sort((a, b) => b - a);
    function findBase(z) {
        for (const zi of ZIndexValues) {
            if (z >= zi) {
                return zi;
            }
        }
        return -1;
    }
    class ZIndexRegistry {
        constructor() {
            this.styleSheet = (0, dom_1.createStyleSheet)();
            this.zIndexMap = new Map();
            this.scheduler = new async_1.RunOnceScheduler(() => this.updateStyleElement(), 200);
        }
        registerZIndex(relativeLayer, z, name) {
            if (this.zIndexMap.get(name)) {
                throw new Error(`z-index with name ${name} has already been registered.`);
            }
            const proposedZValue = relativeLayer + z;
            if (findBase(proposedZValue) !== relativeLayer) {
                throw new Error(`Relative layer: ${relativeLayer} + z-index: ${z} exceeds next layer ${proposedZValue}.`);
            }
            this.zIndexMap.set(name, proposedZValue);
            this.scheduler.schedule();
            return this.getVarName(name);
        }
        getVarName(name) {
            return `--z-index-${name}`;
        }
        updateStyleElement() {
            (0, dom_1.clearNode)(this.styleSheet);
            let ruleBuilder = '';
            this.zIndexMap.forEach((zIndex, name) => {
                ruleBuilder += `${this.getVarName(name)}: ${zIndex};\n`;
            });
            (0, dom_1.createCSSRule)(':root', ruleBuilder, this.styleSheet);
        }
    }
    const zIndexRegistry = new ZIndexRegistry();
    function registerZIndex(relativeLayer, z, name) {
        return zIndexRegistry.registerZIndex(relativeLayer, z, name);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiekluZGV4UmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sYXlvdXQvYnJvd3Nlci96SW5kZXhSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRWhHLHdDQUVDO0lBbEVELElBQVksTUFVWDtJQVZELFdBQVksTUFBTTtRQUNqQixtQ0FBUSxDQUFBO1FBQ1Isb0NBQVMsQ0FBQTtRQUNULHNEQUFrQixDQUFBO1FBQ2xCLHNDQUFVLENBQUE7UUFDVixnREFBZ0IsQ0FBQTtRQUNoQiwwRUFBNkIsQ0FBQTtRQUM3QixvREFBa0IsQ0FBQTtRQUNsQixvREFBa0IsQ0FBQTtRQUNsQiw2REFBdUIsQ0FBQTtJQUN4QixDQUFDLEVBVlcsTUFBTSxzQkFBTixNQUFNLFFBVWpCO0lBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMxSCxTQUFTLFFBQVEsQ0FBQyxDQUFTO1FBQzFCLEtBQUssTUFBTSxFQUFFLElBQUksWUFBWSxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQsTUFBTSxjQUFjO1FBSW5CO1lBQ0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFBLHNCQUFnQixHQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELGNBQWMsQ0FBQyxhQUFxQixFQUFFLENBQVMsRUFBRSxJQUFZO1lBQzVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsSUFBSSwrQkFBK0IsQ0FBQyxDQUFDO1lBQzNFLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixhQUFhLGVBQWUsQ0FBQyx1QkFBdUIsY0FBYyxHQUFHLENBQUMsQ0FBQztZQUMzRyxDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDMUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFTyxVQUFVLENBQUMsSUFBWTtZQUM5QixPQUFPLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUN2QyxXQUFXLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLE1BQU0sS0FBSyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBQSxtQkFBYSxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FDRDtJQUVELE1BQU0sY0FBYyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7SUFFNUMsU0FBZ0IsY0FBYyxDQUFDLGFBQXFCLEVBQUUsQ0FBUyxFQUFFLElBQVk7UUFDNUUsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDOUQsQ0FBQyJ9