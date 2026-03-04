/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/extpath", "vs/base/common/platform"], function (require, exports, cp, extpath_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasChildProcesses = hasChildProcesses;
    exports.prepareCommand = prepareCommand;
    function spawnAsPromised(command, args) {
        return new Promise((resolve, reject) => {
            let stdout = '';
            const child = cp.spawn(command, args);
            if (child.pid) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            child.on('error', err => {
                reject(err);
            });
            child.on('close', code => {
                resolve(stdout);
            });
        });
    }
    async function hasChildProcesses(processId) {
        if (processId) {
            // if shell has at least one child process, assume that shell is busy
            if (platform.isWindows) {
                const windowsProcessTree = await new Promise((resolve_1, reject_1) => { require(['@vscode/windows-process-tree'], resolve_1, reject_1); });
                return new Promise(resolve => {
                    windowsProcessTree.getProcessTree(processId, processTree => {
                        resolve(!!processTree && processTree.children.length > 0);
                    });
                });
            }
            else {
                return spawnAsPromised('/usr/bin/pgrep', ['-lP', String(processId)]).then(stdout => {
                    const r = stdout.trim();
                    if (r.length === 0 || r.indexOf(' tmux') >= 0) { // ignore 'tmux'; see #43683
                        return false;
                    }
                    else {
                        return true;
                    }
                }, error => {
                    return true;
                });
            }
        }
        // fall back to safe side
        return Promise.resolve(true);
    }
    var ShellType;
    (function (ShellType) {
        ShellType[ShellType["cmd"] = 0] = "cmd";
        ShellType[ShellType["powershell"] = 1] = "powershell";
        ShellType[ShellType["bash"] = 2] = "bash";
    })(ShellType || (ShellType = {}));
    function prepareCommand(shell, args, argsCanBeInterpretedByShell, cwd, env) {
        shell = shell.trim().toLowerCase();
        // try to determine the shell type
        let shellType;
        if (shell.indexOf('powershell') >= 0 || shell.indexOf('pwsh') >= 0) {
            shellType = 1 /* ShellType.powershell */;
        }
        else if (shell.indexOf('cmd.exe') >= 0) {
            shellType = 0 /* ShellType.cmd */;
        }
        else if (shell.indexOf('bash') >= 0) {
            shellType = 2 /* ShellType.bash */;
        }
        else if (platform.isWindows) {
            shellType = 0 /* ShellType.cmd */; // pick a good default for Windows
        }
        else {
            shellType = 2 /* ShellType.bash */; // pick a good default for anything else
        }
        let quote;
        // begin command with a space to avoid polluting shell history
        let command = ' ';
        switch (shellType) {
            case 1 /* ShellType.powershell */:
                quote = (s) => {
                    s = s.replace(/\'/g, '\'\'');
                    if (s.length > 0 && s.charAt(s.length - 1) === '\\') {
                        return `'${s}\\'`;
                    }
                    return `'${s}'`;
                };
                if (cwd) {
                    const driveLetter = (0, extpath_1.getDriveLetter)(cwd);
                    if (driveLetter) {
                        command += `${driveLetter}:; `;
                    }
                    command += `cd ${quote(cwd)}; `;
                }
                if (env) {
                    for (const key in env) {
                        const value = env[key];
                        if (value === null) {
                            command += `Remove-Item env:${key}; `;
                        }
                        else {
                            command += `\${env:${key}}='${value}'; `;
                        }
                    }
                }
                if (args.length > 0) {
                    const arg = args.shift();
                    const cmd = argsCanBeInterpretedByShell ? arg : quote(arg);
                    command += (cmd[0] === '\'') ? `& ${cmd} ` : `${cmd} `;
                    for (const a of args) {
                        command += (a === '<' || a === '>' || argsCanBeInterpretedByShell) ? a : quote(a);
                        command += ' ';
                    }
                }
                break;
            case 0 /* ShellType.cmd */:
                quote = (s) => {
                    // Note: Wrapping in cmd /C "..." complicates the escaping.
                    // cmd /C "node -e "console.log(process.argv)" """A^>0"""" # prints "A>0"
                    // cmd /C "node -e "console.log(process.argv)" "foo^> bar"" # prints foo> bar
                    // Outside of the cmd /C, it could be a simple quoting, but here, the ^ is needed too
                    s = s.replace(/\"/g, '""');
                    s = s.replace(/([><!^&|])/g, '^$1');
                    return (' "'.split('').some(char => s.includes(char)) || s.length === 0) ? `"${s}"` : s;
                };
                if (cwd) {
                    const driveLetter = (0, extpath_1.getDriveLetter)(cwd);
                    if (driveLetter) {
                        command += `${driveLetter}: && `;
                    }
                    command += `cd ${quote(cwd)} && `;
                }
                if (env) {
                    command += 'cmd /C "';
                    for (const key in env) {
                        let value = env[key];
                        if (value === null) {
                            command += `set "${key}=" && `;
                        }
                        else {
                            value = value.replace(/[&^|<>]/g, s => `^${s}`);
                            command += `set "${key}=${value}" && `;
                        }
                    }
                }
                for (const a of args) {
                    command += (a === '<' || a === '>' || argsCanBeInterpretedByShell) ? a : quote(a);
                    command += ' ';
                }
                if (env) {
                    command += '"';
                }
                break;
            case 2 /* ShellType.bash */: {
                quote = (s) => {
                    s = s.replace(/(["'\\\$!><#()\[\]*&^| ;{}?`])/g, '\\$1');
                    return s.length === 0 ? `""` : s;
                };
                const hardQuote = (s) => {
                    return /[^\w@%\/+=,.:^-]/.test(s) ? `'${s.replace(/'/g, '\'\\\'\'')}'` : s;
                };
                if (cwd) {
                    command += `cd ${quote(cwd)} ; `;
                }
                if (env) {
                    command += '/usr/bin/env';
                    for (const key in env) {
                        const value = env[key];
                        if (value === null) {
                            command += ` -u ${hardQuote(key)}`;
                        }
                        else {
                            command += ` ${hardQuote(`${key}=${value}`)}`;
                        }
                    }
                    command += ' ';
                }
                for (const a of args) {
                    command += (a === '<' || a === '>' || argsCanBeInterpretedByShell) ? a : quote(a);
                    command += ' ';
                }
                break;
            }
        }
        return command;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvbm9kZS90ZXJtaW5hbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3QmhHLDhDQTBCQztJQUtELHdDQXlJQztJQTFMRCxTQUFTLGVBQWUsQ0FBQyxPQUFlLEVBQUUsSUFBYztRQUN2RCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3RDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDZixLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtvQkFDeEMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDM0IsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hCLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxTQUE2QjtRQUNwRSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBRWYs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