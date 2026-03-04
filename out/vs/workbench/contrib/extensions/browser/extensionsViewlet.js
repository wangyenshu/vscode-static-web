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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "../common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionsViews", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/severity", "vs/workbench/services/activity/common/activity", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/base/browser/ui/aria/aria", "vs/platform/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/preferences/common/preferences", "vs/workbench/common/theme", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contextkeys", "vs/platform/commands/common/commands", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/actions/common/actions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/arrays", "vs/platform/dnd/browser/dnd", "vs/base/common/resources", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/platform/actions/browser/toolbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/extensionsViewlet"], function (require, exports, nls_1, async_1, errors_1, errorMessage_1, lifecycle_1, event_1, actions_1, dom_1, telemetry_1, instantiation_1, extensions_1, extensions_2, extensionsActions_1, extensionManagement_1, extensionManagement_2, extensionsInput_1, extensionsViews_1, progress_1, editorGroupsService_1, severity_1, activity_1, themeService_1, configuration_1, views_1, storage_1, workspace_1, contextkey_1, contextView_1, log_1, notification_1, host_1, layoutService_1, viewPaneContainer_1, extensionQuery_1, suggestEnabledInput_1, aria_1, extensions_3, platform_1, label_1, descriptors_1, preferences_1, theme_1, environmentService_1, contextkeys_1, commands_1, extensionsIcons_1, actions_2, panecomposite_1, arrays_1, dnd_1, resources_1, extensionManagementUtil_1, widgetNavigationCommands_1, toolbar_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MaliciousExtensionChecker = exports.StatusUpdater = exports.ExtensionsViewPaneContainer = exports.ExtensionsViewletViewsContribution = exports.RecommendedExtensionsContext = exports.BuiltInExtensionsContext = exports.SearchHasTextContext = exports.SearchMarketplaceExtensionsContext = exports.ExtensionsSortByContext = exports.DefaultViewsContext = void 0;
    exports.DefaultViewsContext = new contextkey_1.RawContextKey('defaultExtensionViews', true);
    exports.ExtensionsSortByContext = new contextkey_1.RawContextKey('extensionsSortByValue', '');
    exports.SearchMarketplaceExtensionsContext = new contextkey_1.RawContextKey('searchMarketplaceExtensions', false);
    exports.SearchHasTextContext = new contextkey_1.RawContextKey('extensionSearchHasText', false);
    const InstalledExtensionsContext = new contextkey_1.RawContextKey('installedExtensions', false);
    const SearchInstalledExtensionsContext = new contextkey_1.RawContextKey('searchInstalledExtensions', false);
    const SearchRecentlyUpdatedExtensionsContext = new contextkey_1.RawContextKey('searchRecentlyUpdatedExtensions', false);
    const SearchExtensionUpdatesContext = new contextkey_1.RawContextKey('searchExtensionUpdates', false);
    const SearchOutdatedExtensionsContext = new contextkey_1.RawContextKey('searchOutdatedExtensions', false);
    const SearchEnabledExtensionsContext = new contextkey_1.RawContextKey('searchEnabledExtensions', false);
    const SearchDisabledExtensionsContext = new contextkey_1.RawContextKey('searchDisabledExtensions', false);
    const HasInstalledExtensionsContext = new contextkey_1.RawContextKey('hasInstalledExtensions', true);
    exports.BuiltInExtensionsContext = new contextkey_1.RawContextKey('builtInExtensions', false);
    const SearchBuiltInExtensionsContext = new contextkey_1.RawContextKey('searchBuiltInExtensions', false);
    const SearchUnsupportedWorkspaceExtensionsContext = new contextkey_1.RawContextKey('searchUnsupportedWorkspaceExtensions', false);
    const SearchDeprecatedExtensionsContext = new contextkey_1.RawContextKey('searchDeprecatedExtensions', false);
    exports.RecommendedExtensionsContext = new contextkey_1.RawContextKey('recommendedExtensions', false);
    const SortByUpdateDateContext = new contextkey_1.RawContextKey('sortByUpdateDate', false);
    const REMOTE_CATEGORY = (0, nls_1.localize2)({ key: 'remote', comment: ['Remote as in remote machine'] }, "Remote");
    let ExtensionsViewletViewsContribution = class ExtensionsViewletViewsContribution extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, labelService, viewDescriptorService, contextKeyService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.container = viewDescriptorService.getViewContainerById(extensions_2.VIEWLET_ID);
            this.registerViews();
        }
        registerViews() {
            const viewDescriptors = [];
            /* Default views */
            viewDescriptors.push(...this.createDefaultExtensionsViewDescriptors());
            /* Search views */
            viewDescriptors.push(...this.createSearchExtensionsViewDescriptors());
            /* Recommendations views */
            viewDescriptors.push(...this.createRecommendedExtensionsViewDescriptors());
            /* Built-in extensions views */
            viewDescriptors.push(...this.createBuiltinExtensionsViewDescriptors());
            /* Trust Required extensions views */
            viewDescriptors.push(...this.createUnsupportedWorkspaceExtensionsViewDescriptors());
            /* Other Local Filtered extensions views */
            viewDescriptors.push(...this.createOtherLocalFilteredExtensionsViewDescriptors());
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptors, this.container);
        }
        createDefaultExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * Default installed extensions views - Shows all user installed extensions.
             */
            const servers = [];
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            const getViewName = (viewTitle, server) => {
                return servers.length > 1 ? `${server.label} - ${viewTitle}` : viewTitle;
            };
            let installedWebExtensionsContextChangeEvent = event_1.Event.None;
            if (this.extensionManagementServerService.webExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const interestingContextKeys = new Set();
                interestingContextKeys.add('hasInstalledWebExtensions');
                installedWebExtensionsContextChangeEvent = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(interestingContextKeys));
            }
            const serverLabelChangeEvent = event_1.Event.any(this.labelService.onDidChangeFormatters, installedWebExtensionsContextChangeEvent);
            for (const server of servers) {
                const getInstalledViewName = () => getViewName((0, nls_1.localize)('installed', "Installed"), server);
                const onDidChangeTitle = event_1.Event.map(serverLabelChangeEvent, () => getInstalledViewName());
                const id = servers.length > 1 ? `workbench.views.extensions.${server.id}.installed` : `workbench.views.extensions.installed`;
                /* Installed extensions view */
                viewDescriptors.push({
                    id,
                    get name() {
                        return {
                            value: getInstalledViewName(),
                            original: getViewName('Installed', server)
                        };
                    },
                    weight: 100,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ServerInstalledExtensionsView, [{ server, flexibleHeight: true, onDidChangeTitle }]),
                    /* Installed extensions views shall not be allowed to hidden when there are more than one server */
                    canToggleVisibility: servers.length === 1
                });
                if (server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManagementServerService.localExtensionManagementServer) {
                    this._register((0, actions_2.registerAction2)(class InstallLocalExtensionsInRemoteAction2 extends actions_2.Action2 {
                        constructor() {
                            super({
                                id: 'workbench.extensions.installLocalExtensions',
                                get title() {
                                    return (0, nls_1.localize2)('select and install local extensions', "Install Local Extensions in '{0}'...", server.label);
                                },
                                category: REMOTE_CATEGORY,
                                icon: extensionsIcons_1.installLocalInRemoteIcon,
                                f1: true,
                                menu: {
                                    id: actions_2.MenuId.ViewTitle,
                                    when: contextkey_1.ContextKeyExpr.equals('view', id),
                                    group: 'navigation',
                                }
                            });
                        }
                        run(accessor) {
                            return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallLocalExtensionsInRemoteAction).run();
                        }
                    }));
                }
            }
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                this._register((0, actions_2.registerAction2)(class InstallRemoteExtensionsInLocalAction2 extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.extensions.actions.installLocalExtensionsInRemote',
                            title: (0, nls_1.localize2)('install remote in local', 'Install Remote Extensions Locally...'),
                            category: REMOTE_CATEGORY,
                            f1: true
                        });
                    }
                    run(accessor) {
                        return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallRemoteExtensionsInLocalAction, 'workbench.extensions.actions.installLocalExtensionsInRemote').run();
                    }
                }));
            }
            /*
             * Default popular extensions view
             * Separate view for popular extensions required as we need to show popular and recommended sections
             * in the default view when there is no search text, and user has no installed extensions.
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.popular',
                name: (0, nls_1.localize2)('popularExtensions', "Popular"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultPopularExtensionsView, [{ hideBadge: true }]),
                when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.not('hasInstalledExtensions'), extensions_2.CONTEXT_HAS_GALLERY),
                weight: 60,
                order: 2,
                canToggleVisibility: false
            });
            /*
             * Default recommended extensions view
             * When user has installed extensions, this is shown along with the views for enabled & disabled extensions
             * When user has no installed extensions, this is shown along with the view for popular extensions
             */
            viewDescriptors.push({
                id: 'extensions.recommendedList',
                name: (0, nls_1.localize2)('recommendedExtensions', "Recommended"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultRecommendedExtensionsView, [{ flexibleHeight: true }]),
                when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, SortByUpdateDateContext.negate(), contextkey_1.ContextKeyExpr.not('config.extensions.showRecommendationsOnlyOnDemand'), extensions_2.CONTEXT_HAS_GALLERY),
                weight: 40,
                order: 3,
                canToggleVisibility: true
            });
            /* Installed views shall be default in multi server window  */
            if (servers.length === 1) {
                /*
                 * Default enabled extensions view - Shows all user installed enabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.enabled',
                    name: (0, nls_1.localize2)('enabledExtensions', "Enabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.EnabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 40,
                    order: 4,
                    canToggleVisibility: true
                });
                /*
                 * Default disabled extensions view - Shows all disabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.disabled',
                    name: (0, nls_1.localize2)('disabledExtensions', "Disabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DisabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 10,
                    order: 5,
                    canToggleVisibility: true
                });
            }
            return viewDescriptors;
        }
        createSearchExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * View used for searching Marketplace
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.marketplace',
                name: (0, nls_1.localize2)('marketPlace', "Marketplace"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.SearchMarketplaceExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchMarketplaceExtensions')),
            });
            /*
             * View used for searching all installed extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchInstalled',
                name: (0, nls_1.localize2)('installed', "Installed"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('searchInstalledExtensions'), contextkey_1.ContextKeyExpr.has('installedExtensions')),
            });
            /*
             * View used for searching recently updated extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchRecentlyUpdated',
                name: (0, nls_1.localize2)('recently updated', "Recently Updated"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.RecentlyUpdatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(SearchExtensionUpdatesContext, contextkey_1.ContextKeyExpr.has('searchRecentlyUpdatedExtensions')),
                order: 2,
            });
            /*
             * View used for searching enabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchEnabled',
                name: (0, nls_1.localize2)('enabled', "Enabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchEnabledExtensions')),
            });
            /*
             * View used for searching disabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchDisabled',
                name: (0, nls_1.localize2)('disabled', "Disabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchDisabledExtensions')),
            });
            /*
             * View used for searching outdated extensions
             */
            viewDescriptors.push({
                id: extensions_2.OUTDATED_EXTENSIONS_VIEW_ID,
                name: (0, nls_1.localize2)('availableUpdates', "Available Updates"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.OutdatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(SearchExtensionUpdatesContext, contextkey_1.ContextKeyExpr.has('searchOutdatedExtensions')),
                order: 1,
            });
            /*
             * View used for searching builtin extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchBuiltin',
                name: (0, nls_1.localize2)('builtin', "Builtin"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions')),
            });
            /*
             * View used for searching workspace unsupported extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchWorkspaceUnsupported',
                name: (0, nls_1.localize2)('workspaceUnsupported', "Workspace Unsupported"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchWorkspaceUnsupportedExtensions')),
            });
            return viewDescriptors;
        }
        createRecommendedExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID,
                name: (0, nls_1.localize2)('workspaceRecommendedExtensions', "Workspace Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.WorkspaceRecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('recommendedExtensions'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')),
                order: 1
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.otherRecommendations',
                name: (0, nls_1.localize2)('otherRecommendedExtensions', "Other Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.RecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('recommendedExtensions'),
                order: 2
            });
            return viewDescriptors;
        }
        createBuiltinExtensionsViewDescriptors() {
            const viewDescriptors = [];
            const configuredCategories = ['themes', 'programming languages'];
            const otherCategories = extensions_3.EXTENSION_CATEGORIES.filter(c => !configuredCategories.includes(c.toLowerCase()));
            otherCategories.push(extensionsViews_1.NONE_CATEGORY);
            const otherCategoriesQuery = `${otherCategories.map(c => `category:"${c}"`).join(' ')} ${configuredCategories.map(c => `category:"-${c}"`).join(' ')}`;
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinFeatureExtensions',
                name: (0, nls_1.localize2)('builtinFeatureExtensions', "Features"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin ${otherCategoriesQuery}` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinThemeExtensions',
                name: (0, nls_1.localize2)('builtInThemesExtensions', "Themes"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin category:themes` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinProgrammingLanguageExtensions',
                name: (0, nls_1.localize2)('builtinProgrammingLanguageExtensions', "Programming Languages"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin category:"programming languages"` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            return viewDescriptors;
        }
        createUnsupportedWorkspaceExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedUnsupportedExtensions',
                name: (0, nls_1.localize2)('untrustedUnsupportedExtensions', "Disabled in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedPartiallySupportedExtensions',
                name: (0, nls_1.localize2)('untrustedPartiallySupportedExtensions', "Limited in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualUnsupportedExtensions',
                name: (0, nls_1.localize2)('virtualUnsupportedExtensions', "Disabled in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualPartiallySupportedExtensions',
                name: (0, nls_1.localize2)('virtualPartiallySupportedExtensions', "Limited in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            return viewDescriptors;
        }
        createOtherLocalFilteredExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.deprecatedExtensions',
                name: (0, nls_1.localize2)('deprecated', "Deprecated"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DeprecatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchDeprecatedExtensionsContext),
            });
            return viewDescriptors;
        }
    };
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution;
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService)
    ], ExtensionsViewletViewsContribution);
    let ExtensionsViewPaneContainer = class ExtensionsViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, instantiationService, editorGroupService, extensionsWorkbenchService, extensionManagementServerService, notificationService, paneCompositeService, themeService, configurationService, storageService, contextService, contextKeyService, contextMenuService, extensionService, viewDescriptorService, preferencesService, commandService) {
            super(extensions_2.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.editorGroupService = editorGroupService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.notificationService = notificationService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
            this.preferencesService = preferencesService;
            this.commandService = commandService;
            this.searchDelayer = new async_1.Delayer(500);
            this.defaultViewsContextKey = exports.DefaultViewsContext.bindTo(contextKeyService);
            this.sortByContextKey = exports.ExtensionsSortByContext.bindTo(contextKeyService);
            this.searchMarketplaceExtensionsContextKey = exports.SearchMarketplaceExtensionsContext.bindTo(contextKeyService);
            this.searchHasTextContextKey = exports.SearchHasTextContext.bindTo(contextKeyService);
            this.sortByUpdateDateContextKey = SortByUpdateDateContext.bindTo(contextKeyService);
            this.installedExtensionsContextKey = InstalledExtensionsContext.bindTo(contextKeyService);
            this.searchInstalledExtensionsContextKey = SearchInstalledExtensionsContext.bindTo(contextKeyService);
            this.searchRecentlyUpdatedExtensionsContextKey = SearchRecentlyUpdatedExtensionsContext.bindTo(contextKeyService);
            this.searchExtensionUpdatesContextKey = SearchExtensionUpdatesContext.bindTo(contextKeyService);
            this.searchWorkspaceUnsupportedExtensionsContextKey = SearchUnsupportedWorkspaceExtensionsContext.bindTo(contextKeyService);
            this.searchDeprecatedExtensionsContextKey = SearchDeprecatedExtensionsContext.bindTo(contextKeyService);
            this.searchOutdatedExtensionsContextKey = SearchOutdatedExtensionsContext.bindTo(contextKeyService);
            this.searchEnabledExtensionsContextKey = SearchEnabledExtensionsContext.bindTo(contextKeyService);
            this.searchDisabledExtensionsContextKey = SearchDisabledExtensionsContext.bindTo(contextKeyService);
            this.hasInstalledExtensionsContextKey = HasInstalledExtensionsContext.bindTo(contextKeyService);
            this.builtInExtensionsContextKey = exports.BuiltInExtensionsContext.bindTo(contextKeyService);
            this.searchBuiltInExtensionsContextKey = SearchBuiltInExtensionsContext.bindTo(contextKeyService);
            this.recommendedExtensionsContextKey = exports.RecommendedExtensionsContext.bindTo(contextKeyService);
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => { if (e.viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.onViewletOpen(e.composite);
            } }, this));
            this._register(extensionsWorkbenchService.onReset(() => this.refresh()));
            this.searchViewletState = this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        get searchValue() {
            return this.searchBox?.getValue();
        }
        create(parent) {
            parent.classList.add('extensions-viewlet');
            this.root = parent;
            const overlay = (0, dom_1.append)(this.root, (0, dom_1.$)('.overlay'));
            const overlayBackgroundColor = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) ?? '';
            overlay.style.backgroundColor = overlayBackgroundColor;
            (0, dom_1.hide)(overlay);
            const header = (0, dom_1.append)(this.root, (0, dom_1.$)('.header'));
            const placeholder = (0, nls_1.localize)('searchExtensions', "Search Extensions in Marketplace");
            const searchValue = this.searchViewletState['query.value'] ? this.searchViewletState['query.value'] : '';
            const searchContainer = (0, dom_1.append)(header, (0, dom_1.$)('.extensions-search-container'));
            this.searchBox = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${extensions_2.VIEWLET_ID}.searchbox`, searchContainer, {
                triggerCharacters: ['@'],
                sortKey: (item) => {
                    if (item.indexOf(':') === -1) {
                        return 'a';
                    }
                    else if (/ext:/.test(item) || /id:/.test(item) || /tag:/.test(item)) {
                        return 'b';
                    }
                    else if (/sort:/.test(item)) {
                        return 'c';
                    }
                    else {
                        return 'd';
                    }
                },
                provideResults: (query) => extensionQuery_1.Query.suggestions(query)
            }, placeholder, 'extensions:searchinput', { placeholderText: placeholder, value: searchValue }));
            this.updateInstalledExtensionsContexts();
            if (this.searchBox.getValue()) {
                this.triggerSearch();
            }
            this._register(this.searchBox.onInputDidChange(() => {
                this.sortByContextKey.set(extensionQuery_1.Query.parse(this.searchBox?.getValue() ?? '').sortBy);
                this.triggerSearch();
            }, this));
            this._register(this.searchBox.onShouldFocusResults(() => this.focusListView(), this));
            const controlElement = (0, dom_1.append)(searchContainer, (0, dom_1.$)('.extensions-search-actions-container'));
            this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, controlElement, extensions_2.extensionsSearchActionsMenu, {
                toolbarOptions: {
                    primaryGroup: () => true,
                },
                actionViewItemProvider: (action, options) => (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options)
            }));
            // Register DragAndDrop support
            this._register(new dom_1.DragAndDropObserver(this.root, {
                onDragEnter: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.show)(overlay);
                    }
                },
                onDragLeave: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                    }
                },
                onDragOver: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                },
                onDrop: async (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                        const vsixs = (0, arrays_1.coalesce)((await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractEditorsAndFilesDropData)(accessor, e)))
                            .map(editor => editor.resource && (0, resources_1.extname)(editor.resource) === '.vsix' ? editor.resource : undefined));
                        if (vsixs.length > 0) {
                            try {
                                // Attempt to install the extension(s)
                                await this.commandService.executeCommand(extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID, vsixs);
                            }
                            catch (err) {
                                this.notificationService.error(err);
                            }
                        }
                    }
                }
            }));
            super.create((0, dom_1.append)(this.root, (0, dom_1.$)('.extensions')));
            const focusTracker = this._register((0, dom_1.trackFocus)(this.root));
            const isSearchBoxFocused = () => this.searchBox?.inputWidget.hasWidgetFocus();
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                name: 'extensionsView',
                focusNotifiers: [focusTracker],
                focusNextWidget: () => {
                    if (isSearchBoxFocused()) {
                        this.focusListView();
                    }
                },
                focusPreviousWidget: () => {
                    if (!isSearchBoxFocused()) {
                        this.searchBox?.focus();
                    }
                }
            }));
        }
        focus() {
            super.focus();
            this.searchBox?.focus();
        }
        layout(dimension) {
            if (this.root) {
                this.root.classList.toggle('narrow', dimension.width <= 250);
                this.root.classList.toggle('mini', dimension.width <= 200);
            }
            this.searchBox?.layout(new dom_1.Dimension(dimension.width - 34 - /*padding*/ 8 - (24 * 2), 20));
            super.layout(new dom_1.Dimension(dimension.width, dimension.height - 41));
        }
        getOptimalWidth() {
            return 400;
        }
        search(value) {
            if (this.searchBox && this.searchBox.getValue() !== value) {
                this.searchBox.setValue(value);
            }
        }
        async refresh() {
            await this.updateInstalledExtensionsContexts();
            this.doSearch(true);
            if (this.configurationService.getValue(extensions_2.AutoCheckUpdatesConfigurationKey)) {
                this.extensionsWorkbenchService.checkForUpdates();
            }
        }
        async updateInstalledExtensionsContexts() {
            const result = await this.extensionsWorkbenchService.queryLocal();
            this.hasInstalledExtensionsContextKey.set(result.some(r => !r.isBuiltin));
        }
        triggerSearch() {
            this.searchDelayer.trigger(() => this.doSearch(), this.searchBox && this.searchBox.getValue() ? 500 : 0).then(undefined, err => this.onError(err));
        }
        normalizedQuery() {
            return this.searchBox
                ? this.searchBox.getValue()
                    .trim()
                    .replace(/@category/g, 'category')
                    .replace(/@tag:/g, 'tag:')
                    .replace(/@ext:/g, 'ext:')
                    .replace(/@featured/g, 'featured')
                    .replace(/@popular/g, this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer ? '@web' : '@popular')
                : '';
        }
        saveState() {
            const value = this.searchBox ? this.searchBox.getValue() : '';
            if (extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value)) {
                this.searchViewletState['query.value'] = value;
            }
            else {
                this.searchViewletState['query.value'] = '';
            }
            super.saveState();
        }
        doSearch(refresh) {
            const value = this.normalizedQuery();
            this.contextKeyService.bufferChangeEvents(() => {
                const isRecommendedExtensionsQuery = extensionsViews_1.ExtensionsListView.isRecommendedExtensionsQuery(value);
                this.searchHasTextContextKey.set(value.trim() !== '');
                this.installedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isInstalledExtensionsQuery(value));
                this.searchInstalledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchInstalledExtensionsQuery(value));
                this.searchRecentlyUpdatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchRecentlyUpdatedQuery(value) && !extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchOutdatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isOutdatedExtensionsQuery(value) && !extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchExtensionUpdatesContextKey.set(extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchEnabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isEnabledExtensionsQuery(value));
                this.searchDisabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isDisabledExtensionsQuery(value));
                this.searchBuiltInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchBuiltInExtensionsQuery(value));
                this.searchWorkspaceUnsupportedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchWorkspaceUnsupportedExtensionsQuery(value));
                this.searchDeprecatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchDeprecatedExtensionsQuery(value));
                this.builtInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery(value));
                this.recommendedExtensionsContextKey.set(isRecommendedExtensionsQuery);
                this.searchMarketplaceExtensionsContextKey.set(!!value && !extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value) && !isRecommendedExtensionsQuery);
                this.sortByUpdateDateContextKey.set(extensionsViews_1.ExtensionsListView.isSortUpdateDateQuery(value));
                this.defaultViewsContextKey.set(!value || extensionsViews_1.ExtensionsListView.isSortInstalledExtensionsQuery(value));
            });
            return this.progress(Promise.all(this.panes.map(view => view.show(this.normalizedQuery(), refresh)
                .then(model => this.alertSearchResult(model.length, view.id))))).then(() => undefined);
        }
        onDidAddViewDescriptors(added) {
            const addedViews = super.onDidAddViewDescriptors(added);
            this.progress(Promise.all(addedViews.map(addedView => addedView.show(this.normalizedQuery())
                .then(model => this.alertSearchResult(model.length, addedView.id)))));
            return addedViews;
        }
        alertSearchResult(count, viewId) {
            const view = this.viewContainerModel.visibleViewDescriptors.find(view => view.id === viewId);
            switch (count) {
                case 0:
                    break;
                case 1:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFoundInSection', "1 extension found in the {0} section.", view.name.value));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFound', "1 extension found."));
                    }
                    break;
                default:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFoundInSection', "{0} extensions found in the {1} section.", count, view.name.value));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFound', "{0} extensions found.", count));
                    }
                    break;
            }
        }
        getFirstExpandedPane() {
            for (const pane of this.panes) {
                if (pane.isExpanded() && pane instanceof extensionsViews_1.ExtensionsListView) {
                    return pane;
                }
            }
            return undefined;
        }
        focusListView() {
            const pane = this.getFirstExpandedPane();
            if (pane && pane.count() > 0) {
                pane.focus();
            }
        }
        onViewletOpen(viewlet) {
            if (!viewlet || viewlet.getId() === extensions_2.VIEWLET_ID) {
                return;
            }
            if (this.configurationService.getValue(extensions_2.CloseExtensionDetailsOnViewChangeKey)) {
                const promises = this.editorGroupService.groups.map(group => {
                    const editors = group.editors.filter(input => input instanceof extensionsInput_1.ExtensionsInput);
                    return group.closeEditors(editors);
                });
                Promise.all(promises);
            }
        }
        progress(promise) {
            return this.progressService.withProgress({ location: 5 /* ProgressLocation.Extensions */ }, () => promise);
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/ECONNREFUSED/.test(message)) {
                const error = (0, errorMessage_1.createErrorWithActions)((0, nls_1.localize)('suggestProxyError', "Marketplace returned 'ECONNREFUSED'. Please check the 'http.proxy' setting."), [
                    new actions_1.Action('open user settings', (0, nls_1.localize)('open user settings', "Open User Settings"), undefined, true, () => this.preferencesService.openUserSettings())
                ]);
                this.notificationService.error(error);
                return;
            }
            this.notificationService.error(err);
        }
        isSupportedDragElement(e) {
            if (e.dataTransfer) {
                const typesLowerCase = e.dataTransfer.types.map(t => t.toLocaleLowerCase());
                return typesLowerCase.indexOf('files') !== -1;
            }
            return false;
        }
    };
    exports.ExtensionsViewPaneContainer = ExtensionsViewPaneContainer;
    exports.ExtensionsViewPaneContainer = ExtensionsViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, extensions_2.IExtensionsWorkbenchService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, notification_1.INotificationService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, themeService_1.IThemeService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, storage_1.IStorageService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, contextkey_1.IContextKeyService),
        __param(14, contextView_1.IContextMenuService),
        __param(15, extensions_1.IExtensionService),
        __param(16, views_1.IViewDescriptorService),
        __param(17, preferences_1.IPreferencesService),
        __param(18, commands_1.ICommandService)
    ], ExtensionsViewPaneContainer);
    let StatusUpdater = class StatusUpdater extends lifecycle_1.Disposable {
        constructor(activityService, extensionsWorkbenchService, extensionEnablementService) {
            super();
            this.activityService = activityService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.badgeHandle = this._register(new lifecycle_1.MutableDisposable());
            this.onServiceChange();
            this._register(event_1.Event.debounce(extensionsWorkbenchService.onChange, () => undefined, 100, undefined, undefined, undefined, this._store)(this.onServiceChange, this));
        }
        onServiceChange() {
            this.badgeHandle.clear();
            const actionRequired = this.extensionsWorkbenchService.installed.filter(e => e.runtimeState !== undefined);
            const outdated = this.extensionsWorkbenchService.outdated.reduce((r, e) => r + (this.extensionEnablementService.isEnabled(e.local) && !actionRequired.includes(e) ? 1 : 0), 0);
            const newBadgeNumber = outdated + actionRequired.length;
            if (newBadgeNumber > 0) {
                let msg = '';
                if (outdated) {
                    msg += outdated === 1 ? (0, nls_1.localize)('extensionToUpdate', '{0} requires update', outdated) : (0, nls_1.localize)('extensionsToUpdate', '{0} require update', outdated);
                }
                if (outdated > 0 && actionRequired.length > 0) {
                    msg += ', ';
                }
                if (actionRequired.length) {
                    msg += actionRequired.length === 1 ? (0, nls_1.localize)('extensionToReload', '{0} requires restart', actionRequired.length) : (0, nls_1.localize)('extensionsToReload', '{0} require restart', actionRequired.length);
                }
                const badge = new activity_1.NumberBadge(newBadgeNumber, () => msg);
                this.badgeHandle.value = this.activityService.showViewContainerActivity(extensions_2.VIEWLET_ID, { badge });
            }
        }
    };
    exports.StatusUpdater = StatusUpdater;
    exports.StatusUpdater = StatusUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, extensions_2.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], StatusUpdater);
    let MaliciousExtensionChecker = class MaliciousExtensionChecker {
        constructor(extensionsManagementService, hostService, logService, notificationService, environmentService) {
            this.extensionsManagementService = extensionsManagementService;
            this.hostService = hostService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.environmentService = environmentService;
            if (!this.environmentService.disableExtensions) {
                this.loopCheckForMaliciousExtensions();
            }
        }
        loopCheckForMaliciousExtensions() {
            this.checkForMaliciousExtensions()
                .then(() => (0, async_1.timeout)(1000 * 60 * 5)) // every five minutes
                .then(() => this.loopCheckForMaliciousExtensions());
        }
        checkForMaliciousExtensions() {
            return this.extensionsManagementService.getExtensionsControlManifest().then(extensionsControlManifest => {
                return this.extensionsManagementService.getInstalled(1 /* ExtensionType.User */).then(installed => {
                    const maliciousExtensions = installed
                        .filter(e => extensionsControlManifest.malicious.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier)));
                    if (maliciousExtensions.length) {
                        return async_1.Promises.settled(maliciousExtensions.map(e => this.extensionsManagementService.uninstall(e).then(() => {
                            this.notificationService.prompt(severity_1.default.Warning, (0, nls_1.localize)('malicious warning', "We have uninstalled '{0}' which was reported to be problematic.", e.identifier.id), [{
                                    label: (0, nls_1.localize)('reloadNow', "Reload Now"),
                                    run: () => this.hostService.reload()
                                }], {
                                sticky: true,
                                priority: notification_1.NotificationPriority.URGENT
                            });
                        })));
                    }
                    else {
                        return Promise.resolve(undefined);
                    }
                }).then(() => undefined);
            }, err => this.logService.error(err));
        }
    };
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker;
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, host_1.IHostService),
        __param(2, log_1.ILogService),
        __param(3, notification_1.INotificationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService)
    ], MaliciousExtensionChecker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1ZpZXdsZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc1ZpZXdsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0VuRixRQUFBLG1CQUFtQixHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRixRQUFBLHVCQUF1QixHQUFHLElBQUksMEJBQWEsQ0FBUyx1QkFBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNqRixRQUFBLGtDQUFrQyxHQUFHLElBQUksMEJBQWEsQ0FBVSw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RyxRQUFBLG9CQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRyxNQUFNLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1RixNQUFNLGdDQUFnQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4RyxNQUFNLHNDQUFzQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwSCxNQUFNLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRyxNQUFNLCtCQUErQixHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RyxNQUFNLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxLQUFLLENBQUMs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