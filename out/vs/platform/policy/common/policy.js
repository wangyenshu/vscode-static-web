/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullPolicyService = exports.AbstractPolicyService = exports.IPolicyService = void 0;
    exports.IPolicyService = (0, instantiation_1.createDecorator)('policy');
    class AbstractPolicyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.policyDefinitions = {};
            this.policies = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        async updatePolicyDefinitions(policyDefinitions) {
            const size = Object.keys(this.policyDefinitions).length;
            this.policyDefinitions = { ...policyDefinitions, ...this.policyDefinitions };
            if (size !== Object.keys(this.policyDefinitions).length) {
                await this._updatePolicyDefinitions(policyDefinitions);
            }
            return iterator_1.Iterable.reduce(this.policies.entries(), (r, [name, value]) => ({ ...r, [name]: value }), {});
        }
        getPolicyValue(name) {
            return this.policies.get(name);
        }
        serialize() {
            return iterator_1.Iterable.reduce(Object.entries(this.policyDefinitions), (r, [name, definition]) => ({ ...r, [name]: { definition, value: this.policies.get(name) } }), {});
        }
    }
    exports.AbstractPolicyService = AbstractPolicyService;
    class NullPolicyService {
        constructor() {
            this.onDidChange = event_1.Event.None;
        }
        async updatePolicyDefinitions() { return {}; }
        getPolicyValue() { return undefined; }
        serialize() { return undefined; }
    }
    exports.NullPolicyService = NullPolicyService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcG9saWN5L2NvbW1vbi9wb2xpY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWW5GLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsUUFBUSxDQUFDLENBQUM7SUFXeEUsTUFBc0IscUJBQXNCLFNBQVEsc0JBQVU7UUFBOUQ7O1lBR1csc0JBQWlCLEdBQXdDLEVBQUUsQ0FBQztZQUM1RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFFckMsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7WUFDOUUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQXNCaEQsQ0FBQztRQXBCQSxLQUFLLENBQUMsdUJBQXVCLENBQUMsaUJBQXNEO1lBQ25GLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3hELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsaUJBQWlCLEVBQUUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUU3RSxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6RCxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxPQUFPLG1CQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQUFnQjtZQUM5QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxTQUFTO1lBQ1IsT0FBTyxtQkFBUSxDQUFDLE1BQU0sQ0FBMEcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdRLENBQUM7S0FHRDtJQTdCRCxzREE2QkM7SUFFRCxNQUFhLGlCQUFpQjtRQUE5QjtZQUVVLGdCQUFXLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQUluQyxDQUFDO1FBSEEsS0FBSyxDQUFDLHVCQUF1QixLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QyxjQUFjLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLFNBQVMsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDakM7SUFORCw4Q0FNQyJ9