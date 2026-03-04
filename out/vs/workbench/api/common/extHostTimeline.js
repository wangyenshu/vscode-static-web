/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/platform/extensions/common/extensions", "vs/base/common/types"], function (require, exports, uri_1, instantiation_1, extHost_protocol_1, lifecycle_1, extHostTypes_1, extHostTypeConverters_1, extensions_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTimeline = exports.IExtHostTimeline = void 0;
    exports.IExtHostTimeline = (0, instantiation_1.createDecorator)('IExtHostTimeline');
    class ExtHostTimeline {
        constructor(mainContext, commands) {
            this._providers = new Map();
            this._itemsBySourceAndUriMap = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTimeline);
            commands.registerArgumentProcessor({
                processArgument: (arg, extension) => {
                    if (arg && arg.$mid === 12 /* MarshalledId.TimelineActionContext */) {
                        if (this._providers.get(arg.source) && extensions_1.ExtensionIdentifier.equals(extension, this._providers.get(arg.source)?.extension)) {
                            const uri = arg.uri === undefined ? undefined : uri_1.URI.revive(arg.uri);
                            return this._itemsBySourceAndUriMap.get(arg.source)?.get(getUriKey(uri))?.get(arg.handle);
                        }
                        else {
                            return undefined;
                        }
                    }
                    return arg;
                }
            });
        }
        async $getTimeline(id, uri, options, token) {
            const item = this._providers.get(id);
            return item?.provider.provideTimeline(uri_1.URI.revive(uri), options, token);
        }
        registerTimelineProvider(scheme, provider, extensionId, commandConverter) {
            const timelineDisposables = new lifecycle_1.DisposableStore();
            const convertTimelineItem = this.convertTimelineItem(provider.id, commandConverter, timelineDisposables).bind(this);
            let disposable;
            if (provider.onDidChange) {
                disposable = provider.onDidChange(e => this._proxy.$emitTimelineChangeEvent({ uri: undefined, reset: true, ...e, id: provider.id }), this);
            }
            const itemsBySourceAndUriMap = this._itemsBySourceAndUriMap;
            return this.registerTimelineProviderCore({
                ...provider,
                scheme: scheme,
                onDidChange: undefined,
                async provideTimeline(uri, options, token) {
                    if (options?.resetCache) {
                        timelineDisposables.clear();
                        // For now, only allow the caching of a single Uri
                        // itemsBySourceAndUriMap.get(provider.id)?.get(getUriKey(uri))?.clear();
                        itemsBySourceAndUriMap.get(provider.id)?.clear();
                    }
                    const result = await provider.provideTimeline(uri, options, token);
                    if (result === undefined || result === null) {
                        return undefined;
                    }
                    // TODO: Should we bother converting all the data if we aren't caching? Meaning it is being requested by an extension?
                    const convertItem = convertTimelineItem(uri, options);
                    return {
                        ...result,
                        source: provider.id,
                        items: result.items.map(convertItem)
                    };
                },
                dispose() {
                    for (const sourceMap of itemsBySourceAndUriMap.values()) {
                        sourceMap.get(provider.id)?.clear();
                    }
                    disposable?.dispose();
                    timelineDisposables.dispose();
                }
            }, extensionId);
        }
        convertTimelineItem(source, commandConverter, disposables) {
            return (uri, options) => {
                let items;
                if (options?.cacheResults) {
                    let itemsByUri = this._itemsBySourceAndUriMap.get(source);
                    if (itemsByUri === undefined) {
                        itemsByUri = new Map();
                        this._itemsBySourceAndUriMap.set(source, itemsByUri);
                    }
                    const uriKey = getUriKey(uri);
                    items = itemsByUri.get(uriKey);
                    if (items === undefined) {
                        items = new Map();
                        itemsByUri.set(uriKey, items);
                    }
                }
                return (item) => {
                    const { iconPath, ...props } = item;
                    const handle = `${source}|${item.id ?? item.timestamp}`;
                    items?.set(handle, item);
                    let icon;
                    let iconDark;
                    let themeIcon;
                    if (item.iconPath) {
                        if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                            themeIcon = { id: iconPath.id, color: iconPath.color };
                        }
                        else if (uri_1.URI.isUri(iconPath)) {
                            icon = iconPath;
                            iconDark = iconPath;
                        }
                        else {
                            ({ light: icon, dark: iconDark } = iconPath);
                        }
                    }
                    let tooltip;
                    if (extHostTypes_1.MarkdownString.isMarkdownString(props.tooltip)) {
                        tooltip = extHostTypeConverters_1.MarkdownString.from(props.tooltip);
                    }
                    else if ((0, types_1.isString)(props.tooltip)) {
                        tooltip = props.tooltip;
                    }
                    // TODO @jkearl, remove once migration complete.
                    else if (extHostTypes_1.MarkdownString.isMarkdownString(props.detail)) {
                        console.warn('Using deprecated TimelineItem.detail, migrate to TimelineItem.tooltip');
                        tooltip = extHostTypeConverters_1.MarkdownString.from(props.detail);
                    }
                    else if ((0, types_1.isString)(props.detail)) {
                        console.warn('Using deprecated TimelineItem.detail, migrate to TimelineItem.tooltip');
                        tooltip = props.detail;
                    }
                    return {
                        ...props,
                        id: props.id ?? undefined,
                        handle: handle,
                        source: source,
                        command: item.command ? commandConverter.toInternal(item.command, disposables) : undefined,
                        icon: icon,
                        iconDark: iconDark,
                        themeIcon: themeIcon,
                        tooltip,
                        accessibilityInformation: item.accessibilityInformation
                    };
                };
            };
        }
        registerTimelineProviderCore(provider, extension) {
            // console.log(`ExtHostTimeline#registerTimelineProvider: id=${provider.id}`);
            const existing = this._providers.get(provider.id);
            if (existing) {
                throw new Error(`Timeline Provider ${provider.id} already exists.`);
            }
            this._proxy.$registerTimelineProvider({
                id: provider.id,
                label: provider.label,
                scheme: provider.scheme
            });
            this._providers.set(provider.id, { provider, extension });
            return (0, lifecycle_1.toDisposable)(() => {
                for (const sourceMap of this._itemsBySourceAndUriMap.values()) {
                    sourceMap.get(provider.id)?.clear();
                }
                this._providers.delete(provider.id);
                this._proxy.$unregisterTimelineProvider(provider.id);
                provider.dispose();
            });
        }
    }
    exports.ExtHostTimeline = ExtHostTimeline;
    function getUriKey(uri) {
        return uri?.toString();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRpbWVsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRpbWVsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCbkYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLCtCQUFlLEVBQW1CLGtCQUFrQixDQUFDLENBQUM7SUFFdEYsTUFBYSxlQUFlO1FBUzNCLFlBQ0MsV0FBeUIsRUFDekIsUUFBeUI7WUFObEIsZUFBVSxHQUFHLElBQUksR0FBRyxFQUEwRSxDQUFDO1lBRS9GLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUFxRSxDQUFDO1lBTTlHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFbkUsUUFBUSxDQUFDLHlCQUF5QixDQUFDO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUU7b0JBQ25DLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLGdEQUF1QyxFQUFFLENBQUM7d0JBQzVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGdDQUFtQixDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7NEJBQzFILE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRC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