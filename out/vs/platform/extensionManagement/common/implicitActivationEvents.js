/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/extensions/common/extensions"], function (require, exports, errors_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImplicitActivationEvents = exports.ImplicitActivationEventsImpl = void 0;
    class ImplicitActivationEventsImpl {
        constructor() {
            this._generators = new Map();
            this._cache = new WeakMap();
        }
        register(extensionPointName, generator) {
            this._generators.set(extensionPointName, generator);
        }
        /**
         * This can run correctly only on the renderer process because that is the only place
         * where all extension points and all implicit activation events generators are known.
         */
        readActivationEvents(extensionDescription) {
            if (!this._cache.has(extensionDescription)) {
                this._cache.set(extensionDescription, this._readActivationEvents(extensionDescription));
            }
            return this._cache.get(extensionDescription);
        }
        /**
         * This can run correctly only on the renderer process because that is the only place
         * where all extension points and all implicit activation events generators are known.
         */
        createActivationEventsMap(extensionDescriptions) {
            const result = Object.create(null);
            for (const extensionDescription of extensionDescriptions) {
                const activationEvents = this.readActivationEvents(extensionDescription);
                if (activationEvents.length > 0) {
                    result[extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier)] = activationEvents;
                }
            }
            return result;
        }
        _readActivationEvents(desc) {
            if (typeof desc.main === 'undefined' && typeof desc.browser === 'undefined') {
                return [];
            }
            const activationEvents = (Array.isArray(desc.activationEvents) ? desc.activationEvents.slice(0) : []);
            for (let i = 0; i < activationEvents.length; i++) {
                // TODO@joao: there's no easy way to contribute this
                if (activationEvents[i] === 'onUri') {
                    activationEvents[i] = `onUri:${extensions_1.ExtensionIdentifier.toKey(desc.identifier)}`;
                }
            }
            if (!desc.contributes) {
                // no implicit activation events
                return activationEvents;
            }
            for (const extPointName in desc.contributes) {
                const generator = this._generators.get(extPointName);
                if (!generator) {
                    // There's no generator for this extension point
                    continue;
                }
                const contrib = desc.contributes[extPointName];
                const contribArr = Array.isArray(contrib) ? contrib : [contrib];
                try {
                    generator(contribArr, activationEvents);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            return activationEvents;
        }
    }
    exports.ImplicitActivationEventsImpl = ImplicitActivationEventsImpl;
    exports.ImplicitActivationEvents = new ImplicitActivationEventsImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wbGljaXRBY3RpdmF0aW9uRXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vaW1wbGljaXRBY3RpdmF0aW9uRXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLDRCQUE0QjtRQUF6QztZQUVrQixnQkFBVyxHQUFHLElBQUksR0FBRyxFQUEyQyxDQUFDO1lBQ2pFLFdBQU0sR0FBRyxJQUFJLE9BQU8sRUFBbUMsQ0FBQztRQW9FMUUsQ0FBQztRQWxFTyxRQUFRLENBQUksa0JBQTBCLEVBQUUsU0FBd0M7WUFDdEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVEOzs7V0FHRztRQUNJLG9CQUFvQixDQUFDLG9CQUEyQztZQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFFLENBQUM7UUFDL0MsQ0FBQztRQUVEOzs7V0FHRztRQUNJLHlCQUF5QixDQUFDLHFCQUE4QztZQUM5RSxNQUFNLE1BQU0sR0FBd0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RSxLQUFLLE1BQU0sb0JBQW9CLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDekUsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLE1BQU0sQ0FBQyxnQ0FBbUIsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQztnQkFDdkYsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUEyQjtZQUN4RCxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFaEgsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxvREFBb0Q7Z0JBQ3BELElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ3JDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsZ0NBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUM3RSxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZCLGdDQUFnQztnQkFDaEMsT0FBTyxnQkFBZ0IsQ0FBQztZQUN6QixDQUFDO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2hCLGdEQUFnRDtvQkFDaEQsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFJLElBQUksQ0FBQyxXQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQztvQkFDSixTQUFTLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3pDLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztLQUNEO0lBdkVELG9FQXVFQztJQUVZLFFBQUEsd0JBQXdCLEdBQWlDLElBQUksNEJBQTRCLEVBQUUsQ0FBQyJ9