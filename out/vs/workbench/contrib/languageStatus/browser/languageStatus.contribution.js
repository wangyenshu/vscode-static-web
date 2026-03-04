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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/themables", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/linkedText", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/base/common/htmlContent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/platform/storage/common/storage", "vs/base/common/arrays", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/hover/browser/hover", "vs/css!./media/languageStatus"], function (require, exports, dom, iconLabels_1, lifecycle_1, severity_1, editorBrowser_1, nls_1, platform_1, themables_1, contributions_1, editorService_1, languageStatusService_1, statusbar_1, linkedText_1, link_1, opener_1, htmlContent_1, actionbar_1, actions_1, codicons_1, storage_1, arrays_1, uri_1, actions_2, instantiation_1, actionCommonCategories_1, editorGroupsService_1, serviceCollection_1, hover_1) {
    "use strict";
    var LanguageStatus_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageStatusViewModel {
        constructor(combined, dedicated) {
            this.combined = combined;
            this.dedicated = dedicated;
        }
        isEqual(other) {
            return (0, arrays_1.equals)(this.combined, other.combined) && (0, arrays_1.equals)(this.dedicated, other.dedicated);
        }
    }
    let StoredCounter = class StoredCounter {
        constructor(_storageService, _key) {
            this._storageService = _storageService;
            this._key = _key;
        }
        get value() {
            return this._storageService.getNumber(this._key, 0 /* StorageScope.PROFILE */, 0);
        }
        increment() {
            const n = this.value + 1;
            this._storageService.store(this._key, n, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return n;
        }
    };
    StoredCounter = __decorate([
        __param(0, storage_1.IStorageService)
    ], StoredCounter);
    let LanguageStatusContribution = class LanguageStatusContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, editorGroupService, editorService) {
            super();
            // --- main language status
            const mainInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_1.IEditorService, editorService.createScoped('main', this._store)]));
            this._register(mainInstantiationService.createInstance(LanguageStatus));
            // --- auxiliary language status
            this._register(editorGroupService.onDidCreateAuxiliaryEditorPart(({ instantiationService, disposables }) => {
                disposables.add(instantiationService.createInstance(LanguageStatus));
            }));
        }
    };
    LanguageStatusContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService)
    ], LanguageStatusContribution);
    let LanguageStatus = class LanguageStatus {
        static { LanguageStatus_1 = this; }
        static { this._id = 'status.languageStatus'; }
        static { this._keyDedicatedItems = 'languageStatus.dedicated'; }
        constructor(_languageStatusService, _statusBarService, _editorService, _hoverService, _openerService, _storageService) {
            this._languageStatusService = _languageStatusService;
            this._statusBarService = _statusBarService;
            this._editorService = _editorService;
            this._hoverService = _hoverService;
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._dedicated = new Set();
            this._dedicatedEntries = new Map();
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, LanguageStatus_1._keyDedicatedItems, this._disposables)(this._handleStorageChange, this, this._disposables);
            this._restoreState();
            this._interactionCounter = new StoredCounter(_storageService, 'languageStatus.interactCount');
            _languageStatusService.onDidChange(this._update, this, this._disposables);
            _editorService.onDidActiveEditorChange(this._update, this, this._disposables);
            this._update();
            _statusBarService.onDidChangeEntryVisibility(e => {
                if (!e.visible && this._dedicated.has(e.id)) {
                    this._dedicated.delete(e.id);
                    this._update();
                    this._storeState();
                }
            }, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
            this._combinedEntry?.dispose();
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._renderDisposables.dispose();
        }
        // --- persisting dedicated items
        _handleStorageChange() {
            this._restoreState();
            this._update();
        }
        _restoreState() {
            const raw = this._storageService.get(LanguageStatus_1._keyDedicatedItems, 0 /* StorageScope.PROFILE */, '[]');
            try {
                const ids = JSON.parse(raw);
                this._dedicated = new Set(ids);
            }
            catch {
                this._dedicated.clear();
            }
        }
        _storeState() {
            if (this._dedicated.size === 0) {
                this._storageService.remove(LanguageStatus_1._keyDedicatedItems, 0 /* StorageScope.PROFILE */);
            }
            else {
                const raw = JSON.stringify(Array.from(this._dedicated.keys()));
                this._storageService.store(LanguageStatus_1._keyDedicatedItems, raw, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
        // --- language status model and UI
        _createViewModel(editor) {
            if (!editor?.hasModel()) {
                return new LanguageStatusViewModel([], []);
            }
            const all = this._languageStatusService.getLanguageStatus(editor.getModel());
            const combined = [];
            const dedicated = [];
            for (const item of all) {
                if (this._dedicated.has(item.id)) {
                    dedicated.push(item);
                }
                combined.push(item);
            }
            return new LanguageStatusViewModel(combined, dedicated);
        }
        _update() {
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            const model = this._createViewModel(editor);
            if (this._model?.isEqual(model)) {
                return;
            }
            this._renderDisposables.clear();
            this._model = model;
            // update when editor language changes
            editor?.onDidChangeModelLanguage(this._update, this, this._renderDisposables);
            // combined status bar item is a single item which hover shows
            // each status item
            if (model.combined.length === 0) {
                // nothing
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const [first] = model.combined;
                const showSeverity = first.severity >= severity_1.default.Warning;
                const text = LanguageStatus_1._severityToComboCodicon(first.severity);
                let isOneBusy = false;
                const ariaLabels = [];
                const element = document.createElement('div');
                for (const status of model.combined) {
                    const isPinned = model.dedicated.includes(status);
                    element.appendChild(this._renderStatus(status, showSeverity, isPinned, this._renderDisposables));
                    ariaLabels.push(LanguageStatus_1._accessibilityInformation(status).label);
                    isOneBusy = isOneBusy || (!isPinned && status.busy); // unpinned items contribute to the busy-indicator of the composite status item
                }
                const props = {
                    name: (0, nls_1.localize)('langStatus.name', "Editor Language Status"),
                    ariaLabel: (0, nls_1.localize)('langStatus.aria', "Editor Language Status: {0}", ariaLabels.join(', next: ')),
                    tooltip: element,
                    command: statusbar_1.ShowTooltipCommand,
                    text: isOneBusy ? `${text}\u00A0\u00A0$(sync~spin)` : text,
                };
                if (!this._combinedEntry) {
                    this._combinedEntry = this._statusBarService.addEntry(props, LanguageStatus_1._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 0 /* StatusbarAlignment.LEFT */, compact: true });
                }
                else {
                    this._combinedEntry.update(props);
                }
                // animate the status bar icon whenever language status changes, repeat animation
                // when severity is warning or error, don't show animation when showing progress/busy
                const userHasInteractedWithStatus = this._interactionCounter.value >= 3;
                const targetWindow = dom.getWindow(editor?.getContainerDomNode());
                const node = targetWindow.document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus A>SPAN.codicon');
                const container = targetWindow.document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus');
                if (node instanceof HTMLElement && container) {
                    const _wiggle = 'wiggle';
                    const _flash = 'flash';
                    if (!isOneBusy) {
                        // wiggle icon when severe or "new"
                        node.classList.toggle(_wiggle, showSeverity || !userHasInteractedWithStatus);
                        this._renderDisposables.add(dom.addDisposableListener(node, 'animationend', _e => node.classList.remove(_wiggle)));
                        // flash background when severe
                        container.classList.toggle(_flash, showSeverity);
                        this._renderDisposables.add(dom.addDisposableListener(container, 'animationend', _e => container.classList.remove(_flash)));
                    }
                    else {
                        node.classList.remove(_wiggle);
                        container.classList.remove(_flash);
                    }
                }
                // track when the hover shows (this is automagic and DOM mutation spying is needed...)
                //  use that as signal that the user has interacted/learned language status items work
                if (!userHasInteractedWithStatus) {
                    const hoverTarget = targetWindow.document.querySelector('.monaco-workbench .context-view');
                    if (hoverTarget instanceof HTMLElement) {
                        const observer = new MutationObserver(() => {
                            if (targetWindow.document.contains(element)) {
                                this._interactionCounter.increment();
                                observer.disconnect();
                            }
                        });
                        observer.observe(hoverTarget, { childList: true, subtree: true });
                        this._renderDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
                    }
                }
            }
            // dedicated status bar items are shows as-is in the status bar
            const newDedicatedEntries = new Map();
            for (const status of model.dedicated) {
                const props = LanguageStatus_1._asStatusbarEntry(status);
                let entry = this._dedicatedEntries.get(status.id);
                if (!entry) {
                    entry = this._statusBarService.addEntry(props, status.id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */ });
                }
                else {
                    entry.update(props);
                    this._dedicatedEntries.delete(status.id);
                }
                newDedicatedEntries.set(status.id, entry);
            }
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._dedicatedEntries = newDedicatedEntries;
        }
        _renderStatus(status, showSeverity, isPinned, store) {
            const parent = document.createElement('div');
            parent.classList.add('hover-language-status');
            const severity = document.createElement('div');
            severity.classList.add('severity', `sev${status.severity}`);
            severity.classList.toggle('show', showSeverity);
            const severityText = LanguageStatus_1._severityToSingleCodicon(status.severity);
            dom.append(severity, ...(0, iconLabels_1.renderLabelWithIcons)(severityText));
            parent.appendChild(severity);
            const element = document.createElement('div');
            element.classList.add('element');
            parent.appendChild(element);
            const left = document.createElement('div');
            left.classList.add('left');
            element.appendChild(left);
            const label = document.createElement('span');
            label.classList.add('label');
            const labelValue = typeof status.label === 'string' ? status.label : status.label.value;
            dom.append(label, ...(0, iconLabels_1.renderLabelWithIcons)(status.busy ? `$(sync~spin)\u00A0\u00A0${labelValue}` : labelValue));
            left.appendChild(label);
            const detail = document.createElement('span');
            detail.classList.add('detail');
            this._renderTextPlus(detail, status.detail, store);
            left.appendChild(detail);
            const right = document.createElement('div');
            right.classList.add('right');
            element.appendChild(right);
            // -- command (if available)
            const { command } = status;
            if (command) {
                store.add(new link_1.Link(right, {
                    label: command.title,
                    title: command.tooltip,
                    href: uri_1.URI.from({
                        scheme: 'command', path: command.id, query: command.arguments && JSON.stringify(command.arguments)
                    }).toString()
                }, { hoverDelegate: hover_1.nativeHoverDelegate }, this._hoverService, this._openerService));
            }
            // -- pin
            const actionBar = new actionbar_1.ActionBar(right, { hoverDelegate: hover_1.nativeHoverDelegate });
            store.add(actionBar);
            let action;
            if (!isPinned) {
                action = new actions_1.Action('pin', (0, nls_1.localize)('pin', "Add to Status Bar"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pin), true, () => {
                    this._dedicated.add(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, true);
                    this._update();
                    this._storeState();
                });
            }
            else {
                action = new actions_1.Action('unpin', (0, nls_1.localize)('unpin', "Remove from Status Bar"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned), true, () => {
                    this._dedicated.delete(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, false);
                    this._update();
                    this._storeState();
                });
            }
            actionBar.push(action, { icon: true, label: false });
            store.add(action);
            return parent;
        }
        static _severityToComboCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(bracket-error)';
                case severity_1.default.Warning: return '$(bracket-dot)';
                default: return '$(bracket)';
            }
        }
        static _severityToSingleCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(error)';
                case severity_1.default.Warning: return '$(info)';
                default: return '$(check)';
            }
        }
        _renderTextPlus(target, text, store) {
            for (const node of (0, linkedText_1.parseLinkedText)(text).nodes) {
                if (typeof node === 'string') {
                    const parts = (0, iconLabels_1.renderLabelWithIcons)(node);
                    dom.append(target, ...parts);
                }
                else {
                    store.add(new link_1.Link(target, node, undefined, this._hoverService, this._openerService));
                }
            }
        }
        static _accessibilityInformation(status) {
            if (status.accessibilityInfo) {
                return status.accessibilityInfo;
            }
            const textValue = typeof status.label === 'string' ? status.label : status.label.value;
            if (status.detail) {
                return { label: (0, nls_1.localize)('aria.1', '{0}, {1}', textValue, status.detail) };
            }
            else {
                return { label: (0, nls_1.localize)('aria.2', '{0}', textValue) };
            }
        }
        // ---
        static _asStatusbarEntry(item) {
            let kind;
            if (item.severity === severity_1.default.Warning) {
                kind = 'warning';
            }
            else if (item.severity === severity_1.default.Error) {
                kind = 'error';
            }
            const textValue = typeof item.label === 'string' ? item.label : item.label.shortValue;
            return {
                name: (0, nls_1.localize)('name.pattern', '{0} (Language Status)', item.name),
                text: item.busy ? `${textValue}\u00A0\u00A0$(sync~spin)` : textValue,
                ariaLabel: LanguageStatus_1._accessibilityInformation(item).label,
                role: item.accessibilityInfo?.role,
                tooltip: item.command?.tooltip || new htmlContent_1.MarkdownString(item.detail, { isTrusted: true, supportThemeIcons: true }),
                kind,
                command: item.command
            };
        }
    };
    LanguageStatus = LanguageStatus_1 = __decorate([
        __param(0, languageStatusService_1.ILanguageStatusService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, editorService_1.IEditorService),
        __param(3, hover_1.IHoverService),
        __param(4, opener_1.IOpenerService),
        __param(5, storage_1.IStorageService)
    ], LanguageStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LanguageStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.inlayHints.Reset',
                title: (0, nls_1.localize2)('reset', "Reset Language Status Interaction Counter"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove('languageStatus.interactCount', 0 /* StorageScope.PROFILE */);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTdGF0dXMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbGFuZ3VhZ2VTdGF0dXMvYnJvd3Nlci9sYW5ndWFnZVN0YXR1cy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLHVCQUF1QjtRQUU1QixZQUNVLFFBQW9DLEVBQ3BDLFNBQXFDO1lBRHJDLGFBQVEsR0FBUixRQUFRLENBQTRCO1lBQ3BDLGNBQVMsR0FBVCxTQUFTLENBQTRCO1FBQzNDLENBQUM7UUFFTCxPQUFPLENBQUMsS0FBOEI7WUFDckMsT0FBTyxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RixDQUFDO0tBQ0Q7SUFFRCxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhO1FBRWxCLFlBQThDLGVBQWdDLEVBQW1CLElBQVk7WUFBL0Qsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQW1CLFNBQUksR0FBSixJQUFJLENBQVE7UUFBSSxDQUFDO1FBRWxILElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksZ0NBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxTQUFTO1lBQ1IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLDhEQUE4QyxDQUFDO1lBQ3RGLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQUNELENBQUE7SUFiSyxhQUFhO1FBRUwsV0FBQSx5QkFBZSxDQUFBO09BRnZCLGFBQWEsQ0FhbEI7SUFFRCxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBRWxELFlBQ3dCLG9CQUEyQyxFQUM1QyxrQkFBd0MsRUFDOUMsYUFBNkI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFFUiwyQkFBMkI7WUFDM0IsTUFBTSx3QkFBd0IsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxxQ0FBaUIsQ0FDdEYsQ0FBQyw4QkFBYyxFQUFFLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUNqRSxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBRXhFLGdDQUFnQztZQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLDhCQUE4QixDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUMxRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0QsQ0FBQTtJQXBCSywwQkFBMEI7UUFHN0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDBDQUFvQixDQUFBO1FBQ3BCLFdBQUEsOEJBQWMsQ0FBQTtPQUxYLDBCQUEwQixDQW9CL0I7SUFFRCxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFjOztpQkFFSyxRQUFHLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO2lCQUU5Qix1QkFBa0IsR0FBRywwQkFBMEIsQUFBN0IsQ0FBOEI7UUFZeEUsWUFDeUIsc0JBQStELEVBQ3BFLGlCQUFxRCxFQUN4RCxjQUErQyxFQUNoRCxhQUE2QyxFQUM1QyxjQUErQyxFQUM5QyxlQUFpRDtZQUx6QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ25ELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDdkMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQy9CLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzNCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFoQmxELGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFHOUMsZUFBVSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFJL0Isc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFDdEQsdUJBQWtCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFVM0QsZUFBZSxDQUFDLGdCQUFnQiwrQkFBdUIsZ0JBQWMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDakssSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLGFBQWEsQ0FBQyxlQUFlLEVBQUUsOEJBQThCLENBQUMsQ0FBQztZQUU5RixzQkFBc0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFFLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWYsaUJBQWlCLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXZCLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQy9CLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVELGlDQUFpQztRQUV6QixvQkFBb0I7WUFDM0IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRU8sYUFBYTtZQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxnQkFBYyxDQUFDLGtCQUFrQixnQ0FBd0IsSUFBSSxDQUFDLENBQUM7WUFDcEcsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxHQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVztZQUNsQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxnQkFBYyxDQUFDLGtCQUFrQiwrQkFBdUIsQ0FBQztZQUN0RixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxnQkFBYyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsMkRBQTJDLENBQUM7WUFDOUcsQ0FBQztRQUNGLENBQUM7UUFFRCxtQ0FBbUM7UUFFM0IsZ0JBQWdCLENBQUMsTUFBMEI7WUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN6QixPQUFPLElBQUksdUJBQXVCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDN0UsTUFBTSxRQUFRLEdBQXNCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLFNBQVMsR0FBc0IsRUFBRSxDQUFDO1lBQ3hDLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBQ0QsT0FBTyxJQUFJLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRU8sT0FBTztZQUNkLE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQWEsRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDMUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTVDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFcEIsc0NBQXNDO1lBQ3RDLE1BQU0sRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUU5RSw4REFBOEQ7WUFDOUQsbUJBQW1CO1lBQ25CLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLFVBQVU7Z0JBQ1YsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFFakMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUMvQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLGtCQUFRLENBQUMsT0FBTyxDQUFDO2dCQUN4RCxNQUFNLElBQUksR0FBRyxnQkFBYyxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFcEUsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixNQUFNLFVBQVUsR0FBYSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlDLEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNyQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDbEQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7b0JBQ2pHLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDeEUsU0FBUyxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLCtFQUErRTtnQkFDckksQ0FBQztnQkFDRCxNQUFNLEtBQUssR0FBb0I7b0JBQzlCLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsQ0FBQztvQkFDM0QsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLDZCQUE2QixFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2xHLE9BQU8sRUFBRSxPQUFPO29CQUNoQixPQUFPLEVBQUUsOEJBQWtCO29CQUMzQixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksMEJBQTBCLENBQUMsQ0FBQyxDQUFDLElBQUk7aUJBQzFELENBQUM7Z0JBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxnQkFBYyxDQUFDLEdBQUcsb0NBQTRCLEVBQUUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLFNBQVMsaUNBQXlCLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzdMLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxpRkFBaUY7Z0JBQ2pGLHFGQUFxRjtnQkFDckYsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO2dCQUM1SCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQywwREFBMEQsQ0FBQyxDQUFDO2dCQUNsSCxJQUFJLElBQUksWUFBWSxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQzlDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQztvQkFDekIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDO29CQUN2QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ2hCLG1DQUFtQzt3QkFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFlBQVksSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7d0JBQzdFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ25ILCtCQUErQjt3QkFDL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3SCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQy9CLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsc0ZBQXNGO2dCQUN0RixzRkFBc0Y7Z0JBQ3RGLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO29CQUNsQyxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO29CQUMzRixJQUFJLFdBQVcsWUFBWSxXQUFXLEVBQUUsQ0FBQzt3QkFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUU7NEJBQzFDLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQ0FDN0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dDQUNyQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7NEJBQ3ZCLENBQUM7d0JBQ0YsQ0FBQyxDQUFDLENBQUM7d0JBQ0gsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUNsRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN4RSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsK0RBQStEO1lBQy9ELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFDdkUsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sS0FBSyxHQUFHLGdCQUFjLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLG9DQUE0QixFQUFFLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxTQUFTLGtDQUEwQixFQUFFLENBQUMsQ0FBQztnQkFDeEosQ0FBQztxQkFBTSxDQUFDO29CQUNQLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO2dCQUNELG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFDRCxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDO1FBQzlDLENBQUM7UUFFTyxhQUFhLENBQUMsTUFBdUIsRUFBRSxZQUFxQixFQUFFLFFBQWlCLEVBQUUsS0FBc0I7WUFFOUcsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBRTlDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0MsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDNUQsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sWUFBWSxHQUFHLGdCQUFjLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlFLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBQSxpQ0FBb0IsRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFN0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTVCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUxQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLE1BQU0sVUFBVSxHQUFHLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ3hGLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBQSxpQ0FBb0IsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDL0csSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV4QixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV6QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFM0IsNEJBQTRCO1lBQzVCLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7WUFDM0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksV0FBSSxDQUFDLEtBQUssRUFBRTtvQkFDekIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUNwQixLQUFLLEVBQUUsT0FBTyxDQUFDLE9BQU87b0JBQ3RCLElBQUksRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDO3dCQUNkLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO3FCQUNsRyxDQUFDLENBQUMsUUFBUSxFQUFFO2lCQUNiLEVBQUUsRUFBRSxhQUFhLEVBQUUsMkJBQW1CLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLENBQUM7WUFFRCxTQUFTO1lBQ1QsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLEtBQUssRUFBRSxFQUFFLGFBQWEsRUFBRSwyQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDL0UsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQixJQUFJLE1BQWMsQ0FBQztZQUNuQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLEVBQUUscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO29CQUMvRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQy9CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM5RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2YsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLENBQUMsRUFBRSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7b0JBQzNILElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQy9ELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRCxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWxCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxHQUFhO1lBQ25ELFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2IsS0FBSyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sa0JBQWtCLENBQUM7Z0JBQy9DLEtBQUssa0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLGdCQUFnQixDQUFDO2dCQUMvQyxPQUFPLENBQUMsQ0FBQyxPQUFPLFlBQVksQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVPLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFhO1lBQ3BELFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2IsS0FBSyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO2dCQUN2QyxLQUFLLGtCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7Z0JBQ3hDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRU8sZUFBZSxDQUFDLE1BQW1CLEVBQUUsSUFBWSxFQUFFLEtBQXNCO1lBQ2hGLEtBQUssTUFBTSxJQUFJLElBQUksSUFBQSw0QkFBZSxFQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoRCxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUM5QixNQUFNLEtBQUssR0FBRyxJQUFBLGlDQUFvQixFQUFDLElBQUksQ0FBQyxDQUFDO29CQUN6QyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFdBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMseUJBQXlCLENBQUMsTUFBdUI7WUFDL0QsSUFBSSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxNQUFNLENBQUMsaUJBQWlCLENBQUM7WUFDakMsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ3ZGLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQixPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzVFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU07UUFFRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBcUI7WUFFckQsSUFBSSxJQUFvQyxDQUFDO1lBQ3pDLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxrQkFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QyxJQUFJLEdBQUcsU0FBUyxDQUFDO1lBQ2xCLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLGtCQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdDLElBQUksR0FBRyxPQUFPLENBQUM7WUFDaEIsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBRXRGLE9BQU87Z0JBQ04sSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNsRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUNwRSxTQUFTLEVBQUUsZ0JBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLO2dCQUMvRCxJQUFJLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUk7Z0JBQ2xDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxJQUFJLDRCQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQy9HLElBQUk7Z0JBQ0osT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQ3JCLENBQUM7UUFDSCxDQUFDOztJQTFVSSxjQUFjO1FBaUJqQixXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSx5QkFBZSxDQUFBO09BdEJaLGNBQWMsQ0EyVW5CO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLDBCQUEwQixrQ0FBMEIsQ0FBQztJQUUvSixJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBRXBDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx5QkFBeUI7Z0JBQzdCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxPQUFPLEVBQUUsMkNBQTJDLENBQUM7Z0JBQ3RFLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQyxNQUFNLENBQUMsOEJBQThCLCtCQUF1QixDQUFDO1FBQzVGLENBQUM7S0FDRCxDQUFDLENBQUMifQ==