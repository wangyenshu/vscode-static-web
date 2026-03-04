/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/controller/textAreaInput", "vs/base/common/lifecycle", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/browser/window"], function (require, exports, textAreaInput_1, lifecycle_1, browser, platform, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (() => {
        const startButton = window_1.mainWindow.document.getElementById('startRecording');
        const endButton = window_1.mainWindow.document.getElementById('endRecording');
        let inputarea;
        const disposables = new lifecycle_1.DisposableStore();
        let originTimeStamp = 0;
        let recorded = {
            env: null,
            initial: null,
            events: [],
            final: null
        };
        const readTextareaState = () => {
            return {
                selectionDirection: inputarea.selectionDirection,
                selectionEnd: inputarea.selectionEnd,
                selectionStart: inputarea.selectionStart,
                value: inputarea.value,
            };
        };
        startButton.onclick = () => {
            disposables.clear();
            startTest();
            originTimeStamp = 0;
            recorded = {
                env: {
                    OS: platform.OS,
                    browser: {
                        isAndroid: browser.isAndroid,
                        isFirefox: browser.isFirefox,
                        isChrome: browser.isChrome,
                        isSafari: browser.isSafari
                    }
                },
                initial: readTextareaState(),
                events: [],
                final: null
            };
        };
        endButton.onclick = () => {
            recorded.final = readTextareaState();
            console.log(printRecordedData());
        };
        function printRecordedData() {
            const lines = [];
            lines.push(`const recorded: IRecorded = {`);
            lines.push(`\tenv: ${JSON.stringify(recorded.env)}, `);
            lines.push(`\tinitial: ${printState(recorded.initial)}, `);
            lines.push(`\tevents: [\n\t\t${recorded.events.map(ev => printEvent(ev)).join(',\n\t\t')}\n\t],`);
            lines.push(`\tfinal: ${printState(recorded.final)},`);
            lines.push(`}`);
            return lines.join('\n');
            function printString(str) {
                return str.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
            }
            function printState(state) {
                return `{ value: '${printString(state.value)}', selectionStart: ${state.selectionStart}, selectionEnd: ${state.selectionEnd}, selectionDirection: '${state.selectionDirection}' }`;
            }
            function printEvent(ev) {
                if (ev.type === 'keydown' || ev.type === 'keypress' || ev.type === 'keyup') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', altKey: ${ev.altKey}, charCode: ${ev.charCode}, code: '${ev.code}', ctrlKey: ${ev.ctrlKey}, isComposing: ${ev.isComposing}, key: '${ev.key}', keyCode: ${ev.keyCode}, location: ${ev.location}, metaKey: ${ev.metaKey}, repeat: ${ev.repeat}, shiftKey: ${ev.shiftKey} }`;
                }
                if (ev.type === 'compositionstart' || ev.type === 'compositionupdate' || ev.type === 'compositionend') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', data: '${printString(ev.data)}' }`;
                }
                if (ev.type === 'beforeinput' || ev.type === 'input') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', data: ${ev.data === null ? 'null' : `'${printString(ev.data)}'`}, inputType: '${ev.inputType}', isComposing: ${ev.isComposing} }`;
                }
                return JSON.stringify(ev);
            }
        }
        function startTest() {
            inputarea = document.createElement('textarea');
            window_1.mainWindow.document.body.appendChild(inputarea);
            inputarea.focus();
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                inputarea.remove();
            }));
            const wrapper = disposables.add(new textAreaInput_1.TextAreaWrapper(inputarea));
            wrapper.setValue('', `aaaa`);
            wrapper.setSelectionRange('', 2, 2);
            const recordEvent = (e) => {
                recorded.events.push(e);
            };
            const recordKeyboardEvent = (e) => {
                if (e.type !== 'keydown' && e.type !== 'keypress' && e.type !== 'keyup') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    altKey: e.altKey,
                    charCode: e.charCode,
                    code: e.code,
                    ctrlKey: e.ctrlKey,
                    isComposing: e.isComposing,
                    key: e.key,
                    keyCode: e.keyCode,
                    location: e.location,
                    metaKey: e.metaKey,
                    repeat: e.repeat,
                    shiftKey: e.shiftKey
                };
                recordEvent(ev);
            };
            const recordCompositionEvent = (e) => {
                if (e.type !== 'compositionstart' && e.type !== 'compositionupdate' && e.type !== 'compositionend') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    data: e.data,
                };
                recordEvent(ev);
            };
            const recordInputEvent = (e) => {
                if (e.type !== 'beforeinput' && e.type !== 'input') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    data: e.data,
                    inputType: e.inputType,
                    isComposing: e.isComposing,
                };
                recordEvent(ev);
            };
            wrapper.onKeyDown(recordKeyboardEvent);
            wrapper.onKeyPress(recordKeyboardEvent);
            wrapper.onKeyUp(recordKeyboardEvent);
            wrapper.onCompositionStart(recordCompositionEvent);
            wrapper.onCompositionUpdate(recordCompositionEvent);
            wrapper.onCompositionEnd(recordCompositionEvent);
            wrapper.onBeforeInput(recordInputEvent);
            wrapper.onInput(recordInputEvent);
        }
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1lUmVjb3JkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2NvbnRyb2xsZXIvaW1lUmVjb3JkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsQ0FBQyxHQUFHLEVBQUU7UUFFTCxNQUFNLFdBQVcsR0FBc0IsbUJBQVUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFFLENBQUM7UUFDN0YsTUFBTSxTQUFTLEdBQXNCLG1CQUFVLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUUsQ0FBQztRQUV6RixJQUFJLFNBQThCLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksUUFBUSxHQUFjO1lBQ3pCLEdBQUcsRUFBRSxJQUFLO1lBQ1YsT0FBTyxFQUFFLElBQUs7WUFDZCxNQUFNLEVBQUUsRUFBRTtZQUNWLEtBQUssRUFBRSxJQUFLO1NBQ1osQ0FBQztRQUVGLE1BQU0saUJBQWlCLEdBQUcsR0FBMkIsRUFBRTtZQUN0RCxPQUFPO2dCQUNOLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxrQkFBa0I7Z0JBQ2hELFlBQVksRUFBRSxTQUFTLENBQUMsWUFBWTtnQkFDcEMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxjQUFjO2dCQUN4QyxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7YUFDdEIsQ0FBQztRQUNILENBQUMsQ0FBQztRQUVGLFdBQVcsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO1lBQzFCLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixTQUFTLEVBQUUsQ0FBQztZQUNaLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFDcEIs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