define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/electron-sandbox/window", "vs/platform/tunnel/common/tunnel", "vs/base/common/uri", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/base/common/lifecycle"], function (require, exports, assert, utils_1, window_1, tunnel_1, uri_1, workbenchTestServices_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TunnelMock {
        constructor() {
            this.assignedPorts = {};
            this.expectedDispose = false;
        }
        reset(ports) {
            this.assignedPorts = ports;
        }
        expectDispose() {
            this.expectedDispose = true;
        }
        getExistingTunnel() {
            return Promise.resolve(undefined);
        }
        openTunnel(_addressProvider, _host, port) {
            if (!this.assignedPorts[port]) {
                return Promise.reject(new Error('Unexpected tunnel request'));
            }
            const res = {
                localAddress: `localhost:${this.assignedPorts[port]}`,
                tunnelRemoteHost: '4.3.2.1',
                tunnelRemotePort: this.assignedPorts[port],
                privacy: '',
                dispose: () => {
                    assert(this.expectedDispose, 'Unexpected dispose');
                    this.expectedDispose = false;
                    return Promise.resolve();
                }
            };
            delete this.assignedPorts[port];
            return Promise.resolve(res);
        }
        validate() {
            try {
                assert(Object.keys(this.assignedPorts).length === 0, 'Expected tunnel to be used');
                assert(!this.expectedDispose, 'Expected dispose to be called');
            }
            finally {
                this.expectedDispose = false;
            }
        }
    }
    class TestNativeWindow extends window_1.NativeWindow {
        create() { }
        registerListeners() { }
        enableMultiWindowAwareTimeout() { }
    }
    suite.skip('NativeWindow:resolveExternal', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const tunnelMock = new TunnelMock();
        let window;
        setup(() => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(tunnel_1.ITunnelService, tunnelMock);
            window = disposables.add(instantiationService.createInstance(TestNativeWindow));
        });
        teardown(() => {
            disposables.clear();
        });
        async function doTest(uri, ports = {}, expectedUri) {
            tunnelMock.reset(ports);
            const res = await window.resolveExternalUri(uri_1.URI.parse(uri), {
                allowTunneling: true,
                openExternal: true
            });
            assert.strictEqual(!expectedUri, !res, `Expected URI ${expectedUri} but got ${res}`);
            if (expectedUri && res) {
                assert.strictEqual(res.resolved.toString(), uri_1.URI.parse(expectedUri).toString());
            }
            tunnelMock.validate();
        }
        test('invalid', async () => {
            await doTest('file:///foo.bar/baz');
            await doTest('http://foo.bar/path');
        });
        test('simple', async () => {
            await doTest('http://localhost:1234/path', { 1234: 1234 }, 'http://localhost:1234/path');
        });
        test('all interfaces', async () => {
            await doTest('http://0.0.0.0:1234/path', { 1234: 1234 }, 'http://localhost:1234/path');
        });
        test('changed port', async () => {
            await doTest('http://localhost:1234/path', { 1234: 1235 }, 'http://localhost:1235/path');
        });
        test('query', async () => {
            await doTest('http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 4455: 4455 }, 'http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        test('query with different port', async () => {
            tunnelMock.expectDispose();
            await doTest('http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 4455: 4567 });
        });
        test('both url and query', async () => {
            await doTest('http://localhost:1234/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 1234: 4321, 4455: 4455 }, 'http://localhost:4321/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        test('both url and query, query rejected', async () => {
            tunnelMock.expectDispose();
            await doTest('http://localhost:1234/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 1234: 4321, 4455: 5544 }, 'http://localhost:4321/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZUV4dGVybmFsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9lbGVjdHJvbi1zYW5kYm94L3Jlc29sdmVFeHRlcm5hbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWdCQSxNQUFNLFVBQVU7UUFBaEI7WUFDUyxrQkFBYSxHQUFZLEVBQUUsQ0FBQztZQUM1QixvQkFBZSxHQUFHLEtBQUssQ0FBQztRQXlDakMsQ0FBQztRQXZDQSxLQUFLLENBQUMsS0FBYztZQUNuQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQsYUFBYTtZQUNaLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxVQUFVLENBQUMsZ0JBQThDLEVBQUUsS0FBeUIsRUFBRSxJQUFZO1lBQ2pHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFpQjtnQkFDekIsWUFBWSxFQUFFLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDckQsZ0JBQWdCLEVBQUUsU0FBUztnQkFDM0IsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQzFDLE9BQU8sRUFBRSxFQUFFO2dCQUNYLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsTUFBTSxDQUFDLElBQUks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