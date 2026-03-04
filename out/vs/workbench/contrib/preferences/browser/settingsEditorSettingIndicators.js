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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/configuration/common/configuration", "vs/platform/hover/browser/hover"], function (require, exports, DOM, keyboardEvent_1, simpleIconLabel_1, async_1, lifecycle_1, language_1, nls_1, commands_1, userDataProfile_1, userDataSync_1, preferences_1, configuration_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsTreeIndicatorsLabel = void 0;
    exports.getIndicatorsLabelAriaLabel = getIndicatorsLabelAriaLabel;
    const $ = DOM.$;
    /**
     * Contains a set of the sync-ignored settings
     * to keep the sync ignored indicator and the getIndicatorsLabelAriaLabel() function in sync.
     * SettingsTreeIndicatorsLabel#updateSyncIgnored provides the source of truth.
     */
    let cachedSyncIgnoredSettingsSet = new Set();
    /**
     * Contains a copy of the sync-ignored settings to determine when to update
     * cachedSyncIgnoredSettingsSet.
     */
    let cachedSyncIgnoredSettings = [];
    /**
     * Renders the indicators next to a setting, such as "Also Modified In".
     */
    let SettingsTreeIndicatorsLabel = class SettingsTreeIndicatorsLabel {
        constructor(container, configurationService, hoverService, userDataSyncEnablementService, languageService, userDataProfilesService, commandService) {
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.languageService = languageService;
            this.userDataProfilesService = userDataProfilesService;
            this.commandService = commandService;
            this.keybindingListeners = new lifecycle_1.DisposableStore();
            this.focusedIndex = 0;
            this.defaultHoverOptions = {
                trapFocus: true,
                position: {
                    hoverPosition: 2 /* HoverPosition.BELOW */,
                },
                appearance: {
                    showPointer: true,
                    compact: false,
                }
            };
            this.indicatorsContainerElement = DOM.append(container, $('.setting-indicators-container'));
            this.indicatorsContainerElement.style.display = 'inline';
            this.profilesEnabled = this.userDataProfilesService.isEnabled();
            this.workspaceTrustIndicator = this.createWorkspaceTrustIndicator();
            this.scopeOverridesIndicator = this.createScopeOverridesIndicator();
            this.syncIgnoredIndicator = this.createSyncIgnoredIndicator();
            this.defaultOverrideIndicator = this.createDefaultOverrideIndicator();
            this.allIndicators = [this.workspaceTrustIndicator, this.scopeOverridesIndicator, this.syncIgnoredIndicator, this.defaultOverrideIndicator];
        }
        addHoverDisposables(disposables, element, showHover) {
            disposables.clear();
            const scheduler = disposables.add(new async_1.RunOnceScheduler(() => {
                const hover = showHover(false);
                if (hover) {
                    disposables.add(hover);
                }
            }, this.configurationService.getValue('workbench.hover.delay')));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.MOUSE_OVER, () => {
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.MOUSE_LEAVE, () => {
                scheduler.cancel();
            }));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.KEY_DOWN, (e) => {
                const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (evt.equals(10 /* KeyCode.Space */) || evt.equals(3 /* KeyCode.Enter */)) {
                    const hover = showHover(true);
                    if (hover) {
                        disposables.add(hover);
                    }
                    e.preventDefault();
                }
            }));
        }
        createWorkspaceTrustIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const workspaceTrustElement = $('span.setting-indicator.setting-item-workspace-trust');
            const workspaceTrustLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(workspaceTrustElement));
            workspaceTrustLabel.text = '$(warning) ' + (0, nls_1.localize)('workspaceUntrustedLabel', "Setting value not applied");
            const content = (0, nls_1.localize)('trustLabel', "The setting value can only be applied in a trusted workspace.");
            const showHover = (focus) => {
                return this.hoverService.showHover({
                    ...this.defaultHoverOptions,
                    content,
                    target: workspaceTrustElement,
                    actions: [{
                            label: (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust"),
                            commandId: 'workbench.trust.manage',
                            run: (target) => {
                                this.commandService.executeCommand('workbench.trust.manage');
                            }
                        }],
                }, focus);
            };
            this.addHoverDisposables(disposables, workspaceTrustElement, showHover);
            return {
                element: workspaceTrustElement,
                label: workspaceTrustLabel,
                disposables
            };
        }
        createScopeOverridesIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            // Don't add .setting-indicator class here, because it gets conditionally added later.
            const otherOverridesElement = $('span.setting-item-overrides');
            const otherOverridesLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(otherOverridesElement));
            return {
                element: otherOverridesElement,
                label: otherOverridesLabel,
                disposables
            };
        }
        createSyncIgnoredIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const syncIgnoredElement = $('span.setting-indicator.setting-item-ignored');
            const syncIgnoredLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(syncIgnoredElement));
            syncIgnoredLabel.text = (0, nls_1.localize)('extensionSyncIgnoredLabel', 'Not synced');
            const syncIgnoredHoverContent = (0, nls_1.localize)('syncIgnoredTitle', "This setting is ignored during sync");
            const showHover = (focus) => {
                return this.hoverService.showHover({
                    ...this.defaultHoverOptions,
                    content: syncIgnoredHoverContent,
                    target: syncIgnoredElement
                }, focus);
            };
            this.addHoverDisposables(disposables, syncIgnoredElement, showHover);
            return {
                element: syncIgnoredElement,
                label: syncIgnoredLabel,
                disposables
            };
        }
        createDefaultOverrideIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const defaultOverrideIndicator = $('span.setting-indicator.setting-item-default-overridden');
            const defaultOverrideLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(defaultOverrideIndicator));
            defaultOverrideLabel.text = (0, nls_1.localize)('defaultOverriddenLabel', "Default value changed");
            return {
                element: defaultOverrideIndicator,
                label: defaultOverrideLabel,
                disposables
            };
        }
        render() {
            const indicatorsToShow = this.allIndicators.filter(indicator => {
                return indicator.element.style.display !== 'none';
            });
            this.indicatorsContainerElement.innerText = '';
            this.indicatorsContainerElement.style.display = 'none';
            if (indicatorsToShow.length) {
                this.indicatorsContainerElement.style.display = 'inline';
                DOM.append(this.indicatorsContainerElement, $('span', undefined, '('));
                for (let i = 0; i < indicatorsToShow.length - 1; i++) {
                    DOM.append(this.indicatorsContainerElement, indicatorsToShow[i].element);
                    DOM.append(this.indicatorsContainerElement, $('span.comma', undefined, ' • '));
                }
                DOM.append(this.indicatorsContainerElement, indicatorsToShow[indicatorsToShow.length - 1].element);
                DOM.append(this.indicatorsContainerElement, $('span', undefined, ')'));
                this.resetIndicatorNavigationKeyBindings(indicatorsToShow);
            }
        }
        resetIndicatorNavigationKeyBindings(indicators) {
            this.keybindingListeners.clear();
            this.indicatorsContainerElement.role = indicators.length >= 1 ? 'toolbar' : 'button';
            if (!indicators.length) {
                return;
            }
            const firstElement = indicators[0].focusElement ?? indicators[0].element;
            firstElement.tabIndex = 0;
            this.keybindingListeners.add(DOM.addDisposableListener(this.indicatorsContainerElement, 'keydown', (e) => {
                const ev = new keyboardEvent_1.StandardKeyboardEvent(e);
                let handled = true;
                if (ev.equals(14 /* KeyCode.Home */)) {
                    this.focusIndicatorAt(indicators, 0);
                }
                else if (ev.equals(13 /* KeyCode.End */)) {
                    this.focusIndicatorAt(indicators, indicators.length - 1);
                }
                else if (ev.equals(17 /* KeyCode.RightArrow */)) {
                    const indexToFocus = (this.focusedIndex + 1) % indicators.length;
                    this.focusIndicatorAt(indicators, indexToFocus);
                }
                else if (ev.equals(15 /* KeyCode.LeftArrow */)) {
                    const indexToFocus = this.focusedIndex ? this.focusedIndex - 1 : indicators.length - 1;
                    this.focusIndicatorAt(indicators, indexToFocus);
                }
                else {
                    handled = false;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
        }
        focusIndicatorAt(indicators, index) {
            if (index === this.focusedIndex) {
                return;
            }
            const indicator = indicators[index];
            const elementToFocus = indicator.focusElement ?? indicator.element;
            elementToFocus.tabIndex = 0;
            elementToFocus.focus();
            const currentlyFocusedIndicator = indicators[this.focusedIndex];
            const previousFocusedElement = currentlyFocusedIndicator.focusElement ?? currentlyFocusedIndicator.element;
            previousFocusedElement.tabIndex = -1;
            this.focusedIndex = index;
        }
        updateWorkspaceTrust(element) {
            this.workspaceTrustIndicator.element.style.display = element.isUntrusted ? 'inline' : 'none';
            this.render();
        }
        updateSyncIgnored(element, ignoredSettings) {
            this.syncIgnoredIndicator.element.style.display = this.userDataSyncEnablementService.isEnabled()
                && ignoredSettings.includes(element.setting.key) ? 'inline' : 'none';
            this.render();
            if (cachedSyncIgnoredSettings !== ignoredSettings) {
                cachedSyncIgnoredSettings = ignoredSettings;
                cachedSyncIgnoredSettingsSet = new Set(cachedSyncIgnoredSettings);
            }
        }
        getInlineScopeDisplayText(completeScope) {
            const [scope, language] = completeScope.split(':');
            const localizedScope = scope === 'user' ?
                (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
                (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
            if (language) {
                return `${this.languageService.getLanguageName(language)} > ${localizedScope}`;
            }
            return localizedScope;
        }
        dispose() {
            this.keybindingListeners.dispose();
            for (const indicator of this.allIndicators) {
                indicator.disposables.dispose();
            }
        }
        updateScopeOverrides(element, onDidClickOverrideElement, onApplyFilter) {
            this.scopeOverridesIndicator.element.innerText = '';
            this.scopeOverridesIndicator.element.style.display = 'none';
            this.scopeOverridesIndicator.focusElement = this.scopeOverridesIndicator.element;
            if (element.hasPolicyValue) {
                // If the setting falls under a policy, then no matter what the user sets, the policy value takes effect.
                this.scopeOverridesIndicator.element.style.display = 'inline';
                this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                this.scopeOverridesIndicator.label.text = '$(warning) ' + (0, nls_1.localize)('policyLabelText', "Setting value not applied");
                const content = (0, nls_1.localize)('policyDescription', "This setting is managed by your organization and its applied value cannot be changed.");
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        ...this.defaultHoverOptions,
                        content,
                        actions: [{
                                label: (0, nls_1.localize)('policyFilterLink', "View policy settings"),
                                commandId: '_settings.action.viewPolicySettings',
                                run: (_) => {
                                    onApplyFilter.fire(`@${preferences_1.POLICY_SETTING_TAG}`);
                                }
                            }],
                        target: this.scopeOverridesIndicator.element
                    }, focus);
                };
                this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
            }
            else if (this.profilesEnabled && element.settingsTarget === 3 /* ConfigurationTarget.USER_LOCAL */ && this.configurationService.isSettingAppliedForAllProfiles(element.setting.key)) {
                this.scopeOverridesIndicator.element.style.display = 'inline';
                this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                this.scopeOverridesIndicator.label.text = (0, nls_1.localize)('applicationSetting', "Applies to all profiles");
                const content = (0, nls_1.localize)('applicationSettingDescription', "The setting is not specific to the current profile, and will retain its value when switching profiles.");
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        ...this.defaultHoverOptions,
                        content,
                        target: this.scopeOverridesIndicator.element
                    }, focus);
                };
                this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
            }
            else if (element.overriddenScopeList.length || element.overriddenDefaultsLanguageList.length) {
                if (element.overriddenScopeList.length === 1 && !element.overriddenDefaultsLanguageList.length) {
                    // We can inline the override and show all the text in the label
                    // so that users don't have to wait for the hover to load
                    // just to click into the one override there is.
                    this.scopeOverridesIndicator.element.style.display = 'inline';
                    this.scopeOverridesIndicator.element.classList.remove('setting-indicator');
                    this.scopeOverridesIndicator.disposables.clear();
                    const prefaceText = element.isConfigured ?
                        (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                        (0, nls_1.localize)('configuredIn', "Modified in");
                    this.scopeOverridesIndicator.label.text = `${prefaceText} `;
                    const overriddenScope = element.overriddenScopeList[0];
                    const view = DOM.append(this.scopeOverridesIndicator.element, $('a.modified-scope', undefined, this.getInlineScopeDisplayText(overriddenScope)));
                    view.tabIndex = -1;
                    this.scopeOverridesIndicator.focusElement = view;
                    const onClickOrKeydown = (e) => {
                        const [scope, language] = overriddenScope.split(':');
                        onDidClickOverrideElement.fire({
                            settingKey: element.setting.key,
                            scope: scope,
                            language
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    };
                    this.scopeOverridesIndicator.disposables.add(DOM.addDisposableListener(view, DOM.EventType.CLICK, (e) => {
                        onClickOrKeydown(e);
                    }));
                    this.scopeOverridesIndicator.disposables.add(DOM.addDisposableListener(view, DOM.EventType.KEY_DOWN, (e) => {
                        const ev = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if (ev.equals(10 /* KeyCode.Space */) || ev.equals(3 /* KeyCode.Enter */)) {
                            onClickOrKeydown(e);
                        }
                    }));
                }
                else {
                    this.scopeOverridesIndicator.element.style.display = 'inline';
                    this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                    const scopeOverridesLabelText = element.isConfigured ?
                        (0, nls_1.localize)('alsoConfiguredElsewhere', "Also modified elsewhere") :
                        (0, nls_1.localize)('configuredElsewhere', "Modified elsewhere");
                    this.scopeOverridesIndicator.label.text = scopeOverridesLabelText;
                    let contentMarkdownString = '';
                    if (element.overriddenScopeList.length) {
                        const prefaceText = element.isConfigured ?
                            (0, nls_1.localize)('alsoModifiedInScopes', "The setting has also been modified in the following scopes:") :
                            (0, nls_1.localize)('modifiedInScopes', "The setting has been modified in the following scopes:");
                        contentMarkdownString = prefaceText;
                        for (const scope of element.overriddenScopeList) {
                            const scopeDisplayText = this.getInlineScopeDisplayText(scope);
                            contentMarkdownString += `\n- [${scopeDisplayText}](${encodeURIComponent(scope)} "${getAccessibleScopeDisplayText(scope, this.languageService)}")`;
                        }
                    }
                    if (element.overriddenDefaultsLanguageList.length) {
                        if (contentMarkdownString) {
                            contentMarkdownString += `\n\n`;
                        }
                        const prefaceText = (0, nls_1.localize)('hasDefaultOverridesForLanguages', "The following languages have default overrides:");
                        contentMarkdownString += prefaceText;
                        for (const language of element.overriddenDefaultsLanguageList) {
                            const scopeDisplayText = this.languageService.getLanguageName(language);
                            contentMarkdownString += `\n- [${scopeDisplayText}](${encodeURIComponent(`default:${language}`)} "${scopeDisplayText}")`;
                        }
                    }
                    const content = {
                        value: contentMarkdownString,
                        isTrusted: false,
                        supportHtml: false
                    };
                    const showHover = (focus) => {
                        return this.hoverService.showHover({
                            ...this.defaultHoverOptions,
                            content,
                            linkHandler: (url) => {
                                const [scope, language] = decodeURIComponent(url).split(':');
                                onDidClickOverrideElement.fire({
                                    settingKey: element.setting.key,
                                    scope: scope,
                                    language
                                });
                            },
                            target: this.scopeOverridesIndicator.element
                        }, focus);
                    };
                    this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
                }
            }
            this.render();
        }
        updateDefaultOverrideIndicator(element) {
            this.defaultOverrideIndicator.element.style.display = 'none';
            const sourceToDisplay = getDefaultValueSourceToDisplay(element);
            if (sourceToDisplay !== undefined) {
                this.defaultOverrideIndicator.element.style.display = 'inline';
                this.defaultOverrideIndicator.disposables.clear();
                const defaultOverrideHoverContent = (0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", sourceToDisplay);
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        content: defaultOverrideHoverContent,
                        target: this.defaultOverrideIndicator.element,
                        position: {
                            hoverPosition: 2 /* HoverPosition.BELOW */,
                        },
                        appearance: {
                            showPointer: true,
                            compact: false
                        }
                    }, focus);
                };
                this.addHoverDisposables(this.defaultOverrideIndicator.disposables, this.defaultOverrideIndicator.element, showHover);
            }
            this.render();
        }
    };
    exports.SettingsTreeIndicatorsLabel = SettingsTreeIndicatorsLabel;
    exports.SettingsTreeIndicatorsLabel = SettingsTreeIndicatorsLabel = __decorate([
        __param(1, configuration_1.IWorkbenchConfigurationService),
        __param(2, hover_1.IHoverService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, language_1.ILanguageService),
        __param(5, userDataProfile_1.IUserDataProfilesService),
        __param(6, commands_1.ICommandService)
    ], SettingsTreeIndicatorsLabel);
    function getDefaultValueSourceToDisplay(element) {
        let sourceToDisplay;
        const defaultValueSource = element.defaultValueSource;
        if (defaultValueSource) {
            if (typeof defaultValueSource !== 'string') {
                sourceToDisplay = defaultValueSource.displayName ?? defaultValueSource.id;
            }
            else if (typeof defaultValueSource === 'string') {
                sourceToDisplay = defaultValueSource;
            }
        }
        return sourceToDisplay;
    }
    function getAccessibleScopeDisplayText(completeScope, languageService) {
        const [scope, language] = completeScope.split(':');
        const localizedScope = scope === 'user' ?
            (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
            (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
        if (language) {
            return (0, nls_1.localize)('modifiedInScopeForLanguage', "The {0} scope for {1}", localizedScope, languageService.getLanguageName(language));
        }
        return localizedScope;
    }
    function getAccessibleScopeDisplayMidSentenceText(completeScope, languageService) {
        const [scope, language] = completeScope.split(':');
        const localizedScope = scope === 'user' ?
            (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
            (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
        if (language) {
            return (0, nls_1.localize)('modifiedInScopeForLanguageMidSentence', "the {0} scope for {1}", localizedScope.toLowerCase(), languageService.getLanguageName(language));
        }
        return localizedScope;
    }
    function getIndicatorsLabelAriaLabel(element, configurationService, userDataProfilesService, languageService) {
        const ariaLabelSections = [];
        // Add workspace trust text
        if (element.isUntrusted) {
            ariaLabelSections.push((0, nls_1.localize)('workspaceUntrustedAriaLabel', "Workspace untrusted; setting value not applied"));
        }
        if (element.hasPolicyValue) {
            ariaLabelSections.push((0, nls_1.localize)('policyDescriptionAccessible', "Managed by organization policy; setting value not applied"));
        }
        else if (userDataProfilesService.isEnabled() && element.settingsTarget === 3 /* ConfigurationTarget.USER_LOCAL */ && configurationService.isSettingAppliedForAllProfiles(element.setting.key)) {
            ariaLabelSections.push((0, nls_1.localize)('applicationSettingDescriptionAccessible', "Setting value retained when switching profiles"));
        }
        else {
            // Add other overrides text
            const otherOverridesStart = element.isConfigured ?
                (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                (0, nls_1.localize)('configuredIn', "Modified in");
            const otherOverridesList = element.overriddenScopeList
                .map(scope => getAccessibleScopeDisplayMidSentenceText(scope, languageService)).join(', ');
            if (element.overriddenScopeList.length) {
                ariaLabelSections.push(`${otherOverridesStart} ${otherOverridesList}`);
            }
        }
        // Add sync ignored text
        if (cachedSyncIgnoredSettingsSet.has(element.setting.key)) {
            ariaLabelSections.push((0, nls_1.localize)('syncIgnoredAriaLabel', "Setting ignored during sync"));
        }
        // Add default override indicator text
        const sourceToDisplay = getDefaultValueSourceToDisplay(element);
        if (sourceToDisplay !== undefined) {
            ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetailsAriaLabel', "{0} overrides the default value", sourceToDisplay));
        }
        // Add text about default values being overridden in other languages
        const otherLanguageOverridesList = element.overriddenDefaultsLanguageList
            .map(language => languageService.getLanguageName(language)).join(', ');
        if (element.overriddenDefaultsLanguageList.length) {
            const otherLanguageOverridesText = (0, nls_1.localize)('defaultOverriddenLanguagesList', "Language-specific default values exist for {0}", otherLanguageOverridesList);
            ariaLabelSections.push(otherLanguageOverridesText);
        }
        const ariaLabel = ariaLabelSections.join('. ');
        return ariaLabel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NFZGl0b3JTZXR0aW5nSW5kaWNhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIvc2V0dGluZ3NFZGl0b3JTZXR0aW5nSW5kaWNhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyZmhHLGtFQTZDQztJQWpoQkQsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQXFCaEI7Ozs7T0FJRztJQUNILElBQUksNEJBQTRCLEdBQWdCLElBQUksR0FBRyxFQUFVLENBQUM7SUFFbEU7OztPQUdHO0lBQ0gsSUFBSSx5QkFBeUIsR0FBYSxFQUFFLENBQUM7SUFFN0M7O09BRUc7SUFDSSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQWN2QyxZQUNDLFNBQXNCLEVBQ1Usb0JBQXFFLEVBQ3RGLFlBQTRDLEVBQzNCLDZCQUE4RSxFQUM1RixlQUFrRCxFQUMxQyx1QkFBa0UsRUFDM0UsY0FBZ0Q7WUFMaEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFnQztZQUNyRSxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNWLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDM0Usb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3pCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDMUQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBVmpELHdCQUFtQixHQUFvQixJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUN0RSxpQkFBWSxHQUFHLENBQUMsQ0FBQztZQXNCakIsd0JBQW1CLEdBQTJCO2dCQUNyRCxTQUFTLEVBQUUsSUFBSTtnQkFDZixRQUFRLEVBQUU7b0JBQ1QsYUFBYSw2QkFBcUI7aUJBQ2xDO2dCQUNELFVBQVUsRUFBRTtvQkFDWCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsT0FBTyxFQUFFLEtBQUs7aUJBQ2Q7YUFDRCxDQUFDO1lBckJELElBQUksQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO1lBQzVGLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztZQUV6RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUVoRSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDcEUsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBQ3BFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUM5RCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7WUFDdEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzdJLENBQUM7UUFhTyxtQkFBbUIsQ0FBQyxXQUE0QixFQUFFLE9BQW9CLEVBQUUsU0FBdUQ7WUFDdEksV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLE1BQU0sU0FBUyxHQUFxQixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUM3RSxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9CLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2pGLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztvQkFDOUIsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2xGLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hGLE1BQU0sR0FBRyxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksR0FBRyxDQUFDLE1BQU0sd0JBQWUsSUFBSSxHQUFHLENBQUMsTUFBTSx1QkFBZSxFQUFFLENBQUM7b0JBQzVELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4QixDQUFDO29CQUNELENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sNkJBQTZCO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7WUFDdkYsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDeEYsbUJBQW1CLENBQUMsSUFBSSxHQUFHLGFBQWEsR0FBRyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1lBRTVHLE1BQU0sT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSwrREFBK0QsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUU7Z0JBQ3BDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7b0JBQ2xDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQjtvQkFDM0IsT0FBTztvQkFDUCxNQUFNLEVBQUUscUJBQXFCO29CQUM3QixPQUFPLEVBQUUsQ0FBQzs0QkFDVCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLENBQUM7NEJBQ2pFLFNBQVMsRUFBRSx3QkFBd0I7NEJBQ25DLEdBQUcsRUFBRSxDQUFDLE1BQW1CLEVBQUUsRUFBRTtnQ0FDNUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQzs0QkFDOUQsQ0FBQzt5QkFDRCxDQUFDO2lCQUNGLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3hFLE9BQU87Z0JBQ04sT0FBTyxFQUFFLHFCQUFxQjtnQkFDOUIsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsV0FBVzthQUNYLENBQUM7UUFDSCxDQUFDO1FBRU8sNkJBQTZCO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLHNGQUFzRjtZQUN0RixNQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sbUJBQW1CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlDQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLE9BQU87Z0JBQ04sT0FBTyxFQUFFLHFCQUFxQjtnQkFDOUIsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsV0FBVzthQUNYLENBQUM7UUFDSCxDQUFDO1FBRU8sMEJBQTBCO1lBQ2pDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7WUFDNUUsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDbEYsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRTVFLE1BQU0sdUJBQXVCLEdBQUcsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUscUNBQXFDLENBQUMsQ0FBQztZQUNwRyxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO29CQUNsQyxHQUFHLElBQUksQ0FBQyxtQkFBbUI7b0JBQzNCLE9BQU8sRUFBRSx1QkFBdUI7b0JBQ2hDLE1BQU0sRUFBRSxrQkFBa0I7aUJBQzFCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXJFLE9BQU87Z0JBQ04sT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsV0FBVzthQUNYLENBQUM7UUFDSCxDQUFDO1FBRU8sOEJBQThCO1lBQ3JDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7WUFDN0YsTUFBTSxvQkFBb0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFDNUYsb0JBQW9CLENBQUMsSUFBSSxHQUFHLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFFeEYsT0FBTztnQkFDTixPQUFPLEVBQUUsd0JBQXdCO2dCQUNqQyxLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixXQUFXO2FBQ1gsQ0FBQztRQUNILENBQUM7UUFFTyxNQUFNO1lBQ2IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDOUQsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssTUFBTSxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3ZELElBQUksZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFDekQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLENBQUM7Z0JBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsbUNBQW1DLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLG1DQUFtQyxDQUFDLFVBQThCO1lBQ3pFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUNyRixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUN6RSxZQUFZLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hHLE1BQU0sRUFBRSxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDbkIsSUFBSSxFQUFFLENBQUMsTUFBTSx1QkFBYyxFQUFFLENBQUM7b0JBQzdCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sSUFBSSxFQUFFLENBQUMsTUFBTSxzQkFBYSxFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsQ0FBQztxQkFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLDZCQUFvQixFQUFFLENBQUM7b0JBQzFDLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUNqRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO3FCQUFNLElBQUksRUFBRSxDQUFDLE1BQU0sNEJBQW1CLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUN2RixJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDakIsQ0FBQztnQkFFRCxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxVQUE4QixFQUFFLEtBQWE7WUFDckUsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDbkUsY0FBYyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDNUIsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRXZCLE1BQU0seUJBQXlCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoRSxNQUFNLHNCQUFzQixHQUFHLHlCQUF5QixDQUFDLFlBQVksSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLENBQUM7WUFDM0csc0JBQXNCLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXJDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxPQUFtQztZQUN2RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDN0YsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELGlCQUFpQixDQUFDLE9BQW1DLEVBQUUsZUFBeUI7WUFDL0UsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUU7bUJBQzVGLGVBQWUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDdEUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSx5QkFBeUIsS0FBSyxlQUFlLEVBQUUsQ0FBQztnQkFDbkQseUJBQXlCLEdBQUcsZUFBZSxDQUFDO2dCQUM1Qyw0QkFBNEIsR0FBRyxJQUFJLEdBQUcsQ0FBUyx5QkFBeUIsQ0FBQyxDQUFDO1lBQzNFLENBQUM7UUFDRixDQUFDO1FBRU8seUJBQXlCLENBQUMsYUFBcUI7WUFDdEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sY0FBYyxHQUFHLEtBQUssS0FBSyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUM7Z0JBQ2pELElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BFLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxNQUFNLGNBQWMsRUFBRSxDQUFDO1lBQ2hGLENBQUM7WUFDRCxPQUFPLGNBQWMsQ0FBQztRQUN2QixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQyxLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDNUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVELG9CQUFvQixDQUFDLE9BQW1DLEVBQUUseUJBQThELEVBQUUsYUFBOEI7WUFDdkosSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDNUQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDO1lBQ2pGLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUM1Qix5R0FBeUc7Z0JBQ3pHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7Z0JBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUV4RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxhQUFhLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztnQkFDbkgsTUFBTSxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsdUZBQXVGLENBQUMsQ0FBQztnQkFDdkksTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtvQkFDcEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQzt3QkFDbEMsR0FBRyxJQUFJLENBQUMsbUJBQW1CO3dCQUMzQixPQUFPO3dCQUNQLE9BQU8sRUFBRSxDQUFDO2dDQUNULEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxzQkFBc0IsQ0FBQztnQ0FDM0QsU0FBUyxFQUFFLHFDQUFxQztnQ0FDaEQsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0NBQ1YsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLGdDQUFrQixFQUFFLENBQUMsQ0FBQztnQ0FDOUMsQ0FBQzs2QkFDRCxDQUFDO3dCQUNGLE1BQU0sRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTztxQkFDNUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNySCxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsY0FBYywyQ0FBbUMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvSyxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO2dCQUM5RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFFeEUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFFcEcsTUFBTSxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsd0dBQXdHLENBQUMsQ0FBQztnQkFDcEssTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtvQkFDcEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQzt3QkFDbEMsR0FBRyxJQUFJLENBQUMsbUJBQW1CO3dCQUMzQixPQUFPO3dCQUNQLE1BQU0sRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTztxQkFDNUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNySCxDQUFDO2lCQUFNLElBQUksT0FBTyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hHLElBQUksT0FBTyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2hHLGdFQUFnRTtvQkFDaEUseURBQXlEO29CQUN6RCxnREFBZ0Q7b0JBQ2hELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7b0JBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO29CQUMzRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUVqRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ3pDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQzt3QkFDbEQsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLFdBQVcsR0FBRyxDQUFDO29CQUU1RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pKLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ25CLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUNqRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBVSxFQUFFLEVBQUU7d0JBQ3ZDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDckQseUJBQXlCLENBQUMsSUFBSSxDQUFDOzRCQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHOzRCQUMvQixLQUFLLEVBQUUsS0FBb0I7NEJBQzNCLFFBQVE7eUJBQ1IsQ0FBQyxDQUFDO3dCQUNILENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNyQixDQUFDLENBQUM7b0JBQ0YsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUN2RyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDSixJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQzFHLE1BQU0sRUFBRSxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3hDLElBQUksRUFBRSxDQUFDLE1BQU0sd0JBQWUsSUFBSSxFQUFFLENBQUMsTUFBTSx1QkFBZSxFQUFFLENBQUM7NEJBQzFELGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNyQixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7b0JBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO29CQUN4RSxNQUFNLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDckQsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDO3dCQUNoRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQztvQkFFbEUsSUFBSSxxQkFBcUIsR0FBRyxFQUFFLENBQUM7b0JBQy9CLElBQUksT0FBTyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN4QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7NEJBQ3pDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLDZEQUE2RCxDQUFDLENBQUMsQ0FBQzs0QkFDakcsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsd0RBQXdELENBQUMsQ0FBQzt3QkFDeEYscUJBQXFCLEdBQUcsV0FBVyxDQUFDO3dCQUNwQyxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOzRCQUNqRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDL0QscUJBQXFCLElBQUksUUFBUSxnQkFBZ0IsS0FBSyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7d0JBQ3BKLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDbkQsSUFBSSxxQkFBcUIsRUFBRSxDQUFDOzRCQUMzQixxQkFBcUIsSUFBSSxNQUFNLENBQUM7d0JBQ2pDLENBQUM7d0JBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsaURBQWlELENBQUMsQ0FBQzt3QkFDbkgscUJBQXFCLElBQUksV0FBVyxDQUFDO3dCQUNyQyxLQUFLLE1BQU0sUUFBUSxJQUFJLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxDQUFDOzRCQUMvRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUN4RSxxQkFBcUIsSUFBSSxRQUFRLGdCQUFnQixLQUFLLGtCQUFrQixDQUFDLFdBQVcsUUFBUSxFQUFFLENBQUMsS0FBSyxnQkFBZ0IsSUFBSSxDQUFDO3dCQUMxSCxDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTSxPQUFPLEdBQW9CO3dCQUNoQyxLQUFLLEVBQUUscUJBQXFCO3dCQUM1QixTQUFTLEVBQUUsS0FBSzt3QkFDaEIsV0FBVyxFQUFFLEtBQUs7cUJBQ2xCLENBQUM7b0JBQ0YsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTt3QkFDcEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQzs0QkFDbEMsR0FBRyxJQUFJLENBQUMsbUJBQW1COzRCQUMzQixPQUFPOzRCQUNQLFdBQVcsRUFBRSxDQUFDLEdBQVcsRUFBRSxFQUFFO2dDQUM1QixNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDN0QseUJBQXlCLENBQUMsSUFBSSxDQUFDO29DQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHO29DQUMvQixLQUFLLEVBQUUsS0FBb0I7b0NBQzNCLFFBQVE7aUNBQ1IsQ0FBQyxDQUFDOzRCQUNKLENBQUM7NEJBQ0QsTUFBTSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPO3lCQUM1QyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNYLENBQUMsQ0FBQztvQkFDRixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNySCxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCw4QkFBOEIsQ0FBQyxPQUFtQztZQUNqRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQzdELE1BQU0sZUFBZSxHQUFHLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO2dCQUMvRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVsRCxNQUFNLDJCQUEyQixHQUFHLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHlDQUF5QyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUNySSxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO29CQUNwQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO3dCQUNsQyxPQUFPLEVBQUUsMkJBQTJCO3dCQUNwQyxNQUFNLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU87d0JBQzdDLFFBQVEsRUFBRTs0QkFDVCxhQUFhLDZCQUFxQjt5QkFDbEM7d0JBQ0QsVUFBVSxFQUFFOzRCQUNYLFdBQVcsRUFBRSxJQUFJOzRCQUNqQixPQUFPLEVBQUUsS0FBSzt5QkFDZDtxQkFDRCxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQztnQkFDRixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZILENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO0tBQ0QsQ0FBQTtJQTFaWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQWdCckMsV0FBQSw4Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDZDQUE4QixDQUFBO1FBQzlCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLDBCQUFlLENBQUE7T0FyQkwsMkJBQTJCLENBMFp2QztJQUVELFNBQVMsOEJBQThCLENBQUMsT0FBbUM7UUFDMUUsSUFBSSxlQUFtQyxDQUFDO1FBQ3hDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDO1FBQ3RELElBQUksa0JBQWtCLEVBQUUsQ0FBQztZQUN4QixJQUFJLE9BQU8sa0JBQWtCLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVDLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLElBQUksa0JBQWtCLENBQUMsRUFBRSxDQUFDO1lBQzNFLENBQUM7aUJBQU0sSUFBSSxPQUFPLGtCQUFrQixLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRCxlQUFlLEdBQUcsa0JBQWtCLENBQUM7WUFDdEMsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLGVBQWUsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUyw2QkFBNkIsQ0FBQyxhQUFxQixFQUFFLGVBQWlDO1FBQzlGLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRCxNQUFNLGNBQWMsR0FBRyxLQUFLLEtBQUssTUFBTSxDQUFDLENBQUM7WUFDeEMsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUM7WUFDakQsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEUsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsdUJBQXVCLEVBQUUsY0FBYyxFQUFFLGVBQWUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNuSSxDQUFDO1FBQ0QsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUVELFNBQVMsd0NBQXdDLENBQUMsYUFBcUIsRUFBRSxlQUFpQztRQUN6RyxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkQsTUFBTSxjQUFjLEdBQUcsS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLElBQUksUUFBUSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsY0FBUSxFQUFDLHVDQUF1QyxFQUFFLHVCQUF1QixFQUFFLGNBQWMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDNUosQ0FBQztRQUNELE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFnQiwyQkFBMkIsQ0FBQyxPQUFtQyxFQUFFLG9CQUFvRCxFQUFFLHVCQUFpRCxFQUFFLGVBQWlDO1FBQzFOLE1BQU0saUJBQWlCLEdBQWEsRUFBRSxDQUFDO1FBRXZDLDJCQUEyQjtRQUMzQixJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN6QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO1FBQ25ILENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsMkRBQTJELENBQUMsQ0FBQyxDQUFDO1FBQzlILENBQUM7YUFBTSxJQUFJLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxjQUFjLDJDQUFtQyxJQUFJLG9CQUFvQixDQUFDLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6TCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO1FBQy9ILENBQUM7YUFBTSxDQUFDO1lBQ1AsMkJBQTJCO1lBQzNCLE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNqRCxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN6QyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxtQkFBbUI7aUJBQ3BELEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLHdDQUF3QyxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RixJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsbUJBQW1CLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDRixDQUFDO1FBRUQsd0JBQXdCO1FBQ3hCLElBQUksNEJBQTRCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMzRCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxzQ0FBc0M7UUFDdEMsTUFBTSxlQUFlLEdBQUcsOEJBQThCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEUsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDbkMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLG1DQUFtQyxFQUFFLGlDQUFpQyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDM0gsQ0FBQztRQUVELG9FQUFvRTtRQUNwRSxNQUFNLDBCQUEwQixHQUFHLE9BQU8sQ0FBQyw4QkFBOEI7YUFDdkUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4RSxJQUFJLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNuRCxNQUFNLDBCQUEwQixHQUFHLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLGdEQUFnRCxFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDNUosaUJBQWlCLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDIn0=