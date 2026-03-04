define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/tunnel/common/tunnel", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, tunnel_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Tunnel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function portMappingDoTest(uri, func, expectedAddress, expectedPort) {
            const res = func(uri_1.URI.parse(uri));
            assert.strictEqual(!expectedAddress, !res);
            assert.strictEqual(res?.address, expectedAddress);
            assert.strictEqual(res?.port, expectedPort);
        }
        function portMappingTest(uri, expectedAddress, expectedPort) {
            portMappingDoTest(uri, tunnel_1.extractLocalHostUriMetaDataForPortMapping, expectedAddress, expectedPort);
        }
        function portMappingTestQuery(uri, expectedAddress, expectedPort) {
            portMappingDoTest(uri, tunnel_1.extractQueryLocalHostUriMetaDataForPortMapping, expectedAddress, expectedPort);
        }
        test('portMapping', () => {
            portMappingTest('file:///foo.bar/baz');
            portMappingTest('http://foo.bar:1234');
            portMappingTest('http://localhost:8080', 'localhost', 8080);
            portMappingTest('https://localhost:443', 'localhost', 443);
            portMappingTest('http://127.0.0.1:3456', '127.0.0.1', 3456);
            portMappingTest('http://0.0.0.0:7654', '0.0.0.0', 7654);
            portMappingTest('http://localhost:8080/path?foo=bar', 'localhost', 8080);
            portMappingTest('http://localhost:8080/path?foo=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8080);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8081);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Flocalhost%3A8081&url2=http%3A%2F%2Flocalhost%3A8082', 'localhost', 8081);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Fmicrosoft.com%2Fbad&url2=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8081);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90dW5uZWwvdGVzdC9jb21tb24vdHVubmVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBYUEsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsaUJBQWlCLENBQUMsR0FBVyxFQUNyQyxJQUFpRSxFQUNqRSxlQUF3QixFQUN4QixZQUFxQjtZQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxTQUFTLGVBQWUsQ0FBQyxHQUFXLEVBQUUsZUFBd0IsRUFBRSxZQUFxQjtZQUNwRixpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsa0RBQXlDLEVBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2xHLENBQUM7UUFFRCxTQUFTLG9CQUFvQixDQUFDLEdBQVcsRUFBRSxlQUF3QixFQUFFLFlBQXFCO1lBQ3pGLGlCQUFpQixDQUFDLEdBQUcsRUFBRSx1REFBOEMsRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkcsQ0FBQztRQUVELElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsZUFBZSxDQUFDLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzRCxlQUFlLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsZUFBZSxDQUFDLG9DQUFvQyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxlQUFlLENBQUMsOERBQThELEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25HLG9CQUFvQixDQUFDLHVEQUF1RCxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRyxvQkFBb0IsQ0FBQywwRkFBMEYsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEksb0JBQW9CLENBQUMsNkZBQTZGLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hJLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==