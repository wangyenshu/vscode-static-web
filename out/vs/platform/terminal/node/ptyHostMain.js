/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uriIpc", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/base/parts/ipc/node/ipc.mp", "vs/nls", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/log/common/logService", "vs/platform/log/node/loggerService", "vs/platform/product/common/product", "vs/platform/terminal/common/terminal", "vs/platform/terminal/node/heartbeatService", "vs/platform/terminal/node/ptyService", "vs/base/parts/sandbox/node/electronTypes", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, uriIpc_1, ipc_1, ipc_cp_1, ipc_mp_1, nls_1, argv_1, environmentService_1, log_1, logIpc_1, logService_1, loggerService_1, product_1, terminal_1, heartbeatService_1, ptyService_1, electronTypes_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    startPtyHost();
    async function startPtyHost() {
        // Parse environment variables
        const startupDelay = parseInt(process.env.VSCODE_STARTUP_DELAY ?? '0');
        const simulatedLatency = parseInt(process.env.VSCODE_LATENCY ?? '0');
        const reconnectConstants = {
            graceTime: parseInt(process.env.VSCODE_RECONNECT_GRACE_TIME || '0'),
            shortGraceTime: parseInt(process.env.VSCODE_RECONNECT_SHORT_GRACE_TIME || '0'),
            scrollback: parseInt(process.env.VSCODE_RECONNECT_SCROLLBACK || '100')
        };
        // Sanitize environment
        delete process.env.VSCODE_RECONNECT_GRACE_TIME;
        delete process.env.VSCODE_RECONNECT_SHORT_GRACE_TIME;
        delete process.env.VSCODE_RECONNECT_SCROLLBACK;
        delete process.env.VSCODE_LATENCY;
        delete process.env.VSCODE_STARTUP_DELAY;
        // Delay startup if needed, this must occur before RPC is setup to avoid the channel from timing
        // out.
        if (startupDelay) {
            await (0, async_1.timeout)(startupDelay);
        }
        // Setup RPC
        const _isUtilityProcess = (0, electronTypes_1.isUtilityProcess)(process);
        let server;
        if (_isUtilityProcess) {
            server = new ipc_mp_1.Server();
        }
        else {
            server = new ipc_cp_1.Server(terminal_1.TerminalIpcChannels.PtyHost);
        }
        // Services
        const productService = { _serviceBrand: undefined, ...product_1.default };
        const environmentService = new environmentService_1.NativeEnvironmentService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService);
        const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
        server.registerChannel(terminal_1.TerminalIpcChannels.Logger, new logIpc_1.LoggerChannel(loggerService, () => uriIpc_1.DefaultURITransformer));
        const logger = loggerService.createLogger('ptyhost', { name: (0, nls_1.localize)('ptyHost', "Pty Host") });
        const logService = new logService_1.LogService(logger);
        // Log developer config
        if (startupDelay) {
            logService.warn(`Pty Host startup is delayed ${startupDelay}ms`);
        }
        if (simulatedLatency) {
            logService.warn(`Pty host is simulating ${simulatedLatency}ms latency`);
        }
        const disposables = new lifecycle_1.DisposableStore();
        // Heartbeat responsiveness tracking
        const heartbeatService = new heartbeatService_1.HeartbeatService();
        server.registerChannel(terminal_1.TerminalIpcChannels.Heartbeat, ipc_1.ProxyChannel.fromService(heartbeatService, disposables));
        // Init pty service
        const ptyService = new ptyService_1.PtyService(logService, productService, reconnectConstants, simulatedLatency);
        const ptyServiceChannel = ipc_1.ProxyChannel.fromService(ptyService, disposables);
        server.registerChannel(terminal_1.TerminalIpcChannels.PtyHost, ptyServiceChannel);
        // Register a channel for direct communication via Message Port
        if (_isUtilityProcess) {
            server.registerChannel(terminal_1.TerminalIpcChannels.PtyHostWindow, ptyServiceChannel);
        }
        // Clean up
        process.once('exit', () => {
            logService.trace('Pty host exiting');
            logService.dispose();
            heartbeatService.dispose();
            ptyService.dispose();
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5SG9zdE1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9ub2RlL3B0eUhvc3RNYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxZQUFZLEVBQUUsQ0FBQztJQUVmLEtBQUssVUFBVSxZQUFZO1FBQzFCLDhCQUE4QjtRQUM5QixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUN2RSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNyRSxNQUFNLGtCQUFrQixHQUF3QjtZQUMvQyxTQUFTLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLElBQUksR0FBRyxDQUFDO1lBQ25FLGNBQWMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsSUFBSSxHQUFHLENBQUM7WUFDOUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixJQUFJLEtBQUssQ0FBQztTQUN0RSxDQUFDO1FBRUYsdUJBQXVCO1FBQ3ZCLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQztRQUMvQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUM7UUFDckQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDO1FBQy9DLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7UUFDbEMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDO1FBRXhDLGdHQUFnRztRQUNo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