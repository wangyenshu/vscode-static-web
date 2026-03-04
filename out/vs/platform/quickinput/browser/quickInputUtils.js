/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/common/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/idGenerator", "vs/base/common/linkedText", "vs/nls", "vs/css!./media/quickInput"], function (require, exports, dom, event_1, event_2, keyboardEvent_1, touch_1, iconLabels_1, idGenerator_1, linkedText_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.quickInputButtonToAction = quickInputButtonToAction;
    exports.renderQuickInputDescription = renderQuickInputDescription;
    const iconPathToClass = {};
    const iconClassGenerator = new idGenerator_1.IdGenerator('quick-input-button-icon-');
    function getIconClass(iconPath) {
        if (!iconPath) {
            return undefined;
        }
        let iconClass;
        const key = iconPath.dark.toString();
        if (iconPathToClass[key]) {
            iconClass = iconPathToClass[key];
        }
        else {
            iconClass = iconClassGenerator.nextId();
            dom.createCSSRule(`.${iconClass}, .hc-light .${iconClass}`, `background-image: ${dom.asCSSUrl(iconPath.light || iconPath.dark)}`);
            dom.createCSSRule(`.vs-dark .${iconClass}, .hc-black .${iconClass}`, `background-image: ${dom.asCSSUrl(iconPath.dark)}`);
            iconPathToClass[key] = iconClass;
        }
        return iconClass;
    }
    function quickInputButtonToAction(button, id, run) {
        let cssClasses = button.iconClass || getIconClass(button.iconPath);
        if (button.alwaysVisible) {
            cssClasses = cssClasses ? `${cssClasses} always-visible` : 'always-visible';
        }
        return {
            id,
            label: '',
            tooltip: button.tooltip || '',
            class: cssClasses,
            enabled: true,
            run
        };
    }
    function renderQuickInputDescription(description, container, actionHandler) {
        dom.reset(container);
        const parsed = (0, linkedText_1.parseLinkedText)(description);
        let tabIndex = 0;
        for (const node of parsed.nodes) {
            if (typeof node === 'string') {
                container.append(...(0, iconLabels_1.renderLabelWithIcons)(node));
            }
            else {
                let title = node.title;
                if (!title && node.href.startsWith('command:')) {
                    title = (0, nls_1.localize)('executeCommand', "Click to execute command '{0}'", node.href.substring('command:'.length));
                }
                else if (!title) {
                    title = node.href;
                }
                const anchor = dom.$('a', { href: node.href, title, tabIndex: tabIndex++ }, node.label);
                anchor.style.textDecoration = 'underline';
                const handleOpen = (e) => {
                    if (dom.isEventLike(e)) {
                        dom.EventHelper.stop(e, true);
                    }
                    actionHandler.callback(node.href);
                };
                const onClick = actionHandler.disposables.add(new event_1.DomEmitter(anchor, dom.EventType.CLICK)).event;
                const onKeydown = actionHandler.disposables.add(new event_1.DomEmitter(anchor, dom.EventType.KEY_DOWN)).event;
                const onSpaceOrEnter = event_2.Event.chain(onKeydown, $ => $.filter(e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    return event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */);
                }));
                actionHandler.disposables.add(touch_1.Gesture.addTarget(anchor));
                const onTap = actionHandler.disposables.add(new event_1.DomEmitter(anchor, touch_1.EventType.Tap)).event;
                event_2.Event.any(onClick, onTap, onSpaceOrEnter)(handleOpen, null, actionHandler.disposables);
                container.appendChild(anchor);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC9icm93c2VyL3F1aWNrSW5wdXRVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdDaEcsNERBY0M7SUFFRCxrRUF5Q0M7SUEvRUQsTUFBTSxlQUFlLEdBQTJCLEVBQUUsQ0FBQztJQUNuRCxNQUFNLGtCQUFrQixHQUFHLElBQUkseUJBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXZFLFNBQVMsWUFBWSxDQUFDLFFBQWdEO1FBQ3JFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNmLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxJQUFJLFNBQWlCLENBQUM7UUFFdEIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQyxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFCLFNBQVMsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQzthQUFNLENBQUM7WUFDUCxTQUFTLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLFNBQVMsZ0JBQWdCLFNBQVMsRUFBRSxFQUFFLHFCQUFxQixHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsSSxHQUFHLENBQUMsYUFBYSxDQUFDLGFBQWEsU0FBUyxnQkFBZ0IsU0FBUyxFQUFFLEVBQUUscUJBQXFCLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMs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