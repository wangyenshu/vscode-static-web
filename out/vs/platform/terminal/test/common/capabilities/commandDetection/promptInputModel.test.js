/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/commandDetection/promptInputModel", "vs/base/common/event", "@xterm/headless", "assert", "vs/base/common/async"], function (require, exports, utils_1, log_1, promptInputModel_1, event_1, headless_1, assert_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PromptInputModel', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let promptInputModel;
        let xterm;
        let onCommandStart;
        let onCommandExecuted;
        async function writePromise(data) {
            await new Promise(r => xterm.write(data, r));
        }
        function fireCommandStart() {
            onCommandStart.fire({ marker: xterm.registerMarker() });
        }
        function fireCommandExecuted() {
            onCommandExecuted.fire(null);
        }
        async function assertPromptInput(valueWithCursor) {
            await (0, async_1.timeout)(0);
            if (promptInputModel.cursorIndex !== -1 && !valueWithCursor.includes('|')) {
                throw new Error('assertPromptInput must contain | character');
            }
            const actualValueWithCursor = promptInputModel.getCombinedString();
            (0, assert_1.strictEqual)(actualValueWithCursor, valueWithCursor.replaceAll('\n', '\u23CE'));
            // This is required to ensure the cursor index is correctly resolved for non-ascii characters
            const value = valueWithCursor.replace(/[\|\[\]]/g, '');
            const cursorIndex = valueWithCursor.indexOf('|');
            (0, assert_1.strictEqual)(promptInputModel.value, value);
            (0, assert_1.strictEqual)(promptInputModel.cursorIndex, cursorIndex, `value=${promptInputModel.value}`);
        }
        setup(() => {
            xterm = store.add(new headless_1.Terminal({ allowProposedApi: true }));
            onCommandStart = store.add(new event_1.Emitter());
            onCommandExecuted = store.add(new event_1.Emitter());
            promptInputModel = store.add(new promptInputModel_1.PromptInputModel(xterm, onCommandStart.event, onCommandExecuted.event, new log_1.NullLogService));
        });
        test('basic input and execute', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo bar');
            await assertPromptInput('foo bar|');
            await writePromise('\r\n');
            fireCommandExecuted();
            await assertPromptInput('foo bar');
            await writePromise('(command output)\r\n$ ');
            fireCommandStart();
            await assertPromptInput('|');
        });
        test('should not fire onDidChangeInput events when nothing changes', async () => {
            const events = [];
            store.add(promptInputModel.onDidChangeInput(e => events.push(e)));
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo');
            await assertPromptInput('foo|');
            await writePromise(' bar');
            await assertPromptInput('foo bar|');
            await writePromise('\r\n');
            fireCommandExecuted();
            await assertPromptInput('foo bar');
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo bar');
            await assertPromptInput('foo bar|');
            for (let i = 0; i < events.length - 1; i++) {
                (0, assert_1.notDeepStrictEqual)(events[i], events[i + 1], 'not adjacent events should fire with the same value');
            }
        });
        test('should fire onDidInterrupt followed by onDidFinish when ctrl+c is pressed', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo');
            await assertPromptInput('foo|');
            await new Promise(r => {
                store.add(promptInputModel.onDidInterrupt(() => {
                    // Fire onDidFinishInput immediately after onDidInterrupt
                    store.add(promptInputModel.onDidFinishInput(() => {
                        r();
                    }));
                }));
                xterm.input('\x03');
                writePromise('^C').then(() => fireCommandExecuted());
            });
        });
        test('cursor navigation', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo bar');
            await assertPromptInput('foo bar|');
            await writePromise('\x1b[3D');
            await assertPromptInput('foo |bar');
            await writePromise('\x1b[4D');
            await assertPromptInput('|foo bar');
            await writePromise('\x1b[3C');
            await assertPromptInput('foo| bar');
            await writePromise('\x1b[4C');
            await assertPromptInput('foo bar|');
            await writePromise('\x1b[D');
            await assertPromptInput('foo ba|r');
            await writePromise('\x1b[C');
            await assertPromptInput('foo bar|');
        });
        test('ghost text', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('foo\x1b[2m bar\x1b[0m\x1b[4D');
            await assertPromptInput('foo|[ bar]');
            await writePromise('\x1b[2D');
            await assertPromptInput('f|oo[ bar]');
        });
        test('wide input (Korean)', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('안영');
            await assertPromptInput('안영|');
            await writePromise('\r\n컴퓨터');
            await assertPromptInput('안영\n컴퓨터|');
            await writePromise('\r\n사람');
            await assertPromptInput('안영\n컴퓨터\n사람|');
            await writePromise('\x1b[G');
            await assertPromptInput('안영\n컴퓨터\n|사람');
            await writePromise('\x1b[A');
            await assertPromptInput('안영\n|컴퓨터\n사람');
            await writePromise('\x1b[4C');
            await assertPromptInput('안영\n컴퓨|터\n사람');
            await writePromise('\x1b[1;4H');
            await assertPromptInput('안|영\n컴퓨터\n사람');
            await writePromise('\x1b[D');
            await assertPromptInput('|안영\n컴퓨터\n사람');
        });
        test('emoji input', async () => {
            await writePromise('$ ');
            fireCommandStart();
            await assertPromptInput('|');
            await writePromise('✌️👍');
            await assertPromptInput('✌️👍|');
            await writePromise('\r\n😎😕😅');
            await assertPromptInput('✌️👍\n😎😕😅|');
            await writePromise('\r\n🤔🤷😩');
            await assertPromptInput('✌️👍\n😎😕😅\n🤔🤷😩|');
            await writePromise('\x1b[G');
            await assertPromptInput('✌️👍\n😎😕😅\n|🤔🤷😩');
            await writePromise('\x1b[A');
            await assertPromptInput('✌️👍\n|😎😕😅\n🤔🤷😩');
            await writePromise('\x1b[2C');
            await assertPromptInput('✌️👍\n😎😕|😅\n🤔🤷😩');
            await writePromise('\x1b[1;4H');
            await assertPromptInput('✌️|👍\n😎😕😅\n🤔🤷😩');
            await writePromise('\x1b[D');
            await assertPromptInput('|✌️👍\n😎😕😅\n🤔🤷😩');
        });
        // To "record a session" for these tests:
        // - Enable debug logging
        // - Open and clear Terminal output channel
        // - Open terminal and perform the test
        // - Extract all "parsing data" lines from the terminal
        suite('recorded sessions', () => {
            async function replayEvents(events) {
                for (const data of events) {
                    await writePromise(data);
                }
            }
            suite('Windows 11 (10.0.22621.3447), pwsh 7.4.2, starship prompt 1.10.2', () => {
                test('input with ignored ghost text', async () => {
                    await replayEvents([
                        '[?25l[2J[m[H]0;C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.4.2.0_x64__8wekyb3d8bbwe\\pwsh.exe[?25h',
                        '[?25l[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K[H[?25h',
                        ']633;P;IsWindows=True',
                        ']633;P;ContinuationPrompt=\x1b[38\x3b5\x3b8m∙\x1b[0m ',
                        ']633;A]633;P;Cwd=C:\x5cGithub\x5cmicrosoft\x5cvscode]633;B',
                        '[34m\r\n[38;2;17;17;17m[44m03:13:47 [34m[41m [38;2;17;17;17mvscode [31m[43m [38;2;17;17;17m tyriar/prompt_input_model [33m[46m [38;2;17;17;17m$⇡ [36m[49m [mvia [32m[1m v18.18.2 \r\n❯[m ',
                    ]);
                    fireCommandStart();
                    await assertPromptInput('|');
                    await replayEvents([
                        '[?25l[93mf[97m[2m[3makecommand[3;4H[?25h',
                        '[m',
                        '[93mfo[9X',
                        '[m',
                        '[?25l[93m[3;3Hfoo[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('foo|');
                });
                test('input with accepted and run ghost text', async () => {
                    await replayEvents([
                        '[?25l[2J[m[H]0;C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.4.2.0_x64__8wekyb3d8bbwe\\pwsh.exe[?25h',
                        '[?25l[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K[H[?25h',
                        ']633;P;IsWindows=True',
                        ']633;P;ContinuationPrompt=\x1b[38\x3b5\x3b8m∙\x1b[0m ',
                        ']633;A]633;P;Cwd=C:\x5cGithub\x5cmicrosoft\x5cvscode]633;B',
                        '[34m\r\n[38;2;17;17;17m[44m03:41:36 [34m[41m [38;2;17;17;17mvscode [31m[43m [38;2;17;17;17m tyriar/prompt_input_model [33m[46m [38;2;17;17;17m$ [36m[49m [mvia [32m[1m v18.18.2 \r\n❯[m ',
                    ]);
                    promptInputModel.setContinuationPrompt('∙ ');
                    fireCommandStart();
                    await assertPromptInput('|');
                    await replayEvents([
                        '[?25l[93me[97m[2m[3mcho "hello world"[3;4H[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('e|[cho "hello world"]');
                    await replayEvents([
                        '[?25l[93mec[97m[2m[3mho "hello world"[3;5H[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('ec|[ho "hello world"]');
                    await replayEvents([
                        '[?25l[93m[3;3Hech[97m[2m[3mo "hello world"[3;6H[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('ech|[o "hello world"]');
                    await replayEvents([
                        '[?25l[93m[3;3Hecho[97m[2m[3m "hello world"[3;7H[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('echo|[ "hello world"]');
                    await replayEvents([
                        '[?25l[93m[3;3Hecho [97m[2m[3m"hello world"[3;8H[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('echo |["hello world"]');
                    await replayEvents([
                        '[?25l[93m[3;3Hecho [36m"hello world"[?25h',
                        '[m',
                    ]);
                    await assertPromptInput('echo "hello world"|');
                    await replayEvents([
                        ']633;E;echo "hello world";ff464d39-bc80-4bae-9ead-b1cafc4adf6f]633;C',
                    ]);
                    fireCommandExecuted();
                    await assertPromptInput('echo "hello world"');
                    await replayEvents([
                        '\r\n',
                        'hello world\r\n',
                    ]);
                    await assertPromptInput('echo "hello world"');
                    await replayEvents([
                        ']633;D;0]633;A]633;P;Cwd=C:\x5cGithub\x5cmicrosoft\x5cvscode]633;B',
                        '[34m\r\n[38;2;17;17;17m[44m03:41:42 [34m[41m [38;2;17;17;17mvscode [31m[43m [38;2;17;17;17m tyriar/prompt_input_model [33m[46m [38;2;17;17;17m$ [36m[49m [mvia [32m[1m v18.18.2 \r\n❯[m ',
                    ]);
                    fireCommandStart();
                    await assertPromptInput('|');
                });
                test('input, go to start (ctrl+home), delete word in front (ctrl+delete)', async () => {
                    await replayEvents([
                        '[?25l[2J[m[H]0;C:\Program Files\WindowsApps\Microsoft.PowerShell_7.4.2.0_x64__8wekyb3d8bbwe\pwsh.exe[?25h',
                        '[?25l[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K\r\n[K[H[?25h',
                        ']633;P;IsWindows=True',
                        ']633;P;ContinuationPrompt=\x1b[38\x3b5\x3b8m∙\x1b[0m ',
                        ']633;A]633;P;Cwd=C:\x5cGithub\x5cmicrosoft\x5cvscode]633;B',
                        '[34m\r\n[38;2;17;17;17m[44m16:07:06 [34m[41m [38;2;17;17;17mvscode [31m[43m [38;2;17;17;17m tyriar/210662 [33m[46m [38;2;17;17;17m$! [36m[49m [mvia [32m[1m v18.18.2 \r\n❯[m ',
                    ]);
                    fireCommandStart();
                    await assertPromptInput('|');
                    await replayEvents([
                        '[?25l[93mG[97m[2m[3mit push[3;4H[?25h',
                        '[m',
                        '[?25l[93mGe[97m[2m[3mt-ChildItem -Path a[3;5H[?25h',
                        '[m',
                        '[?25l[93m[3;3HGet[97m[2m[3m-ChildItem -Path a[3;6H[?25h',
                    ]);
                    await assertPromptInput('Get|[-ChildItem -Path a]');
                    await replayEvents([
                        '[m',
                        '[?25l[3;3H[?25h',
                        '[21X',
                    ]);
                    // Don't force a sync, the prompt input model should update by itself
                    await (0, async_1.timeout)(0);
                    const actualValueWithCursor = promptInputModel.getCombinedString();
                    (0, assert_1.strictEqual)(actualValueWithCursor, '|'.replaceAll('\n', '\u23CE'));
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbXB0SW5wdXRNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvdGVzdC9jb21tb24vY2FwYWJpbGl0aWVzL2NvbW1hbmREZXRlY3Rpb24vcHJvbXB0SW5wdXRNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksZ0JBQWtDLENBQUM7UUFDdkMsSUFBSSxLQUFlLENBQUM7UUFDcEIsSUFBSSxjQUF5QyxDQUFDO1FBQzlDLElBQUksaUJBQTRDLENBQUM7UUFFakQsS0FBSyxVQUFVLFlBQVksQ0FBQyxJQUFZO1lBQ3ZDLE1BQU0sSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxTQUFTLGdCQUFnQjtZQUN4QixjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBc0IsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxTQUFTLG1CQUFtQjtZQUMzQixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxlQUF1QjtZQUN2RCxNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpCLElBQUksZ0JBQWdCLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFH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