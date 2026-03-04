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
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/process", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/issue/common/issue", "vs/platform/product/common/productService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/theme", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/integrity/common/integrity", "vs/workbench/services/issue/common/issue", "vs/base/browser/window", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, browser_1, process_1, globals_1, extensionManagement_1, extensions_1, extensions_2, issue_1, productService_1, colorRegistry_1, themeService_1, workspaceTrust_1, theme_1, assignmentService_1, authentication_1, environmentService_1, extensionManagement_2, integrity_1, issue_2, window_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeIssueService = void 0;
    exports.getIssueReporterStyles = getIssueReporterStyles;
    let NativeIssueService = class NativeIssueService {
        constructor(issueMainService, themeService, extensionManagementService, extensionEnablementService, environmentService, workspaceTrustManagementService, productService, experimentService, authenticationService, integrityService, menuService, contextKeyService) {
            this.issueMainService = issueMainService;
            this.themeService = themeService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.productService = productService;
            this.experimentService = experimentService;
            this.authenticationService = authenticationService;
            this.integrityService = integrityService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.extensionIdentifierSet = new extensions_1.ExtensionIdentifierSet();
            globals_1.ipcRenderer.on('vscode:triggerReporterMenu', async (event, arg) => {
                const extensionId = arg.extensionId;
                // creates menu from contributed
                const menu = this.menuService.createMenu(actions_1.MenuId.IssueReporter, this.contextKeyService);
                // render menu and dispose
                const actions = menu.getActions({ renderShortTitle: true }).flatMap(entry => entry[1]);
                actions.forEach(async (action) => {
                    try {
                        if (action.item && 'source' in action.item && action.item.source?.id === extensionId) {
                            this.extensionIdentifierSet.add(extensionId);
                            await action.run();
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                });
                if (!this.extensionIdentifierSet.has(extensionId)) {
                    // send undefined to indicate no action was taken
                    globals_1.ipcRenderer.send(`vscode:triggerReporterMenuResponse:${extensionId}`, undefined);
                }
                menu.dispose();
            });
        }
        async openReporter(dataOverrides = {}) {
            const extensionData = [];
            try {
                const extensions = await this.extensionManagementService.getInstalled();
                const enabledExtensions = extensions.filter(extension => this.extensionEnablementService.isEnabled(extension) || (dataOverrides.extensionId && extension.identifier.id === dataOverrides.extensionId));
                extensionData.push(...enabledExtensions.map((extension) => {
                    const { manifest } = extension;
                    const manifestKeys = manifest.contributes ? Object.keys(manifest.contributes) : [];
                    const isTheme = !manifest.main && !manifest.browser && manifestKeys.length === 1 && manifestKeys[0] === 'themes';
                    const isBuiltin = extension.type === 0 /* ExtensionType.System */;
                    return {
                        name: manifest.name,
                        publisher: manifest.publisher,
                        version: manifest.version,
                        repositoryUrl: manifest.repository && manifest.repository.url,
                        bugsUrl: manifest.bugs && manifest.bugs.url,
                        displayName: manifest.displayName,
                        id: extension.identifier.id,
                        data: dataOverrides.data,
                        uri: dataOverrides.uri,
                        isTheme,
                        isBuiltin,
                        extensionData: 'Extensions data loading',
                    };
                }));
            }
            catch (e) {
                extensionData.push({
                    name: 'Workbench Issue Service',
                    publisher: 'Unknown',
                    version: '0.0.0',
                    repositoryUrl: undefined,
                    bugsUrl: undefined,
                    extensionData: 'Extensions data loading',
                    displayName: `Extensions not loaded: ${e}`,
                    id: 'workbench.issue',
                    isTheme: false,
                    isBuiltin: true
                });
            }
            const experiments = await this.experimentService.getCurrentExperiments();
            let githubAccessToken = '';
            try {
                const githubSessions = await this.authenticationService.getSessions('github');
                const potentialSessions = githubSessions.filter(session => session.scopes.includes('repo'));
                githubAccessToken = potentialSessions[0]?.accessToken;
            }
            catch (e) {
                // Ignore
            }
            // air on the side of caution and have false be the default
            let isUnsupported = false;
            try {
                isUnsupported = !(await this.integrityService.isPure()).isPure;
            }
            catch (e) {
                // Ignore
            }
            const theme = this.themeService.getColorTheme();
            const issueReporterData = Object.assign({
                styles: getIssueReporterStyles(theme),
                zoomLevel: (0, browser_1.getZoomLevel)(window_1.mainWindow),
                enabledExtensions: extensionData,
                experiments: experiments?.join('\n'),
                restrictedMode: !this.workspaceTrustManagementService.isWorkspaceTrusted(),
                isUnsupported,
                githubAccessToken
            }, dataOverrides);
            if (issueReporterData.extensionId) {
                const extensionExists = extensionData.some(extension => extensions_1.ExtensionIdentifier.equals(extension.id, issueReporterData.extensionId));
                if (!extensionExists) {
                    console.error(`Extension with ID ${issueReporterData.extensionId} does not exist.`);
                }
            }
            if (issueReporterData.extensionId && this.extensionIdentifierSet.has(issueReporterData.extensionId)) {
                globals_1.ipcRenderer.send(`vscode:triggerReporterMenuResponse:${issueReporterData.extensionId}`, issueReporterData);
                this.extensionIdentifierSet.delete(new extensions_1.ExtensionIdentifier(issueReporterData.extensionId));
            }
            return this.issueMainService.openReporter(issueReporterData);
        }
        openProcessExplorer() {
            const theme = this.themeService.getColorTheme();
            const data = {
                pid: this.environmentService.mainPid,
                zoomLevel: (0, browser_1.getZoomLevel)(window_1.mainWindow),
                styles: {
                    backgroundColor: getColor(theme, colorRegistry_1.editorBackground),
                    color: getColor(theme, colorRegistry_1.editorForeground),
                    listHoverBackground: getColor(theme, colorRegistry_1.listHoverBackground),
                    listHoverForeground: getColor(theme, colorRegistry_1.listHoverForeground),
                    listFocusBackground: getColor(theme, colorRegistry_1.listFocusBackground),
                    listFocusForeground: getColor(theme, colorRegistry_1.listFocusForeground),
                    listFocusOutline: getColor(theme, colorRegistry_1.listFocusOutline),
                    listActiveSelectionBackground: getColor(theme, colorRegistry_1.listActiveSelectionBackground),
                    listActiveSelectionForeground: getColor(theme, colorRegistry_1.listActiveSelectionForeground),
                    listHoverOutline: getColor(theme, colorRegistry_1.activeContrastBorder),
                    scrollbarShadowColor: getColor(theme, colorRegistry_1.scrollbarShadow),
                    scrollbarSliderActiveBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
                    scrollbarSliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
                    scrollbarSliderHoverBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
                },
                platform: process_1.platform,
                applicationName: this.productService.applicationName
            };
            return this.issueMainService.openProcessExplorer(data);
        }
    };
    exports.NativeIssueService = NativeIssueService;
    exports.NativeIssueService = NativeIssueService = __decorate([
        __param(0, issue_1.IIssueMainService),
        __param(1, themeService_1.IThemeService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, productService_1.IProductService),
        __param(7, assignmentService_1.IWorkbenchAssignmentService),
        __param(8, authentication_1.IAuthenticationService),
        __param(9, integrity_1.IIntegrityService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService)
    ], NativeIssueService);
    function getIssueReporterStyles(theme) {
        return {
            backgroundColor: getColor(theme, theme_1.SIDE_BAR_BACKGROUND),
            color: getColor(theme, colorRegistry_1.foreground),
            textLinkColor: getColor(theme, colorRegistry_1.textLinkForeground),
            textLinkActiveForeground: getColor(theme, colorRegistry_1.textLinkActiveForeground),
            inputBackground: getColor(theme, colorRegistry_1.inputBackground),
            inputForeground: getColor(theme, colorRegistry_1.inputForeground),
            inputBorder: getColor(theme, colorRegistry_1.inputBorder),
            inputActiveBorder: getColor(theme, colorRegistry_1.inputActiveOptionBorder),
            inputErrorBorder: getColor(theme, colorRegistry_1.inputValidationErrorBorder),
            inputErrorBackground: getColor(theme, colorRegistry_1.inputValidationErrorBackground),
            inputErrorForeground: getColor(theme, colorRegistry_1.inputValidationErrorForeground),
            buttonBackground: getColor(theme, colorRegistry_1.buttonBackground),
            buttonForeground: getColor(theme, colorRegistry_1.buttonForeground),
            buttonHoverBackground: getColor(theme, colorRegistry_1.buttonHoverBackground),
            sliderActiveColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
            sliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
            sliderHoverColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
        };
    }
    function getColor(theme, key) {
        const color = theme.getColor(key);
        return color ? color.toString() : undefined;
    }
    (0, extensions_2.registerSingleton)(issue_2.IWorkbenchIssueService, NativeIssueService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2lzc3VlL2VsZWN0cm9uLXNhbmRib3gvaXNzdWVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNMaEcsd0RBb0JDO0lBbExNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCO1FBSTlCLFlBQ29CLGdCQUFvRCxFQUN4RCxZQUE0QyxFQUM5QiwwQkFBd0UsRUFDL0QsMEJBQWlGLEVBQ25GLGtCQUF1RSxFQUN6RSwrQkFBa0YsRUFDbkcsY0FBZ0QsRUFDcEMsaUJBQStELEVBQ3BFLHFCQUE4RCxFQUNuRSxnQkFBb0QsRUFDekQsV0FBMEMsRUFDcEMsaUJBQXNEO1lBWHRDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDYiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFDbEUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQztZQUN4RCxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ2xGLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQTZCO1lBQ25ELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDbEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBZG5FLDJCQUFzQixHQUEyQixJQUFJLG1DQUFzQixFQUFFLENBQUM7WUFnQnJGLHFCQUFXLENBQUMsRUFBRSxDQUFDLDRCQUE0QixFQUFFLEtB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