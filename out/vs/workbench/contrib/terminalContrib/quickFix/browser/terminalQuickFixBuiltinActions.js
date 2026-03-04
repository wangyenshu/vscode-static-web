/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix"], function (require, exports, uri_1, nls_1, quickFix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickFixSource = exports.PwshUnixCommandNotFoundErrorOutputRegex = exports.PwshGeneralErrorOutputRegex = exports.GitCreatePrOutputRegex = exports.GitPushOutputRegex = exports.FreePortOutputRegex = exports.GitSimilarOutputRegex = exports.GitTwoDashesRegex = exports.GitPushCommandLineRegex = exports.GitPullOutputRegex = exports.GitCommandLineRegex = void 0;
    exports.gitSimilar = gitSimilar;
    exports.gitPull = gitPull;
    exports.gitTwoDashes = gitTwoDashes;
    exports.freePort = freePort;
    exports.gitPushSetUpstream = gitPushSetUpstream;
    exports.gitCreatePr = gitCreatePr;
    exports.pwshGeneralError = pwshGeneralError;
    exports.pwshUnixCommandNotFoundError = pwshUnixCommandNotFoundError;
    exports.GitCommandLineRegex = /git/;
    exports.GitPullOutputRegex = /and can be fast-forwarded/;
    exports.GitPushCommandLineRegex = /git\s+push/;
    exports.GitTwoDashesRegex = /error: did you mean `--(.+)` \(with two dashes\)\?/;
    exports.GitSimilarOutputRegex = /(?:(most similar commands? (is|are)))/;
    exports.FreePortOutputRegex = /(?:address already in use (?:0\.0\.0\.0|127\.0\.0\.1|localhost|::):|Unable to bind [^ ]*:|can't listen on port |listen EADDRINUSE [^ ]*:)(?<portNumber>\d{4,5})/;
    exports.GitPushOutputRegex = /git push --set-upstream origin (?<branchName>[^\s]+)/;
    // The previous line starts with "Create a pull request for \'([^\s]+)\' on GitHub by visiting:\s*"
    // it's safe to assume it's a github pull request if the URL includes `/pull/`
    exports.GitCreatePrOutputRegex = /remote:\s*(?<link>https:\/\/github\.com\/.+\/.+\/pull\/new\/.+)/;
    exports.PwshGeneralErrorOutputRegex = /Suggestion \[General\]:/;
    exports.PwshUnixCommandNotFoundErrorOutputRegex = /Suggestion \[cmd-not-found\]:/;
    var QuickFixSource;
    (function (QuickFixSource) {
        QuickFixSource["Builtin"] = "builtin";
    })(QuickFixSource || (exports.QuickFixSource = QuickFixSource = {}));
    function gitSimilar() {
        return {
            id: 'Git Similar',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitSimilarOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const regexMatch = matchResult.outputMatch?.regexMatch[0];
                if (!regexMatch || !matchResult.outputMatch) {
                    return;
                }
                const actions = [];
                const startIndex = matchResult.outputMatch.outputLines.findIndex(l => l.includes(regexMatch)) + 1;
                const results = matchResult.outputMatch.outputLines.map(r => r.trim());
                for (let i = startIndex; i < results.length; i++) {
                    const fixedCommand = results[i];
                    if (fixedCommand) {
                        actions.push({
                            id: 'Git Similar',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: matchResult.commandLine.replace(/git\s+[^\s]+/, () => `git ${fixedCommand}`),
                            shouldExecute: true,
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                    }
                }
                return actions;
            }
        };
    }
    function gitPull() {
        return {
            id: 'Git Pull',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitPullOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 8
            },
            commandExitResult: 'success',
            getQuickFixes: (matchResult) => {
                return {
                    type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                    id: 'Git Pull',
                    terminalCommand: `git pull`,
                    shouldExecute: true,
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function gitTwoDashes() {
        return {
            id: 'Git Two Dashes',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitTwoDashesRegex,
                anchor: 'bottom',
                offset: 0,
                length: 2
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const problemArg = matchResult?.outputMatch?.regexMatch?.[1];
                if (!problemArg) {
                    return;
                }
                return {
                    type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                    id: 'Git Two Dashes',
                    terminalCommand: matchResult.commandLine.replace(` -${problemArg}`, () => ` --${problemArg}`),
                    shouldExecute: true,
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function freePort(runCallback) {
        return {
            id: 'Free Port',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.FreePortOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 30
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const port = matchResult?.outputMatch?.regexMatch?.groups?.portNumber;
                if (!port) {
                    return;
                }
                const label = (0, nls_1.localize)("terminal.freePort", "Free port {0}", port);
                return {
                    type: quickFix_1.TerminalQuickFixType.Port,
                    class: undefined,
                    tooltip: label,
                    id: 'Free Port',
                    label,
                    enabled: true,
                    source: "builtin" /* QuickFixSource.Builtin */,
                    run: () => runCallback(port, matchResult.commandLine)
                };
            }
        };
    }
    function gitPushSetUpstream() {
        return {
            id: 'Git Push Set Upstream',
            type: 'internal',
            commandLineMatcher: exports.GitPushCommandLineRegex,
            /**
                Example output on Windows:
                8: PS C:\Users\merogge\repos\xterm.js> git push
                7: fatal: The current branch sdjfskdjfdslkjf has no upstream branch.
                6: To push the current branch and set the remote as upstream, use
                5:
                4:	git push --set-upstream origin sdjfskdjfdslkjf
                3:
                2: To have this happen automatically for branches without a tracking
                1: upstream, see 'push.autoSetupRemote' in 'git help config'.
                0:
    
                Example output on macOS:
                5: meganrogge@Megans-MacBook-Pro xterm.js % git push
                4: fatal: The current branch merogge/asjdkfsjdkfsdjf has no upstream branch.
                3: To push the current branch and set the remote as upstream, use
                2:
                1:	git push --set-upstream origin merogge/asjdkfsjdkfsdjf
                0:
             */
            outputMatcher: {
                lineMatcher: exports.GitPushOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 8
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const matches = matchResult.outputMatch;
                const commandToRun = 'git push --set-upstream origin ${group:branchName}';
                if (!matches) {
                    return;
                }
                const groups = matches.regexMatch.groups;
                if (!groups) {
                    return;
                }
                const actions = [];
                let fixedCommand = commandToRun;
                for (const [key, value] of Object.entries(groups)) {
                    const varToResolve = '${group:' + `${key}` + '}';
                    if (!commandToRun.includes(varToResolve)) {
                        return [];
                    }
                    fixedCommand = fixedCommand.replaceAll(varToResolve, () => value);
                }
                if (fixedCommand) {
                    actions.push({
                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                        id: 'Git Push Set Upstream',
                        terminalCommand: fixedCommand,
                        shouldExecute: true,
                        source: "builtin" /* QuickFixSource.Builtin */
                    });
                    return actions;
                }
                return;
            }
        };
    }
    function gitCreatePr() {
        return {
            id: 'Git Create Pr',
            type: 'internal',
            commandLineMatcher: exports.GitPushCommandLineRegex,
            // Example output:
            // ...
            // 10: remote:
            // 9:  remote: Create a pull request for 'my_branch' on GitHub by visiting:
            // 8:  remote:      https://github.com/microsoft/vscode/pull/new/my_branch
            // 7:  remote:
            // 6:  remote: GitHub found x vulnerabilities on microsoft/vscode's default branch (...). To find out more, visit:
            // 5:  remote:      https://github.com/microsoft/vscode/security/dependabot
            // 4:  remote:
            // 3:  To https://github.com/microsoft/vscode
            // 2:  * [new branch]              my_branch -> my_branch
            // 1:  Branch 'my_branch' set up to track remote branch 'my_branch' from 'origin'.
            // 0:
            outputMatcher: {
                lineMatcher: exports.GitCreatePrOutputRegex,
                anchor: 'bottom',
                offset: 4,
                // ~6 should only be needed here for security alerts, but the git provider can customize
                // the text, so use 12 to be safe.
                length: 12
            },
            commandExitResult: 'success',
            getQuickFixes: (matchResult) => {
                const link = matchResult?.outputMatch?.regexMatch?.groups?.link?.trimEnd();
                if (!link) {
                    return;
                }
                const label = (0, nls_1.localize)("terminal.createPR", "Create PR {0}", link);
                return {
                    id: 'Git Create Pr',
                    label,
                    enabled: true,
                    type: quickFix_1.TerminalQuickFixType.Opener,
                    uri: uri_1.URI.parse(link),
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function pwshGeneralError() {
        return {
            id: 'Pwsh General Error',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.PwshGeneralErrorOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const lines = matchResult.outputMatch?.regexMatch.input?.split('\n');
                if (!lines) {
                    return;
                }
                // Find the start
                let i = 0;
                let inFeedbackProvider = false;
                for (; i < lines.length; i++) {
                    if (lines[i].match(exports.PwshGeneralErrorOutputRegex)) {
                        inFeedbackProvider = true;
                        break;
                    }
                }
                if (!inFeedbackProvider) {
                    return;
                }
                const suggestions = lines[i + 1].match(/The most similar commands are: (?<values>.+)./)?.groups?.values?.split(', ');
                if (!suggestions) {
                    return;
                }
                const result = [];
                for (const suggestion of suggestions) {
                    result.push({
                        id: 'Pwsh General Error',
                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                        terminalCommand: suggestion,
                        source: "builtin" /* QuickFixSource.Builtin */
                    });
                }
                return result;
            }
        };
    }
    function pwshUnixCommandNotFoundError() {
        return {
            id: 'Unix Command Not Found',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.PwshUnixCommandNotFoundErrorOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const lines = matchResult.outputMatch?.regexMatch.input?.split('\n');
                if (!lines) {
                    return;
                }
                // Find the start
                let i = 0;
                let inFeedbackProvider = false;
                for (; i < lines.length; i++) {
                    if (lines[i].match(exports.PwshUnixCommandNotFoundErrorOutputRegex)) {
                        inFeedbackProvider = true;
                        break;
                    }
                }
                if (!inFeedbackProvider) {
                    return;
                }
                // Always remove the first element as it's the "Suggestion [cmd-not-found]"" line
                const result = [];
                let inSuggestions = false;
                for (; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.length === 0) {
                        break;
                    }
                    const installCommand = line.match(/You also have .+ installed, you can run '(?<command>.+)' instead./)?.groups?.command;
                    if (installCommand) {
                        result.push({
                            id: 'Pwsh Unix Command Not Found Error',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: installCommand,
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                        inSuggestions = false;
                        continue;
                    }
                    if (line.match(/Command '.+' not found, but can be installed with:/)) {
                        inSuggestions = true;
                        continue;
                    }
                    if (inSuggestions) {
                        result.push({
                            id: 'Pwsh Unix Command Not Found Error',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: line.trim(),
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                    }
                }
                return result;
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxRdWlja0ZpeEJ1aWx0aW5BY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3F1aWNrRml4L2Jyb3dzZXIvdGVybWluYWxRdWlja0ZpeEJ1aWx0aW5BY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsZ0NBbUNDO0lBRUQsMEJBc0JDO0lBRUQsb0NBMEJDO0lBQ0QsNEJBOEJDO0lBRUQsZ0RBZ0VDO0lBRUQsa0NBMkNDO0lBRUQsNENBK0NDO0lBRUQsb0VBa0VDO0lBM1dZLFFBQUEsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBQzVCLFFBQUEsa0JBQWtCLEdBQUcsMkJBQTJCLENBQUM7SUFDakQsUUFBQSx1QkFBdUIsR0FBRyxZQUFZLENBQUM7SUFDdkMsUUFBQSxpQkFBaUIsR0FBRyxvREFBb0QsQ0FBQztJQUN6RSxRQUFBLHFCQUFxQixHQUFHLHVDQUF1QyxDQUFDO0lBQ2hFLFFBQUEsbUJBQW1CLEdBQUcsaUtBQWlLLENBQUM7SUFDeEwsUUFBQSxrQkFBa0IsR0FBRyxzREFBc0QsQ0FBQztJQUN6RixtR0FBbUc7SUFDbkcsOEVBQThFO0lBQ2pFLFFBQUEsc0JBQXNCLEdBQUcsaUVBQWlFLENBQUM7SUFDM0YsUUFBQSwyQkFBMkIsR0FBRyx5QkFBeUIsQ0FBQztJQUN4RCxRQUFBLHVDQUF1QyxHQUFHLCtCQUErQixDQUFDO0lBRXZGLElBQWtCLGNBRWpCO0lBRkQsV0FBa0IsY0FBYztRQUMvQixxQ0FBbUIsQ0FBQTtJQUNwQixDQUFDLEVBRmlCLGNBQWMsOEJBQWQsY0FBYyxRQUUvQjtJQUVELFNBQWdCLFVBQVU7UUFDekIsT0FBTztZQUNOLEVBQUUsRUFBRSxhQUFhO1lBQ2pCLElBQUksRUFBRSxV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