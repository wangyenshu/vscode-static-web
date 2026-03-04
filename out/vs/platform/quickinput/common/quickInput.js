/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, instantiation_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IQuickInputService = exports.quickPickItemScorerAccessor = exports.QuickPickItemScorerAccessor = exports.ItemActivation = exports.QuickInputHideReason = exports.NO_KEY_MODS = void 0;
    exports.NO_KEY_MODS = { ctrlCmd: false, alt: false };
    var QuickInputHideReason;
    (function (QuickInputHideReason) {
        /**
         * Focus moved away from the quick input.
         */
        QuickInputHideReason[QuickInputHideReason["Blur"] = 1] = "Blur";
        /**
         * An explicit user gesture, e.g. pressing Escape key.
         */
        QuickInputHideReason[QuickInputHideReason["Gesture"] = 2] = "Gesture";
        /**
         * Anything else.
         */
        QuickInputHideReason[QuickInputHideReason["Other"] = 3] = "Other";
    })(QuickInputHideReason || (exports.QuickInputHideReason = QuickInputHideReason = {}));
    /**
     * Represents the activation behavior for items in a quick input. This means which item will be
     * "active" (aka focused).
     */
    var ItemActivation;
    (function (ItemActivation) {
        /**
         * No item will be active.
         */
        ItemActivation[ItemActivation["NONE"] = 0] = "NONE";
        /**
         * First item will be active.
         */
        ItemActivation[ItemActivation["FIRST"] = 1] = "FIRST";
        /**
         * Second item will be active.
         */
        ItemActivation[ItemActivation["SECOND"] = 2] = "SECOND";
        /**
         * Last item will be active.
         */
        ItemActivation[ItemActivation["LAST"] = 3] = "LAST";
    })(ItemActivation || (exports.ItemActivation = ItemActivation = {}));
    class QuickPickItemScorerAccessor {
        constructor(options) {
            this.options = options;
        }
        getItemLabel(entry) {
            return entry.label;
        }
        getItemDescription(entry) {
            if (this.options?.skipDescription) {
                return undefined;
            }
            return entry.description;
        }
        getItemPath(entry) {
            if (this.options?.skipPath) {
                return undefined;
            }
            if (entry.resource?.scheme === network_1.Schemas.file) {
                return entry.resource.fsPath;
            }
            return entry.resource?.path;
        }
    }
    exports.QuickPickItemScorerAccessor = QuickPickItemScorerAccessor;
    exports.quickPickItemScorerAccessor = new QuickPickItemScorerAccessor();
    //#endregion
    exports.IQuickInputService = (0, instantiation_1.createDecorator)('quickInputService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvY29tbW9uL3F1aWNrSW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUVuRixRQUFBLFdBQVcsR0FBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBa0hwRSxJQUFZLG9CQWdCWDtJQWhCRCxXQUFZLG9CQUFvQjtRQUUvQjs7V0FFRztRQUNILCtEQUFRLENBQUE7UUFFUjs7V0FFRztRQUNILHFFQUFPLENBQUE7UUFFUDs7V0FFRztRQUNILGlFQUFLLENBQUE7SUFDTixDQUFDLEVBaEJXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBZ0IvQjtJQW9JRDs7O09BR0c7SUFDSCxJQUFZLGNBaUJYO0lBakJELFdBQVksY0FBYztRQUN6Qjs7V0FFRztRQUNILG1EQUFJLENBQUE7UUFDSjs7V0FFRztRQUNILHFEQUFLLENBQUE7UUFDTDs7V0FFRztRQUNILHVEQUFNLENBQUE7UUFDTjs7V0FFRztRQUNILG1EQUFJLENBQUE7SUFDTCxDQUFDLEVBakJXLGNBQWMsOEJBQWQsY0FBYyxRQWlCekI7SUFzVkQsTUFBYSwyQkFBMkI7UUFFdkMsWUFBb0IsT0FBMkQ7WUFBM0QsWUFBTyxHQUFQLE9BQU8sQ0FBb0Q7UUFBSSxDQUFDO1FBRXBGLFlBQVksQ0FBQyxLQUFpQztZQUM3QyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDcEIsQ0FBQztRQUVELGtCQUFrQixDQUFDLEtBQWlDO1lBQ25ELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUMxQixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQWlDO1lBQzVDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDN0MsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUM5QixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztRQUM3QixDQUFDO0tBQ0Q7SUEzQkQsa0VBMkJDO0lBRVksUUFBQSwyQkFBMkIsR0FBRyxJQUFJLDJCQUEyQixFQUFFLENBQUM7SUFFN0UsWUFBWTtJQUVDLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSwrQkFBZSxFQUFxQixtQkFBbUIsQ0FBQyxDQUFDIn0=