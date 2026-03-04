/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event"], function (require, exports, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestServiceClient = exports.TestChannel = exports.TestService = void 0;
    class TestService {
        constructor() {
            this._onMarco = new event_1.Emitter();
            this.onMarco = this._onMarco.event;
        }
        marco() {
            this._onMarco.fire({ answer: 'polo' });
            return Promise.resolve('polo');
        }
        pong(ping) {
            return Promise.resolve({ incoming: ping, outgoing: 'pong' });
        }
        cancelMe() {
            return Promise.resolve((0, async_1.timeout)(100)).then(() => true);
        }
    }
    exports.TestService = TestService;
    class TestChannel {
        constructor(testService) {
            this.testService = testService;
        }
        listen(_, event) {
            switch (event) {
                case 'marco': return this.testService.onMarco;
            }
            throw new Error('Event not found');
        }
        call(_, command, ...args) {
            switch (command) {
                case 'pong': return this.testService.pong(args[0]);
                case 'cancelMe': return this.testService.cancelMe();
                case 'marco': return this.testService.marco();
                default: return Promise.reject(new Error(`command not found: ${command}`));
            }
        }
    }
    exports.TestChannel = TestChannel;
    class TestServiceClient {
        get onMarco() { return this.channel.listen('marco'); }
        constructor(channel) {
            this.channel = channel;
        }
        marco() {
            return this.channel.call('marco');
        }
        pong(ping) {
            return this.channel.call('pong', ping);
        }
        cancelMe() {
            return this.channel.call('cancelMe');
        }
    }
    exports.TestServiceClient = TestServiceClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy90ZXN0L25vZGUvdGVzdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFhLFdBQVc7UUFBeEI7WUFFa0IsYUFBUSxHQUFHLElBQUksZUFBTyxFQUFtQixDQUFDO1lBQzNELFlBQU8sR0FBMkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFjdkQsQ0FBQztRQVpBLEtBQUs7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQVk7WUFDaEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLGVBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxDQUFDO0tBQ0Q7SUFqQkQsa0NBaUJDO0lBRUQsTUFBYSxXQUFXO1FBRXZCLFlBQW9CLFdBQXlCO1lBQXpCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1FBQUksQ0FBQztRQUVsRCxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7WUFDL0MsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxDQUFDLENBQVUsRUFBRSxPQUFlLEVBQUUsR0FBRyxJQUFXO1lBQy9DLFFBQVEsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BELEtBQUssT0FBTyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM5QyxPQUFPLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBcEJELGtDQW9CQztJQUVELE1BQWEsaUJBQWlCO1FBRTdCLElBQUksT0FBTyxLQUE2QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU5RSxZQUFvQixPQUFpQjtZQUFqQixZQUFPLEdBQVAsT0FBTyxDQUFVO1FBQUksQ0FBQztRQUUxQyxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQVk7WUFDaEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVELFFBQVE7WUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQWpCRCw4Q0FpQkMifQ==