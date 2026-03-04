/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/network"], function (require, exports, child_process_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.listProcesses = listProcesses;
    function listProcesses(rootPid) {
        return new Promise((resolve, reject) => {
            let rootItem;
            const map = new Map();
            function addToTree(pid, ppid, cmd, load, mem) {
                const parent = map.get(ppid);
                if (pid === rootPid || parent) {
                    const item = {
                        name: findName(cmd),
                        cmd,
                        pid,
                        ppid,
                        load,
                        mem
                    };
                    map.set(pid, item);
                    if (pid === rootPid) {
                        rootItem = item;
                    }
                    if (parent) {
                        if (!parent.children) {
                            parent.children = [];
                        }
                        parent.children.push(item);
                        if (parent.children.length > 1) {
                            parent.children = parent.children.sort((a, b) => a.pid - b.pid);
                        }
                    }
                }
            }
            function findName(cmd) {
                const UTILITY_NETWORK_HINT = /--utility-sub-type=network/i;
                const WINDOWS_CRASH_REPORTER = /--crashes-directory/i;
                const WINPTY = /\\pipe\\winpty-control/i;
                const CONPTY = /conhost\.exe.+--headless/i;
                const TYPE = /--type=([a-zA-Z-]+)/;
                // find windows crash reporter
                if (WINDOWS_CRASH_REPORTER.exec(cmd)) {
                    return 'electron-crash-reporter';
                }
                // find winpty process
                if (WINPTY.exec(cmd)) {
                    return 'winpty-agent';
                }
                // find conpty process
                if (CONPTY.exec(cmd)) {
                    return 'conpty-agent';
                }
                // find "--type=xxxx"
                let matches = TYPE.exec(cmd);
                if (matches && matches.length === 2) {
                    if (matches[1] === 'renderer') {
                        return `window`;
                    }
                    else if (matches[1] === 'utility') {
                        if (UTILITY_NETWORK_HINT.exec(cmd)) {
                            return 'utility-network-service';
                        }
                        return 'utility-process';
                    }
                    else if (matches[1] === 'extensionHost') {
                        return 'extension-host'; // normalize remote extension host type
                    }
                    return matches[1];
                }
                // find all xxxx.js
                const JS = /[a-zA-Z-]+\.js/g;
                let result = '';
                do {
                    matches = JS.exec(cmd);
                    if (matches) {
                        result += matches + ' ';
                    }
                } while (matches);
                if (result) {
                    if (cmd.indexOf('node ') < 0 && cmd.indexOf('node.exe') < 0) {
                        return `electron-nodejs (${result})`;
                    }
                }
                return cmd;
            }
            if (process.platform === 'win32') {
                const cleanUNCPrefix = (value) => {
                    if (value.indexOf('\\\\?\\') === 0) {
                        return value.substring(4);
                    }
                    else if (value.indexOf('\\??\\') === 0) {
                        return value.substring(4);
                    }
                    else if (value.indexOf('"\\\\?\\') === 0) {
                        return '"' + value.substring(5);
                    }
                    else if (value.indexOf('"\\??\\') === 0) {
                        return '"' + value.substring(5);
                    }
                    else {
                        return value;
                    }
                };
                (new Promise((resolve_1, reject_1) => { require(['@vscode/windows-process-tree'], resolve_1, reject_1); })).then(windowsProcessTree => {
                    windowsProcessTree.getProcessList(rootPid, (processList) => {
                        if (!processList) {
                            reject(new Error(`Root process ${rootPid} not found`));
                            return;
                        }
                        windowsProcessTree.getProcessCpuUsage(processList, (completeProcessList) => {
                            const processItems = new Map();
                            completeProcessList.forEach(process => {
                                const commandLine = cleanUNCPrefix(process.commandLine || '');
                                processItems.set(process.pid, {
                                    name: findName(commandLine),
                                    cmd: commandLine,
                                    pid: process.pid,
                                    ppid: process.ppid,
                                    load: process.cpu || 0,
                                    mem: process.memory || 0
                                });
                            });
                            rootItem = processItems.get(rootPid);
                            if (rootItem) {
                                processItems.forEach(item => {
                                    const parent = processItems.get(item.ppid);
                                    if (parent) {
                                        if (!parent.children) {
                                            parent.children = [];
                                        }
                                        parent.children.push(item);
                                    }
                                });
                                processItems.forEach(item => {
                                    if (item.children) {
                                        item.children = item.children.sort((a, b) => a.pid - b.pid);
                                    }
                                });
                                resolve(rootItem);
                            }
                            else {
                                reject(new Error(`Root process ${rootPid} not found`));
                            }
                        });
                    }, windowsProcessTree.ProcessDataFlag.CommandLine | windowsProcessTree.ProcessDataFlag.Memory);
                });
            }
            else { // OS X & Linux
                function calculateLinuxCpuUsage() {
                    // Flatten rootItem to get a list of all VSCode processes
                    let processes = [rootItem];
                    const pids = [];
                    while (processes.length) {
                        const process = processes.shift();
                        if (process) {
                            pids.push(process.pid);
                            if (process.children) {
                                processes = processes.concat(process.children);
                            }
                        }
                    }
                    // The cpu usage value reported on Linux is the average over the process lifetime,
                    // recalculate the usage over a one second interval
                    // JSON.stringify is needed to escape spaces, https://github.com/nodejs/node/issues/6803
                    let cmd = JSON.stringify(network_1.FileAccess.asFileUri('vs/base/node/cpuUsage.sh').fsPath);
                    cmd += ' ' + pids.join(' ');
                    (0, child_process_1.exec)(cmd, {}, (err, stdout, stderr) => {
                        if (err || stderr) {
                            reject(err || new Error(stderr.toString()));
                        }
                        else {
                            const cpuUsage = stdout.toString().split('\n');
                            for (let i = 0; i < pids.length; i++) {
                                const processInfo = map.get(pids[i]);
                                processInfo.load = parseFloat(cpuUsage[i]);
                            }
                            if (!rootItem) {
                                reject(new Error(`Root process ${rootPid} not found`));
                                return;
                            }
                            resolve(rootItem);
                        }
                    });
                }
                (0, child_process_1.exec)('which ps', {}, (err, stdout, stderr) => {
                    if (err || stderr) {
                        if (process.platform !== 'linux') {
                            reject(err || new Error(stderr.toString()));
                        }
                        else {
                            const cmd = JSON.stringify(network_1.FileAccess.asFileUri('vs/base/node/ps.sh').fsPath);
                            (0, child_process_1.exec)(cmd, {}, (err, stdout, stderr) => {
                                if (err || stderr) {
                                    reject(err || new Error(stderr.toString()));
                                }
                                else {
                                    parsePsOutput(stdout, addToTree);
                                    calculateLinuxCpuUsage();
                                }
                            });
                        }
                    }
                    else {
                        const ps = stdout.toString().trim();
                        const args = '-ax -o pid=,ppid=,pcpu=,pmem=,command=';
                        // Set numeric locale to ensure '.' is used as the decimal separator
                        (0, child_process_1.exec)(`${ps} ${args}`, { maxBuffer: 1000 * 1024, env: { LC_NUMERIC: 'en_US.UTF-8' } }, (err, stdout, stderr) => {
                            // Silently ignoring the screen size is bogus error. See https://github.com/microsoft/vscode/issues/98590
                            if (err || (stderr && !stderr.includes('screen size is bogus'))) {
                                reject(err || new Error(stderr.toString()));
                            }
                            else {
                                parsePsOutput(stdout, addToTree);
                                if (process.platform === 'linux') {
                                    calculateLinuxCpuUsage();
                                }
                                else {
                                    if (!rootItem) {
                                        reject(new Error(`Root process ${rootPid} not found`));
                                    }
                                    else {
                                        resolve(rootItem);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    function parsePsOutput(stdout, addToTree) {
        const PID_CMD = /^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s+(.+)$/;
        const lines = stdout.toString().split('\n');
        for (const line of lines) {
            const matches = PID_CMD.exec(line.trim());
            if (matches && matches.length === 6) {
                addToTree(parseInt(matches[1]), parseInt(matches[2]), matches[5], parseFloat(matches[3]), parseFloat(matches[4]));
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsc0NBaVBDO0lBalBELFNBQWdCLGFBQWEsQ0FBQyxPQUFlO1FBRTVDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFFdEMsSUFBSSxRQUFpQyxDQUFDO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBRzNDLFNBQVMsU0FBUyxDQUFDLEdBQVcsRUFBRSxJQUFZLEVBQUUsR0FBVyxFQUFFLElBQVksRUFBRSxHQUFXO2dCQUVuRixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QixJQUFJLEdBQUcsS0FBSyxPQUFPLElBQUksTUFBTSxFQUFFLENBQUM7b0JBRS9CLE1BQU0sSUFBSSxHQUFnQjt3QkFDekIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUM7d0JBQ25CLEdBQUc7d0JBQ0gsR0FBRzt3QkFDSCxJQUFJO3dCQUNKLElBQUk7d0JBQ0osR0FBRztxQkFDSCxDQUFDO29CQUNGLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUVuQixJQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBQzt3QkFDckIsUUFBUSxHQUFHLElBQUksQ0FBQztvQkFDakIsQ0FBQztvQkFFRCxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7NEJBQ3RCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO3dCQUN0QixDQUFDO3dCQUNELE1BQU0sQ0FBQyxRQUFRLENB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