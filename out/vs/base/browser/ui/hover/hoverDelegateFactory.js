/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy"], function (require, exports, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setHoverDelegateFactory = setHoverDelegateFactory;
    exports.getDefaultHoverDelegate = getDefaultHoverDelegate;
    exports.createInstantHoverDelegate = createInstantHoverDelegate;
    const nullHoverDelegateFactory = () => ({
        get delay() { return -1; },
        dispose: () => { },
        showHover: () => { return undefined; },
    });
    let hoverDelegateFactory = nullHoverDelegateFactory;
    const defaultHoverDelegateMouse = new lazy_1.Lazy(() => hoverDelegateFactory('mouse', false));
    const defaultHoverDelegateElement = new lazy_1.Lazy(() => hoverDelegateFactory('element', false));
    // TODO: Remove when getDefaultHoverDelegate is no longer used
    function setHoverDelegateFactory(hoverDelegateProvider) {
        hoverDelegateFactory = hoverDelegateProvider;
    }
    // TODO: Refine type for use in new IHoverService interface
    function getDefaultHoverDelegate(placement) {
        if (placement === 'element') {
            return defaultHoverDelegateElement.value;
        }
        return defaultHoverDelegateMouse.value;
    }
    // TODO: Create equivalent in IHoverService
    function createInstantHoverDelegate() {
        // Creates a hover delegate with instant hover enabled.
        // This hover belongs to the consumer and requires the them to dispose it.
        // Instant hover only makes sense for 'element' placement.
        return hoverDelegateFactory('element', true);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJEZWxlZ2F0ZUZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvaG92ZXIvaG92ZXJEZWxlZ2F0ZUZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLDBEQUVDO0lBR0QsMERBS0M7SUFHRCxnRUFLQztJQTdCRCxNQUFNLHdCQUF3QixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDdkMsSUFBSSxLQUFLLEtBQWEsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDbEIsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztLQUN0QyxDQUFDLENBQUM7SUFFSCxJQUFJLG9CQUFvQixHQUEwRix3QkFBd0IsQ0FBQztJQUMzSSxNQUFNLHlCQUF5QixHQUFHLElBQUksV0FBSSxDQUFpQixHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2RyxNQUFNLDJCQUEyQixHQUFHLElBQUksV0FBSSxDQUFpQixHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUUzRyw4REFBOEQ7SUFDOUQsU0FBZ0IsdUJBQXVCLENBQUMscUJBQThHO1FBQ3JKLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO0lBQzlDLENBQUM7SUFFRCwyREFBMkQ7SUFDM0QsU0FBZ0IsdUJBQXVCLENBQUMsU0FBOEI7UUFDckUsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsT0FBTywyQkFBMkIsQ0FBQyxLQUFLLENBQUM7UUFDMUMsQ0FBQztRQUNELE9BQU8seUJBQXlCLENBQUMsS0FBSyxDQUFDO0lBQ3hDLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0MsU0FBZ0IsMEJBQTBCO1FBQ3pDLHVEQUF1RDtRQUN2RCwwRUFBMEU7UUFDMUUsMERBQTBEO1FBQzFELE9BQU8sb0JBQW9CLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUMifQ==