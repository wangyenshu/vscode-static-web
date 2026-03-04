/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, event_1, lifecycle_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClickLinkGesture = exports.ClickLinkOptions = exports.ClickLinkKeyboardEvent = exports.ClickLinkMouseEvent = void 0;
    function hasModifier(e, modifier) {
        return !!e[modifier];
    }
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkMouseEvent {
        constructor(source, opts) {
            this.target = source.target;
            this.isLeftClick = source.event.leftButton;
            this.isMiddleClick = source.event.middleButton;
            this.isRightClick = source.event.rightButton;
            this.hasTriggerModifier = hasModifier(source.event, opts.triggerModifier);
            this.hasSideBySideModifier = hasModifier(source.event, opts.triggerSideBySideModifier);
            this.isNoneOrSingleMouseDown = (source.event.detail <= 1);
        }
    }
    exports.ClickLinkMouseEvent = ClickLinkMouseEvent;
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkKeyboardEvent {
        constructor(source, opts) {
            this.keyCodeIsTriggerKey = (source.keyCode === opts.triggerKey);
            this.keyCodeIsSideBySideKey = (source.keyCode === opts.triggerSideBySideKey);
            this.hasTriggerModifier = hasModifier(source, opts.triggerModifier);
        }
    }
    exports.ClickLinkKeyboardEvent = ClickLinkKeyboardEvent;
    class ClickLinkOptions {
        constructor(triggerKey, triggerModifier, triggerSideBySideKey, triggerSideBySideModifier) {
            this.triggerKey = triggerKey;
            this.triggerModifier = triggerModifier;
            this.triggerSideBySideKey = triggerSideBySideKey;
            this.triggerSideBySideModifier = triggerSideBySideModifier;
        }
        equals(other) {
            return (this.triggerKey === other.triggerKey
                && this.triggerModifier === other.triggerModifier
                && this.triggerSideBySideKey === other.triggerSideBySideKey
                && this.triggerSideBySideModifier === other.triggerSideBySideModifier);
        }
    }
    exports.ClickLinkOptions = ClickLinkOptions;
    function createOptions(multiCursorModifier) {
        if (multiCursorModifier === 'altKey') {
            if (platform.isMacintosh) {
                return new ClickLinkOptions(57 /* KeyCode.Meta */, 'metaKey', 6 /* KeyCode.Alt */, 'altKey');
            }
            return new ClickLinkOptions(5 /* KeyCode.Ctrl */, 'ctrlKey', 6 /* KeyCode.Alt */, 'altKey');
        }
        if (platform.isMacintosh) {
            return new ClickLinkOptions(6 /* KeyCode.Alt */, 'altKey', 57 /* KeyCode.Meta */, 'metaKey');
        }
        return new ClickLinkOptions(6 /* KeyCode.Alt */, 'altKey', 5 /* KeyCode.Ctrl */, 'ctrlKey');
    }
    class ClickLinkGesture extends lifecycle_1.Disposable {
        constructor(editor, opts) {
            super();
            this._onMouseMoveOrRelevantKeyDown = this._register(new event_1.Emitter());
            this.onMouseMoveOrRelevantKeyDown = this._onMouseMoveOrRelevantKeyDown.event;
            this._onExecute = this._register(new event_1.Emitter());
            this.onExecute = this._onExecute.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            this._editor = editor;
            this._extractLineNumberFromMouseEvent = opts?.extractLineNumberFromMouseEvent ?? ((e) => e.target.position ? e.target.position.lineNumber : 0);
            this._opts = createOptions(this._editor.getOption(78 /* EditorOption.multiCursorModifier */));
            this._lastMouseMoveEvent = null;
            this._hasTriggerKeyOnMouseDown = false;
            this._lineNumberOnMouseDown = 0;
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(78 /* EditorOption.multiCursorModifier */)) {
                    const newOpts = createOptions(this._editor.getOption(78 /* EditorOption.multiCursorModifier */));
                    if (this._opts.equals(newOpts)) {
                        return;
                    }
                    this._opts = newOpts;
                    this._lastMouseMoveEvent = null;
                    this._hasTriggerKeyOnMouseDown = false;
                    this._lineNumberOnMouseDown = 0;
                    this._onCancel.fire();
                }
            }));
            this._register(this._editor.onMouseMove((e) => this._onEditorMouseMove(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseDown((e) => this._onEditorMouseDown(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseUp((e) => this._onEditorMouseUp(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onKeyDown((e) => this._onEditorKeyDown(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onKeyUp((e) => this._onEditorKeyUp(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onMouseDrag(() => this._resetHandler()));
            this._register(this._editor.onDidChangeCursorSelection((e) => this._onDidChangeCursorSelection(e)));
            this._register(this._editor.onDidChangeModel((e) => this._resetHandler()));
            this._register(this._editor.onDidChangeModelContent(() => this._resetHandler()));
            this._register(this._editor.onDidScrollChange((e) => {
                if (e.scrollTopChanged || e.scrollLeftChanged) {
                    this._resetHandler();
                }
            }));
        }
        _onDidChangeCursorSelection(e) {
            if (e.selection && e.selection.startColumn !== e.selection.endColumn) {
                this._resetHandler(); // immediately stop this feature if the user starts to select (https://github.com/microsoft/vscode/issues/7827)
            }
        }
        _onEditorMouseMove(mouseEvent) {
            this._lastMouseMoveEvent = mouseEvent;
            this._onMouseMoveOrRelevantKeyDown.fire([mouseEvent, null]);
        }
        _onEditorMouseDown(mouseEvent) {
            // We need to record if we had the trigger key on mouse down because someone might select something in the editor
            // holding the mouse down and then while mouse is down start to press Ctrl/Cmd to start a copy operation and then
            // release the mouse button without wanting to do the navigation.
            // With this flag we prevent goto definition if the mouse was down before the trigger key was pressed.
            this._hasTriggerKeyOnMouseDown = mouseEvent.hasTriggerModifier;
            this._lineNumberOnMouseDown = this._extractLineNumberFromMouseEvent(mouseEvent);
        }
        _onEditorMouseUp(mouseEvent) {
            const currentLineNumber = this._extractLineNumberFromMouseEvent(mouseEvent);
            if (this._hasTriggerKeyOnMouseDown && this._lineNumberOnMouseDown && this._lineNumberOnMouseDown === currentLineNumber) {
                this._onExecute.fire(mouseEvent);
            }
        }
        _onEditorKeyDown(e) {
            if (this._lastMouseMoveEvent
                && (e.keyCodeIsTriggerKey // User just pressed Ctrl/Cmd (normal goto definition)
                    || (e.keyCodeIsSideBySideKey && e.hasTriggerModifier) // User pressed Ctrl/Cmd+Alt (goto definition to the side)
                )) {
                this._onMouseMoveOrRelevantKeyDown.fire([this._lastMouseMoveEvent, e]);
            }
            else if (e.hasTriggerModifier) {
                this._onCancel.fire(); // remove decorations if user holds another key with ctrl/cmd to prevent accident goto declaration
            }
        }
        _onEditorKeyUp(e) {
            if (e.keyCodeIsTriggerKey) {
                this._onCancel.fire();
            }
        }
        _resetHandler() {
            this._lastMouseMoveEvent = null;
            this._hasTriggerKeyOnMouseDown = false;
            this._onCancel.fire();
        }
    }
    exports.ClickLinkGesture = ClickLinkGesture;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpY2tMaW5rR2VzdHVyZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2dvdG9TeW1ib2wvYnJvd3Nlci9saW5rL2NsaWNrTGlua0dlc3R1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLFNBQVMsV0FBVyxDQUFDLENBQTZFLEVBQUUsUUFBdUQ7UUFDMUosT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQWEsbUJBQW1CO1FBVS9CLFlBQVksTUFBeUIsRUFBRSxJQUFzQjtZQUM1RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztZQUMzQyxJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO1lBQy9DLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDN0MsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMscUJBQXFCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztLQUNEO0lBbkJELGtEQW1CQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxzQkFBc0I7UUFNbEMsWUFBWSxNQUFzQixFQUFFLElBQXNCO1lBQ3pELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7S0FDRDtJQVhELHdEQVdDO0lBR0QsTUFBYSxnQkFBZ0I7UUFPNUIsWUFDQyxVQUFtQixFQUNuQixlQUFnQyxFQUNoQyxvQkFBNkIsRUFDN0IseUJBQTBDO1lBRTFDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztZQUNqRCxJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7UUFDNUQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUF1QjtZQUNwQyxPQUFPLENBQ04sSUFBSSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVTttQkFDakMsSUFBSSxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsZUFBZTttQkFDOUMsSUFBSSxDQUFDLG9CQUFvQixLQUFLLEtBQUssQ0FBQyxvQkFBb0I7bUJBQ3hELElBQUksQ0FBQyx5QkFBeUIsS0FBSyxLQUFLLENBQUMseUJBQXlCLENBQ3JFLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUEzQkQsNENBMkJDO0lBRUQsU0FBUyxhQUFhLENBQUMsbUJBQXFEO1FBQzNFLElBQUksbUJBQW1CLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDdEMsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxnQkFBZ0Isd0JBQWUsU0FBUyx1QkFBZSxRQUFRLENBQUMsQ0FBQztZQUM3RSxDQUFDO1lBQ0QsT0FBTyxJQUFJLGdCQUFnQix1QkFBZSxTQUFTLHVCQUFlLFFBQVEsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksZ0JBQWdCLHNCQUFjLFFBQVEseUJBQWdCLFNBQVMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFDRCxPQUFPLElBQUksZ0JBQWdCLHNCQUFjLFFBQVEsd0JBQWdCLFNBQVMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFTRCxNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBbUIvQyxZQUFZLE1BQW1CLEVBQUUsSUFBK0I7WUFDL0QsS0FBSyxFQUFFLENBQUM7WUFsQlEsa0NBQTZCLEdBQWtFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXdELENBQUMsQ0FBQztZQUNwTCxpQ0FBNEIsR0FBZ0UsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQUVwSSxlQUFVLEdBQWlDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVCLENBQUMsQ0FBQztZQUMvRixjQUFTLEdBQStCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBRTdELGNBQVMsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDaEUsYUFBUSxHQUFnQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQWE1RCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsZ0NBQWdDLEdBQUcsSUFBSSxFQUFFLCtCQUErQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9JLElBQUksQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUywyQ0FBa0MsQ0FBQyxDQUFDO1lBRXJGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMxRCxJQUFJLENBQUMsQ0FBQyxVQUFVLDJDQUFrQyxFQUFFLENBQUM7b0JBQ3BELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsMkNBQWtDLENBQUMsQ0FBQztvQkFDeEYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNoQyxPQUFPO29CQUNSLENBQUM7b0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLHNCQUFzQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVyRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNuRCxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTywyQkFBMkIsQ0FBQyxDQUErQjtZQUNsRSxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsK0dBQStHO1lBQ3RJLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBK0I7WUFDekQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFVBQVUsQ0FBQztZQUV0QyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFVBQStCO1lBQ3pELGlIQUFpSDtZQUNqSCxpSEFBaUg7WUFDakgsaUVBQWlFO1lBQ2pFLHNHQUFzRztZQUN0RyxJQUFJLENBQUMseUJBQXlCLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixDQUFDO1lBQy9ELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFVBQStCO1lBQ3ZELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVFLElBQUksSUFBSSxDQUFDLHlCQUF5QixJQUFJLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEgsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxDQUF5QjtZQUNqRCxJQUNDLElBQUksQ0FBQyxtQkFBbUI7bUJBQ3JCLENBQ0YsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLHNEQUFzRDt1QkFDekUsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLElBQUksQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsMERBQTBEO2lCQUNoSCxFQUNBLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLGtHQUFrRztZQUMxSCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxDQUF5QjtZQUMvQyxJQUFJLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYTtZQUNwQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7WUFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUFqSEQsNENBaUhDIn0=