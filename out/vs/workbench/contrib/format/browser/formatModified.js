/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/model", "vs/editor/common/services/editorWorker", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/format", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/scm/browser/dirtydiffDecorator", "vs/workbench/contrib/scm/common/quickDiff"], function (require, exports, arrays_1, cancellation_1, editorExtensions_1, range_1, editorContextKeys_1, model_1, editorWorker_1, resolverService_1, format_1, nls, contextkey_1, instantiation_1, progress_1, dirtydiffDecorator_1, quickDiff_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getModifiedRanges = getModifiedRanges;
    (0, editorExtensions_1.registerEditorAction)(class FormatModifiedAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatChanges',
                label: nls.localize('formatChanges', "Format Modified Lines"),
                alias: 'Format Modified Lines',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
            });
        }
        async run(accessor, editor) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (!editor.hasModel()) {
                return;
            }
            const ranges = await instaService.invokeFunction(getModifiedRanges, editor.getModel());
            if ((0, arrays_1.isNonEmptyArray)(ranges)) {
                return instaService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, editor, ranges, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true);
            }
        }
    });
    async function getModifiedRanges(accessor, modified) {
        const quickDiffService = accessor.get(quickDiff_1.IQuickDiffService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const original = await (0, dirtydiffDecorator_1.getOriginalResource)(quickDiffService, modified.uri, modified.getLanguageId(), (0, model_1.shouldSynchronizeModel)(modified));
        if (!original) {
            return null; // let undefined signify no changes, null represents no source control (there's probably a better way, but I can't think of one rn)
        }
        const ranges = [];
        const ref = await modelService.createModelReference(original);
        try {
            if (!workerService.canComputeDirtyDiff(original, modified.uri)) {
                return undefined;
            }
            const changes = await workerService.computeDirtyDiff(original, modified.uri, false);
            if (!(0, arrays_1.isNonEmptyArray)(changes)) {
                return undefined;
            }
            for (const change of changes) {
                ranges.push(modified.validateRange(new range_1.Range(change.modifiedStartLineNumber, 1, change.modifiedEndLineNumber || change.modifiedStartLineNumber /*endLineNumber is 0 when things got deleted*/, Number.MAX_SAFE_INTEGER)));
            }
        }
        finally {
            ref.dispose();
        }
        return ranges;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0TW9kaWZpZWQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9mb3JtYXQvYnJvd3Nlci9mb3JtYXRNb2RpZmllZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlEaEcsOENBK0JDO0lBN0RELElBQUEsdUNBQW9CLEVBQUMsTUFBTSxvQkFBcUIsU0FBUSwrQkFBWTtRQUVuRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNkJBQTZCO2dCQUNqQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsdUJBQXVCLENBQUM7Z0JBQzdELEtBQUssRUFBRSx1QkFBdUI7Z0JBQzlCLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxxQ0FBaUIsQ0FBQyxRQUFRLEVBQUUscUNBQWlCLENBQUMsc0NBQXNDLENBQUM7YUFDdEgsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN4RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFFekQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN2RixJQUFJLElBQUEsd0JBQWUsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPLFlBQVksQ0FBQyxjQUFjLENBQ2pDLGlEQUF3QyxFQUFFLE1BQU0sRUFBRSxNQUFNLG1DQUMvQixtQkFBUSxDQUFDLElBQUksRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLEVBQzlELElBQUksQ0FDSixDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFHSSxLQUFLLFVBQVUsaUJBQWlCLENBQUMsUUFBMEIsRUFBRSxRQUFvQjtRQUN2RixNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNkJBQWlCLENBQUMsQ0FBQztRQUN6RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUM7UUFDekQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBaUIsQ0FBQyxDQUFDO1FBRXJELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSx3Q0FBbUIsRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFBLDhCQUFzQixFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDdkksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUMsQ0FBQyxtSUFBbUk7UUFDakosQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFZLEVBQUUsQ0FBQztRQUMzQixNQUFNLEdBQUcsR0FBRyxNQUFNLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUM7WUFDSixJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEUsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sYUFBYSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQyxJQUFBLHdCQUFlLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQUssQ0FDM0MsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsRUFDakMsTUFBTSxDQUFDLHFCQUFxQixJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyw4Q0FBOEMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FDdkksQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7Z0JBQVMsQ0FBQztZQUNWLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==