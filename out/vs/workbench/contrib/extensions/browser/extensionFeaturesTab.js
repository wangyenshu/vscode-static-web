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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/extensions/common/extensions", "vs/base/browser/ui/splitview/splitview", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/list/browser/listService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/markdownRenderer", "vs/base/common/errors", "vs/platform/opener/common/opener", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/dialogs/common/dialogs", "vs/base/common/themables", "vs/base/common/severity", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/severityIcon/browser/severityIcon", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/platform", "vs/base/common/htmlContent", "vs/base/common/color", "vs/workbench/services/extensions/common/extensions", "vs/base/common/codicons", "vs/platform/instantiation/common/descriptors", "vs/base/common/keybindings", "vs/base/common/date"], function (require, exports, lifecycle_1, dom_1, event_1, extensions_1, splitview_1, extensionFeatures_1, platform_1, instantiation_1, nls_1, listService_1, extensionManagementUtil_1, button_1, defaultStyles_1, markdownRenderer_1, errors_1, opener_1, theme_1, themeService_1, scrollableElement_1, dialogs_1, themables_1, severity_1, extensionsIcons_1, severityIcon_1, keybindingLabel_1, platform_2, htmlContent_1, color_1, extensions_2, codicons_1, descriptors_1, keybindings_1, date_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionFeaturesTab = void 0;
    let RuntimeStatusMarkdownRenderer = class RuntimeStatusMarkdownRenderer extends lifecycle_1.Disposable {
        static { this.ID = 'runtimeStatus'; }
        constructor(extensionService, extensionFeaturesManagementService) {
            super();
            this.extensionService = extensionService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.type = 'markdown';
        }
        shouldRender(manifest) {
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            if (!this.extensionService.extensions.some(e => extensions_1.ExtensionIdentifier.equals(e.identifier, extensionId))) {
                return false;
            }
            return !!manifest.main || !!manifest.browser;
        }
        render(manifest) {
            const disposables = new lifecycle_1.DisposableStore();
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            const emitter = disposables.add(new event_1.Emitter());
            disposables.add(this.extensionService.onDidChangeExtensionsStatus(e => {
                if (e.some(extension => extensions_1.ExtensionIdentifier.equals(extension, extensionId))) {
                    emitter.fire(this.getRuntimeStatusData(manifest));
                }
            }));
            disposables.add(this.extensionFeaturesManagementService.onDidChangeAccessData(e => emitter.fire(this.getRuntimeStatusData(manifest))));
            return {
                onDidChange: emitter.event,
                data: this.getRuntimeStatusData(manifest),
                dispose: () => disposables.dispose()
            };
        }
        getRuntimeStatusData(manifest) {
            const data = new htmlContent_1.MarkdownString();
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            const status = this.extensionService.getExtensionsStatus()[extensionId.value];
            if (this.extensionService.extensions.some(extension => extensions_1.ExtensionIdentifier.equals(extension.identifier, extensionId))) {
                data.appendMarkdown(`### ${(0, nls_1.localize)('activation', "Activation")}\n\n`);
                if (status.activationTimes) {
                    if (status.activationTimes.activationReason.startup) {
                        data.appendMarkdown(`Activated on Startup: \`${status.activationTimes.activateCallTime}ms\``);
                    }
                    else {
                        data.appendMarkdown(`Activated by \`${status.activationTimes.activationReason.activationEvent}\` event: \`${status.activationTimes.activateCallTime}ms\``);
                    }
                }
                else {
                    data.appendMarkdown('Not yet activated');
                }
                if (status.runtimeErrors.length) {
                    data.appendMarkdown(`\n ### ${(0, nls_1.localize)('uncaught errors', "Uncaught Errors ({0})", status.runtimeErrors.length)}\n`);
                    for (const error of status.runtimeErrors) {
                        data.appendMarkdown(`$(${codicons_1.Codicon.error.id})&nbsp;${(0, errors_1.getErrorMessage)(error)}\n\n`);
                    }
                }
                if (status.messages.length) {
                    data.appendMarkdown(`\n ### ${(0, nls_1.localize)('messaages', "Messages ({0})", status.messages.length)}\n`);
                    for (const message of status.messages) {
                        data.appendMarkdown(`$(${(message.type === severity_1.default.Error ? codicons_1.Codicon.error : message.type === severity_1.default.Warning ? codicons_1.Codicon.warning : codicons_1.Codicon.info).id})&nbsp;${message.message}\n\n`);
                    }
                }
            }
            const features = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeatures();
            for (const feature of features) {
                const accessData = this.extensionFeaturesManagementService.getAccessData(extensionId, feature.id);
                if (accessData) {
                    data.appendMarkdown(`\n ### ${feature.label}\n\n`);
                    const status = accessData?.current?.status;
                    if (status) {
                        if (status?.severity === severity_1.default.Error) {
                            data.appendMarkdown(`$(${extensionsIcons_1.errorIcon.id}) ${status.message}\n\n`);
                        }
                        if (status?.severity === severity_1.default.Warning) {
                            data.appendMarkdown(`$(${extensionsIcons_1.warningIcon.id}) ${status.message}\n\n`);
                        }
                    }
                    if (accessData?.totalCount) {
                        if (accessData.current) {
                            data.appendMarkdown(`${(0, nls_1.localize)('last request', "Last Request: `{0}`", (0, date_1.fromNow)(accessData.current.lastAccessed, true, true))}\n\n`);
                            data.appendMarkdown(`${(0, nls_1.localize)('requests count session', "Requests (Session) : `{0}`", accessData.current.count)}\n\n`);
                        }
                        data.appendMarkdown(`${(0, nls_1.localize)('requests count total', "Requests (Overall): `{0}`", accessData.totalCount)}\n\n`);
                    }
                }
            }
            return data;
        }
    };
    RuntimeStatusMarkdownRenderer = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], RuntimeStatusMarkdownRenderer);
    const runtimeStatusFeature = {
        id: RuntimeStatusMarkdownRenderer.ID,
        label: (0, nls_1.localize)('runtime', "Runtime Status"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(RuntimeStatusMarkdownRenderer),
    };
    let ExtensionFeaturesTab = class ExtensionFeaturesTab extends themeService_1.Themable {
        constructor(manifest, feature, themeService, instantiationService) {
            super(themeService);
            this.manifest = manifest;
            this.feature = feature;
            this.instantiationService = instantiationService;
            this.featureView = this._register(new lifecycle_1.MutableDisposable());
            this.layoutParticipants = [];
            this.extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            this.domNode = (0, dom_1.$)('div.subcontent.feature-contributions');
            this.create();
        }
        layout(height, width) {
            this.layoutParticipants.forEach(participant => participant.layout(height, width));
        }
        create() {
            const features = this.getFeatures();
            if (features.length === 0) {
                (0, dom_1.append)((0, dom_1.$)('.no-features'), this.domNode).textContent = (0, nls_1.localize)('noFeatures', "No features contributed.");
                return;
            }
            const splitView = new splitview_1.SplitView(this.domNode, {
                orientation: 1 /* Orientation.HORIZONTAL */,
                proportionalLayout: true
            });
            this.layoutParticipants.push({
                layout: (height, width) => {
                    splitView.el.style.height = `${height - 14}px`;
                    splitView.layout(width);
                }
            });
            const featuresListContainer = (0, dom_1.$)('.features-list-container');
            const list = this.createFeaturesList(featuresListContainer);
            list.splice(0, list.length, features);
            const featureViewContainer = (0, dom_1.$)('.feature-view-container');
            this._register(list.onDidChangeSelection(e => {
                const feature = e.elements[0];
                if (feature) {
                    this.showFeatureView(feature, featureViewContainer);
                }
            }));
            const index = this.feature ? features.findIndex(f => f.id === this.feature) : 0;
            list.setSelection([index === -1 ? 0 : index]);
            splitView.addView({
                onDidChange: event_1.Event.None,
                element: featuresListContainer,
                minimumSize: 100,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    featuresListContainer.style.width = `${width}px`;
                    list.layout(height, width);
                }
            }, 200, undefined, true);
            splitView.addView({
                onDidChange: event_1.Event.None,
                element: featureViewContainer,
                minimumSize: 500,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    featureViewContainer.style.width = `${width}px`;
                    this.featureViewDimension = { height, width };
                    this.layoutFeatureView();
                }
            }, splitview_1.Sizing.Distribute, undefined, true);
            splitView.style({
                separatorBorder: this.theme.getColor(theme_1.PANEL_SECTION_BORDER)
            });
        }
        createFeaturesList(container) {
            const renderer = this.instantiationService.createInstance(ExtensionFeatureItemRenderer, this.extensionId);
            const delegate = new ExtensionFeatureItemDelegate();
            const list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'ExtensionFeaturesList', (0, dom_1.append)(container, (0, dom_1.$)('.features-list-wrapper')), delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                accessibilityProvider: {
                    getAriaLabel(extensionFeature) {
                        return extensionFeature?.label ?? '';
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('extension features list', "Extension Features");
                    }
                },
                openOnSingleClick: true
            });
            return list;
        }
        layoutFeatureView() {
            this.featureView.value?.layout(this.featureViewDimension?.height, this.featureViewDimension?.width);
        }
        showFeatureView(feature, container) {
            if (this.featureView.value?.feature.id === feature.id) {
                return;
            }
            (0, dom_1.clearNode)(container);
            this.featureView.value = this.instantiationService.createInstance(ExtensionFeatureView, this.extensionId, this.manifest, feature);
            container.appendChild(this.featureView.value.domNode);
            this.layoutFeatureView();
        }
        getFeatures() {
            const features = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry)
                .getExtensionFeatures().filter(feature => {
                const renderer = this.getRenderer(feature);
                const shouldRender = renderer?.shouldRender(this.manifest);
                renderer?.dispose();
                return shouldRender;
            }).sort((a, b) => a.label.localeCompare(b.label));
            const renderer = this.getRenderer(runtimeStatusFeature);
            if (renderer?.shouldRender(this.manifest)) {
                features.splice(0, 0, runtimeStatusFeature);
            }
            renderer?.dispose();
            return features;
        }
        getRenderer(feature) {
            return feature.renderer ? this.instantiationService.createInstance(feature.renderer) : undefined;
        }
    };
    exports.ExtensionFeaturesTab = ExtensionFeaturesTab;
    exports.ExtensionFeaturesTab = ExtensionFeaturesTab = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService)
    ], ExtensionFeaturesTab);
    class ExtensionFeatureItemDelegate {
        getHeight() { return 22; }
        getTemplateId() { return 'extensionFeatureDescriptor'; }
    }
    let ExtensionFeatureItemRenderer = class ExtensionFeatureItemRenderer {
        constructor(extensionId, extensionFeaturesManagementService) {
            this.extensionId = extensionId;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.templateId = 'extensionFeatureDescriptor';
        }
        renderTemplate(container) {
            container.classList.add('extension-feature-list-item');
            const label = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-label'));
            const disabledElement = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-disabled-label'));
            disabledElement.textContent = (0, nls_1.localize)('revoked', "No Access");
            const statusElement = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-status'));
            return { label, disabledElement, statusElement, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(element, index, templateData) {
            templateData.disposables.clear();
            templateData.label.textContent = element.label;
            templateData.disabledElement.style.display = element.id === runtimeStatusFeature.id || this.extensionFeaturesManagementService.isEnabled(this.extensionId, element.id) ? 'none' : 'inherit';
            templateData.disposables.add(this.extensionFeaturesManagementService.onDidChangeEnablement(({ extension, featureId, enabled }) => {
                if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === element.id) {
                    templateData.disabledElement.style.display = enabled ? 'none' : 'inherit';
                }
            }));
            const statusElementClassName = templateData.statusElement.className;
            const updateStatus = () => {
                const accessData = this.extensionFeaturesManagementService.getAccessData(this.extensionId, element.id);
                if (accessData?.current?.status) {
                    templateData.statusElement.style.display = 'inherit';
                    templateData.statusElement.className = `${statusElementClassName} ${severityIcon_1.SeverityIcon.className(accessData.current.status.severity)}`;
                }
                else {
                    templateData.statusElement.style.display = 'none';
                }
            };
            updateStatus();
            templateData.disposables.add(this.extensionFeaturesManagementService.onDidChangeAccessData(({ extension, featureId }) => {
                if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === element.id) {
                    updateStatus();
                }
            }));
        }
        disposeElement(element, index, templateData, height) {
            templateData.disposables.dispose();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    ExtensionFeatureItemRenderer = __decorate([
        __param(1, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], ExtensionFeatureItemRenderer);
    let ExtensionFeatureView = class ExtensionFeatureView extends lifecycle_1.Disposable {
        constructor(extensionId, manifest, feature, openerService, instantiationService, extensionFeaturesManagementService, dialogService) {
            super();
            this.extensionId = extensionId;
            this.manifest = manifest;
            this.feature = feature;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.dialogService = dialogService;
            this.layoutParticipants = [];
            this.domNode = (0, dom_1.$)('.extension-feature-content');
            this.create(this.domNode);
        }
        create(content) {
            const header = (0, dom_1.append)(content, (0, dom_1.$)('.feature-header'));
            const title = (0, dom_1.append)(header, (0, dom_1.$)('.feature-title'));
            title.textContent = this.feature.label;
            if (this.feature.access.canToggle) {
                const actionsContainer = (0, dom_1.append)(header, (0, dom_1.$)('.feature-actions'));
                const button = new button_1.Button(actionsContainer, defaultStyles_1.defaultButtonStyles);
                this.updateButtonLabel(button);
                this._register(this.extensionFeaturesManagementService.onDidChangeEnablement(({ extension, featureId }) => {
                    if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === this.feature.id) {
                        this.updateButtonLabel(button);
                    }
                }));
                this._register(button.onDidClick(async () => {
                    const enabled = this.extensionFeaturesManagementService.isEnabled(this.extensionId, this.feature.id);
                    const confirmationResult = await this.dialogService.confirm({
                        title: (0, nls_1.localize)('accessExtensionFeature', "Enable '{0}' Feature", this.feature.label),
                        message: enabled
                            ? (0, nls_1.localize)('disableAccessExtensionFeatureMessage', "Would you like to revoke '{0}' extension to access '{1}' feature?", this.manifest.displayName ?? this.extensionId.value, this.feature.label)
                            : (0, nls_1.localize)('enableAccessExtensionFeatureMessage', "Would you like to allow '{0}' extension to access '{1}' feature?", this.manifest.displayName ?? this.extensionId.value, this.feature.label),
                        custom: true,
                        primaryButton: enabled ? (0, nls_1.localize)('revoke', "Revoke Access") : (0, nls_1.localize)('grant', "Allow Access"),
                        cancelButton: (0, nls_1.localize)('cancel', "Cancel"),
                    });
                    if (confirmationResult.confirmed) {
                        this.extensionFeaturesManagementService.setEnablement(this.extensionId, this.feature.id, !enabled);
                    }
                }));
            }
            const body = (0, dom_1.append)(content, (0, dom_1.$)('.feature-body'));
            const bodyContent = (0, dom_1.$)('.feature-body-content');
            const scrollableContent = this._register(new scrollableElement_1.DomScrollableElement(bodyContent, {}));
            (0, dom_1.append)(body, scrollableContent.getDomNode());
            this.layoutParticipants.push({ layout: () => scrollableContent.scanDomNode() });
            scrollableContent.scanDomNode();
            if (this.feature.description) {
                const description = (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-description'));
                description.textContent = this.feature.description;
            }
            const accessData = this.extensionFeaturesManagementService.getAccessData(this.extensionId, this.feature.id);
            if (accessData?.current?.status) {
                (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-status', undefined, (0, dom_1.$)(`span${themables_1.ThemeIcon.asCSSSelector(accessData.current.status.severity === severity_1.default.Error ? extensionsIcons_1.errorIcon : accessData.current.status.severity === severity_1.default.Warning ? extensionsIcons_1.warningIcon : extensionsIcons_1.infoIcon)}`, undefined), (0, dom_1.$)('span', undefined, accessData.current.status.message)));
            }
            const featureContentElement = (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-content'));
            if (this.feature.renderer) {
                const renderer = this.instantiationService.createInstance(this.feature.renderer);
                if (renderer.type === 'table') {
                    this.renderTableData(featureContentElement, renderer);
                }
                else if (renderer.type === 'markdown') {
                    this.renderMarkdownData(featureContentElement, renderer);
                }
                else if (renderer.type === 'markdown+table') {
                    this.renderMarkdownAndTableData(featureContentElement, renderer);
                }
            }
        }
        updateButtonLabel(button) {
            button.label = this.extensionFeaturesManagementService.isEnabled(this.extensionId, this.feature.id) ? (0, nls_1.localize)('revoke', "Revoke Access") : (0, nls_1.localize)('enable', "Allow Access");
        }
        renderTableData(container, renderer) {
            const tableData = this._register(renderer.render(this.manifest));
            const tableDisposable = this._register(new lifecycle_1.MutableDisposable());
            if (tableData.onDidChange) {
                this._register(tableData.onDidChange(data => {
                    (0, dom_1.clearNode)(container);
                    tableDisposable.value = this.renderTable(data, container);
                }));
            }
            tableDisposable.value = this.renderTable(tableData.data, container);
        }
        renderTable(tableData, container) {
            const disposables = new lifecycle_1.DisposableStore();
            (0, dom_1.append)(container, (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, ...tableData.headers.map(header => (0, dom_1.$)('th', undefined, header))), ...tableData.rows
                .map(row => {
                return (0, dom_1.$)('tr', undefined, ...row.map(rowData => {
                    if (typeof rowData === 'string') {
                        return (0, dom_1.$)('td', undefined, rowData);
                    }
                    const data = Array.isArray(rowData) ? rowData : [rowData];
                    return (0, dom_1.$)('td', undefined, ...data.map(item => {
                        const result = [];
                        if ((0, htmlContent_1.isMarkdownString)(rowData)) {
                            const element = (0, dom_1.$)('', undefined);
                            this.renderMarkdown(rowData, element);
                            result.push(element);
                        }
                        else if (item instanceof keybindings_1.ResolvedKeybinding) {
                            const element = (0, dom_1.$)('');
                            const kbl = disposables.add(new keybindingLabel_1.KeybindingLabel(element, platform_2.OS, defaultStyles_1.defaultKeybindingLabelStyles));
                            kbl.set(item);
                            result.push(element);
                        }
                        else if (item instanceof color_1.Color) {
                            result.push((0, dom_1.$)('span', { class: 'colorBox', style: 'background-color: ' + color_1.Color.Format.CSS.format(item) }, ''));
                            result.push((0, dom_1.$)('code', undefined, color_1.Color.Format.CSS.formatHex(item)));
                        }
                        return result;
                    }).flat());
                }));
            })));
            return disposables;
        }
        renderMarkdownAndTableData(container, renderer) {
            const markdownAndTableData = this._register(renderer.render(this.manifest));
            if (markdownAndTableData.onDidChange) {
                this._register(markdownAndTableData.onDidChange(data => {
                    (0, dom_1.clearNode)(container);
                    this.renderMarkdownAndTable(data, container);
                }));
            }
            this.renderMarkdownAndTable(markdownAndTableData.data, container);
        }
        renderMarkdownData(container, renderer) {
            container.classList.add('markdown');
            const markdownData = this._register(renderer.render(this.manifest));
            if (markdownData.onDidChange) {
                this._register(markdownData.onDidChange(data => {
                    (0, dom_1.clearNode)(container);
                    this.renderMarkdown(data, container);
                }));
            }
            this.renderMarkdown(markdownData.data, container);
        }
        renderMarkdown(markdown, container) {
            const { element, dispose } = (0, markdownRenderer_1.renderMarkdown)({
                value: markdown.value,
                isTrusted: markdown.isTrusted,
                supportThemeIcons: true
            }, {
                actionHandler: {
                    callback: (content) => this.openerService.open(content, { allowCommands: !!markdown.isTrusted }).catch(errors_1.onUnexpectedError),
                    disposables: this._store
                },
            });
            this._register((0, lifecycle_1.toDisposable)(dispose));
            (0, dom_1.append)(container, element);
        }
        renderMarkdownAndTable(data, container) {
            for (const markdownOrTable of data) {
                if ((0, htmlContent_1.isMarkdownString)(markdownOrTable)) {
                    const element = (0, dom_1.$)('', undefined);
                    this.renderMarkdown(markdownOrTable, element);
                    (0, dom_1.append)(container, element);
                }
                else {
                    const tableElement = (0, dom_1.append)(container, (0, dom_1.$)('table'));
                    this.renderTable(markdownOrTable, tableElement);
                }
            }
        }
        layout(height, width) {
            this.layoutParticipants.forEach(p => p.layout(height, width));
        }
    };
    ExtensionFeatureView = __decorate([
        __param(3, opener_1.IOpenerService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(6, dialogs_1.IDialogService)
    ], ExtensionFeatureView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXNUYWIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uRmVhdHVyZXNUYWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0NoRyxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO2lCQUVyQyxPQUFFLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtRQUdyQyxZQUNvQixnQkFBb0QsRUFDbEMsa0NBQXdGO1lBRTdILEtBQUssRUFBRSxDQUFDO1lBSDRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDakIsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUpySCxTQUFJLEdBQUcsVUFBVSxDQUFDO1FBTzNCLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBNEI7WUFDeEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxnQ0FBbUIsQ0FBQyxJQUFBLHdDQUFjLEVBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQ0FBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hHLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDOUMsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUE0QjtZQUNsQyxNQUFN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