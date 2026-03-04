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
define(["require", "exports", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService"], function (require, exports, network_1, platform_1, types_1, uri_1, nls_1, commands_1, extensionManagement_1, extensionManagementCLI_1, extensionManagementUtil_1, instantiation_1, serviceCollection_1, label_1, log_1, opener_1, environmentService_1, extensionManagement_2, extensionManifestPropertiesService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this class contains the commands that the CLI server is reying on
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.openExternal', function (accessor, uri) {
        const openerService = accessor.get(opener_1.IOpenerService);
        return openerService.open((0, types_1.isString)(uri) ? uri : uri_1.URI.revive(uri), { openExternal: true, allowTunneling: true });
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.windowOpen', function (accessor, toOpen, options) {
        const commandService = accessor.get(commands_1.ICommandService);
        if (!toOpen.length) {
            return commandService.executeCommand('_files.newWindow', options);
        }
        return commandService.executeCommand('_files.windowOpen', toOpen, options);
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.getSystemStatus', function (accessor) {
        const commandService = accessor.get(commands_1.ICommandService);
        return commandService.executeCommand('_issues.getSystemStatus');
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.manageExtensions', async function (accessor, args) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const extensionManagementServerService = accessor.get(extensionManagement_2.IExtensionManagementServerService);
        const remoteExtensionManagementService = extensionManagementServerService.remoteExtensionManagementServer?.extensionManagementService;
        if (!remoteExtensionManagementService) {
            return;
        }
        const lines = [];
        const logger = new class extends log_1.AbstractMessageLogger {
            log(level, message) {
                lines.push(message);
            }
        }();
        const cliService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([extensionManagement_1.IExtensionManagementService, remoteExtensionManagementService])).createInstance(RemoteExtensionManagementCLI, logger);
        if (args.list) {
            await cliService.listExtensions(!!args.list.showVersions, args.list.category, undefined);
        }
        else {
            const revive = (inputs) => inputs.map(input => (0, types_1.isString)(input) ? input : uri_1.URI.revive(input));
            if (Array.isArray(args.install) && args.install.length) {
                try {
                    await cliService.installExtensions(revive(args.install), [], { isMachineScoped: true }, !!args.force);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
            if (Array.isArray(args.uninstall) && args.uninstall.length) {
                try {
                    await cliService.uninstallExtensions(revive(args.uninstall), !!args.force, undefined);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
        }
        return lines.join('\n');
    });
    let RemoteExtensionManagementCLI = class RemoteExtensionManagementCLI extends extensionManagementCLI_1.ExtensionManagementCLI {
        constructor(logger, extensionManagementService, extensionGalleryService, labelService, envService, _extensionManifestPropertiesService) {
            super(logger, extensionManagementService, extensionGalleryService);
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            const remoteAuthority = envService.remoteAuthority;
            this._location = remoteAuthority ? labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAuthority) : undefined;
        }
        get location() {
            return this._location;
        }
        validateExtensionKind(manifest) {
            if (!this._extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)
                // Web extensions installed on remote can be run in web worker extension host
                && !(platform_1.isWeb && this._extensionManifestPropertiesService.canExecuteOnWeb(manifest))) {
                this.logger.info((0, nls_1.localize)('cannot be installed', "Cannot install the '{0}' extension because it is declared to not run in this setup.", (0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name)));
                return false;
            }
            return true;
        }
    };
    RemoteExtensionManagementCLI = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, label_1.ILabelService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionManagementCLI);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENMSUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRDTElDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQXVCaEcsb0VBQW9FO0lBRXBFLDJCQUFnQixDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsRUFBRSxVQUFVLFFBQTBCLEVBQUUsR0FBMkI7UUFDNUgsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7UUFDbkQsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNoSCxDQUFDLENBQUMsQ0FBQztJQUVILDJCQUFnQixDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsRUFBRSxVQUFVLFFBQTBCLEVBQUUsTUFBeUIsRUFBRSxPQUEyQjtRQUNySixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLE9BQU8sY0FBYyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBQ0QsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RSxDQUFDLENBQUMsQ0FBQztJ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