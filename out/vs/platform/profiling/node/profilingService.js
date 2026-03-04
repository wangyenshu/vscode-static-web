/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid"], function (require, exports, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InspectProfilingService = void 0;
    class InspectProfilingService {
        constructor() {
            this._sessions = new Map();
        }
        async startProfiling(options) {
            const prof = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
            const session = await prof.startProfiling({ host: options.host, port: options.port, checkForPaused: true });
            const id = (0, uuid_1.generateUuid)();
            this._sessions.set(id, session);
            return id;
        }
        async stopProfiling(sessionId) {
            const session = this._sessions.get(sessionId);
            if (!session) {
                throw new Error(`UNKNOWN session '${sessionId}'`);
            }
            const result = await session.stop();
            this._sessions.delete(sessionId);
            return result.profile;
        }
    }
    exports.InspectProfilingService = InspectProfilingService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2ZpbGluZy9ub2RlL3Byb2ZpbGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsdUJBQXVCO1FBQXBDO1lBSWtCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBNEIsQ0FBQztRQW1CbEUsQ0FBQztRQWpCQSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQXVDO1lBQzNELE1BQU0sSUFBSSxHQUFHLHNEQUFhLHFCQUFxQiwyQkFBQyxDQUFDO1lBQ2pELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVHLE1BQU0sRUFBRSxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoQyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQWlCO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBdkJELDBEQXVCQyJ9