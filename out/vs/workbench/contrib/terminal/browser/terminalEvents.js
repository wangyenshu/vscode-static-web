/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createInstanceCapabilityEventMultiplexer = createInstanceCapabilityEventMultiplexer;
    function createInstanceCapabilityEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, capabilityId, getEvent) {
        const store = new lifecycle_1.DisposableStore();
        const multiplexer = store.add(new event_1.EventMultiplexer());
        const capabilityListeners = store.add(new lifecycle_1.DisposableMap());
        function addCapability(instance, capability) {
            const listener = multiplexer.add(event_1.Event.map(getEvent(capability), data => ({ instance, data })));
            capabilityListeners.set(capability, listener);
        }
        // Existing capabilities
        for (const instance of currentInstances) {
            const capability = instance.capabilities.get(capabilityId);
            if (capability) {
                addCapability(instance, capability);
            }
        }
        // Added capabilities
        const addCapabilityMultiplexer = store.add(new event_1.DynamicListEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, instance => event_1.Event.map(instance.capabilities.onDidAddCapability, changeEvent => ({ instance, changeEvent }))));
        store.add(addCapabilityMultiplexer.event(e => {
            if (e.changeEvent.id === capabilityId) {
                addCapability(e.instance, e.changeEvent.capability);
            }
        }));
        // Removed capabilities
        const removeCapabilityMultiplexer = store.add(new event_1.DynamicListEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, instance => instance.capabilities.onDidRemoveCapability));
        store.add(removeCapabilityMultiplexer.event(e => {
            if (e.id === capabilityId) {
                capabilityListeners.deleteAndDispose(e.capability);
            }
        }));
        return {
            dispose: () => store.dispose(),
            event: multiplexer.event
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFdmVudHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsRXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLDRGQXNEQztJQXRERCxTQUFnQix3Q0FBd0MsQ0FDdkQsZ0JBQXFDLEVBQ3JDLGFBQXVDLEVBQ3ZDLGdCQUEwQyxFQUMxQyxZQUFlLEVBQ2YsUUFBaUU7UUFFakUsTUFBTSxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHdCQUFnQixFQUE0QyxDQUFDLENBQUM7UUFDaEcsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQWEsRUFBOEMsQ0FBQyxDQUFDO1FBRXZHLFNBQVMsYUFBYSxDQUFDLFFBQTJCLEVBQUUsVUFBeUM7WUFDNUYsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsd0JBQXdCO1FBQ3hCLEtBQUssTUFBTSxRQUFRLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUN6QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixhQUFhLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDO1FBRUQscUJBQXFCO1FBQ3JCLE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1DQUEyQixDQUN6RSxnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLGdCQUFnQixFQUNoQixRQUFRLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUMzRyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM1QyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUN2QyxhQUFhLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosdUJBQXVCO1FBQ3ZCLE1BQU0sMkJBQTJCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1DQUEyQixDQUM1RSxnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLGdCQUFnQixFQUNoQixRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQ3ZELENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9DLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDM0IsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BELENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTztZQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO1lBQzlCLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSztTQUN4QixDQUFDO0lBQ0gsQ0FBQyJ9