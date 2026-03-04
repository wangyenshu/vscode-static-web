/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "./viewsWelcomeExtensionPoint", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls, lifecycle_1, contextkey_1, viewsWelcomeExtensionPoint_1, platform_1, views_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsWelcomeContribution = void 0;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    class ViewsWelcomeContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint) {
            super();
            this.viewWelcomeContents = new Map();
            extensionPoint.setHandler((_, { added, removed }) => {
                for (const contribution of removed) {
                    for (const welcome of contribution.value) {
                        const disposable = this.viewWelcomeContents.get(welcome);
                        disposable?.dispose();
                    }
                }
                const welcomesByViewId = new Map();
                for (const contribution of added) {
                    for (const welcome of contribution.value) {
                        const { group, order } = parseGroupAndOrder(welcome, contribution);
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(welcome.enablement);
                        const id = viewsWelcomeExtensionPoint_1.ViewIdentifierMap[welcome.view] ?? welcome.view;
                        let viewContentMap = welcomesByViewId.get(id);
                        if (!viewContentMap) {
                            viewContentMap = new Map();
                            welcomesByViewId.set(id, viewContentMap);
                        }
                        viewContentMap.set(welcome, {
                            content: welcome.contents,
                            when: contextkey_1.ContextKeyExpr.deserialize(welcome.when),
                            precondition,
                            group,
                            order
                        });
                    }
                }
                for (const [id, viewContentMap] of welcomesByViewId) {
                    const disposables = viewsRegistry.registerViewWelcomeContent2(id, viewContentMap);
                    for (const [welcome, disposable] of disposables) {
                        this.viewWelcomeContents.set(welcome, disposable);
                    }
                }
            });
        }
    }
    exports.ViewsWelcomeContribution = ViewsWelcomeContribution;
    function parseGroupAndOrder(welcome, contribution) {
        let group;
        let order;
        if (welcome.group) {
            if (!(0, extensions_1.isProposedApiEnabled)(contribution.description, 'contribViewsWelcome')) {
                contribution.collector.warn(nls.localize('ViewsWelcomeExtensionPoint.proposedAPI', "The viewsWelcome contribution in '{0}' requires 'enabledApiProposals: [\"contribViewsWelcome\"]' in order to use the 'group' proposed property.", contribution.description.identifier.value));
                return { group, order };
            }
            const idx = welcome.group.lastIndexOf('@');
            if (idx > 0) {
                group = welcome.group.substr(0, idx);
                order = Number(welcome.group.substr(idx + 1)) || undefined;
            }
            else {
                group = welcome.group;
            }
        }
        return { group, order };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NXZWxjb21lQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZVZpZXdzL2NvbW1vbi92aWV3c1dlbGNvbWVDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV6RixNQUFhLHdCQUF5QixTQUFRLHNCQUFVO1FBSXZELFlBQVksY0FBMkQ7WUFDdEUsS0FBSyxFQUFFLENBQUM7WUFIRCx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBNEIsQ0FBQztZQUtqRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ25ELEtBQUssTUFBTSxZQUFZLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3BDLEtBQUssTUFBTSxPQUFPLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUV6RCxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQ3ZCLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFvRCxDQUFDO2dCQUVyRixLQUFLLE1BQU0sWUFBWSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNsQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDMUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxr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