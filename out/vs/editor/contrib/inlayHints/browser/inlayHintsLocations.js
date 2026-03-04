/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/goToCommands", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification"], function (require, exports, dom, actions_1, cancellation_1, uuid_1, range_1, resolverService_1, goToCommands_1, peekView_1, actions_2, commands_1, contextkey_1, contextView_1, instantiation_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showGoToContextMenu = showGoToContextMenu;
    exports.goToDefinitionWithLocation = goToDefinitionWithLocation;
    async function showGoToContextMenu(accessor, editor, anchor, part) {
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const commandService = accessor.get(commands_1.ICommandService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const notificationService = accessor.get(notification_1.INotificationService);
        await part.item.resolve(cancellation_1.CancellationToken.None);
        if (!part.part.location) {
            return;
        }
        const location = part.part.location;
        const menuActions = [];
        // from all registered (not active) context menu actions select those
        // that are a symbol navigation actions
        const filter = new Set(actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.EditorContext)
            .map(item => (0, actions_2.isIMenuItem)(item) ? item.command.id : (0, uuid_1.generateUuid)()));
        for (const delegate of goToCommands_1.SymbolNavigationAction.all()) {
            if (filter.has(delegate.desc.id)) {
                menuActions.push(new actions_1.Action(delegate.desc.id, actions_2.MenuItemAction.label(delegate.desc, { renderShortTitle: true }), undefined, true, async () => {
                    const ref = await resolverService.createModelReference(location.uri);
                    try {
                        const symbolAnchor = new goToCommands_1.SymbolNavigationAnchor(ref.object.textEditorModel, range_1.Range.getStartPosition(location.range));
                        const range = part.item.anchor.range;
                        await instaService.invokeFunction(delegate.runEditorCommand.bind(delegate), editor, symbolAnchor, range);
                    }
                    finally {
                        ref.dispose();
                    }
                }));
            }
        }
        if (part.part.command) {
            const { command } = part.part;
            menuActions.push(new actions_1.Separator());
            menuActions.push(new actions_1.Action(command.id, command.title, undefined, true, async () => {
                try {
                    await commandService.executeCommand(command.id, ...(command.arguments ?? []));
                }
                catch (err) {
                    notificationService.notify({
                        severity: notification_1.Severity.Error,
                        source: part.item.provider.displayName,
                        message: err
                    });
                }
            }));
        }
        // show context menu
        const useShadowDOM = editor.getOption(127 /* EditorOption.useShadowDOM */);
        contextMenuService.showContextMenu({
            domForShadowRoot: useShadowDOM ? editor.getDomNode() ?? undefined : undefined,
            getAnchor: () => {
                const box = dom.getDomNodePagePosition(anchor);
                return { x: box.left, y: box.top + box.height + 8 };
            },
            getActions: () => menuActions,
            onHide: () => {
                editor.focus();
            },
            autoSelectFirstItem: true,
        });
    }
    async function goToDefinitionWithLocation(accessor, event, editor, location) {
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const ref = await resolverService.createModelReference(location.uri);
        await editor.invokeWithinContext(async (accessor) => {
            const openToSide = event.hasSideBySideModifier;
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const isInPeek = peekView_1.PeekContext.inPeekEditor.getValue(contextKeyService);
            const canPeek = !openToSide && editor.getOption(88 /* EditorOption.definitionLinkOpensInPeek */) && !isInPeek;
            const action = new goToCommands_1.DefinitionAction({ openToSide, openInPeek: canPeek, muteMessage: true }, { title: { value: '', original: '' }, id: '', precondition: undefined });
            return action.run(accessor, new goToCommands_1.SymbolNavigationAnchor(ref.object.textEditorModel, range_1.Range.getStartPosition(location.range)), range_1.Range.lift(location.range));
        });
        ref.dispose();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0xvY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGF5SGludHMvYnJvd3Nlci9pbmxheUhpbnRzTG9jYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxrREFxRUM7SUFFRCxnRUFrQkM7SUF6Rk0sS0FBSyxVQUFVLG1CQUFtQixDQUFDLFFBQTBCLEVBQUUsTUFBbUIsRUFBRSxNQUFtQixFQUFFLElBQWdDO1FBRS9JLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQWlCLENBQUMsQ0FBQztRQUN4RCxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztRQUM3RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztRQUNyRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFDekQsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUM7UUFFL0QsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVoRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN6QixPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQzlDLE1BQU0sV0FBVyxHQUFjLEVBQUUsQ0FBQztRQUVsQyxxRUFBcUU7UUFDckUsdUNBQXVDO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxD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