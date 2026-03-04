/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/policy/common/policy"], function (require, exports, event_1, lifecycle_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyChannelClient = exports.PolicyChannel = void 0;
    class PolicyChannel {
        constructor(service) {
            this.service = service;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChange': return event_1.Event.map(this.service.onDidChange, names => names.reduce((r, name) => ({ ...r, [name]: this.service.getPolicyValue(name) ?? null }), {}), this.disposables);
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'updatePolicyDefinitions': return this.service.updatePolicyDefinitions(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.PolicyChannel = PolicyChannel;
    class PolicyChannelClient extends policy_1.AbstractPolicyService {
        constructor(policiesData, channel) {
            super();
            this.channel = channel;
            for (const name in policiesData) {
                const { definition, value } = policiesData[name];
                this.policyDefinitions[name] = definition;
                if (value !== undefined) {
                    this.policies.set(name, value);
                }
            }
            this.channel.listen('onDidChange')(policies => {
                for (const name in policies) {
                    const value = policies[name];
                    if (value === null) {
                        this.policies.delete(name);
                    }
                    else {
                        this.policies.set(name, value);
                    }
                }
                this._onDidChange.fire(Object.keys(policies));
            });
        }
        async _updatePolicyDefinitions(policyDefinitions) {
            const result = await this.channel.call('updatePolicyDefinitions', policyDefinitions);
            for (const name in result) {
                this.policies.set(name, result[name]);
            }
        }
    }
    exports.PolicyChannelClient = PolicyChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5SXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcG9saWN5L2NvbW1vbi9wb2xpY3lJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsYUFBYTtRQUl6QixZQUFvQixPQUF1QjtZQUF2QixZQUFPLEdBQVAsT0FBTyxDQUFnQjtZQUYxQixnQkFBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRU4sQ0FBQztRQUVoRCxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQ3hCLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQzdHLElBQUksQ0FBQyxXQUFXLENBQ2hCLENBQUM7WUFDSCxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxDQUFDLENBQVUsRUFBRSxPQUFlLEVBQUUsR0FBUztZQUMxQyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLHlCQUF5QixDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEdBQTBDLENBQUMsQ0FBQztZQUN6SCxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBN0JELHNDQTZCQztJQUVELE1BQWEsbUJBQW9CLFNBQVEsOEJBQXFCO1FBRTdELFlBQVksWUFBcUYsRUFBbUIsT0FBaUI7WUFDcEksS0FBSyxFQUFFLENBQUM7WUFEMkcsWUFBTyxHQUFQLE9BQU8sQ0FBVTtZQUVwSSxLQUFLLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztnQkFDMUMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBUyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckQsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDN0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQTZCLENBQUMsQ0FBQztvQkFFdEQsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM1QixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNoQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVTLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBc0Q7WUFDOUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBc0MseUJBQXlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUMxSCxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNGLENBQUM7S0FFRDtJQWpDRCxrREFpQ0MifQ==