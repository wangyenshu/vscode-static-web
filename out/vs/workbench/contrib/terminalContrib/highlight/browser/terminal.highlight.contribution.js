/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminalExtensions"], function (require, exports, dom_1, lifecycle_1, terminalExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalHighlightContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminal.highlight'; }
        static get(instance) {
            return instance.getContribution(TerminalHighlightContribution.ID);
        }
        constructor(_instance, processManager, widgetManager) {
            super();
            this._instance = _instance;
        }
        xtermOpen(xterm) {
            const screenElement = xterm.raw.element.querySelector('.xterm-screen');
            this._register((0, dom_1.addDisposableListener)(screenElement, 'mousemove', (e) => this._tryShowHighlight(screenElement, xterm, e)));
            const viewportElement = xterm.raw.element.querySelector('.xterm-viewport');
            this._register((0, dom_1.addDisposableListener)(viewportElement, 'mousemove', (e) => this._tryShowHighlight(screenElement, xterm, e)));
            this._register((0, dom_1.addDisposableListener)(xterm.raw.element, 'mouseout', () => xterm.markTracker.showCommandGuide(undefined)));
            this._register(xterm.raw.onData(() => xterm.markTracker.showCommandGuide(undefined)));
        }
        _tryShowHighlight(element, xterm, e) {
            const rect = element.getBoundingClientRect();
            if (!rect) {
                return;
            }
            const mouseCursorY = Math.floor(e.offsetY / (rect.height / xterm.raw.rows));
            const command = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.getCommandForLine(xterm.raw.buffer.active.viewportY + mouseCursorY);
            if (command && 'getOutput' in command) {
                xterm.markTracker.showCommandGuide(command);
            }
            else {
                xterm.markTracker.showCommandGuide(undefined);
            }
        }
    }
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalHighlightContribution.ID, TerminalHighlightContribution, false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuaGlnaGxpZ2h0LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9oaWdobGlnaHQvYnJvd3Nlci90ZXJtaW5hbC5oaWdobGlnaHQuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLE1BQU0sNkJBQThCLFNBQVEsc0JBQVU7aUJBQ3JDLE9BQUUsR0FBRyxvQkFBb0IsQ0FBQztRQUUxQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQXVEO1lBQ2pFLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBZ0MsNkJBQTZCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUVELFlBQ2tCLFNBQXdELEVBQ3pFLGNBQThELEVBQzlELGFBQW9DO1lBRXBDLEtBQUssRUFBRSxDQUFDO1lBSlMsY0FBUyxHQUFULFNBQVMsQ0FBK0M7UUFLMUUsQ0FBQztRQUVELFNBQVMsQ0FBQyxLQUFpRDtZQUMxRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQVEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFFLENBQUM7WUFDekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0SSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQVEsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUUsQ0FBQztZQUM3RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsZUFBZSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRU8saUJBQWlCLENBQUMsT0FBZ0IsRUFBRSxLQUFpRCxFQUFFLENBQWE7WUFDM0csTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyw2Q0FBcUMsRUFBRSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxDQUFDO1lBQzFKLElBQUksT0FBTyxJQUFJLFdBQVcsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDdkMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQzs7SUFHRixJQUFBLGlEQUE0QixFQUFDLDZCQUE2QixDQUFDLEVBQUUsRUFBRSw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQyJ9