/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, nls_1, actions_1, configuration_1, configurationRegistry_1, contextkey_1, platform_1, contextkeys_1, coreActions_1, notebookContextKeys_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellEditorOptions = void 0;
    //todo@Yoyokrazy implenets is needed or not?
    class CellEditorOptions extends cellPart_1.CellContentPart {
        set tabSize(value) {
            if (this._tabSize !== value) {
                this._tabSize = value;
                this._onDidChange.fire();
            }
        }
        get tabSize() {
            return this._tabSize;
        }
        set indentSize(value) {
            if (this._indentSize !== value) {
                this._indentSize = value;
                this._onDidChange.fire();
            }
        }
        get indentSize() {
            return this._indentSize;
        }
        set insertSpaces(value) {
            if (this._insertSpaces !== value) {
                this._insertSpaces = value;
                this._onDidChange.fire();
            }
        }
        get insertSpaces() {
            return this._insertSpaces;
        }
        constructor(base, notebookOptions, configurationService) {
            super();
            this.base = base;
            this.notebookOptions = notebookOptions;
            this.configurationService = configurationService;
            this._lineNumbers = 'inherit';
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(base.onDidChange(() => {
                this._recomputeOptions();
            }));
            this._value = this._computeEditorOptions();
        }
        updateState(element, e) {
            if (e.cellLineNumberChanged) {
                this.setLineNumbers(element.lineNumbers);
            }
        }
        _recomputeOptions() {
            this._value = this._computeEditorOptions();
            this._onDidChange.fire();
        }
        _computeEditorOptions() {
            const value = this.base.value; // base IEditorOptions
            // TODO @Yoyokrazy find a different way to get the editor overrides, this is not the right way
            const cellEditorOverridesRaw = this.notebookOptions.getDisplayOptions().editorOptionsCustomizations;
            const indentSize = cellEditorOverridesRaw?.['editor.indentSize'];
            if (indentSize !== undefined) {
                this.indentSize = indentSize;
            }
            const insertSpaces = cellEditorOverridesRaw?.['editor.insertSpaces'];
            if (insertSpaces !== undefined) {
                this.insertSpaces = insertSpaces;
            }
            const tabSize = cellEditorOverridesRaw?.['editor.tabSize'];
            if (tabSize !== undefined) {
                this.tabSize = tabSize;
            }
            let cellRenderLineNumber = value.lineNumbers;
            switch (this._lineNumbers) {
                case 'inherit':
                    // inherit from the notebook setting
                    if (this.configurationService.getValue('notebook.lineNumbers') === 'on') {
                        if (value.lineNumbers === 'off') {
                            cellRenderLineNumber = 'on';
                        } // otherwise just use the editor setting
                    }
                    else {
                        cellRenderLineNumber = 'off';
                    }
                    break;
                case 'on':
                    // should turn on, ignore the editor line numbers off options
                    if (value.lineNumbers === 'off') {
                        cellRenderLineNumber = 'on';
                    } // otherwise just use the editor setting
                    break;
                case 'off':
                    cellRenderLineNumber = 'off';
                    break;
            }
            if (value.lineNumbers !== cellRenderLineNumber) {
                return {
                    ...value,
                    ...{ lineNumbers: cellRenderLineNumber }
                };
            }
            else {
                return Object.assign({}, value);
            }
        }
        getUpdatedValue(internalMetadata, cellUri) {
            const options = this.getValue(internalMetadata, cellUri);
            delete options.hover; // This is toggled by a debug editor contribution
            return options;
        }
        getValue(internalMetadata, cellUri) {
            return {
                ...this._value,
                ...{
                    padding: this.notebookOptions.computeEditorPadding(internalMetadata, cellUri)
                }
            };
        }
        getDefaultValue() {
            return {
                ...this._value,
                ...{
                    padding: { top: 12, bottom: 12 }
                }
            };
        }
        setLineNumbers(lineNumbers) {
            this._lineNumbers = lineNumbers;
            this._recomputeOptions();
        }
    }
    exports.CellEditorOptions = CellEditorOptions;
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.lineNumbers': {
                type: 'string',
                enum: ['off', 'on'],
                default: 'off',
                markdownDescription: (0, nls_1.localize)('notebook.lineNumbers', "Controls the display of line numbers in the cell editor.")
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbers',
                title: (0, nls_1.localize2)('notebook.toggleLineNumbers', 'Toggle Notebook Line Numbers'),
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: (0, nls_1.localize)('notebook.showLineNumbers', "Notebook Line Numbers"),
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const renderLiNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            if (renderLiNumbers) {
                configurationService.updateValue('notebook.lineNumbers', 'off');
            }
            else {
                configurationService.updateValue('notebook.lineNumbers', 'on');
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleActiveLineNumberAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: 'notebook.cell.toggleLineNumbers',
                title: (0, nls_1.localize)('notebook.cell.toggleLineNumbers.title', "Show Cell Line Numbers"),
                precondition: contextkeys_1.ActiveEditorContext.isEqualTo(notebookCommon_1.NOTEBOOK_EDITOR_ID),
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                toggled: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('on'), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('inherit'), contextkey_1.ContextKeyExpr.equals('config.notebook.lineNumbers', 'on')))
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                this.updateCell(accessor.get(configuration_1.IConfigurationService), context.cell);
            }
            else {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                context.selectedCells.forEach(cell => {
                    this.updateCell(configurationService, cell);
                });
            }
        }
        updateCell(configurationService, cell) {
            const renderLineNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            const cellLineNumbers = cell.lineNumbers;
            // 'on', 'inherit' 	-> 'on'
            // 'on', 'off'		-> 'off'
            // 'on', 'on'		-> 'on'
            // 'off', 'inherit'	-> 'off'
            // 'off', 'off'		-> 'off'
            // 'off', 'on'		-> 'on'
            const currentLineNumberIsOn = cellLineNumbers === 'on' || (cellLineNumbers === 'inherit' && renderLineNumbers);
            if (currentLineNumberIsOn) {
                cell.lineNumbers = 'off';
            }
            else {
                cell.lineNumbers = 'on';
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXRvck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxFZGl0b3JPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCaEcsNENBQTRDO0lBQzVDLE1BQWEsaUJBQWtCLFNBQVEsMEJBQWU7UUFNckQsSUFBSSxPQUFPLENBQUMsS0FBeUI7WUFDcEMsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxVQUFVLENBQUMsS0FBcUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBSSxZQUFZLENBQUMsS0FBMEI7WUFDMUMsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZ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