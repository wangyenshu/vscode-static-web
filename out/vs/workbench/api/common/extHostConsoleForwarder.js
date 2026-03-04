/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/objects", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, objects_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtHostConsoleForwarder = void 0;
    let AbstractExtHostConsoleForwarder = class AbstractExtHostConsoleForwarder {
        constructor(extHostRpc, initData) {
            this._mainThreadConsole = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConsole);
            this._includeStack = initData.consoleForward.includeStack;
            this._logNative = initData.consoleForward.logNative;
            // Pass console logging to the outside so that we have it in the main side if told so
            this._wrapConsoleMethod('info', 'log');
            this._wrapConsoleMethod('log', 'log');
            this._wrapConsoleMethod('warn', 'warn');
            this._wrapConsoleMethod('debug', 'debug');
            this._wrapConsoleMethod('error', 'error');
        }
        /**
         * Wraps a console message so that it is transmitted to the renderer. If
         * native logging is turned on, the original console message will be written
         * as well. This is needed since the console methods are "magic" in V8 and
         * are the only methods that allow later introspection of logged variables.
         *
         * The wrapped property is not defined with `writable: false` to avoid
         * throwing errors, but rather a no-op setting. See https://github.com/microsoft/vscode-extension-telemetry/issues/88
         */
        _wrapConsoleMethod(method, severity) {
            const that = this;
            const original = console[method];
            Object.defineProperty(console, method, {
                set: () => { },
                get: () => function () {
                    that._handleConsoleCall(method, severity, original, arguments);
                },
            });
        }
        _handleConsoleCall(method, severity, original, args) {
            this._mainThreadConsole.$logExtensionHostMessage({
                type: '__$console',
                severity,
                arguments: safeStringifyArgumentsToArray(args, this._includeStack)
            });
            if (this._logNative) {
                this._nativeConsoleLogMessage(method, original, args);
            }
        }
    };
    exports.AbstractExtHostConsoleForwarder = AbstractExtHostConsoleForwarder;
    exports.AbstractExtHostConsoleForwarder = AbstractExtHostConsoleForwarder = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], AbstractExtHostConsoleForwarder);
    const MAX_LENGTH = 100000;
    /**
     * Prevent circular stringify and convert arguments to real array
     */
    function safeStringifyArgumentsToArray(args, includeStack) {
        const argsArray = [];
        // Massage some arguments with special treatment
        if (args.length) {
            for (let i = 0; i < args.length; i++) {
                let arg = args[i];
                // Any argument of type 'undefined' needs to be specially treated because
                // JSON.stringify will simply ignore those. We replace them with the string
                // 'undefined' which is not 100% right, but good enough to be logged to console
                if (typeof arg === 'undefined') {
                    arg = 'undefined';
                }
                // Any argument that is an Error will be changed to be just the error stack/message
                // itself because currently cannot serialize the error over entirely.
                else if (arg instanceof Error) {
                    const errorObj = arg;
                    if (errorObj.stack) {
                        arg = errorObj.stack;
                    }
                    else {
                        arg = errorObj.toString();
                    }
                }
                argsArray.push(arg);
            }
        }
        // Add the stack trace as payload if we are told so. We remove the message and the 2 top frames
        // to start the stacktrace where the console message was being written
        if (includeStack) {
            const stack = new Error().stack;
            if (stack) {
                argsArray.push({ __$stack: stack.split('\n').slice(3).join('\n') });
            }
        }
        try {
            const res = (0, objects_1.safeStringify)(argsArray);
            if (res.length > MAX_LENGTH) {
                return 'Output omitted for a large object that exceeds the limits';
            }
            return res;
        }
        catch (error) {
            return `Output omitted for an object that cannot be inspected ('${error.toString()}')`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbnNvbGVGb3J3YXJkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q29uc29sZUZvcndhcmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBZSwrQkFBK0IsR0FBOUMsTUFBZSwrQkFBK0I7UUFNcEQsWUFDcUIsVUFBOEIsRUFDekIsUUFBaUM7WUFFMUQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7WUFDMUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUVwRCxxRkFBcUY7WUFDckYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRDs7Ozs7Ozs7V0FRRztRQUNLLGtCQUFrQixDQUFDLE1BQW1ELEVBQUUsUUFBNEM7WUFDM0gsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFN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