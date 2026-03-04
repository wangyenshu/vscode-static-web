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
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/uri", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/editorBrowser", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/editor/common/editorService"], function (require, exports, pixelRatio_1, dom_1, arrays_1, event_1, lifecycle_1, path_1, uri_1, domFontInfo_1, editorBrowser_1, fontInfo_1, range_1, stringBuilder_1, resolverService_1, nls_1, configuration_1, contextkey_1, instantiation_1, listService_1, log_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, uriIdentity_1, editorPane_1, callStackEditorContribution_1, icons, debug_1, debugModel_1, debugSource_1, debugUtils_1, editorService_1) {
    "use strict";
    var DisassemblyView_1, BreakpointRenderer_1, InstructionRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewContribution = exports.DisassemblyView = void 0;
    // Special entry as a placeholer when disassembly is not available
    const disassemblyNotAvailable = {
        allowBreakpoint: false,
        isBreakpointSet: false,
        isBreakpointEnabled: false,
        instructionReference: '',
        instructionOffset: 0,
        instructionReferenceOffset: 0,
        address: 0n,
        instruction: {
            address: '-1',
            instruction: (0, nls_1.localize)('instructionNotAvailable', "Disassembly not available.")
        },
    };
    let DisassemblyView = class DisassemblyView extends editorPane_1.EditorPane {
        static { DisassemblyView_1 = this; }
        static { this.NUM_INSTRUCTIONS_TO_LOAD = 50; }
        constructor(group, telemetryService, themeService, storageService, _configurationService, _instantiationService, _debugService) {
            super(debug_1.DISASSEMBLY_VIEW_ID, group, telemetryService, themeService, storageService);
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._debugService = _debugService;
            this._instructionBpList = [];
            this._enableSourceCodeRender = true;
            this._loadingLock = false;
            this._referenceToMemoryAddress = new Map();
            this._disassembledInstructions = undefined;
            this._onDidChangeStackFrame = this._register(new event_1.Emitter({ leakWarningThreshold: 1000 }));
            this._previousDebuggingState = _debugService.state;
            this._register(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug')) {
                    // show/hide source code requires changing height which WorkbenchTable doesn't support dynamic height, thus force a total reload.
                    const newValue = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                    if (this._enableSourceCodeRender !== newValue) {
                        this._enableSourceCodeRender = newValue;
                        // todo: trigger rerender
                    }
                    else {
                        this._disassembledInstructions?.rerender();
                    }
                }
            }));
        }
        get fontInfo() {
            if (!this._fontInfo) {
                this._fontInfo = this.createFontInfo();
                this._register(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor')) {
                        this._fontInfo = this.createFontInfo();
                    }
                }));
            }
            return this._fontInfo;
        }
        createFontInfo() {
            return fontInfo_1.BareFontInfo.createFromRawSettings(this._configurationService.getValue('editor'), pixelRatio_1.PixelRatio.getInstance(this.window).value);
        }
        get currentInstructionAddresses() {
            return this._debugService.getModel().getSessions(false).
                map(session => session.getAllThreads()).
                reduce((prev, curr) => prev.concat(curr), []).
                map(thread => thread.getTopStackFrame()).
                map(frame => frame?.instructionPointerReference).
                map(ref => ref ? this.getReferenceAddress(ref) : undefined);
        }
        // Instruction reference of the top stack frame of the focused stack
        get focusedCurrentInstructionReference() {
            return this._debugService.getViewModel().focusedStackFrame?.thread.getTopStackFrame()?.instructionPointerReference;
        }
        get focusedCurrentInstructionAddress() {
            const ref = this.focusedCurrentInstructionReference;
            return ref ? this.getReferenceAddress(ref) : undefined;
        }
        get focusedInstructionReference() {
            return this._debugService.getViewModel().focusedStackFrame?.instructionPointerReference;
        }
        get focusedInstructionAddress() {
            const ref = this.focusedInstructionReference;
            return ref ? this.getReferenceAddress(ref) : undefined;
        }
        get isSourceCodeRender() { return this._enableSourceCodeRender; }
        get debugSession() {
            return this._debugService.getViewModel().focusedSession;
        }
        get onDidChangeStackFrame() { return this._onDidChangeStackFrame.event; }
        get focusedAddressAndOffset() {
            const element = this._disassembledInstructions?.getFocusedElements()[0];
            if (!element) {
                return undefined;
            }
            const reference = element.instructionReference;
            const offset = Number(element.address - this.getReferenceAddress(reference));
            return { reference, offset, address: element.address };
        }
        createEditor(parent) {
            this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
            const lineHeight = this.fontInfo.lineHeight;
            const thisOM = this;
            const delegate = new class {
                constructor() {
                    this.headerRowHeight = 0; // No header
                }
                getHeight(row) {
                    if (thisOM.isSourceCodeRender && row.showSourceLocation && row.instruction.location?.path && row.instruction.line) {
                        // instruction line + source lines
                        if (row.instruction.endLine) {
                            return lineHeight * (row.instruction.endLine - row.instruction.line + 2);
                        }
                        else {
                            // source is only a single line.
                            return lineHeight * 2;
                        }
                    }
                    // just instruction line
                    return lineHeight;
                }
            };
            const instructionRenderer = this._register(this._instantiationService.createInstance(InstructionRenderer, this));
            this._disassembledInstructions = this._register(this._instantiationService.createInstance(listService_1.WorkbenchTable, 'DisassemblyView', parent, delegate, [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: this.fontInfo.lineHeight,
                    maximumWidth: this.fontInfo.lineHeight,
                    templateId: BreakpointRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('disassemblyTableColumnLabel', "instructions"),
                    tooltip: '',
                    weight: 0.3,
                    templateId: InstructionRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this._instantiationService.createInstance(BreakpointRenderer, this),
                instructionRenderer,
            ], {
                identityProvider: { getId: (e) => e.instruction.address },
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                openOnSingleClick: false,
                accessibilityProvider: new AccessibilityProvider(),
                mouseSupport: false
            }));
            if (this.focusedInstructionReference) {
                this.reloadDisassembly(this.focusedInstructionReference, 0);
            }
            this._register(this._disassembledInstructions.onDidScroll(e => {
                if (this._loadingLock) {
                    return;
                }
                if (e.oldScrollTop > e.scrollTop && e.scrollTop < e.height) {
                    this._loadingLock = true;
                    const prevTop = Math.floor(e.scrollTop / this.fontInfo.lineHeight);
                    this.scrollUp_LoadDisassembledInstructions(DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD).then((loaded) => {
                        if (loaded > 0) {
                            this._disassembledInstructions.reveal(prevTop + loaded, 0);
                        }
                        this._loadingLock = false;
                    });
                }
                else if (e.oldScrollTop < e.scrollTop && e.scrollTop + e.height > e.scrollHeight - e.height) {
                    this._loadingLock = true;
                    this.scrollDown_LoadDisassembledInstructions(DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD).then(() => { this._loadingLock = false; });
                }
            }));
            this._register(this._debugService.getViewModel().onDidFocusStackFrame(({ stackFrame }) => {
                if (this._disassembledInstructions && stackFrame?.instructionPointerReference) {
                    this.goToInstructionAndOffset(stackFrame.instructionPointerReference, 0);
                }
                this._onDidChangeStackFrame.fire();
            }));
            // refresh breakpoints view
            this._register(this._debugService.getModel().onDidChangeBreakpoints(bpEvent => {
                if (bpEvent && this._disassembledInstructions) {
                    // draw viewable BP
                    let changed = false;
                    bpEvent.added?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = true;
                                this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                changed = true;
                            }
                        }
                    });
                    bpEvent.removed?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = false;
                                changed = true;
                            }
                        }
                    });
                    bpEvent.changed?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                if (this._disassembledInstructions.row(index).isBreakpointEnabled !== bp.enabled) {
                                    this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                    changed = true;
                                }
                            }
                        }
                    });
                    // get an updated list so that items beyond the current range would render when reached.
                    this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
                    // breakpoints restored from a previous session can be based on memory
                    // references that may no longer exist in the current session. Request
                    // those instructions to be loaded so the BP can be displayed.
                    for (const bp of this._instructionBpList) {
                        this.primeMemoryReference(bp.instructionReference);
                    }
                    if (changed) {
                        this._onDidChangeStackFrame.fire();
                    }
                }
            }));
            this._register(this._debugService.onDidChangeState(e => {
                if ((e === 3 /* State.Running */ || e === 2 /* State.Stopped */) &&
                    (this._previousDebuggingState !== 3 /* State.Running */ && this._previousDebuggingState !== 2 /* State.Stopped */)) {
                    // Just started debugging, clear the view
                    this.clear();
                    this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                }
                this._previousDebuggingState = e;
                this._onDidChangeStackFrame.fire();
            }));
        }
        layout(dimension) {
            this._disassembledInstructions?.layout(dimension.height);
        }
        async goToInstructionAndOffset(instructionReference, offset, focus) {
            let addr = this._referenceToMemoryAddress.get(instructionReference);
            if (addr === undefined) {
                await this.loadDisassembledInstructions(instructionReference, 0, -DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 2);
                addr = this._referenceToMemoryAddress.get(instructionReference);
            }
            if (addr) {
                this.goToAddress(addr + BigInt(offset), focus);
            }
        }
        /** Gets the address associated with the instruction reference. */
        getReferenceAddress(instructionReference) {
            return this._referenceToMemoryAddress.get(instructionReference);
        }
        /**
         * Go to the address provided. If no address is provided, reveal the address of the currently focused stack frame. Returns false if that address is not available.
         */
        goToAddress(address, focus) {
            if (!this._disassembledInstructions) {
                return false;
            }
            if (!address) {
                return false;
            }
            const index = this.getIndexFromAddress(address);
            if (index >= 0) {
                this._disassembledInstructions.reveal(index);
                if (focus) {
                    this._disassembledInstructions.domFocus();
                    this._disassembledInstructions.setFocus([index]);
                }
                return true;
            }
            return false;
        }
        async scrollUp_LoadDisassembledInstructions(instructionCount) {
            const first = this._disassembledInstructions?.row(0);
            if (first) {
                return this.loadDisassembledInstructions(first.instructionReference, first.instructionReferenceOffset, first.instructionOffset - instructionCount, instructionCount);
            }
            return 0;
        }
        async scrollDown_LoadDisassembledInstructions(instructionCount) {
            const last = this._disassembledInstructions?.row(this._disassembledInstructions?.length - 1);
            if (last) {
                return this.loadDisassembledInstructions(last.instructionReference, last.instructionReferenceOffset, last.instructionOffset + 1, instructionCount);
            }
            return 0;
        }
        /**
         * Sets the memory reference address. We don't just loadDisassembledInstructions
         * for this, since we can't really deal with discontiguous ranges (we can't
         * detect _if_ a range is discontiguous since we don't know how much memory
         * comes between instructions.)
         */
        async primeMemoryReference(instructionReference) {
            if (this._referenceToMemoryAddress.has(instructionReference)) {
                return true;
            }
            const s = await this.debugSession?.disassemble(instructionReference, 0, 0, 1);
            if (s && s.length > 0) {
                try {
                    this._referenceToMemoryAddress.set(instructionReference, BigInt(s[0].address));
                    return true;
                }
                catch {
                    return false;
                }
            }
            return false;
        }
        /** Loads disasembled instructions. Returns the number of instructions that were loaded. */
        async loadDisassembledInstructions(instructionReference, offset, instructionOffset, instructionCount) {
            const session = this.debugSession;
            const resultEntries = await session?.disassemble(instructionReference, offset, instructionOffset, instructionCount);
            // Ensure we always load the baseline instructions so we know what address the instructionReference refers to.
            if (!this._referenceToMemoryAddress.has(instructionReference) && instructionOffset !== 0) {
                await this.loadDisassembledInstructions(instructionReference, 0, 0, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD);
            }
            if (session && resultEntries && this._disassembledInstructions) {
                const newEntries = [];
                let lastLocation;
                let lastLine;
                for (let i = 0; i < resultEntries.length; i++) {
                    const instruction = resultEntries[i];
                    const thisInstructionOffset = instructionOffset + i;
                    // Forward fill the missing location as detailed in the DAP spec.
                    if (instruction.location) {
                        lastLocation = instruction.location;
                        lastLine = undefined;
                    }
                    if (instruction.line) {
                        const currentLine = {
                            startLineNumber: instruction.line,
                            startColumn: instruction.column ?? 0,
                            endLineNumber: instruction.endLine ?? instruction.line,
                            endColumn: instruction.endColumn ?? 0,
                        };
                        // Add location only to the first unique range. This will give the appearance of grouping of instructions.
                        if (!range_1.Range.equalsRange(currentLine, lastLine ?? null)) {
                            lastLine = currentLine;
                            instruction.location = lastLocation;
                        }
                    }
                    let address;
                    try {
                        address = BigInt(instruction.address);
                    }
                    catch {
                        console.error(`Could not parse disassembly address ${instruction.address} (in ${JSON.stringify(instruction)})`);
                        continue;
                    }
                    const entry = {
                        allowBreakpoint: true,
                        isBreakpointSet: false,
                        isBreakpointEnabled: false,
                        instructionReference,
                        instructionReferenceOffset: offset,
                        instructionOffset: thisInstructionOffset,
                        instruction,
                        address,
                    };
                    newEntries.push(entry);
                    // if we just loaded the first instruction for this reference, mark its address.
                    if (offset === 0 && thisInstructionOffset === 0) {
                        this._referenceToMemoryAddress.set(instructionReference, address);
                    }
                }
                if (newEntries.length === 0) {
                    return 0;
                }
                const refBaseAddress = this._referenceToMemoryAddress.get(instructionReference);
                const bps = this._instructionBpList.map(p => {
                    const base = this._referenceToMemoryAddress.get(p.instructionReference);
                    if (!base) {
                        return undefined;
                    }
                    return {
                        enabled: p.enabled,
                        address: base + BigInt(p.offset || 0),
                    };
                });
                if (refBaseAddress !== undefined) {
                    for (const entry of newEntries) {
                        const bp = bps.find(p => p?.address === entry.address);
                        if (bp) {
                            entry.isBreakpointSet = true;
                            entry.isBreakpointEnabled = bp.enabled;
                        }
                    }
                }
                const da = this._disassembledInstructions;
                if (da.length === 1 && this._disassembledInstructions.row(0) === disassemblyNotAvailable) {
                    da.splice(0, 1);
                }
                const firstAddr = newEntries[0].address;
                const lastAddr = newEntries[newEntries.length - 1].address;
                const startN = (0, arrays_1.binarySearch2)(da.length, i => Number(da.row(i).address - firstAddr));
                const start = startN < 0 ? ~startN : startN;
                const endN = (0, arrays_1.binarySearch2)(da.length, i => Number(da.row(i).address - lastAddr));
                const end = endN < 0 ? ~endN : endN + 1;
                const toDelete = end - start;
                // Go through everything we're about to add, and only show the source
                // location if it's different from the previous one, "grouping" instructions by line
                let lastLocated;
                for (let i = start - 1; i >= 0; i--) {
                    const { instruction } = da.row(i);
                    if (instruction.location && instruction.line !== undefined) {
                        lastLocated = instruction;
                        break;
                    }
                }
                const shouldShowLocation = (instruction) => instruction.line !== undefined && instruction.location !== undefined &&
                    (!lastLocated || !(0, debugUtils_1.sourcesEqual)(instruction.location, lastLocated.location) || instruction.line !== lastLocated.line);
                for (const entry of newEntries) {
                    if (shouldShowLocation(entry.instruction)) {
                        entry.showSourceLocation = true;
                        lastLocated = entry.instruction;
                    }
                }
                da.splice(start, toDelete, newEntries);
                return newEntries.length - toDelete;
            }
            return 0;
        }
        getIndexFromReferenceAndOffset(instructionReference, offset) {
            const addr = this._referenceToMemoryAddress.get(instructionReference);
            if (addr === undefined) {
                return -1;
            }
            return this.getIndexFromAddress(addr + BigInt(offset));
        }
        getIndexFromAddress(address) {
            const disassembledInstructions = this._disassembledInstructions;
            if (disassembledInstructions && disassembledInstructions.length > 0) {
                return (0, arrays_1.binarySearch2)(disassembledInstructions.length, index => {
                    const row = disassembledInstructions.row(index);
                    return Number(row.address - address);
                });
            }
            return -1;
        }
        /**
         * Clears the table and reload instructions near the target address
         */
        reloadDisassembly(instructionReference, offset) {
            if (!this._disassembledInstructions) {
                return;
            }
            this._loadingLock = true; // stop scrolling during the load.
            this.clear();
            this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
            this.loadDisassembledInstructions(instructionReference, offset, -DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 4, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 8).then(() => {
                // on load, set the target instruction in the middle of the page.
                if (this._disassembledInstructions.length > 0) {
                    const targetIndex = Math.floor(this._disassembledInstructions.length / 2);
                    this._disassembledInstructions.reveal(targetIndex, 0.5);
                    // Always focus the target address on reload, or arrow key navigation would look terrible
                    this._disassembledInstructions.domFocus();
                    this._disassembledInstructions.setFocus([targetIndex]);
                }
                this._loadingLock = false;
            });
        }
        clear() {
            this._referenceToMemoryAddress.clear();
            this._disassembledInstructions?.splice(0, this._disassembledInstructions.length, [disassemblyNotAvailable]);
        }
    };
    exports.DisassemblyView = DisassemblyView;
    exports.DisassemblyView = DisassemblyView = DisassemblyView_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, debug_1.IDebugService)
    ], DisassemblyView);
    let BreakpointRenderer = class BreakpointRenderer {
        static { BreakpointRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'breakpoint'; }
        constructor(_disassemblyView, _debugService) {
            this._disassemblyView = _disassemblyView;
            this._debugService = _debugService;
            this.templateId = BreakpointRenderer_1.TEMPLATE_ID;
            this._breakpointIcon = 'codicon-' + icons.breakpoint.regular.id;
            this._breakpointDisabledIcon = 'codicon-' + icons.breakpoint.disabled.id;
            this._breakpointHintIcon = 'codicon-' + icons.debugBreakpointHint.id;
            this._debugStackframe = 'codicon-' + icons.debugStackframe.id;
            this._debugStackframeFocused = 'codicon-' + icons.debugStackframeFocused.id;
        }
        renderTemplate(container) {
            // align from the bottom so that it lines up with instruction when source code is present.
            container.style.alignSelf = 'flex-end';
            const icon = (0, dom_1.append)(container, (0, dom_1.$)('.disassembly-view'));
            icon.classList.add('codicon');
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.height = this._disassemblyView.fontInfo.lineHeight + 'px';
            const currentElement = { element: undefined };
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderDebugStackframe(icon, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseover', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        icon.classList.add(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseout', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        icon.classList.remove(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'click', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        // click show hint while waiting for BP to resolve.
                        icon.classList.add(this._breakpointHintIcon);
                        const reference = currentElement.element.instructionReference;
                        const offset = Number(currentElement.element.address - this._disassemblyView.getReferenceAddress(reference));
                        if (currentElement.element.isBreakpointSet) {
                            this._debugService.removeInstructionBreakpoints(reference, offset);
                        }
                        else if (currentElement.element.allowBreakpoint && !currentElement.element.isBreakpointSet) {
                            this._debugService.addInstructionBreakpoint({ instructionReference: reference, offset, address: currentElement.element.address, canPersist: false });
                        }
                    }
                })
            ];
            return { currentElement, icon, disposables };
        }
        renderElement(element, index, templateData, height) {
            templateData.currentElement.element = element;
            this.rerenderDebugStackframe(templateData.icon, element);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderDebugStackframe(icon, element) {
            if (element?.address === this._disassemblyView.focusedCurrentInstructionAddress) {
                icon.classList.add(this._debugStackframe);
            }
            else if (element?.address === this._disassemblyView.focusedInstructionAddress) {
                icon.classList.add(this._debugStackframeFocused);
            }
            else {
                icon.classList.remove(this._debugStackframe);
                icon.classList.remove(this._debugStackframeFocused);
            }
            icon.classList.remove(this._breakpointHintIcon);
            if (element?.isBreakpointSet) {
                if (element.isBreakpointEnabled) {
                    icon.classList.add(this._breakpointIcon);
                    icon.classList.remove(this._breakpointDisabledIcon);
                }
                else {
                    icon.classList.remove(this._breakpointIcon);
                    icon.classList.add(this._breakpointDisabledIcon);
                }
            }
            else {
                icon.classList.remove(this._breakpointIcon);
                icon.classList.remove(this._breakpointDisabledIcon);
            }
        }
    };
    BreakpointRenderer = BreakpointRenderer_1 = __decorate([
        __param(1, debug_1.IDebugService)
    ], BreakpointRenderer);
    let InstructionRenderer = class InstructionRenderer extends lifecycle_1.Disposable {
        static { InstructionRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'instruction'; }
        static { this.INSTRUCTION_ADDR_MIN_LENGTH = 25; }
        static { this.INSTRUCTION_BYTES_MIN_LENGTH = 30; }
        constructor(_disassemblyView, themeService, editorService, textModelService, uriService, logService) {
            super();
            this._disassemblyView = _disassemblyView;
            this.editorService = editorService;
            this.textModelService = textModelService;
            this.uriService = uriService;
            this.logService = logService;
            this.templateId = InstructionRenderer_1.TEMPLATE_ID;
            this._topStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.topStackFrameColor);
            this._focusedStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.focusedStackFrameColor);
            this._register(themeService.onDidColorThemeChange(e => {
                this._topStackFrameColor = e.getColor(callStackEditorContribution_1.topStackFrameColor);
                this._focusedStackFrameColor = e.getColor(callStackEditorContribution_1.focusedStackFrameColor);
            }));
        }
        renderTemplate(container) {
            const sourcecode = (0, dom_1.append)(container, (0, dom_1.$)('.sourcecode'));
            const instruction = (0, dom_1.append)(container, (0, dom_1.$)('.instruction'));
            this.applyFontInfo(sourcecode);
            this.applyFontInfo(instruction);
            const currentElement = { element: undefined };
            const cellDisposable = [];
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderBackground(instruction, sourcecode, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(sourcecode, 'dblclick', () => this.openSourceCode(currentElement.element?.instruction)),
            ];
            return { currentElement, instruction, sourcecode, cellDisposable, disposables };
        }
        renderElement(element, index, templateData, height) {
            this.renderElementInner(element, index, templateData, height);
        }
        async renderElementInner(element, index, templateData, height) {
            templateData.currentElement.element = element;
            const instruction = element.instruction;
            templateData.sourcecode.innerText = '';
            const sb = new stringBuilder_1.StringBuilder(1000);
            if (this._disassemblyView.isSourceCodeRender && element.showSourceLocation && instruction.location?.path && instruction.line !== undefined) {
                const sourceURI = this.getUriFromSource(instruction);
                if (sourceURI) {
                    let textModel = undefined;
                    const sourceSB = new stringBuilder_1.StringBuilder(10000);
                    const ref = await this.textModelService.createModelReference(sourceURI);
                    if (templateData.currentElement.element !== element) {
                        return; // avoid a race, #192831
                    }
                    textModel = ref.object.textEditorModel;
                    templateData.cellDisposable.push(ref);
                    // templateData could have moved on during async.  Double check if it is still the same source.
                    if (textModel && templateData.currentElement.element === element) {
                        let lineNumber = instruction.line;
                        while (lineNumber && lineNumber >= 1 && lineNumber <= textModel.getLineCount()) {
                            const lineContent = textModel.getLineContent(lineNumber);
                            sourceSB.appendString(`  ${lineNumber}: `);
                            sourceSB.appendString(lineContent + '\n');
                            if (instruction.endLine && lineNumber < instruction.endLine) {
                                lineNumber++;
                                continue;
                            }
                            break;
                        }
                        templateData.sourcecode.innerText = sourceSB.build();
                    }
                }
            }
            let spacesToAppend = 10;
            if (instruction.address !== '-1') {
                sb.appendString(instruction.address);
                if (instruction.address.length < InstructionRenderer_1.INSTRUCTION_ADDR_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer_1.INSTRUCTION_ADDR_MIN_LENGTH - instruction.address.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendString(' ');
                }
            }
            if (instruction.instructionBytes) {
                sb.appendString(instruction.instructionBytes);
                spacesToAppend = 10;
                if (instruction.instructionBytes.length < InstructionRenderer_1.INSTRUCTION_BYTES_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer_1.INSTRUCTION_BYTES_MIN_LENGTH - instruction.instructionBytes.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendString(' ');
                }
            }
            sb.appendString(instruction.instruction);
            templateData.instruction.innerText = sb.build();
            this.rerenderBackground(templateData.instruction, templateData.sourcecode, element);
        }
        disposeElement(element, index, templateData, height) {
            (0, lifecycle_1.dispose)(templateData.cellDisposable);
            templateData.cellDisposable = [];
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderBackground(instruction, sourceCode, element) {
            if (element && this._disassemblyView.currentInstructionAddresses.includes(element.address)) {
                instruction.style.background = this._topStackFrameColor?.toString() || 'transparent';
            }
            else if (element?.address === this._disassemblyView.focusedInstructionAddress) {
                instruction.style.background = this._focusedStackFrameColor?.toString() || 'transparent';
            }
            else {
                instruction.style.background = 'transparent';
            }
        }
        openSourceCode(instruction) {
            if (instruction) {
                const sourceURI = this.getUriFromSource(instruction);
                const selection = instruction.endLine ? {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.endLine,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                } : {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.line,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                };
                this.editorService.openEditor({
                    resource: sourceURI,
                    description: (0, nls_1.localize)('editorOpenedFromDisassemblyDescription', "from disassembly"),
                    options: {
                        preserveFocus: false,
                        selection: selection,
                        revealIfOpened: true,
                        selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */,
                        pinned: false,
                    }
                });
            }
        }
        getUriFromSource(instruction) {
            // Try to resolve path before consulting the debugSession.
            const path = instruction.location.path;
            if (path && (0, debugUtils_1.isUri)(path)) { // path looks like a uri
                return this.uriService.asCanonicalUri(uri_1.URI.parse(path));
            }
            // assume a filesystem path
            if (path && (0, path_1.isAbsolute)(path)) {
                return this.uriService.asCanonicalUri(uri_1.URI.file(path));
            }
            return (0, debugSource_1.getUriFromSource)(instruction.location, instruction.location.path, this._disassemblyView.debugSession.getId(), this.uriService, this.logService);
        }
        applyFontInfo(element) {
            (0, domFontInfo_1.applyFontInfo)(element, this._disassemblyView.fontInfo);
            element.style.whiteSpace = 'pre';
        }
    };
    InstructionRenderer = InstructionRenderer_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, editorService_1.IEditorService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, log_1.ILogService)
    ], InstructionRenderer);
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('disassemblyView', "Disassembly View");
        }
        getAriaLabel(element) {
            let label = '';
            const instruction = element.instruction;
            if (instruction.address !== '-1') {
                label += `${(0, nls_1.localize)('instructionAddress', "Address")}: ${instruction.address}`;
            }
            if (instruction.instructionBytes) {
                label += `, ${(0, nls_1.localize)('instructionBytes', "Bytes")}: ${instruction.instructionBytes}`;
            }
            label += `, ${(0, nls_1.localize)(`instructionText`, "Instruction")}: ${instruction.instruction}`;
            return label;
        }
    }
    let DisassemblyViewContribution = class DisassemblyViewContribution {
        constructor(editorService, debugService, contextKeyService) {
            contextKeyService.bufferChangeEvents(() => {
                this._languageSupportsDisassembleRequest = debug_1.CONTEXT_LANGUAGE_SUPPORTS_DISASSEMBLE_REQUEST.bindTo(contextKeyService);
            });
            const onDidActiveEditorChangeListener = () => {
                if (this._onDidChangeModelLanguage) {
                    this._onDidChangeModelLanguage.dispose();
                    this._onDidChangeModelLanguage = undefined;
                }
                const activeTextEditorControl = editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    const language = activeTextEditorControl.getModel()?.getLanguageId();
                    // TODO: instead of using idDebuggerInterestedInLanguage, have a specific ext point for languages
                    // support disassembly
                    this._languageSupportsDisassembleRequest?.set(!!language && debugService.getAdapterManager().someDebuggerInterestedInLanguage(language));
                    this._onDidChangeModelLanguage = activeTextEditorControl.onDidChangeModelLanguage(e => {
                        this._languageSupportsDisassembleRequest?.set(debugService.getAdapterManager().someDebuggerInterestedInLanguage(e.newLanguage));
                    });
                }
                else {
                    this._languageSupportsDisassembleRequest?.set(false);
                }
            };
            onDidActiveEditorChangeListener();
            this._onDidActiveEditorChangeListener = editorService.onDidActiveEditorChange(onDidActiveEditorChangeListener);
        }
        dispose() {
            this._onDidActiveEditorChangeListener.dispose();
            this._onDidChangeModelLanguage?.dispose();
        }
    };
    exports.DisassemblyViewContribution = DisassemblyViewContribution;
    exports.DisassemblyViewContribution = DisassemblyViewContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, debug_1.IDebugService),
        __param(2, contextkey_1.IContextKeyService)
    ], DisassemblyViewContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzYXNzZW1ibHlWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kaXNhc3NlbWJseVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThEaEcsa0VBQWtFO0lBQ2xFLE1BQU0sdUJBQXVCLEdBQWtDO1FBQzlELGVBQWUsRUFBRSxLQUFLO1FBQ3RCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLG1CQUFtQixFQUFFLEtBQUs7UUFDMUIsb0JBQW9CLEVBQUUsRUFBRTtRQUN4QixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLDBCQUEwQixFQUFFLENBQUM7UUFDN0IsT0FBTyxFQUFFLEVBQUU7UUFDWCxXQUFXLEVBQUU7WUFDWixPQUFPLEVBQUUsSUFBSTtZQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSw0QkFBNEIsQ0FBQztTQUM5RTtLQUNELENBQUM7SUFFSyxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHVCQUFVOztpQkFFdEIsNkJBQXdCLEdBQUcsRUFBRSxBQUFMLENBQU07UUFZdEQsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN6QixjQUErQixFQUN6QixxQkFBNkQsRUFDN0QscUJBQTZELEVBQ3JFLGFBQTZDO1lBRTVELEtBQUssQ0FBQywyQkFBbUIsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBSjFDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQVpyRCx1QkFBa0IsR0FBc0MsRUFBRSxDQUFDO1lB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