/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/base/common/types"], function (require, exports, instantiation_1, uri_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceFileEdit = exports.ResourceTextEdit = exports.ResourceEdit = exports.IBulkEditService = void 0;
    exports.IBulkEditService = (0, instantiation_1.createDecorator)('IWorkspaceEditService');
    class ResourceEdit {
        constructor(metadata) {
            this.metadata = metadata;
        }
        static convert(edit) {
            return edit.edits.map(edit => {
                if (ResourceTextEdit.is(edit)) {
                    return ResourceTextEdit.lift(edit);
                }
                if (ResourceFileEdit.is(edit)) {
                    return ResourceFileEdit.lift(edit);
                }
                throw new Error('Unsupported edit');
            });
        }
    }
    exports.ResourceEdit = ResourceEdit;
    class ResourceTextEdit extends ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceTextEdit) {
                return true;
            }
            return (0, types_1.isObject)(candidate)
                && uri_1.URI.isUri(candidate.resource)
                && (0, types_1.isObject)(candidate.textEdit);
        }
        static lift(edit) {
            if (edit instanceof ResourceTextEdit) {
                return edit;
            }
            else {
                return new ResourceTextEdit(edit.resource, edit.textEdit, edit.versionId, edit.metadata);
            }
        }
        constructor(resource, textEdit, versionId = undefined, metadata) {
            super(metadata);
            this.resource = resource;
            this.textEdit = textEdit;
            this.versionId = versionId;
        }
    }
    exports.ResourceTextEdit = ResourceTextEdit;
    class ResourceFileEdit extends ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceFileEdit) {
                return true;
            }
            else {
                return (0, types_1.isObject)(candidate)
                    && (Boolean(candidate.newResource) || Boolean(candidate.oldResource));
            }
        }
        static lift(edit) {
            if (edit instanceof ResourceFileEdit) {
                return edit;
            }
            else {
                return new ResourceFileEdit(edit.oldResource, edit.newResource, edit.options, edit.metadata);
            }
        }
        constructor(oldResource, newResource, options = {}, metadata) {
            super(metadata);
            this.oldResource = oldResource;
            this.newResource = newResource;
            this.options = options;
        }
    }
    exports.ResourceFileEdit = ResourceFileEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc2VydmljZXMvYnVsa0VkaXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVluRixRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsdUJBQXVCLENBQUMsQ0FBQztJQUUzRixNQUFhLFlBQVk7UUFFeEIsWUFBK0IsUUFBZ0M7WUFBaEMsYUFBUSxHQUFSLFFBQVEsQ0FBd0I7UUFBSSxDQUFDO1FBRXBFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBbUI7WUFFakMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDNUIsSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7Z0JBRUQsSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBakJELG9DQWlCQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsWUFBWTtRQUVqRCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQWM7WUFDdkIsSUFBSSxTQUFTLFlBQVksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxJQUFBLGdCQUFRLEVBQUMsU0FBUyxDQUFDO21CQUN0QixTQUFHLENBQUMsS0FBSyxDQUFzQixTQUFVLENBQUMsUUFBUSxDQUFDO21CQUNuRCxJQUFBLGdCQUFRLEVBQXNCLFNBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUF3QjtZQUNuQyxJQUFJLElBQUksWUFBWSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFGLENBQUM7UUFDRixDQUFDO1FBRUQsWUFDVSxRQUFhLEVBQ2IsUUFBa0QsRUFDbEQsWUFBZ0MsU0FBUyxFQUNsRCxRQUFnQztZQUVoQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFMUCxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsYUFBUSxHQUFSLFFBQVEsQ0FBMEM7WUFDbEQsY0FBUyxHQUFULFNBQVMsQ0FBZ0M7UUFJbkQsQ0FBQztLQUNEO0lBM0JELDRDQTJCQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsWUFBWTtRQUVqRCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQWM7WUFDdkIsSUFBSSxTQUFTLFlBQVksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFBLGdCQUFRLEVBQUMsU0FBUyxDQUFDO3VCQUN0QixDQUFDLE9BQU8sQ0FBc0IsU0FBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLE9BQU8sQ0FBc0IsU0FBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDcEgsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQXdCO1lBQ25DLElBQUksSUFBSSxZQUFZLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUNVLFdBQTRCLEVBQzVCLFdBQTRCLEVBQzVCLFVBQW9DLEVBQUUsRUFDL0MsUUFBZ0M7WUFFaEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBTFAsZ0JBQVcsR0FBWCxXQUFXLENBQWlCO1lBQzVCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtZQUM1QixZQUFPLEdBQVAsT0FBTyxDQUErQjtRQUloRCxDQUFDO0tBQ0Q7SUEzQkQsNENBMkJDIn0=