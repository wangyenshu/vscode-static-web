/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "child_process", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/node/processes"], function (require, exports, assert, cp, network_1, objects, platform, processes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fork(id) {
        const opts = {
            env: objects.mixin(objects.deepClone(process.env), {
                VSCODE_AMD_ENTRYPOINT: id,
                VSCODE_PIPE_LOGGING: 'true',
                VSCODE_VERBOSE_LOGGING: true
            })
        };
        return cp.fork(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, ['--type=processTests'], opts);
    }
    suite('Processes', () => {
        test('buffered sending - simple data', function (done) {
            if (process.env['VSCODE_PID']) {
                return done(); // this test fails when run from within VS Code
            }
            const child = fork('vs/base/test/node/processes/fixtures/fork');
            const sender = processes.createQueuedSender(child);
            let counter = 0;
            const msg1 = 'Hello One';
            const msg2 = 'Hello Two';
            const msg3 = 'Hello Three';
            child.on('message', msgFromChild => {
                if (msgFromChild === 'ready') {
                    sender.send(msg1);
                    sender.send(msg2);
                    sender.send(msg3);
                }
                else {
                    counter++;
                    if (counter === 1) {
                        assert.strictEqual(msgFromChild, msg1);
                    }
                    else if (counter === 2) {
                        assert.strictEqual(msgFromChild, msg2);
                    }
                    else if (counter === 3) {
                        assert.strictEqual(msgFromChild, msg3);
                        child.kill();
                        done();
                    }
                }
            });
        });
        (!platform.isWindows || process.env['VSCODE_PID'] ? test.skip : test)('buffered sending - lots of data (potential deadlock on win32)', function (done) {
            const child = fork('vs/base/test/node/processes/fixtures/fork_large');
            const sender = processes.createQueuedSender(child);
            const largeObj = Object.create(null);
            for (let i = 0; i < 10000; i++) {
                largeObj[i] = 'some data';
            }
            const msg = JSON.stringify(largeObj);
            child.on('message', msgFromChild => {
                if (msgFromChild === 'ready') {
                    sender.send(msg);
                    sender.send(msg);
                    sender.send(msg);
                }
                else if (msgFromChild === 'done') {
                    child.kill();
                    done();
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL3Byb2Nlc3Nlcy9wcm9jZXNzZXMuaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLFNBQVMsSUFBSSxDQUFDLEVBQVU7UUFDdkIsTUFBTSxJQUFJLEdBQVE7WUFDakIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2xELHFCQUFxQixFQUFFLEVBQUU7Z0JBQ3pCLG1CQUFtQixFQUFFLE1BQU07Z0JBQzNCLHNCQUFzQixFQUFFLElBQUk7YUFDNUIsQ0FBQztTQUNGLENBQUM7UUFFRixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN2QixJQUFJLENBQUMsZ0NBQWdDLEVBQUUsVUFBVSxJQUFnQjtZQUNoRSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLCtDQUErQztZQUMvRCxDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5ELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUVo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