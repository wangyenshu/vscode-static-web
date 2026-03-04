/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/extensionManagement/common/configRemotes"], function (require, exports, assert, utils_1, configRemotes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Config Remotes', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const allowedDomains = [
            'github.com',
            'github2.com',
            'github3.com',
            'example.com',
            'example2.com',
            'example3.com',
            'server.org',
            'server2.org',
        ];
        test('HTTPS remotes', function () {
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://github.com/microsoft/vscode.git'), allowedDomains), ['github.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://git.example.com/gitproject.git'), allowedDomains), ['example.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://username@github2.com/username/repository.git'), allowedDomains), ['github2.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://username:password@github3.com/username/repository.git'), allowedDomains), ['github3.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://username:password@example2.com:1234/username/repository.git'), allowedDomains), ['example2.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('https://example3.com:1234/username/repository.git'), allowedDomains), ['example3.com']);
        });
        test('SSH remotes', function () {
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('ssh://user@git.server.org/project.git'), allowedDomains), ['server.org']);
        });
        test('SCP-like remotes', function () {
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('git@github.com:microsoft/vscode.git'), allowedDomains), ['github.com']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('user@git.server.org:project.git'), allowedDomains), ['server.org']);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('git.server2.org:project.git'), allowedDomains), ['server2.org']);
        });
        test('Local remotes', function () {
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('/opt/git/project.git'), allowedDomains), []);
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(remote('file:///opt/git/project.git'), allowedDomains), []);
        });
        test('Multiple remotes', function () {
            const config = ['https://github.com/microsoft/vscode.git', 'https://git.example.com/gitproject.git'].map(remote).join('');
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(config, allowedDomains).sort(), ['example.com', 'github.com']);
        });
        test('Non allowed domains are anonymized', () => {
            const config = ['https://github.com/microsoft/vscode.git', 'https://git.foobar.com/gitproject.git'].map(remote).join('');
            assert.deepStrictEqual((0, configRemotes_1.getDomainsOfRemotes)(config, allowedDomains).sort(), ['aaaaaa.aaa', 'github.com']);
        });
        test('HTTPS remotes to be hashed', function () {
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://github.com/microsoft/vscode.git')), ['github.com/microsoft/vscode.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://git.example.com/gitproject.git')), ['git.example.com/gitproject.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username@github2.com/username/repository.git')), ['github2.com/username/repository.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@github3.com/username/repository.git')), ['github3.com/username/repository.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@example2.com:1234/username/repository.git')), ['example2.com/username/repository.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://example3.com:1234/username/repository.git')), ['example3.com/username/repository.git']);
            // Strip .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://github.com/microsoft/vscode.git'), true), ['github.com/microsoft/vscode']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://git.example.com/gitproject.git'), true), ['git.example.com/gitproject']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username@github2.com/username/repository.git'), true), ['github2.com/username/repository']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@github3.com/username/repository.git'), true), ['github3.com/username/repository']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@example2.com:1234/username/repository.git'), true), ['example2.com/username/repository']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://example3.com:1234/username/repository.git'), true), ['example3.com/username/repository']);
            // Compare Striped .git with no .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://github.com/microsoft/vscode.git'), true), (0, configRemotes_1.getRemotes)(remote('https://github.com/microsoft/vscode')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://git.example.com/gitproject.git'), true), (0, configRemotes_1.getRemotes)(remote('https://git.example.com/gitproject')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username@github2.com/username/repository.git'), true), (0, configRemotes_1.getRemotes)(remote('https://username@github2.com/username/repository')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@github3.com/username/repository.git'), true), (0, configRemotes_1.getRemotes)(remote('https://username:password@github3.com/username/repository')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://username:password@example2.com:1234/username/repository.git'), true), (0, configRemotes_1.getRemotes)(remote('https://username:password@example2.com:1234/username/repository')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('https://example3.com:1234/username/repository.git'), true), (0, configRemotes_1.getRemotes)(remote('https://example3.com:1234/username/repository')));
        });
        test('SSH remotes to be hashed', function () {
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('ssh://user@git.server.org/project.git')), ['git.server.org/project.git']);
            // Strip .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('ssh://user@git.server.org/project.git'), true), ['git.server.org/project']);
            // Compare Striped .git with no .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('ssh://user@git.server.org/project.git'), true), (0, configRemotes_1.getRemotes)(remote('ssh://user@git.server.org/project')));
        });
        test('SCP-like remotes to be hashed', function () {
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git@github.com:microsoft/vscode.git')), ['github.com/microsoft/vscode.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('user@git.server.org:project.git')), ['git.server.org/project.git']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git.server2.org:project.git')), ['git.server2.org/project.git']);
            // Strip .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git@github.com:microsoft/vscode.git'), true), ['github.com/microsoft/vscode']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('user@git.server.org:project.git'), true), ['git.server.org/project']);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git.server2.org:project.git'), true), ['git.server2.org/project']);
            // Compare Striped .git with no .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git@github.com:microsoft/vscode.git'), true), (0, configRemotes_1.getRemotes)(remote('git@github.com:microsoft/vscode')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('user@git.server.org:project.git'), true), (0, configRemotes_1.getRemotes)(remote('user@git.server.org:project')));
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('git.server2.org:project.git'), true), (0, configRemotes_1.getRemotes)(remote('git.server2.org:project')));
        });
        test('Local remotes to be hashed', function () {
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('/opt/git/project.git')), []);
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(remote('file:///opt/git/project.git')), []);
        });
        test('Multiple remotes to be hashed', function () {
            const config = ['https://github.com/microsoft/vscode.git', 'https://git.example.com/gitproject.git'].map(remote).join(' ');
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(config), ['github.com/microsoft/vscode.git', 'git.example.com/gitproject.git']);
            // Strip .git
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(config, true), ['github.com/microsoft/vscode', 'git.example.com/gitproject']);
            // Compare Striped .git with no .git
            const noDotGitConfig = ['https://github.com/microsoft/vscode', 'https://git.example.com/gitproject'].map(remote).join(' ');
            assert.deepStrictEqual((0, configRemotes_1.getRemotes)(config, true), (0, configRemotes_1.getRemotes)(noDotGitConfig));
        });
        function remote(url) {
            return `[remote "origin"]
	url = ${url}
	fetch = +refs/heads/*:refs/remotes/origin/*
`;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnUmVtb3Rlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC90ZXN0L2NvbW1vbi9jb25maWdSZW1vdGVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxjQUFjLEdBQUc7WUFDdEIsWUFBWTtZQUNaLGFBQWE7WUFDYixhQUFhO1lBQ2IsYUFBYTtZQUNiLGNBQWM7WUFDZCxjQUFjO1lBQ2QsWUFBWTtZQUNaLGFBQWE7U0FDYixDQUFDO1FBRUYsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUNyQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsTUFBTSxDQUFDLHlDQUF5QyxDQUFDLEVBQUUsY0FBYyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQy9ILE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBbUIsRUFBQyxNQUFNLENBQUMsd0NBQXdDLENBQUMsRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDL0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFtQixFQUFDLE1BQU0sQ0FBQyxzREFBc0QsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM3SSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQW1CLEVBQUMsTUFBTSxDQUFDLCtEQUErRCxDQUFDLEVBQUUsY0FBYyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3RKLE1BQU0sQ0FBQyxl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