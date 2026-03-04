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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/browser/dom", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/log/common/log", "vs/workbench/browser/parts/views/treeView", "vs/workbench/services/userDataProfile/browser/settingsResource", "vs/workbench/services/userDataProfile/browser/keybindingsResource", "vs/workbench/services/userDataProfile/browser/snippetsResource", "vs/workbench/services/userDataProfile/browser/tasksResource", "vs/workbench/services/userDataProfile/browser/extensionsResource", "vs/workbench/services/userDataProfile/browser/globalStateResource", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/browser/ui/button/button", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/base/common/uuid", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/network", "vs/base/common/cancellation", "vs/base/common/severity", "vs/platform/clipboard/common/clipboardService", "vs/platform/url/common/url", "vs/platform/request/common/request", "vs/platform/product/common/productService", "vs/base/common/types", "vs/base/common/actions", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/htmlContent", "vs/base/browser/markdownRenderer", "vs/workbench/services/log/common/logConstants", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/themables", "vs/platform/hover/browser/hover", "vs/workbench/services/userDataProfile/common/userDataProfileIcons", "vs/workbench/services/userDataProfile/browser/iconSelectBox", "vs/base/browser/keyboardEvent", "vs/workbench/services/accessibility/common/accessibleViewInformationService", "vs/css!./media/userDataProfileView"], function (require, exports, nls_1, extensions_1, instantiation_1, notification_1, event_1, DOM, userDataProfile_1, lifecycle_1, dialogs_1, uriIdentity_1, textfiles_1, files_1, uri_1, views_1, viewsService_1, userDataProfile_2, contextkey_1, platform_1, descriptors_1, viewPaneContainer_1, log_1, treeView_1, settingsResource_1, keybindingsResource_1, snippetsResource_1, tasksResource_1, extensionsResource_1, globalStateResource_1, inMemoryFilesystemProvider_1, button_1, keybinding_1, contextView_1, configuration_1, opener_1, themeService_1, telemetry_1, defaultStyles_1, uuid_1, editorService_1, errors_1, progress_1, extensions_2, quickInput_1, buffer_1, resources_1, strings_1, network_1, cancellation_1, severity_1, clipboardService_1, url_1, request_1, productService_1, types_1, actions_1, platform_2, actions_2, codicons_1, async_1, extensionManagement_1, extensionManagementUtil_1, htmlContent_1, markdownRenderer_1, logConstants_1, selectBox_1, themables_1, hover_1, userDataProfileIcons_1, iconSelectBox_1, keyboardEvent_1, accessibleViewInformationService_1) {
    "use strict";
    var UserDataProfileImportExportService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileImportExportService = void 0;
    function isUserDataProfileTemplate(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && (candidate.name && typeof candidate.name === 'string')
            && ((0, types_1.isUndefined)(candidate.icon) || typeof candidate.icon === 'string')
            && ((0, types_1.isUndefined)(candidate.settings) || typeof candidate.settings === 'string')
            && ((0, types_1.isUndefined)(candidate.globalState) || typeof candidate.globalState === 'string')
            && ((0, types_1.isUndefined)(candidate.extensions) || typeof candidate.extensions === 'string'));
    }
    const EXPORT_PROFILE_PREVIEW_VIEW = 'workbench.views.profiles.export.preview';
    const IMPORT_PROFILE_PREVIEW_VIEW = 'workbench.views.profiles.import.preview';
    let UserDataProfileImportExportService = class UserDataProfileImportExportService extends lifecycle_1.Disposable {
        static { UserDataProfileImportExportService_1 = this; }
        static { this.PROFILE_URL_AUTHORITY_PREFIX = 'profile-'; }
        constructor(instantiationService, userDataProfileService, viewsService, editorService, contextKeyService, userDataProfileManagementService, userDataProfilesService, extensionService, extensionManagementService, quickInputService, notificationService, progressService, dialogService, clipboardService, openerService, requestService, urlService, productService, uriIdentityService, telemetryService, contextViewService, hoverService, logService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataProfileService = userDataProfileService;
            this.viewsService = viewsService;
            this.editorService = editorService;
            this.userDataProfileManagementService = userDataProfileManagementService;
            this.userDataProfilesService = userDataProfilesService;
            this.extensionService = extensionService;
            this.extensionManagementService = extensionManagementService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.clipboardService = clipboardService;
            this.openerService = openerService;
            this.requestService = requestService;
            this.productService = productService;
            this.uriIdentityService = uriIdentityService;
            this.telemetryService = telemetryService;
            this.contextViewService = contextViewService;
            this.hoverService = hoverService;
            this.logService = logService;
            this.profileContentHandlers = new Map();
            this.registerProfileContentHandler(network_1.Schemas.file, this.fileUserDataProfileContentHandler = instantiationService.createInstance(FileUserDataProfileContentHandler));
            this.isProfileExportInProgressContextKey = userDataProfile_1.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT.bindTo(contextKeyService);
            this.isProfileImportInProgressContextKey = userDataProfile_1.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT.bindTo(contextKeyService);
            this.viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: 'userDataProfiles',
                title: userDataProfile_1.PROFILES_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, ['userDataProfiles', { mergeViewWithContainerWhenSingleView: true }]),
                icon: userDataProfile_1.defaultUserDataProfileIcon,
                hideIfEmpty: true,
            }, 0 /* ViewContainerLocation.Sidebar */);
            urlService.registerHandler(this);
        }
        isProfileURL(uri) {
            return uri.authority === userDataProfile_1.PROFILE_URL_AUTHORITY || new RegExp(`^${UserDataProfileImportExportService_1.PROFILE_URL_AUTHORITY_PREFIX}`).test(uri.authority);
        }
        async handleURL(uri) {
            if (this.isProfileURL(uri)) {
                try {
                    await this.importProfile(uri);
                }
                catch (error) {
                    this.notificationService.error((0, nls_1.localize)('profile import error', "Error while importing profile: {0}", (0, errors_1.getErrorMessage)(error)));
                }
                return true;
            }
            return false;
        }
        registerProfileContentHandler(id, profileContentHandler) {
            if (this.profileContentHandlers.has(id)) {
                throw new Error(`Profile content handler with id '${id}' already registered.`);
            }
            this.profileContentHandlers.set(id, profileContentHandler);
            return (0, lifecycle_1.toDisposable)(() => this.unregisterProfileContentHandler(id));
        }
        unregisterProfileContentHandler(id) {
            this.profileContentHandlers.delete(id);
        }
        async exportProfile() {
            if (this.isProfileExportInProgressContextKey.get()) {
                this.logService.warn('Profile export already in progress.');
                return;
            }
            return this.showProfileContents();
        }
        async importProfile(uri, options) {
            if (this.isProfileImportInProgressContextKey.get()) {
                this.notificationService.warn('Profile import already in progress.');
                return;
            }
            this.isProfileImportInProgressContextKey.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.isProfileImportInProgressContextKey.set(false)));
            try {
                const mode = options?.mode ?? 'preview';
                const profileTemplate = await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    command: logConstants_1.showWindowLogActionId,
                    title: (0, nls_1.localize)('resolving uri', "{0}: Resolving profile content...", options?.mode ? (0, nls_1.localize)('preview profile', "Preview Profile") : (0, nls_1.localize)('import profile', "Create Profile")),
                }, () => this.resolveProfileTemplate(uri, options));
                if (!profileTemplate) {
                    return;
                }
                if (mode === 'preview') {
                    await this.previewProfile(profileTemplate, options);
                }
                else if (mode === 'apply') {
                    await this.createAndSwitch(profileTemplate, false, true, options, (0, nls_1.localize)('create profile', "Create Profile"));
                }
                else if (mode === 'both') {
                    await this.importAndPreviewProfile(uri, profileTemplate, options);
                }
            }
            finally {
                disposables.dispose();
            }
        }
        createProfile(from) {
            return this.saveProfile(undefined, from);
        }
        editProfile(profile) {
            return this.saveProfile(profile);
        }
        async saveProfile(profile, source) {
            const createProfileTelemetryData = { source: source instanceof uri_1.URI ? 'template' : (0, userDataProfile_2.isUserDataProfile)(source) ? 'profile' : source ? 'external' : undefined };
            if (profile) {
                this.telemetryService.publicLog2('userDataProfile.startEdit');
            }
            else {
                this.telemetryService.publicLog2('userDataProfile.startCreate', createProfileTelemetryData);
            }
            const disposables = new lifecycle_1.DisposableStore();
            const title = profile ? (0, nls_1.localize)('save profile', "Edit {0} Profile...", profile.name) : (0, nls_1.localize)('create new profle', "Create New Profile...");
            const settings = { id: "settings" /* ProfileResourceType.Settings */, label: (0, nls_1.localize)('settings', "Settings"), picked: !profile?.useDefaultFlags?.settings };
            const keybindings = { id: "keybindings" /* ProfileResourceType.Keybindings */, label: (0, nls_1.localize)('keybindings', "Keyboard Shortcuts"), picked: !profile?.useDefaultFlags?.keybindings };
            const snippets = { id: "snippets" /* ProfileResourceType.Snippets */, label: (0, nls_1.localize)('snippets', "User Snippets"), picked: !profile?.useDefaultFlags?.snippets };
            const tasks = { id: "tasks" /* ProfileResourceType.Tasks */, label: (0, nls_1.localize)('tasks', "User Tasks"), picked: !profile?.useDefaultFlags?.tasks };
            const extensions = { id: "extensions" /* ProfileResourceType.Extensions */, label: (0, nls_1.localize)('extensions', "Extensions"), picked: !profile?.useDefaultFlags?.extensions };
            const resources = [settings, keybindings, snippets, tasks, extensions];
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.title = title;
            quickPick.placeholder = (0, nls_1.localize)('name placeholder', "Profile name");
            quickPick.value = profile?.name ?? (isUserDataProfileTemplate(source) ? this.generateProfileName(source.name) : '');
            quickPick.canSelectMany = true;
            quickPick.matchOnDescription = false;
            quickPick.matchOnDetail = false;
            quickPick.matchOnLabel = false;
            quickPick.sortByLabel = false;
            quickPick.hideCountBadge = true;
            quickPick.ok = false;
            quickPick.customButton = true;
            quickPick.hideCheckAll = true;
            quickPick.ignoreFocusOut = true;
            quickPick.customLabel = profile ? (0, nls_1.localize)('save', "Save") : (0, nls_1.localize)('create', "Create");
            quickPick.description = (0, nls_1.localize)('customise the profile', "Choose what to configure in your Profile:");
            quickPick.items = [...resources];
            const update = () => {
                quickPick.items = resources;
                quickPick.selectedItems = resources.filter(item => item.picked);
            };
            update();
            const validate = () => {
                if (!profile && this.userDataProfilesService.profiles.some(p => p.name === quickPick.value)) {
                    quickPick.validationMessage = (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", quickPick.value);
                    quickPick.severity = severity_1.default.Warning;
                    return;
                }
                if (resources.every(resource => !resource.picked)) {
                    quickPick.validationMessage = (0, nls_1.localize)('invalid configurations', "The profile should contain at least one configuration.");
                    quickPick.severity = severity_1.default.Warning;
                    return;
                }
                quickPick.severity = severity_1.default.Ignore;
                quickPick.validationMessage = undefined;
            };
            disposables.add(quickPick.onDidChangeSelection(items => {
                let needUpdate = false;
                for (const resource of resources) {
                    resource.picked = items.includes(resource);
                    const description = resource.picked ? undefined : (0, nls_1.localize)('use default profile', "Using Default Profile");
                    if (resource.description !== description) {
                        resource.description = description;
                        needUpdate = true;
                    }
                }
                if (needUpdate) {
                    update();
                }
                validate();
            }));
            disposables.add(quickPick.onDidChangeValue(validate));
            let icon = userDataProfileIcons_1.DEFAULT_ICON;
            if (profile?.icon) {
                icon = themables_1.ThemeIcon.fromId(profile.icon);
            }
            if (isUserDataProfileTemplate(source) && source.icon) {
                icon = themables_1.ThemeIcon.fromId(source.icon);
            }
            if (icon.id !== userDataProfileIcons_1.DEFAULT_ICON.id && !userDataProfileIcons_1.ICONS.some(({ id }) => id === icon.id) && !(0, codicons_1.getAllCodicons)().some(({ id }) => id === icon.id)) {
                icon = userDataProfileIcons_1.DEFAULT_ICON;
            }
            let result;
            disposables.add(event_1.Event.any(quickPick.onDidCustom, quickPick.onDidAccept)(() => {
                const name = quickPick.value.trim();
                if (!name) {
                    quickPick.validationMessage = (0, nls_1.localize)('name required', "Profile name is required and must be a non-empty value.");
                    quickPick.severity = severity_1.default.Error;
                }
                if (quickPick.validationMessage) {
                    return;
                }
                result = { name, items: quickPick.selectedItems, icon: icon.id === userDataProfileIcons_1.DEFAULT_ICON.id ? null : icon.id };
                quickPick.hide();
                quickPick.severity = severity_1.default.Ignore;
                quickPick.validationMessage = undefined;
            }));
            const domNode = DOM.$('.profile-edit-widget');
            const profileIconContainer = DOM.$('.profile-icon-container');
            DOM.append(profileIconContainer, DOM.$('.profile-icon-label', undefined, (0, nls_1.localize)('icon', "Icon:")));
            const profileIconElement = DOM.append(profileIconContainer, DOM.$(`.profile-icon${themables_1.ThemeIcon.asCSSSelector(icon)}`));
            profileIconElement.tabIndex = 0;
            profileIconElement.role = 'button';
            profileIconElement.ariaLabel = (0, nls_1.localize)('select icon', "Icon: {0}", icon.id);
            const iconSelectBox = disposables.add(this.instantiationService.createInstance(iconSelectBox_1.WorkbenchIconSelectBox, { icons: userDataProfileIcons_1.ICONS, inputBoxStyles: defaultStyles_1.defaultInputBoxStyles }));
            const dimension = new DOM.Dimension(486, 260);
            iconSelectBox.layout(dimension);
            let hoverWidget;
            const updateIcon = (updated) => {
                icon = updated ?? userDataProfileIcons_1.DEFAULT_ICON;
                profileIconElement.className = `profile-icon ${themables_1.ThemeIcon.asClassName(icon)}`;
                profileIconElement.ariaLabel = (0, nls_1.localize)('select icon', "Icon: {0}", icon.id);
            };
            disposables.add(iconSelectBox.onDidSelect(selectedIcon => {
                if (icon.id !== selectedIcon.id) {
                    updateIcon(selectedIcon);
                }
                hoverWidget?.dispose();
                profileIconElement.focus();
            }));
            const showIconSelectBox = () => {
                iconSelectBox.clearInput();
                hoverWidget = this.hoverService.showHover({
                    content: iconSelectBox.domNode,
                    target: profileIconElement,
                    position: {
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                    },
                    persistence: {
                        sticky: true,
                    },
                    appearance: {
                        showPointer: true,
                    },
                }, true);
                if (hoverWidget) {
                    iconSelectBox.layout(dimension);
                    disposables.add(hoverWidget);
                }
                iconSelectBox.focus();
            };
            disposables.add(DOM.addDisposableListener(profileIconElement, DOM.EventType.CLICK, (e) => {
                DOM.EventHelper.stop(e, true);
                showIconSelectBox();
            }));
            disposables.add(DOM.addDisposableListener(profileIconElement, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    DOM.EventHelper.stop(event, true);
                    showIconSelectBox();
                }
            }));
            disposables.add(DOM.addDisposableListener(iconSelectBox.domNode, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(9 /* KeyCode.Escape */)) {
                    DOM.EventHelper.stop(event, true);
                    hoverWidget?.dispose();
                    profileIconElement.focus();
                }
            }));
            if (!profile && !isUserDataProfileTemplate(source)) {
                const profileTypeContainer = DOM.append(domNode, DOM.$('.profile-type-container'));
                DOM.append(profileTypeContainer, DOM.$('.profile-type-create-label', undefined, (0, nls_1.localize)('create from', "Copy from:")));
                const separator = { text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', isDisabled: true };
                const profileOptions = [];
                profileOptions.push({ text: (0, nls_1.localize)('empty profile', "None") });
                const templates = await this.userDataProfileManagementService.getBuiltinProfileTemplates();
                if (templates.length) {
                    profileOptions.push({ ...separator, decoratorRight: (0, nls_1.localize)('from templates', "Profile Templates") });
                    for (const template of templates) {
                        profileOptions.push({ text: template.name, id: template.url, source: uri_1.URI.parse(template.url) });
                    }
                }
                profileOptions.push({ ...separator, decoratorRight: (0, nls_1.localize)('from existing profiles', "Existing Profiles") });
                for (const profile of this.userDataProfilesService.profiles) {
                    profileOptions.push({ text: profile.name, id: profile.id, source: profile });
                }
                const findOptionIndex = () => {
                    const index = profileOptions.findIndex(option => {
                        if (source instanceof uri_1.URI) {
                            return option.source instanceof uri_1.URI && this.uriIdentityService.extUri.isEqual(option.source, source);
                        }
                        else if ((0, userDataProfile_2.isUserDataProfile)(source)) {
                            return option.id === source.id;
                        }
                        return false;
                    });
                    return index > -1 ? index : 0;
                };
                const initialIndex = findOptionIndex();
                const selectBox = disposables.add(this.instantiationService.createInstance(selectBox_1.SelectBox, profileOptions, initialIndex, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, {
                    useCustomDrawn: true,
                    ariaLabel: (0, nls_1.localize)('copy profile from', "Copy profile from"),
                }));
                selectBox.render(DOM.append(profileTypeContainer, DOM.$('.profile-type-select-container')));
                if (profileOptions[initialIndex].source) {
                    quickPick.value = this.generateProfileName(profileOptions[initialIndex].text);
                }
                const updateOptions = () => {
                    const option = profileOptions[findOptionIndex()];
                    for (const resource of resources) {
                        resource.picked = option.source && !(option.source instanceof uri_1.URI) ? !option.source?.useDefaultFlags?.[resource.id] : true;
                    }
                    updateIcon(!(option.source instanceof uri_1.URI) && option.source?.icon ? themables_1.ThemeIcon.fromId(option.source.icon) : undefined);
                    update();
                };
                updateOptions();
                disposables.add(selectBox.onDidSelect(({ index }) => {
                    source = profileOptions[index].source;
                    updateOptions();
                }));
            }
            DOM.append(domNode, profileIconContainer);
            quickPick.widget = domNode;
            quickPick.show();
            await new Promise((c, e) => {
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
            });
            if (!result) {
                if (profile) {
                    this.telemetryService.publicLog2('userDataProfile.cancelEdit');
                }
                else {
                    this.telemetryService.publicLog2('userDataProfile.cancelCreate', createProfileTelemetryData);
                }
                return;
            }
            try {
                const useDefaultFlags = result.items.length === resources.length
                    ? undefined
                    : {
                        settings: !result.items.includes(settings),
                        keybindings: !result.items.includes(keybindings),
                        snippets: !result.items.includes(snippets),
                        tasks: !result.items.includes(tasks),
                        extensions: !result.items.includes(extensions)
                    };
                if (profile) {
                    await this.userDataProfileManagementService.updateProfile(profile, { name: result.name, icon: result.icon, useDefaultFlags: profile.useDefaultFlags && !useDefaultFlags ? {} : useDefaultFlags });
                }
                else {
                    if (source instanceof uri_1.URI) {
                        this.telemetryService.publicLog2('userDataProfile.createFromTemplate', createProfileTelemetryData);
                        await this.importProfile(source, { mode: 'apply', name: result.name, useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                    else if ((0, userDataProfile_2.isUserDataProfile)(source)) {
                        this.telemetryService.publicLog2('userDataProfile.createFromProfile', createProfileTelemetryData);
                        await this.createFromProfile(source, result.name, { useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                    else if (isUserDataProfileTemplate(source)) {
                        source.name = result.name;
                        this.telemetryService.publicLog2('userDataProfile.createFromExternalTemplate', createProfileTelemetryData);
                        await this.createAndSwitch(source, false, true, { useDefaultFlags, icon: result.icon ? result.icon : undefined }, (0, nls_1.localize)('create profile', "Create Profile"));
                    }
                    else {
                        this.telemetryService.publicLog2('userDataProfile.createEmptyProfile', createProfileTelemetryData);
                        await this.userDataProfileManagementService.createAndEnterProfile(result.name, { useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                }
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
        async showProfileContents() {
            const view = this.viewsService.getViewWithId(EXPORT_PROFILE_PREVIEW_VIEW);
            if (view) {
                this.viewsService.openView(view.id, true);
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfilesExportState = disposables.add(this.instantiationService.createInstance(UserDataProfileExportState, this.userDataProfileService.currentProfile));
                const barrier = new async_1.Barrier();
                const exportAction = new BarrierAction(barrier, new actions_1.Action('export', (0, nls_1.localize)('export', "Export"), undefined, true, async () => {
                    exportAction.enabled = false;
                    try {
                        await this.doExportProfile(userDataProfilesExportState);
                    }
                    catch (error) {
                        exportAction.enabled = true;
                        this.notificationService.error(error);
                        throw error;
                    }
                }), this.notificationService);
                const closeAction = new BarrierAction(barrier, new actions_1.Action('close', (0, nls_1.localize)('close', "Close")), this.notificationService);
                await this.showProfilePreviewView(EXPORT_PROFILE_PREVIEW_VIEW, userDataProfilesExportState.profile.name, exportAction, closeAction, true, userDataProfilesExportState);
                disposables.add(this.userDataProfileService.onDidChangeCurrentProfile(e => barrier.open()));
                await barrier.wait();
                await this.hideProfilePreviewView(EXPORT_PROFILE_PREVIEW_VIEW);
            }
            finally {
                disposables.dispose();
            }
        }
        async createFromProfile(profile, name, options) {
            const userDataProfilesExportState = this.instantiationService.createInstance(UserDataProfileExportState, profile);
            try {
                const profileTemplate = await userDataProfilesExportState.getProfileTemplate(name, options?.icon);
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    delay: 500,
                    sticky: true,
                }, async (progress) => {
                    const reportProgress = (message) => progress.report({ message: (0, nls_1.localize)('create from profile', "Create Profile: {0}", message) });
                    const createdProfile = await this.doCreateProfile(profileTemplate, false, false, { useDefaultFlags: options?.useDefaultFlags, icon: options?.icon }, reportProgress);
                    if (createdProfile) {
                        reportProgress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                        await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).copy(profile, createdProfile, false);
                        reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                        await this.userDataProfileManagementService.switchProfile(createdProfile);
                    }
                });
            }
            finally {
                userDataProfilesExportState.dispose();
            }
        }
        async createTroubleshootProfile() {
            const userDataProfilesExportState = this.instantiationService.createInstance(UserDataProfileExportState, this.userDataProfileService.currentProfile);
            try {
                const profileTemplate = await userDataProfilesExportState.getProfileTemplate((0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"), undefined);
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    delay: 1000,
                    sticky: true,
                }, async (progress) => {
                    const reportProgress = (message) => progress.report({ message: (0, nls_1.localize)('troubleshoot profile progress', "Setting up Troubleshoot Profile: {0}", message) });
                    const profile = await this.doCreateProfile(profileTemplate, true, false, { useDefaultFlags: this.userDataProfileService.currentProfile.useDefaultFlags }, reportProgress);
                    if (profile) {
                        reportProgress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                        await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).copy(this.userDataProfileService.currentProfile, profile, true);
                        reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                        await this.userDataProfileManagementService.switchProfile(profile);
                    }
                });
            }
            finally {
                userDataProfilesExportState.dispose();
            }
        }
        async doExportProfile(userDataProfilesExportState) {
            const profile = await userDataProfilesExportState.getProfileToExport();
            if (!profile) {
                return;
            }
            this.isProfileExportInProgressContextKey.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.isProfileExportInProgressContextKey.set(false)));
            try {
                await this.progressService.withProgress({
                    location: EXPORT_PROFILE_PREVIEW_VIEW,
                    title: (0, nls_1.localize)('profiles.exporting', "{0}: Exporting...", userDataProfile_1.PROFILES_CATEGORY.value),
                }, async (progress) => {
                    const id = await this.pickProfileContentHandler(profile.name);
                    if (!id) {
                        return;
                    }
                    const profileContentHandler = this.profileContentHandlers.get(id);
                    if (!profileContentHandler) {
                        return;
                    }
                    const saveResult = await profileContentHandler.saveProfile(profile.name.replace('/', '-'), JSON.stringify(profile), cancellation_1.CancellationToken.None);
                    if (!saveResult) {
                        return;
                    }
                    const message = (0, nls_1.localize)('export success', "Profile '{0}' was exported successfully.", profile.name);
                    if (profileContentHandler.extensionId) {
                        const buttons = [];
                        const link = this.productService.webUrl ? `${this.productService.webUrl}/${userDataProfile_1.PROFILE_URL_AUTHORITY}/${id}/${saveResult.id}` : (0, userDataProfile_1.toUserDataProfileUri)(`/${id}/${saveResult.id}`, this.productService).toString();
                        buttons.push({
                            label: (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy Link"),
                            run: () => this.clipboardService.writeText(link)
                        });
                        if (this.productService.webUrl) {
                            buttons.push({
                                label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open Link"),
                                run: async () => {
                                    await this.openerService.open(link);
                                }
                            });
                        }
                        else {
                            buttons.push({
                                label: (0, nls_1.localize)({ key: 'open in', comment: ['&& denotes a mnemonic'] }, "&&Open in {0}", profileContentHandler.name),
                                run: async () => {
                                    await this.openerService.open(saveResult.link.toString());
                                }
                            });
                        }
                        await this.dialogService.prompt({
                            type: severity_1.default.Info,
                            message,
                            buttons,
                            cancelButton: (0, nls_1.localize)('close', "Close")
                        });
                    }
                    else {
                        await this.dialogService.info(message);
                    }
                });
            }
            finally {
                disposables.dispose();
            }
        }
        async resolveProfileTemplate(uri, options) {
            const profileContent = await this.resolveProfileContent(uri);
            if (profileContent === null) {
                return null;
            }
            const profileTemplate = JSON.parse(profileContent);
            if (!isUserDataProfileTemplate(profileTemplate)) {
                throw new Error('Invalid profile content.');
            }
            if (options?.name) {
                profileTemplate.name = options.name;
            }
            if (options?.icon) {
                profileTemplate.icon = options.icon;
            }
            return profileTemplate;
        }
        async importAndPreviewProfile(uri, profileTemplate, options) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfileImportState = disposables.add(this.instantiationService.createInstance(UserDataProfileImportState, profileTemplate));
                profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                const importedProfile = await this.createAndSwitch(profileTemplate, true, false, options, (0, nls_1.localize)('preview profile', "Preview Profile"));
                if (!importedProfile) {
                    return;
                }
                const barrier = new async_1.Barrier();
                const importAction = this.getCreateAction(barrier, userDataProfileImportState);
                const primaryAction = platform_2.isWeb
                    ? new actions_1.Action('importInDesktop', (0, nls_1.localize)('import in desktop', "Create Profile in {0}", this.productService.nameLong), undefined, true, async () => this.openerService.open(uri, { openExternal: true }))
                    : importAction;
                const secondaryAction = platform_2.isWeb
                    ? importAction
                    : new BarrierAction(barrier, new actions_1.Action('close', (0, nls_1.localize)('close', "Close")), this.notificationService);
                const view = await this.showProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW, importedProfile.name, primaryAction, secondaryAction, false, userDataProfileImportState);
                const message = new htmlContent_1.MarkdownString();
                message.appendMarkdown((0, nls_1.localize)('preview profile message', "By default, extensions aren't installed when previewing a profile on the web. You can still install them manually before importing the profile. "));
                message.appendMarkdown(`[${(0, nls_1.localize)('learn more', "Learn more")}](https://aka.ms/vscode-extension-marketplace#_can-i-trust-extensions-from-the-marketplace).`);
                view.setMessage(message);
                const that = this;
                const disposable = disposables.add((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'previewProfile.installExtensions',
                            title: (0, nls_1.localize)('install extensions title', "Install Extensions"),
                            icon: codicons_1.Codicon.cloudDownload,
                            menu: {
                                id: actions_2.MenuId.ViewItemContext,
                                group: 'inline',
                                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', IMPORT_PROFILE_PREVIEW_VIEW), contextkey_1.ContextKeyExpr.equals('viewItem', "extensions" /* ProfileResourceType.Extensions */)),
                            }
                        });
                    }
                    async run() {
                        return that.progressService.withProgress({
                            location: IMPORT_PROFILE_PREVIEW_VIEW,
                        }, async (progress) => {
                            view.setMessage(undefined);
                            const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                            if (profileTemplate.extensions) {
                                await that.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profileTemplate.extensions, importedProfile);
                            }
                            disposable.dispose();
                        });
                    }
                }));
                disposables.add(event_1.Event.debounce(this.extensionManagementService.onDidInstallExtensions, () => undefined, 100)(async () => {
                    const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                    if (profileTemplate.extensions) {
                        const profileExtensions = await that.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).getProfileExtensions(profileTemplate.extensions);
                        const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
                        if (profileExtensions.every(e => installed.some(i => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, i.identifier)))) {
                            disposable.dispose();
                        }
                    }
                }));
                await barrier.wait();
                await this.hideProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW);
            }
            finally {
                disposables.dispose();
            }
        }
        async previewProfile(profileTemplate, options) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfileImportState = disposables.add(this.instantiationService.createInstance(UserDataProfileImportState, profileTemplate));
                if (userDataProfileImportState.isEmpty()) {
                    await this.createAndSwitch(profileTemplate, false, true, options, (0, nls_1.localize)('create profile', "Create Profile"));
                }
                else {
                    const barrier = new async_1.Barrier();
                    const cancelAction = new BarrierAction(barrier, new actions_1.Action('cancel', (0, nls_1.localize)('cancel', "Cancel")), this.notificationService);
                    const importAction = this.getCreateAction(barrier, userDataProfileImportState, cancelAction);
                    await this.showProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW, profileTemplate.name, importAction, cancelAction, false, userDataProfileImportState);
                    await barrier.wait();
                    await this.hideProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW);
                }
            }
            finally {
                disposables.dispose();
            }
        }
        getCreateAction(barrier, userDataProfileImportState, cancelAction) {
            const importAction = new BarrierAction(barrier, new actions_1.Action('title', (0, nls_1.localize)('import', "Create Profile"), undefined, true, async () => {
                importAction.enabled = false;
                if (cancelAction) {
                    cancelAction.enabled = false;
                }
                const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                return this.saveProfile(undefined, profileTemplate);
            }), this.notificationService);
            return importAction;
        }
        async createAndSwitch(profileTemplate, temporaryProfile, extensions, options, title) {
            return this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                delay: 500,
                sticky: true,
            }, async (progress) => {
                title = `${title} (${profileTemplate.name})`;
                progress.report({ message: title });
                const reportProgress = (message) => progress.report({ message: `${title}: ${message}` });
                const profile = await this.doCreateProfile(profileTemplate, temporaryProfile, extensions, options, reportProgress);
                if (profile) {
                    reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                    await this.userDataProfileManagementService.switchProfile(profile);
                }
                return profile;
            });
        }
        async doCreateProfile(profileTemplate, temporaryProfile, extensions, options, progress) {
            const profile = await this.getProfileToImport(profileTemplate, temporaryProfile, options);
            if (!profile) {
                return undefined;
            }
            if (profileTemplate.settings && !profile.useDefaultFlags?.settings) {
                progress((0, nls_1.localize)('progress settings', "Applying Settings..."));
                await this.instantiationService.createInstance(settingsResource_1.SettingsResource).apply(profileTemplate.settings, profile);
            }
            if (profileTemplate.keybindings && !profile.useDefaultFlags?.keybindings) {
                progress((0, nls_1.localize)('progress keybindings', "Applying Keyboard Shortcuts..."));
                await this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource).apply(profileTemplate.keybindings, profile);
            }
            if (profileTemplate.tasks && !profile.useDefaultFlags?.tasks) {
                progress((0, nls_1.localize)('progress tasks', "Applying Tasks..."));
                await this.instantiationService.createInstance(tasksResource_1.TasksResource).apply(profileTemplate.tasks, profile);
            }
            if (profileTemplate.snippets && !profile.useDefaultFlags?.snippets) {
                progress((0, nls_1.localize)('progress snippets', "Applying Snippets..."));
                await this.instantiationService.createInstance(snippetsResource_1.SnippetsResource).apply(profileTemplate.snippets, profile);
            }
            if (profileTemplate.globalState && !profile.useDefaultFlags?.globalState) {
                progress((0, nls_1.localize)('progress global state', "Applying State..."));
                await this.instantiationService.createInstance(globalStateResource_1.GlobalStateResource).apply(profileTemplate.globalState, profile);
            }
            if (profileTemplate.extensions && extensions && !profile.useDefaultFlags?.extensions) {
                progress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profileTemplate.extensions, profile);
            }
            return profile;
        }
        async resolveProfileContent(resource) {
            if (await this.fileUserDataProfileContentHandler.canHandle(resource)) {
                return this.fileUserDataProfileContentHandler.readProfile(resource, cancellation_1.CancellationToken.None);
            }
            if (this.isProfileURL(resource)) {
                let handlerId, idOrUri;
                if (resource.authority === userDataProfile_1.PROFILE_URL_AUTHORITY) {
                    idOrUri = this.uriIdentityService.extUri.basename(resource);
                    handlerId = this.uriIdentityService.extUri.basename(this.uriIdentityService.extUri.dirname(resource));
                }
                else {
                    handlerId = resource.authority.substring(UserDataProfileImportExportService_1.PROFILE_URL_AUTHORITY_PREFIX.length);
                    idOrUri = uri_1.URI.parse(resource.path.substring(1));
                }
                await this.extensionService.activateByEvent(`onProfile:${handlerId}`);
                const profileContentHandler = this.profileContentHandlers.get(handlerId);
                if (profileContentHandler) {
                    return profileContentHandler.readProfile(idOrUri, cancellation_1.CancellationToken.None);
                }
            }
            await this.extensionService.activateByEvent('onProfile');
            for (const profileContentHandler of this.profileContentHandlers.values()) {
                const content = await profileContentHandler.readProfile(resource, cancellation_1.CancellationToken.None);
                if (content !== null) {
                    return content;
                }
            }
            const context = await this.requestService.request({ type: 'GET', url: resource.toString(true) }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 200) {
                return await (0, request_1.asText)(context);
            }
            else {
                const message = await (0, request_1.asText)(context);
                throw new Error(`Failed to get profile from URL: ${resource.toString()}. Status code: ${context.res.statusCode}. Message: ${message}`);
            }
        }
        async pickProfileContentHandler(name) {
            await this.extensionService.activateByEvent('onProfile');
            if (this.profileContentHandlers.size === 1) {
                return this.profileContentHandlers.keys().next().value;
            }
            const options = [];
            for (const [id, profileContentHandler] of this.profileContentHandlers) {
                options.push({ id, label: profileContentHandler.name, description: profileContentHandler.description });
            }
            const result = await this.quickInputService.pick(options.reverse(), {
                title: (0, nls_1.localize)('select profile content handler', "Export '{0}' profile as...", name),
                hideInput: true
            });
            return result?.id;
        }
        async getProfileToImport(profileTemplate, temp, options) {
            const profileName = profileTemplate.name;
            const profile = this.userDataProfilesService.profiles.find(p => p.name === profileName);
            if (profile) {
                if (temp) {
                    return this.userDataProfilesService.createNamedProfile(`${profileName} ${this.getProfileNameIndex(profileName)}`, { ...options, transient: temp });
                }
                let ImportProfileChoice;
                (function (ImportProfileChoice) {
                    ImportProfileChoice[ImportProfileChoice["Overwrite"] = 0] = "Overwrite";
                    ImportProfileChoice[ImportProfileChoice["CreateNew"] = 1] = "CreateNew";
                    ImportProfileChoice[ImportProfileChoice["Cancel"] = 2] = "Cancel";
                })(ImportProfileChoice || (ImportProfileChoice = {}));
                const { result } = await this.dialogService.prompt({
                    type: severity_1.default.Info,
                    message: (0, nls_1.localize)('profile already exists', "Profile with name '{0}' already exists. Do you want to overwrite it?", profileName),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'overwrite', comment: ['&& denotes a mnemonic'] }, "&&Overwrite"),
                            run: () => ImportProfileChoice.Overwrite
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'create new', comment: ['&& denotes a mnemonic'] }, "&&Create New Profile"),
                            run: () => ImportProfileChoice.CreateNew
                        },
                    ],
                    cancelButton: {
                        run: () => ImportProfileChoice.Cancel
                    }
                });
                if (result === ImportProfileChoice.Overwrite) {
                    return profile;
                }
                if (result === ImportProfileChoice.Cancel) {
                    return undefined;
                }
                // Create new profile
                const name = await this.quickInputService.input({
                    placeHolder: (0, nls_1.localize)('name', "Profile name"),
                    title: (0, nls_1.localize)('create new title', "Create New Profile"),
                    value: `${profileName} ${this.getProfileNameIndex(profileName)}`,
                    validateInput: async (value) => {
                        if (this.userDataProfilesService.profiles.some(p => p.name === value)) {
                            return (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", value);
                        }
                        return undefined;
                    }
                });
                if (!name) {
                    return undefined;
                }
                return this.userDataProfilesService.createNamedProfile(name);
            }
            else {
                return this.userDataProfilesService.createNamedProfile(profileName, { ...options, transient: temp });
            }
        }
        generateProfileName(profileName) {
            const existingProfile = this.userDataProfilesService.profiles.find(p => p.name === profileName);
            return existingProfile ? `${profileName} ${this.getProfileNameIndex(profileName)}` : profileName;
        }
        getProfileNameIndex(name) {
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(name)}\\s(\\d+)`);
            let nameIndex = 0;
            for (const profile of this.userDataProfilesService.profiles) {
                const matches = nameRegEx.exec(profile.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            return nameIndex + 1;
        }
        async showProfilePreviewView(id, name, primary, secondary, refreshAction, userDataProfilesData) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            if (refreshAction) {
                treeView.showRefreshAction = true;
            }
            const actionRunner = new actions_1.ActionRunner();
            const descriptor = {
                id,
                name: { value: name, original: name },
                ctorDescriptor: new descriptors_1.SyncDescriptor(UserDataProfilePreviewViewPane, [userDataProfilesData, primary, secondary, actionRunner]),
                canToggleVisibility: false,
                canMoveView: false,
                treeView,
                collapsed: false,
            };
            viewsRegistry.registerViews([descriptor], this.viewContainer);
            return (await this.viewsService.openView(id, true));
        }
        async hideProfilePreviewView(id) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewDescriptor = viewsRegistry.getView(id);
            if (viewDescriptor) {
                viewDescriptor.treeView.dispose();
                viewsRegistry.deregisterViews([viewDescriptor], this.viewContainer);
            }
            await this.closeAllImportExportPreviewEditors();
        }
        async closeAllImportExportPreviewEditors() {
            const editorsToColse = this.editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).filter(({ editor }) => editor.resource?.scheme === USER_DATA_PROFILE_EXPORT_SCHEME || editor.resource?.scheme === USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME || editor.resource?.scheme === USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME);
            if (editorsToColse.length) {
                await this.editorService.closeEditors(editorsToColse);
            }
        }
        async setProfile(profile) {
            await this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                title: (0, nls_1.localize)('profiles.applying', "{0}: Applying...", userDataProfile_1.PROFILES_CATEGORY.value),
            }, async (progress) => {
                if (profile.settings) {
                    await this.instantiationService.createInstance(settingsResource_1.SettingsResource).apply(profile.settings, this.userDataProfileService.currentProfile);
                }
                if (profile.globalState) {
                    await this.instantiationService.createInstance(globalStateResource_1.GlobalStateResource).apply(profile.globalState, this.userDataProfileService.currentProfile);
                }
                if (profile.extensions) {
                    await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profile.extensions, this.userDataProfileService.currentProfile);
                }
            });
            this.notificationService.info((0, nls_1.localize)('applied profile', "{0}: Applied successfully.", userDataProfile_1.PROFILES_CATEGORY.value));
        }
    };
    exports.UserDataProfileImportExportService = UserDataProfileImportExportService;
    exports.UserDataProfileImportExportService = UserDataProfileImportExportService = UserDataProfileImportExportService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, viewsService_1.IViewsService),
        __param(3, editorService_1.IEditorService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, userDataProfile_1.IUserDataProfileManagementService),
        __param(6, userDataProfile_2.IUserDataProfilesService),
        __param(7, extensions_2.IExtensionService),
        __param(8, extensionManagement_1.IExtensionManagementService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, notification_1.INotificationService),
        __param(11, progress_1.IProgressService),
        __param(12, dialogs_1.IDialogService),
        __param(13, clipboardService_1.IClipboardService),
        __param(14, opener_1.IOpenerService),
        __param(15, request_1.IRequestService),
        __param(16, url_1.IURLService),
        __param(17, productService_1.IProductService),
        __param(18, uriIdentity_1.IUriIdentityService),
        __param(19, telemetry_1.ITelemetryService),
        __param(20, contextView_1.IContextViewService),
        __param(21, hover_1.IHoverService),
        __param(22, log_1.ILogService)
    ], UserDataProfileImportExportService);
    let FileUserDataProfileContentHandler = class FileUserDataProfileContentHandler {
        constructor(fileDialogService, uriIdentityService, fileService, textFileService) {
            this.fileDialogService = fileDialogService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.name = (0, nls_1.localize)('local', "Local");
            this.description = (0, nls_1.localize)('file', "file");
        }
        async saveProfile(name, content, token) {
            const link = await this.fileDialogService.showSaveDialog({
                title: (0, nls_1.localize)('export profile dialog', "Save Profile"),
                filters: userDataProfile_1.PROFILE_FILTER,
                defaultUri: this.uriIdentityService.extUri.joinPath(await this.fileDialogService.defaultFilePath(), `${name}.${userDataProfile_1.PROFILE_EXTENSION}`),
            });
            if (!link) {
                return null;
            }
            await this.textFileService.create([{ resource: link, value: content, options: { overwrite: true } }]);
            return { link, id: link.toString() };
        }
        async canHandle(uri) {
            return uri.scheme !== network_1.Schemas.http && uri.scheme !== network_1.Schemas.https && await this.fileService.canHandleResource(uri);
        }
        async readProfile(uri, token) {
            if (await this.canHandle(uri)) {
                return (await this.fileService.readFile(uri, undefined, token)).value.toString();
            }
            return null;
        }
        async selectProfile() {
            const profileLocation = await this.fileDialogService.showOpenDialog({
                canSelectFolders: false,
                canSelectFiles: true,
                canSelectMany: false,
                filters: userDataProfile_1.PROFILE_FILTER,
                title: (0, nls_1.localize)('select profile', "Select Profile"),
            });
            return profileLocation ? profileLocation[0] : null;
        }
    };
    FileUserDataProfileContentHandler = __decorate([
        __param(0, dialogs_1.IFileDialogService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService)
    ], FileUserDataProfileContentHandler);
    let UserDataProfilePreviewViewPane = class UserDataProfilePreviewViewPane extends treeView_1.TreeViewPane {
        constructor(userDataProfileData, primaryAction, secondaryAction, actionRunner, options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService, hoverService, accessibleViewService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService, hoverService, accessibleViewService);
            this.userDataProfileData = userDataProfileData;
            this.primaryAction = primaryAction;
            this.secondaryAction = secondaryAction;
            this.actionRunner = actionRunner;
            this.totalTreeItemsCount = 0;
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        renderTreeView(container) {
            this.treeView.dataProvider = this.userDataProfileData;
            super.renderTreeView(DOM.append(container, DOM.$('.profile-view-tree-container')));
            this.messageContainer = DOM.append(container, DOM.$('.profile-view-message-container.hide'));
            this.createButtons(container);
            this._register(this.treeView.onDidChangeCheckboxState(() => this.updateConfirmButtonEnablement()));
            this.computeAndLayout();
            this._register(event_1.Event.any(this.userDataProfileData.onDidChangeRoots, this.treeView.onDidCollapseItem, this.treeView.onDidExpandItem)(() => this.computeAndLayout()));
        }
        async computeAndLayout() {
            const roots = await this.userDataProfileData.getRoots();
            const children = await Promise.all(roots.map(async (root) => {
                let expanded = root.collapsibleState === views_1.TreeItemCollapsibleState.Expanded;
                try {
                    expanded = !this.treeView.isCollapsed(root);
                }
                catch (error) { /* Ignore because element might not be added yet */ }
                if (expanded) {
                    const children = await root.getChildren();
                    return children ?? [];
                }
                return [];
            }));
            this.totalTreeItemsCount = roots.length + children.flat().length;
            this.updateConfirmButtonEnablement();
            if (this.dimension) {
                this.layoutTreeView(this.dimension.height, this.dimension.width);
            }
        }
        createButtons(container) {
            this.buttonsContainer = DOM.append(container, DOM.$('.profile-view-buttons-container'));
            this.primaryButton = this._register(new button_1.Button(this.buttonsContainer, { ...defaultStyles_1.defaultButtonStyles }));
            this.primaryButton.element.classList.add('profile-view-button');
            this.primaryButton.label = this.primaryAction.label;
            this.primaryButton.enabled = this.primaryAction.enabled;
            this._register(this.primaryButton.onDidClick(() => this.actionRunner.run(this.primaryAction)));
            this._register(this.primaryAction.onDidChange(e => {
                if (e.enabled !== undefined) {
                    this.primaryButton.enabled = e.enabled;
                }
            }));
            this.secondaryButton = this._register(new button_1.Button(this.buttonsContainer, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            this.secondaryButton.label = this.secondaryAction.label;
            this.secondaryButton.element.classList.add('profile-view-button');
            this.secondaryButton.enabled = this.secondaryAction.enabled;
            this._register(this.secondaryButton.onDidClick(() => this.actionRunner.run(this.secondaryAction)));
            this._register(this.secondaryAction.onDidChange(e => {
                if (e.enabled !== undefined) {
                    this.secondaryButton.enabled = e.enabled;
                }
            }));
        }
        layoutTreeView(height, width) {
            this.dimension = new DOM.Dimension(width, height);
            let messageContainerHeight = 0;
            if (!this.messageContainer.classList.contains('hide')) {
                messageContainerHeight = DOM.getClientArea(this.messageContainer).height;
            }
            const buttonContainerHeight = 108;
            this.buttonsContainer.style.height = `${buttonContainerHeight}px`;
            this.buttonsContainer.style.width = `${width}px`;
            super.layoutTreeView(Math.min(height - buttonContainerHeight - messageContainerHeight, 22 * this.totalTreeItemsCount), width);
        }
        updateConfirmButtonEnablement() {
            this.primaryButton.enabled = this.primaryAction.enabled && this.userDataProfileData.isEnabled();
        }
        setMessage(message) {
            this.messageContainer.classList.toggle('hide', !message);
            DOM.clearNode(this.messageContainer);
            if (message) {
                this.renderDisposables.clear();
                const rendered = this.renderDisposables.add((0, markdownRenderer_1.renderMarkdown)(message, {
                    actionHandler: {
                        callback: (content) => {
                            this.openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                        },
                        disposables: this.renderDisposables
                    }
                }));
                DOM.append(this.messageContainer, rendered.element);
            }
        }
        refresh() {
            return this.treeView.refresh();
        }
    };
    UserDataProfilePreviewViewPane = __decorate([
        __param(5, keybinding_1.IKeybindingService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, opener_1.IOpenerService),
        __param(12, themeService_1.IThemeService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, notification_1.INotificationService),
        __param(15, hover_1.IHoverService),
        __param(16, accessibleViewInformationService_1.IAccessibleViewInformationService)
    ], UserDataProfilePreviewViewPane);
    const USER_DATA_PROFILE_EXPORT_SCHEME = 'userdataprofileexport';
    const USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME = 'userdataprofileexportpreview';
    const USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME = 'userdataprofileimportpreview';
    let UserDataProfileImportExportState = class UserDataProfileImportExportState extends lifecycle_1.Disposable {
        constructor(quickInputService) {
            super();
            this.quickInputService = quickInputService;
            this._onDidChangeRoots = this._register(new event_1.Emitter());
            this.onDidChangeRoots = this._onDidChangeRoots.event;
            this.roots = [];
        }
        async getChildren(element) {
            if (element) {
                const children = await element.getChildren();
                if (children) {
                    for (const child of children) {
                        if (child.parent.checkbox && child.checkbox) {
                            child.checkbox.isChecked = child.parent.checkbox.isChecked && child.checkbox.isChecked;
                        }
                    }
                }
                return children;
            }
            else {
                this.rootsPromise = undefined;
                this._onDidChangeRoots.fire();
                return this.getRoots();
            }
        }
        getRoots() {
            if (!this.rootsPromise) {
                this.rootsPromise = (async () => {
                    this.roots = await this.fetchRoots();
                    for (const root of this.roots) {
                        root.checkbox = {
                            isChecked: !root.isFromDefaultProfile(),
                            tooltip: (0, nls_1.localize)('select', "Select {0}", root.label.label),
                            accessibilityInformation: {
                                label: (0, nls_1.localize)('select', "Select {0}", root.label.label),
                            }
                        };
                        if (root.isFromDefaultProfile()) {
                            root.description = (0, nls_1.localize)('from default', "From Default Profile");
                        }
                    }
                    return this.roots;
                })();
            }
            return this.rootsPromise;
        }
        isEnabled(resourceType) {
            if (resourceType !== undefined) {
                return this.roots.some(root => root.type === resourceType && this.isSelected(root));
            }
            return this.roots.some(root => this.isSelected(root));
        }
        async getProfileTemplate(name, icon) {
            const roots = await this.getRoots();
            let settings;
            let keybindings;
            let tasks;
            let snippets;
            let extensions;
            let globalState;
            for (const root of roots) {
                if (!this.isSelected(root)) {
                    continue;
                }
                if (root instanceof settingsResource_1.SettingsResourceTreeItem) {
                    settings = await root.getContent();
                }
                else if (root instanceof keybindingsResource_1.KeybindingsResourceTreeItem) {
                    keybindings = await root.getContent();
                }
                else if (root instanceof tasksResource_1.TasksResourceTreeItem) {
                    tasks = await root.getContent();
                }
                else if (root instanceof snippetsResource_1.SnippetsResourceTreeItem) {
                    snippets = await root.getContent();
                }
                else if (root instanceof extensionsResource_1.ExtensionsResourceTreeItem) {
                    extensions = await root.getContent();
                }
                else if (root instanceof globalStateResource_1.GlobalStateResourceTreeItem) {
                    globalState = await root.getContent();
                }
            }
            return {
                name,
                icon,
                settings,
                keybindings,
                tasks,
                snippets,
                extensions,
                globalState
            };
        }
        isSelected(treeItem) {
            if (treeItem.checkbox) {
                return treeItem.checkbox.isChecked || !!treeItem.children?.some(child => child.checkbox?.isChecked);
            }
            return true;
        }
    };
    UserDataProfileImportExportState = __decorate([
        __param(0, quickInput_1.IQuickInputService)
    ], UserDataProfileImportExportState);
    let UserDataProfileExportState = class UserDataProfileExportState extends UserDataProfileImportExportState {
        constructor(profile, quickInputService, fileService, instantiationService) {
            super(quickInputService);
            this.profile = profile;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
        }
        async fetchRoots() {
            this.disposables.clear();
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_EXPORT_SCHEME, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            const previewFileSystemProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME, previewFileSystemProvider));
            const roots = [];
            const exportPreviewProfle = this.createExportPreviewProfile(this.profile);
            const settingsResource = this.instantiationService.createInstance(settingsResource_1.SettingsResource);
            const settingsContent = await settingsResource.getContent(this.profile);
            await settingsResource.apply(settingsContent, exportPreviewProfle);
            const settingsResourceTreeItem = this.instantiationService.createInstance(settingsResource_1.SettingsResourceTreeItem, exportPreviewProfle);
            if (await settingsResourceTreeItem.hasContent()) {
                roots.push(settingsResourceTreeItem);
            }
            const keybindingsResource = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource);
            const keybindingsContent = await keybindingsResource.getContent(this.profile);
            await keybindingsResource.apply(keybindingsContent, exportPreviewProfle);
            const keybindingsResourceTreeItem = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResourceTreeItem, exportPreviewProfle);
            if (await keybindingsResourceTreeItem.hasContent()) {
                roots.push(keybindingsResourceTreeItem);
            }
            const snippetsResource = this.instantiationService.createInstance(snippetsResource_1.SnippetsResource);
            const snippetsContent = await snippetsResource.getContent(this.profile);
            await snippetsResource.apply(snippetsContent, exportPreviewProfle);
            const snippetsResourceTreeItem = this.instantiationService.createInstance(snippetsResource_1.SnippetsResourceTreeItem, exportPreviewProfle);
            if (await snippetsResourceTreeItem.hasContent()) {
                roots.push(snippetsResourceTreeItem);
            }
            const tasksResource = this.instantiationService.createInstance(tasksResource_1.TasksResource);
            const tasksContent = await tasksResource.getContent(this.profile);
            await tasksResource.apply(tasksContent, exportPreviewProfle);
            const tasksResourceTreeItem = this.instantiationService.createInstance(tasksResource_1.TasksResourceTreeItem, exportPreviewProfle);
            if (await tasksResourceTreeItem.hasContent()) {
                roots.push(tasksResourceTreeItem);
            }
            const globalStateResource = (0, resources_1.joinPath)(exportPreviewProfle.globalStorageHome, 'globalState.json').with({ scheme: USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME });
            const globalStateResourceTreeItem = this.instantiationService.createInstance(globalStateResource_1.GlobalStateResourceExportTreeItem, exportPreviewProfle, globalStateResource);
            const content = await globalStateResourceTreeItem.getContent();
            if (content) {
                await this.fileService.writeFile(globalStateResource, buffer_1.VSBuffer.fromString(JSON.stringify(JSON.parse(content), null, '\t')));
                roots.push(globalStateResourceTreeItem);
            }
            const extensionsResourceTreeItem = this.instantiationService.createInstance(extensionsResource_1.ExtensionsResourceExportTreeItem, exportPreviewProfle);
            if (await extensionsResourceTreeItem.hasContent()) {
                roots.push(extensionsResourceTreeItem);
            }
            previewFileSystemProvider.setReadOnly(true);
            return roots;
        }
        createExportPreviewProfile(profile) {
            return {
                id: profile.id,
                name: profile.name,
                location: profile.location,
                isDefault: profile.isDefault,
                shortName: profile.shortName,
                icon: profile.icon,
                globalStorageHome: profile.globalStorageHome,
                settingsResource: profile.settingsResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                keybindingsResource: profile.keybindingsResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                tasksResource: profile.tasksResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                snippetsHome: profile.snippetsHome.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                extensionsResource: profile.extensionsResource,
                cacheHome: profile.cacheHome,
                useDefaultFlags: profile.useDefaultFlags,
                isTransient: profile.isTransient
            };
        }
        async getProfileToExport() {
            let name = this.profile.name;
            if (this.profile.isDefault) {
                name = await this.quickInputService.input({
                    placeHolder: (0, nls_1.localize)('export profile name', "Name the profile"),
                    title: (0, nls_1.localize)('export profile title', "Export Profile"),
                    async validateInput(input) {
                        if (!input.trim()) {
                            return (0, nls_1.localize)('profile name required', "Profile name must be provided.");
                        }
                        return undefined;
                    },
                });
                if (!name) {
                    return null;
                }
            }
            return super.getProfileTemplate(name, this.profile.icon);
        }
    };
    UserDataProfileExportState = __decorate([
        __param(1, quickInput_1.IQuickInputService),
        __param(2, files_1.IFileService),
        __param(3, instantiation_1.IInstantiationService)
    ], UserDataProfileExportState);
    let UserDataProfileImportState = class UserDataProfileImportState extends UserDataProfileImportExportState {
        constructor(profile, fileService, quickInputService, instantiationService) {
            super(quickInputService);
            this.profile = profile;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
        }
        async fetchRoots() {
            this.disposables.clear();
            const inMemoryProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME, inMemoryProvider));
            const roots = [];
            const importPreviewProfle = (0, userDataProfile_2.toUserDataProfile)((0, uuid_1.generateUuid)(), this.profile.name, uri_1.URI.file('/root').with({ scheme: USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME }), uri_1.URI.file('/cache').with({ scheme: USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME }));
            if (this.profile.settings) {
                const settingsResource = this.instantiationService.createInstance(settingsResource_1.SettingsResource);
                await settingsResource.apply(this.profile.settings, importPreviewProfle);
                const settingsResourceTreeItem = this.instantiationService.createInstance(settingsResource_1.SettingsResourceTreeItem, importPreviewProfle);
                if (await settingsResourceTreeItem.hasContent()) {
                    roots.push(settingsResourceTreeItem);
                }
            }
            if (this.profile.keybindings) {
                const keybindingsResource = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource);
                await keybindingsResource.apply(this.profile.keybindings, importPreviewProfle);
                const keybindingsResourceTreeItem = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResourceTreeItem, importPreviewProfle);
                if (await keybindingsResourceTreeItem.hasContent()) {
                    roots.push(keybindingsResourceTreeItem);
                }
            }
            if (this.profile.snippets) {
                const snippetsResource = this.instantiationService.createInstance(snippetsResource_1.SnippetsResource);
                await snippetsResource.apply(this.profile.snippets, importPreviewProfle);
                const snippetsResourceTreeItem = this.instantiationService.createInstance(snippetsResource_1.SnippetsResourceTreeItem, importPreviewProfle);
                if (await snippetsResourceTreeItem.hasContent()) {
                    roots.push(snippetsResourceTreeItem);
                }
            }
            if (this.profile.tasks) {
                const tasksResource = this.instantiationService.createInstance(tasksResource_1.TasksResource);
                await tasksResource.apply(this.profile.tasks, importPreviewProfle);
                const tasksResourceTreeItem = this.instantiationService.createInstance(tasksResource_1.TasksResourceTreeItem, importPreviewProfle);
                if (await tasksResourceTreeItem.hasContent()) {
                    roots.push(tasksResourceTreeItem);
                }
            }
            if (this.profile.globalState) {
                const globalStateResource = (0, resources_1.joinPath)(importPreviewProfle.globalStorageHome, 'globalState.json');
                const content = buffer_1.VSBuffer.fromString(JSON.stringify(JSON.parse(this.profile.globalState), null, '\t'));
                if (content) {
                    await this.fileService.writeFile(globalStateResource, content);
                    roots.push(this.instantiationService.createInstance(globalStateResource_1.GlobalStateResourceImportTreeItem, this.profile.globalState, globalStateResource));
                }
            }
            if (this.profile.extensions) {
                const extensionsResourceTreeItem = this.instantiationService.createInstance(extensionsResource_1.ExtensionsResourceImportTreeItem, this.profile.extensions);
                if (await extensionsResourceTreeItem.hasContent()) {
                    roots.push(extensionsResourceTreeItem);
                }
            }
            inMemoryProvider.setReadOnly(true);
            return roots;
        }
        isEmpty() {
            return !(this.profile.settings || this.profile.keybindings || this.profile.tasks || this.profile.snippets || this.profile.globalState || this.profile.extensions);
        }
        async getProfileTemplateToImport() {
            return this.getProfileTemplate(this.profile.name, this.profile.icon);
        }
    };
    UserDataProfileImportState = __decorate([
        __param(1, files_1.IFileService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService)
    ], UserDataProfileImportState);
    class BarrierAction extends actions_1.Action {
        constructor(barrier, action, notificationService) {
            super(action.id, action.label, action.class, action.enabled, async () => {
                try {
                    await action.run();
                }
                catch (error) {
                    notificationService.error(error);
                    throw error;
                }
                barrier.open();
            });
        }
    }
    (0, extensions_1.registerSingleton)(userDataProfile_1.IUserDataProfileImportExportService, UserDataProfileImportExportService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSW1wb3J0RXhwb3J0U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci91c2VyRGF0YVByb2ZpbGVJbXBvcnRFeHBvcnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0RmhHLFNBQVMseUJBQXlCLENBQUMsS0FBYztRQUNoRCxNQUFNLFNBQVMsR0FBRyxLQUE2QyxDQUFDO1FBRWhFLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVE7ZUFDaEQsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7ZUFDdEQsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7ZUFDbkUsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUM7ZUFDM0UsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUM7ZUFDakYsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLFVBQVUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxNQUFNLDJCQUEyQixHQUFHLHlDQUF5QyxDQUFDO0lBQzlFLE1BQU0sMkJBQTJCLEdBQUcseUNBQXlD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