/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/htmlContent"], function (require, exports, nls_1, arrays_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInstanceHoverInfo = getInstanceHoverInfo;
    exports.getShellIntegrationTooltip = getShellIntegrationTooltip;
    exports.getShellProcessTooltip = getShellProcessTooltip;
    function getInstanceHoverInfo(instance) {
        let statusString = '';
        const statuses = instance.statusList.statuses;
        const actions = [];
        for (const status of statuses) {
            statusString += `\n\n---\n\n${status.icon ? `$(${status.icon?.id}) ` : ''}${status.tooltip || status.id}`;
            if (status.hoverActions) {
                actions.push(...status.hoverActions);
            }
        }
        const shellProcessString = getShellProcessTooltip(instance, true);
        const shellIntegrationString = getShellIntegrationTooltip(instance, true);
        const content = new htmlContent_1.MarkdownString(instance.title + shellProcessString + shellIntegrationString + statusString, { supportThemeIcons: true });
        return { content, actions };
    }
    function getShellIntegrationTooltip(instance, markdown) {
        const shellIntegrationCapabilities = [];
        if (instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
            shellIntegrationCapabilities.push(2 /* TerminalCapability.CommandDetection */);
        }
        if (instance.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
            shellIntegrationCapabilities.push(0 /* TerminalCapability.CwdDetection */);
        }
        let shellIntegrationString = '';
        if (shellIntegrationCapabilities.length > 0) {
            shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('shellIntegration.enabled', "Shell integration activated")}`;
        }
        else {
            if (instance.shellLaunchConfig.ignoreShellIntegration) {
                shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('launchFailed.exitCodeOnlyShellIntegration', "The terminal process failed to launch. Disabling shell integration with terminal.integrated.shellIntegration.enabled might help.")}`;
            }
            else {
                if (instance.usedShellIntegrationInjection) {
                    shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('shellIntegration.activationFailed', "Shell integration failed to activate")}`;
                }
            }
        }
        return shellIntegrationString;
    }
    function getShellProcessTooltip(instance, markdown) {
        const lines = [];
        if (instance.processId && instance.processId > 0) {
            lines.push((0, nls_1.localize)({ key: 'shellProcessTooltip.processId', comment: ['The first arg is "PID" which shouldn\'t be translated'] }, "Process ID ({0}): {1}", 'PID', instance.processId) + '\n');
        }
        if (instance.shellLaunchConfig.executable) {
            let commandLine = instance.shellLaunchConfig.executable;
            const args = (0, arrays_1.asArray)(instance.injectedArgs || instance.shellLaunchConfig.args || []).map(x => `'${x}'`).join(' ');
            if (args) {
                commandLine += ` ${args}`;
            }
            lines.push((0, nls_1.localize)('shellProcessTooltip.commandLine', 'Command line: {0}', commandLine));
        }
        return lines.length ? `${markdown ? '\n\n---\n\n' : '\n\n'}${lines.join('\n')}` : '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUb29sdGlwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFRvb2x0aXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsb0RBZ0JDO0lBRUQsZ0VBcUJDO0lBRUQsd0RBa0JDO0lBM0RELFNBQWdCLG9CQUFvQixDQUFDLFFBQTJCO1FBQy9ELElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUM5QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbkIsS0FBSyxNQUFNLE1BQU0sSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUMvQixZQUFZLElBQUksY0FBYyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxRyxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sa0JBQWtCLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sc0JBQXNCLEdBQUcsMEJBQTBCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzFFLE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLGtCQUFr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