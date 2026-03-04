/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets", "vs/platform/quickinput/common/quickInput", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event"], function (require, exports, nls, snippets_1, quickInput_1, codicons_1, themables_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pickSnippet = pickSnippet;
    async function pickSnippet(accessor, languageIdOrSnippets) {
        const snippetService = accessor.get(snippets_1.ISnippetsService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        let snippets;
        if (Array.isArray(languageIdOrSnippets)) {
            snippets = languageIdOrSnippets;
        }
        else {
            snippets = (await snippetService.getSnippets(languageIdOrSnippets, { includeDisabledSnippets: true, includeNoPrefixSnippets: true }));
        }
        snippets.sort((a, b) => a.snippetSource - b.snippetSource);
        const makeSnippetPicks = () => {
            const result = [];
            let prevSnippet;
            for (const snippet of snippets) {
                const pick = {
                    label: snippet.prefix || snippet.name,
                    detail: snippet.description || snippet.body,
                    snippet
                };
                if (!prevSnippet || prevSnippet.snippetSource !== snippet.snippetSource || prevSnippet.source !== snippet.source) {
                    let label = '';
                    switch (snippet.snippetSource) {
                        case 1 /* SnippetSource.User */:
                            label = nls.localize('sep.userSnippet', "User Snippets");
                            break;
                        case 3 /* SnippetSource.Extension */:
                            label = snippet.source;
                            break;
                        case 2 /* SnippetSource.Workspace */:
                            label = nls.localize('sep.workspaceSnippet', "Workspace Snippets");
                            break;
                    }
                    result.push({ type: 'separator', label });
                }
                if (snippet.snippetSource === 3 /* SnippetSource.Extension */) {
                    const isEnabled = snippetService.isEnabled(snippet);
                    if (isEnabled) {
                        pick.buttons = [{
                                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eyeClosed),
                                tooltip: nls.localize('disableSnippet', 'Hide from IntelliSense')
                            }];
                    }
                    else {
                        pick.description = nls.localize('isDisabled', "(hidden from IntelliSense)");
                        pick.buttons = [{
                                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eye),
                                tooltip: nls.localize('enable.snippet', 'Show in IntelliSense')
                            }];
                    }
                }
                result.push(pick);
                prevSnippet = snippet;
            }
            return result;
        };
        const picker = quickInputService.createQuickPick();
        picker.placeholder = nls.localize('pick.placeholder', "Select a snippet");
        picker.matchOnDetail = true;
        picker.ignoreFocusOut = false;
        picker.keepScrollPosition = true;
        picker.onDidTriggerItemButton(ctx => {
            const isEnabled = snippetService.isEnabled(ctx.item.snippet);
            snippetService.updateEnablement(ctx.item.snippet, !isEnabled);
            picker.items = makeSnippetPicks();
        });
        picker.items = makeSnippetPicks();
        if (!picker.items.length) {
            picker.validationMessage = nls.localize('pick.noSnippetAvailable', "No snippet available");
        }
        picker.show();
        // wait for an item to be picked or the picker to become hidden
        await Promise.race([event_1.Event.toPromise(picker.onDidAccept), event_1.Event.toPromise(picker.onDidHide)]);
        const result = picker.selectedItems[0]?.snippet;
        picker.dispose();
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvc25pcHBldFBpY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxrQ0FzRkM7SUF0Rk0sS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUEwQixFQUFFLG9CQUF3QztRQUVyRyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDdEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFNM0QsSUFBSSxRQUFtQixDQUFDO1FBQ3hCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7WUFDekMsUUFBUSxHQUFHLG9CQUFvQixDQUFDO1FBQ2pDLENBQUM7YUFBTSxDQUFDO1lBQ1AsUUFBUSxHQUFHLENBQUMsTUFBTSxjQUFjLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2SSxDQUFDO1FBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTNELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxFQUFFO1lBQzdCLE1BQU0sTUFBTSxHQUFtQyxFQUFFLENBQUM7WUFDbEQsSUFBSSxXQUFnQyxDQUFDO1lBQ3JDLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0s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