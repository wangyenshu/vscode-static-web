/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, platform_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACTIVE_OUTPUT_CHANNEL_CONTEXT = exports.Extensions = exports.OutputChannelUpdateMode = exports.IOutputService = exports.CONTEXT_OUTPUT_SCROLL_LOCK = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE = exports.CONTEXT_ACTIVE_FILE_OUTPUT = exports.CONTEXT_IN_OUTPUT = exports.OUTPUT_VIEW_ID = exports.LOG_MODE_ID = exports.LOG_MIME = exports.OUTPUT_MODE_ID = exports.OUTPUT_SCHEME = exports.OUTPUT_MIME = void 0;
    /**
     * Mime type used by the output editor.
     */
    exports.OUTPUT_MIME = 'text/x-code-output';
    /**
     * Output resource scheme.
     */
    exports.OUTPUT_SCHEME = 'output';
    /**
     * Id used by the output editor.
     */
    exports.OUTPUT_MODE_ID = 'Log';
    /**
     * Mime type used by the log output editor.
     */
    exports.LOG_MIME = 'text/x-code-log-output';
    /**
     * Id used by the log output editor.
     */
    exports.LOG_MODE_ID = 'log';
    /**
     * Output view id
     */
    exports.OUTPUT_VIEW_ID = 'workbench.panel.output';
    exports.CONTEXT_IN_OUTPUT = new contextkey_1.RawContextKey('inOutput', false);
    exports.CONTEXT_ACTIVE_FILE_OUTPUT = new contextkey_1.RawContextKey('activeLogOutput', false);
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE = new contextkey_1.RawContextKey('activeLogOutput.levelSettable', false);
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL = new contextkey_1.RawContextKey('activeLogOutput.level', '');
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT = new contextkey_1.RawContextKey('activeLogOutput.levelIsDefault', false);
    exports.CONTEXT_OUTPUT_SCROLL_LOCK = new contextkey_1.RawContextKey(`outputView.scrollLock`, false);
    exports.IOutputService = (0, instantiation_1.createDecorator)('outputService');
    var OutputChannelUpdateMode;
    (function (OutputChannelUpdateMode) {
        OutputChannelUpdateMode[OutputChannelUpdateMode["Append"] = 1] = "Append";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Replace"] = 2] = "Replace";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Clear"] = 3] = "Clear";
    })(OutputChannelUpdateMode || (exports.OutputChannelUpdateMode = OutputChannelUpdateMode = {}));
    exports.Extensions = {
        OutputChannels: 'workbench.contributions.outputChannels'
    };
    class OutputChannelRegistry {
        constructor() {
            this.channels = new Map();
            this._onDidRegisterChannel = new event_1.Emitter();
            this.onDidRegisterChannel = this._onDidRegisterChannel.event;
            this._onDidRemoveChannel = new event_1.Emitter();
            this.onDidRemoveChannel = this._onDidRemoveChannel.event;
        }
        registerChannel(descriptor) {
            if (!this.channels.has(descriptor.id)) {
                this.channels.set(descriptor.id, descriptor);
                this._onDidRegisterChannel.fire(descriptor.id);
            }
        }
        getChannels() {
            const result = [];
            this.channels.forEach(value => result.push(value));
            return result;
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        removeChannel(id) {
            this.channels.delete(id);
            this._onDidRemoveChannel.fire(id);
        }
    }
    platform_1.Registry.add(exports.Extensions.OutputChannels, new OutputChannelRegistry());
    exports.ACTIVE_OUTPUT_CHANNEL_CONTEXT = new contextkey_1.RawContextKey('activeOutputChannel', '');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL291dHB1dC9jb21tb24vb3V0cHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRzs7T0FFRztJQUNVLFFBQUEsV0FBVyxHQUFHLG9CQUFvQixDQUFDO0lBRWhEOztPQUVHO0lBQ1UsUUFBQSxhQUFhLEdBQUcsUUFBUSxDQUFDO0lBRXRDOztPQUVHO0lBQ1UsUUFBQSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBRXBDOztPQUVHO0lBQ1UsUUFBQSxRQUFRLEdBQUcsd0JBQXdCLENBQUM7SUFFakQ7O09BRUc7SUFDVSxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFFakM7O09BRUc7SUFDVSxRQUFBLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQztJQUUxQyxRQUFBLGlCQUFpQixHQUFHLElBQUksMEJBQWEsQ0FBVSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbEUsUUFBQSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbEYsUUFBQSxvQ0FBb0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFMUcsUUFBQSwyQkFBMkIsR0FBRyxJQUFJLDBCQUFhLENBQVMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFckYsUUFBQSxzQ0FBc0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0NBQWdDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFN0csUUFBQSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFeEYsUUFBQSxjQUFjLEdBQUcsSUFBQSwrQkFBZSxFQUFpQixlQUFlLENBQUMsQ0FBQztJQXlDL0UsSUFBWSx1QkFJWDtJQUpELFdBQVksdUJBQXVCO1FBQ2xDLHlFQUFVLENBQUE7UUFDViwyRUFBTyxDQUFBO1FBQ1AsdUVBQUssQ0FBQTtJQUNOLENBQUMsRUFKVyx1QkFBdUIsdUNBQXZCLHVCQUF1QixRQUlsQztJQThDWSxRQUFBLFVBQVUsR0FBRztRQUN6QixjQUFjLEVBQUUsd0NBQXdDO0tBQ3hELENBQUM7SUF5Q0YsTUFBTSxxQkFBcUI7UUFBM0I7WUFDUyxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFFOUMsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUN0RCx5QkFBb0IsR0FBa0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUUvRCx3QkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3BELHVCQUFrQixHQUFrQixJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1FBdUI3RSxDQUFDO1FBckJPLGVBQWUsQ0FBQyxVQUFvQztZQUMxRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO1FBRU0sV0FBVztZQUNqQixNQUFNLE1BQU0sR0FBK0IsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVNLFVBQVUsQ0FBQyxFQUFVO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVNLGFBQWEsQ0FBQyxFQUFVO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNEO0lBRUQsbUJBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQVUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7SUFFeEQsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUMifQ==