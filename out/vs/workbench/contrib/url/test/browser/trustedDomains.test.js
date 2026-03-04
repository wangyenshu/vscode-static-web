/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/url/browser/trustedDomainsValidator", "vs/base/common/uri", "vs/workbench/contrib/url/browser/trustedDomains", "vs/base/test/common/utils"], function (require, exports, assert, trustedDomainsValidator_1, uri_1, trustedDomains_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function linkAllowedByRules(link, rules) {
        assert.ok((0, trustedDomainsValidator_1.isURLDomainTrusted)(uri_1.URI.parse(link), rules), `Link\n${link}\n should be allowed by rules\n${JSON.stringify(rules)}`);
    }
    function linkNotAllowedByRules(link, rules) {
        assert.ok(!(0, trustedDomainsValidator_1.isURLDomainTrusted)(uri_1.URI.parse(link), rules), `Link\n${link}\n should NOT be allowed by rules\n${JSON.stringify(rules)}`);
    }
    suite('GitHub remote extraction', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('All known formats', () => {
            assert.deepStrictEqual((0, trustedDomains_1.extractGitHubRemotesFromGitConfig)(`
[remote "1"]
			url = git@github.com:sshgit/vscode.git
[remote "2"]
			url = git@github.com:ssh/vscode
[remote "3"]
			url = https://github.com/httpsgit/vscode.git
[remote "4"]
			url = https://github.com/https/vscode`), [
                'https://github.com/sshgit/vscode/',
                'https://github.com/ssh/vscode/',
                'https://github.com/httpsgit/vscode/',
                'https://github.com/https/vscode/'
            ]);
        });
    });
    suite('Link protection domain matching', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('simple', () => {
            linkNotAllowedByRules('https://x.org', []);
            linkAllowedByRules('https://x.org', ['https://x.org']);
            linkAllowedByRules('https://x.org/foo', ['https://x.org']);
            linkNotAllowedByRules('https://x.org', ['http://x.org']);
            linkNotAllowedByRules('http://x.org', ['https://x.org']);
            linkNotAllowedByRules('https://www.x.org', ['https://x.org']);
            linkAllowedByRules('https://www.x.org', ['https://www.x.org', 'https://y.org']);
        });
        test('localhost', () => {
            linkAllowedByRules('https://127.0.0.1', []);
            linkAllowedByRules('https://127.0.0.1:3000', []);
            linkAllowedByRules('https://localhost', []);
            linkAllowedByRules('https://localhost:3000', []);
        });
        test('* star', () => {
            linkAllowedByRules('https://a.x.org', ['https://*.x.org']);
            linkAllowedByRules('https://a.b.x.org', ['https://*.x.org']);
        });
        test('no scheme', () => {
            linkAllowedByRules('https://a.x.org', ['a.x.org']);
            linkAllowedByRules('https://a.x.org', ['*.x.org']);
            linkAllowedByRules('https://a.b.x.org', ['*.x.org']);
            linkAllowedByRules('https://x.org', ['*.x.org']);
        });
        test('sub paths', () => {
            linkAllowedByRules('https://x.org/foo', ['https://x.org/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo']);
            linkAllowedByRules('https://x.org/foo', ['https://x.org/foo/']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo/']);
            linkAllowedByRules('https://x.org/foo', ['x.org/foo']);
            linkAllowedByRules('https://x.org/foo', ['*.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['https://x.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['x.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['*.org/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo']);
            linkNotAllowedByRules('https://x.org/foo2', ['https://x.org/foo']);
            linkNotAllowedByRules('https://www.x.org/foo', ['https://x.org/foo']);
            linkNotAllowedByRules('https://a.x.org/bar', ['https://*.x.org/foo']);
            linkNotAllowedByRules('https://a.b.x.org/bar', ['https://*.x.org/foo']);
            linkAllowedByRules('https://github.com', ['https://github.com/foo/bar', 'https://github.com']);
        });
        test('ports', () => {
            linkNotAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:8081/foo']);
            linkAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:*/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org:*/foo']);
            linkAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:8080/foo']);
        });
        test('ip addresses', () => {
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.7/']);
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.7']);
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.*']);
            linkNotAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.*.6:*']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.7:3000/']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.7:*']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.*:*']);
            linkNotAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.*.6:*']);
        });
        test('scheme match', () => {
            linkAllowedByRules('http://192.168.1.7/', ['http://*']);
            linkAllowedByRules('http://twitter.com', ['http://*']);
            linkAllowedByRules('http://twitter.com/hello', ['http://*']);
            linkNotAllowedByRules('https://192.168.1.7/', ['http://*']);
            linkNotAllowedByRules('https://twitter.com/', ['http://*']);
        });
        test('case normalization', () => {
            // https://github.com/microsoft/vscode/issues/99294
            linkAllowedByRules('https://github.com/microsoft/vscode/issues/new', ['https://github.com/microsoft']);
            linkAllowedByRules('https://github.com/microsoft/vscode/issues/new', ['https://github.com/microsoft']);
        });
        test('ignore query & fragment - https://github.com/microsoft/vscode/issues/156839', () => {
            linkAllowedByRules('https://github.com/login/oauth/authorize?foo=4', ['https://github.com/login/oauth/authorize']);
            linkAllowedByRules('https://github.com/login/oauth/authorize#foo', ['https://github.com/login/oauth/authorize']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZERvbWFpbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VybC90ZXN0L2Jyb3dzZXIvdHJ1c3RlZERvbWFpbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxTQUFTLGtCQUFrQixDQUFDLElBQVksRUFBRSxLQUFlO1FBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSw0Q0FBa0IsRUFBQyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsSUFBSSxrQ0FBa0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0gsQ0FBQztJQUNELFNBQVMscUJBQXFCLENBQUMsSUFBWSxFQUFFLEtBQWU7UUFDM0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEsNENBQWtCLEVBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxTQUFTLElBQUksc0NBQXNDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BJLENBQUM7SUFFRCxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3RDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEsa0RBQWlDLEVBQ2hDOzs7Ozs7Ozt5Q0FRcUMsQ0FBQyxFQUN2QztnQkFDQyxtQ0FBbUM7Z0JBQ25DLGdDQUFnQztnQkFDaEMscUNBQXFDO2dCQUNyQyxrQ0FBa0M7YUFDbEMsQ0FBQyxDQUFDO1FBQ0wsQ0FB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