/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBadge = exports.IconBadge = exports.NumberBadge = exports.IActivityService = void 0;
    exports.IActivityService = (0, instantiation_1.createDecorator)('activityService');
    class BaseBadge {
        constructor(descriptorFn) {
            this.descriptorFn = descriptorFn;
            this.descriptorFn = descriptorFn;
        }
        getDescription() {
            return this.descriptorFn(null);
        }
    }
    class NumberBadge extends BaseBadge {
        constructor(number, descriptorFn) {
            super(descriptorFn);
            this.number = number;
            this.number = number;
        }
        getDescription() {
            return this.descriptorFn(this.number);
        }
    }
    exports.NumberBadge = NumberBadge;
    class IconBadge extends BaseBadge {
        constructor(icon, descriptorFn) {
            super(descriptorFn);
            this.icon = icon;
        }
    }
    exports.IconBadge = IconBadge;
    class ProgressBadge extends BaseBadge {
    }
    exports.ProgressBadge = ProgressBadge;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWN0aXZpdHkvY29tbW9uL2FjdGl2aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFuRixRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsaUJBQWlCLENBQUMsQ0FBQztJQThDckYsTUFBTSxTQUFTO1FBRWQsWUFBcUIsWUFBa0M7WUFBbEMsaUJBQVksR0FBWixZQUFZLENBQXNCO1lBQ3RELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7S0FDRDtJQUVELE1BQWEsV0FBWSxTQUFRLFNBQVM7UUFFekMsWUFBcUIsTUFBYyxFQUFFLFlBQXFDO1lBQ3pFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQURBLFdBQU0sR0FBTixNQUFNLENBQVE7WUFHbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDdEIsQ0FBQztRQUVRLGNBQWM7WUFDdEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQ0Q7SUFYRCxrQ0FXQztJQUVELE1BQWEsU0FBVSxTQUFRLFNBQVM7UUFDdkMsWUFBcUIsSUFBZSxFQUFFLFlBQTBCO1lBQy9ELEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQURBLFNBQUksR0FBSixJQUFJLENBQVc7UUFFcEMsQ0FBQztLQUNEO0lBSkQsOEJBSUM7SUFFRCxNQUFhLGFBQWMsU0FBUSxTQUFTO0tBQUk7SUFBaEQsc0NBQWdEIn0=