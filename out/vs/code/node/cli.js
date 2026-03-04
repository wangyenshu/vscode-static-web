/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "fs", "os", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/ports", "vs/base/node/pfs", "vs/base/node/ports", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/stdin", "vs/platform/environment/node/wait", "vs/platform/product/common/product", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/platform/profiling/common/profiling", "vs/base/common/network", "vs/base/common/process", "vs/base/node/unc", "vs/base/common/uri", "vs/base/common/async"], function (require, exports, child_process_1, fs_1, os_1, event_1, path_1, platform_1, ports_1, pfs_1, ports_2, nodejsWatcherLib_1, argv_1, argvHelper_1, stdin_1, wait_1, product_1, cancellation_1, extpath_1, profiling_1, network_1, process_1, unc_1, uri_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    function shouldSpawnCliProcess(argv) {
        return !!argv['install-source']
            || !!argv['list-extensions']
            || !!argv['install-extension']
            || !!argv['uninstall-extension']
            || !!argv['update-extensions']
            || !!argv['locate-extension']
            || !!argv['telemetry'];
    }
    async function main(argv) {
        let args;
        try {
            args = (0, argvHelper_1.parseCLIProcessArgv)(argv);
        }
        catch (err) {
            console.error(err.message);
            return;
        }
        for (const subcommand of argv_1.NATIVE_CLI_COMMANDS) {
            if (args[subcommand]) {
                if (!product_1.default.tunnelApplicationName) {
                    console.error(`'${subcommand}' command not supported in ${product_1.default.applicationName}`);
                    return;
                }
                const tunnelArgs = argv.slice(argv.indexOf(subcommand) + 1); // all arguments behind `tunnel`
                return new Promise((resolve, reject) => {
                    let tunnelProcess;
                    const stdio = ['ignore', 'pipe', 'pipe'];
                    if (process.env['VSCODE_DEV']) {
                        tunnelProcess = (0, child_process_1.spawn)('cargo', ['run', '--', subcommand, ...tunnelArgs], { cwd: (0, path_1.join)(getAppRoot(), 'cli'), stdio });
                    }
                    else {
                        const appPath = process.platform === 'darwin'
                            // ./Contents/MacOS/Electron => ./Contents/Resources/app/bin/code-tunnel-insiders
                            ? (0, path_1.join)((0, path_1.dirname)((0, path_1.dirname)(process.execPath)), 'Resources', 'app')
                            : (0, path_1.dirname)(process.execPath);
                        const tunnelCommand = (0, path_1.join)(appPath, 'bin', `${product_1.default.tunnelApplicationName}${platform_1.isWindows ? '.exe' : ''}`);
                        tunnelProcess = (0, child_process_1.spawn)(tunnelCommand, [subcommand, ...tunnelArgs], { cwd: (0, process_1.cwd)(), stdio });
                    }
                    tunnelProcess.stdout.pipe(process.stdout);
                    tunnelProcess.stderr.pipe(process.stderr);
                    tunnelProcess.on('exit', resolve);
                    tunnelProcess.on('error', reject);
                });
            }
        }
        // Help
        if (args.help) {
            const executable = `${product_1.default.applicationName}${platform_1.isWindows ? '.exe' : ''}`;
            console.log((0, argv_1.buildHelpMessage)(product_1.default.nameLong, executable, product_1.default.version, argv_1.OPTIONS));
        }
        // Version Info
        else if (args.version) {
            console.log((0, argv_1.buildVersionMessage)(product_1.default.version, product_1.default.commit));
        }
        // Shell integration
        else if (args['locate-shell-integration-path']) {
            let file;
            switch (args['locate-shell-integration-path']) {
                // Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path bash)"`
                case 'bash':
                    file = 'shellIntegration-bash.sh';
                    break;
                // Usage: `if ($env:TERM_PROGRAM -eq "vscode") { . "$(code --locate-shell-integration-path pwsh)" }`
                case 'pwsh':
                    file = 'shellIntegration.ps1';
                    break;
                // Usage: `[[ "$TERM_PROGRAM" == "vscode" ]] && . "$(code --locate-shell-integration-path zsh)"`
                case 'zsh':
                    file = 'shellIntegration-rc.zsh';
                    break;
                // Usage: `string match -q "$TERM_PROGRAM" "vscode"; and . (code --locate-shell-integration-path fish)`
                case 'fish':
                    file = 'fish_xdg_data/fish/vendor_conf.d/shellIntegration.fish';
                    break;
                default: throw new Error('Error using --locate-shell-integration-path: Invalid shell type');
            }
            console.log((0, path_1.join)(getAppRoot(), 'out', 'vs', 'workbench', 'contrib', 'terminal', 'browser', 'media', file));
        }
        // Extensions Management
        else if (shouldSpawnCliProcess(args)) {
            const cli = await new Promise((resolve, reject) => require(['vs/code/node/cliProcessMain'], resolve, reject));
            await cli.main(args);
            return;
        }
        // Write File
        else if (args['file-write']) {
            const source = args._[0];
            const target = args._[1];
            // Windows: set the paths as allowed UNC paths given
            // they are explicitly provided by the user as arguments
            if (platform_1.isWindows) {
                for (const path of [source, target]) {
                    if ((0, extpath_1.isUNC)(path)) {
                        (0, unc_1.addUNCHostToAllowlist)(uri_1.URI.file(path).authority);
                    }
                }
            }
            // Validate
            if (!source || !target || source === target || // make sure source and target are provided and are not the same
                !(0, path_1.isAbsolute)(source) || !(0, path_1.isAbsolute)(target) || // make sure both source and target are absolute paths
                !(0, fs_1.existsSync)(source) || !(0, fs_1.statSync)(source).isFile() || // make sure source exists as file
                !(0, fs_1.existsSync)(target) || !(0, fs_1.statSync)(target).isFile() // make sure target exists as file
            ) {
                throw new Error('Using --file-write with invalid arguments.');
            }
            try {
                // Check for readonly status and chmod if so if we are told so
                let targetMode = 0;
                let restoreMode = false;
                if (!!args['file-chmod']) {
                    targetMode = (0, fs_1.statSync)(target).mode;
                    if (!(targetMode & 0o200 /* File mode indicating writable by owner */)) {
                        (0, fs_1.chmodSync)(target, targetMode | 0o200);
                        restoreMode = true;
                    }
                }
                // Write source to target
                const data = (0, fs_1.readFileSync)(source);
                if (platform_1.isWindows) {
                    // On Windows we use a different strategy of saving the file
                    // by first truncating the file and then writing with r+ mode.
                    // This helps to save hidden files on Windows
                    // (see https://github.com/microsoft/vscode/issues/931) and
                    // prevent removing alternate data streams
                    // (see https://github.com/microsoft/vscode/issues/6363)
                    (0, fs_1.truncateSync)(target, 0);
                    (0, pfs_1.writeFileSync)(target, data, { flag: 'r+' });
                }
                else {
                    (0, pfs_1.writeFileSync)(target, data);
                }
                // Restore previous mode as needed
                if (restoreMode) {
                    (0, fs_1.chmodSync)(target, targetMode);
                }
            }
            catch (error) {
                error.message = `Error using --file-write: ${error.message}`;
                throw error;
            }
        }
        // Just Code
        else {
            const env = {
                ...process.env,
                'ELECTRON_NO_ATTACH_CONSOLE': '1'
            };
            delete env['ELECTRON_RUN_AS_NODE'];
            const processCallbacks = [];
            if (args.verbose) {
                env['ELECTRON_ENABLE_LOGGING'] = '1';
            }
            if (args.verbose || args.status) {
                processCallbacks.push(async (child) => {
                    child.stdout?.on('data', (data) => console.log(data.toString('utf8').trim()));
                    child.stderr?.on('data', (data) => console.log(data.toString('utf8').trim()));
                    await event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'exit'));
                });
            }
            const hasReadStdinArg = args._.some(arg => arg === '-');
            if (hasReadStdinArg) {
                // remove the "-" argument when we read from stdin
                args._ = args._.filter(a => a !== '-');
                argv = argv.filter(a => a !== '-');
            }
            let stdinFilePath;
            if ((0, stdin_1.hasStdinWithoutTty)()) {
                // Read from stdin: we require a single "-" argument to be passed in order to start reading from
                // stdin. We do this because there is no reliable way to find out if data is piped to stdin. Just
                // checking for stdin being connected to a TTY is not enough (https://github.com/microsoft/vscode/issues/40351)
                if (hasReadStdinArg) {
                    stdinFilePath = (0, stdin_1.getStdinFilePath)();
                    try {
                        const readFromStdinDone = new async_1.DeferredPromise();
                        await (0, stdin_1.readFromStdin)(stdinFilePath, !!args.verbose, () => readFromStdinDone.complete());
                        if (!args.wait) {
                            // if `--wait` is not provided, we keep this process alive
                            // for at least as long as the stdin stream is open to
                            // ensure that we read all the data.
                            // the downside is that the Code CLI process will then not
                            // terminate until stdin is closed, but users can always
                            // pass `--wait` to prevent that from happening (this is
                            // actually what we enforced until v1.85.x but then was
                            // changed to not enforce it anymore).
                            // a solution in the future would possibly be to exit, when
                            // the Code process exits. this would require some careful
                            // solution though in case Code is already running and this
                            // is a second instance telling the first instance what to
                            // open.
                            processCallbacks.push(() => readFromStdinDone.p);
                        }
                        // Make sure to open tmp file as editor but ignore it in the "recently open" list
                        (0, argvHelper_1.addArg)(argv, stdinFilePath);
                        (0, argvHelper_1.addArg)(argv, '--skip-add-to-recently-opened');
                        console.log(`Reading from stdin via: ${stdinFilePath}`);
                    }
                    catch (e) {
                        console.log(`Failed to create file to read via stdin: ${e.toString()}`);
                        stdinFilePath = undefined;
                    }
                }
                else {
                    // If the user pipes data via stdin but forgot to add the "-" argument, help by printing a message
                    // if we detect that data flows into via stdin after a certain timeout.
                    processCallbacks.push(_ => (0, stdin_1.stdinDataListener)(1000).then(dataReceived => {
                        if (dataReceived) {
                            if (platform_1.isWindows) {
                                console.log(`Run with '${product_1.default.applicationName} -' to read output from another program (e.g. 'echo Hello World | ${product_1.default.applicationName} -').`);
                            }
                            else {
                                console.log(`Run with '${product_1.default.applicationName} -' to read from stdin (e.g. 'ps aux | grep code | ${product_1.default.applicationName} -').`);
                            }
                        }
                    }));
                }
            }
            const isMacOSBigSurOrNewer = platform_1.isMacintosh && (0, os_1.release)() > '20.0.0';
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            let waitMarkerFilePath;
            if (args.wait) {
                waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(args.verbose);
                if (waitMarkerFilePath) {
                    (0, argvHelper_1.addArg)(argv, '--waitMarkerFilePath', waitMarkerFilePath);
                }
                // When running with --wait, we want to continue running CLI process
                // until either:
                // - the wait marker file has been deleted (e.g. when closing the editor)
                // - the launched process terminates (e.g. due to a crash)
                processCallbacks.push(async (child) => {
                    let childExitPromise;
                    if (isMacOSBigSurOrNewer) {
                        // On Big Sur, we resolve the following promise only when the child,
                        // i.e. the open command, exited with a signal or error. Otherwise, we
                        // wait for the marker file to be deleted or for the child to error.
                        childExitPromise = new Promise(resolve => {
                            // Only resolve this promise if the child (i.e. open) exited with an error
                            child.on('exit', (code, signal) => {
                                if (code !== 0 || signal) {
                                    resolve();
                                }
                            });
                        });
                    }
                    else {
                        // On other platforms, we listen for exit in case the child exits before the
                        // marker file is deleted.
                        childExitPromise = event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'exit'));
                    }
                    try {
                        await Promise.race([
                            (0, pfs_1.whenDeleted)(waitMarkerFilePath),
                            event_1.Event.toPromise(event_1.Event.fromNodeEventEmitter(child, 'error')),
                            childExitPromise
                        ]);
                    }
                    finally {
                        if (stdinFilePath) {
                            (0, fs_1.unlinkSync)(stdinFilePath); // Make sure to delete the tmp stdin file if we have any
                        }
                    }
                });
            }
            // If we have been started with `--prof-startup` we need to find free ports to profile
            // the main process, the renderer, and the extension host. We also disable v8 cached data
            // to get better profile traces. Last, we listen on stdout for a signal that tells us to
            // stop profiling.
            if (args['prof-startup']) {
                const profileHost = '127.0.0.1';
                const portMain = await (0, ports_2.findFreePort)((0, ports_1.randomPort)(), 10, 3000);
                const portRenderer = await (0, ports_2.findFreePort)(portMain + 1, 10, 3000);
                const portExthost = await (0, ports_2.findFreePort)(portRenderer + 1, 10, 3000);
                // fail the operation when one of the ports couldn't be acquired.
                if (portMain * portRenderer * portExthost === 0) {
                    throw new Error('Failed to find free ports for profiler. Make sure to shutdown all instances of the editor first.');
                }
                const filenamePrefix = (0, extpath_1.randomPath)((0, os_1.homedir)(), 'prof');
                (0, argvHelper_1.addArg)(argv, `--inspect-brk=${profileHost}:${portMain}`);
                (0, argvHelper_1.addArg)(argv, `--remote-debugging-port=${profileHost}:${portRenderer}`);
                (0, argvHelper_1.addArg)(argv, `--inspect-brk-extensions=${profileHost}:${portExthost}`);
                (0, argvHelper_1.addArg)(argv, `--prof-startup-prefix`, filenamePrefix);
                (0, argvHelper_1.addArg)(argv, `--no-cached-data`);
                (0, pfs_1.writeFileSync)(filenamePrefix, argv.slice(-6).join('|'));
                processCallbacks.push(async (_child) => {
                    class Profiler {
                        static async start(name, filenamePrefix, opts) {
                            const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
                            let session;
                            try {
                                session = await profiler.startProfiling({ ...opts, host: profileHost });
                            }
                            catch (err) {
                                console.error(`FAILED to start profiling for '${name}' on port '${opts.port}'`);
                            }
                            return {
                                async stop() {
                                    if (!session) {
                                        return;
                                    }
                                    let suffix = '';
                                    const result = await session.stop();
                                    if (!process.env['VSCODE_DEV']) {
                                        // when running from a not-development-build we remove
                                        // absolute filenames because we don't want to reveal anything
                                        // about users. We also append the `.txt` suffix to make it
                                        // easier to attach these files to GH issues
                                        result.profile = profiling_1.Utils.rewriteAbsolutePaths(result.profile, 'piiRemoved');
                                        suffix = '.txt';
                                    }
                                    (0, pfs_1.writeFileSync)(`${filenamePrefix}.${name}.cpuprofile${suffix}`, JSON.stringify(result.profile, undefined, 4));
                                }
                            };
                        }
                    }
                    try {
                        // load and start profiler
                        const mainProfileRequest = Profiler.start('main', filenamePrefix, { port: portMain });
                        const extHostProfileRequest = Profiler.start('extHost', filenamePrefix, { port: portExthost, tries: 300 });
                        const rendererProfileRequest = Profiler.start('renderer', filenamePrefix, {
                            port: portRenderer,
                            tries: 200,
                            target: function (targets) {
                                return targets.filter(target => {
                                    if (!target.webSocketDebuggerUrl) {
                                        return false;
                                    }
                                    if (target.type === 'page') {
                                        return target.url.indexOf('workbench/workbench.html') > 0 || target.url.indexOf('workbench/workbench-dev.html') > 0;
                                    }
                                    else {
                                        return true;
                                    }
                                })[0];
                            }
                        });
                        const main = await mainProfileRequest;
                        const extHost = await extHostProfileRequest;
                        const renderer = await rendererProfileRequest;
                        // wait for the renderer to delete the marker file
                        await (0, pfs_1.whenDeleted)(filenamePrefix);
                        // stop profiling
                        await main.stop();
                        await renderer.stop();
                        await extHost.stop();
                        // re-create the marker file to signal that profiling is done
                        (0, pfs_1.writeFileSync)(filenamePrefix, '');
                    }
                    catch (e) {
                        console.error('Failed to profile startup. Make sure to quit Code first.');
                    }
                });
            }
            const options = {
                detached: true,
                env
            };
            if (!args.verbose) {
                options['stdio'] = 'ignore';
            }
            let child;
            if (!isMacOSBigSurOrNewer) {
                if (!args.verbose && args.status) {
                    options['stdio'] = ['ignore', 'pipe', 'ignore']; // restore ability to see output when --status is used
                }
                // We spawn process.execPath directly
                child = (0, child_process_1.spawn)(process.execPath, argv.slice(2), options);
            }
            else {
                // On Big Sur, we spawn using the open command to obtain behavior
                // similar to if the app was launched from the dock
                // https://github.com/microsoft/vscode/issues/102975
                // The following args are for the open command itself, rather than for VS Code:
                // -n creates a new instance.
                //    Without -n, the open command re-opens the existing instance as-is.
                // -g starts the new instance in the background.
                //    Later, Electron brings the instance to the foreground.
                //    This way, Mac does not automatically try to foreground the new instance, which causes
                //    focusing issues when the new instance only sends data to a previous instance and then closes.
                const spawnArgs = ['-n', '-g'];
                // -a opens the given application.
                spawnArgs.push('-a', process.execPath); // -a: opens a specific application
                if (args.verbose || args.status) {
                    spawnArgs.push('--wait-apps'); // `open --wait-apps`: blocks until the launched app is closed (even if they were already running)
                    // The open command only allows for redirecting stderr and stdout to files,
                    // so we make it redirect those to temp files, and then use a logger to
                    // redirect the file output to the console
                    for (const outputType of args.verbose ? ['stdout', 'stderr'] : ['stdout']) {
                        // Tmp file to target output to
                        const tmpName = (0, extpath_1.randomPath)((0, os_1.tmpdir)(), `code-${outputType}`);
                        (0, pfs_1.writeFileSync)(tmpName, '');
                        spawnArgs.push(`--${outputType}`, tmpName);
                        // Listener to redirect content to stdout/stderr
                        processCallbacks.push(async (child) => {
                            try {
                                const stream = outputType === 'stdout' ? process.stdout : process.stderr;
                                const cts = new cancellation_1.CancellationTokenSource();
                                child.on('close', () => {
                                    // We must dispose the token to stop watching,
                                    // but the watcher might still be reading data.
                                    setTimeout(() => cts.dispose(true), 200);
                                });
                                await (0, nodejsWatcherLib_1.watchFileContents)(tmpName, chunk => stream.write(chunk), () => { }, cts.token);
                            }
                            finally {
                                (0, fs_1.unlinkSync)(tmpName);
                            }
                        });
                    }
                }
                for (const e in env) {
                    // Ignore the _ env var, because the open command
                    // ignores it anyway.
                    // Pass the rest of the env vars in to fix
                    // https://github.com/microsoft/vscode/issues/134696.
                    if (e !== '_') {
                        spawnArgs.push('--env');
                        spawnArgs.push(`${e}=${env[e]}`);
                    }
                }
                spawnArgs.push('--args', ...argv.slice(2)); // pass on our arguments
                if (env['VSCODE_DEV']) {
                    // If we're in development mode, replace the . arg with the
                    // vscode source arg. Because the OSS app isn't bundled,
                    // it needs the full vscode source arg to launch properly.
                    const curdir = '.';
                    const launchDirIndex = spawnArgs.indexOf(curdir);
                    if (launchDirIndex !== -1) {
                        spawnArgs[launchDirIndex] = (0, path_1.resolve)(curdir);
                    }
                }
                // We already passed over the env variables
                // using the --env flags, so we can leave them out here.
                // Also, we don't need to pass env._, which is different from argv._
                child = (0, child_process_1.spawn)('open', spawnArgs, { ...options, env: {} });
            }
            return Promise.all(processCallbacks.map(callback => callback(child)));
        }
    }
    function getAppRoot() {
        return (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath);
    }
    function eventuallyExit(code) {
        setTimeout(() => process.exit(code), 0);
    }
    main(process.argv)
        .then(() => eventuallyExit(0))
        .then(null, err => {
        console.error(err.message || err.stack || err);
        eventuallyExit(1);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9ub2RlL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBDaEcsb0JBMmRDO0lBemVELFNBQVMscUJBQXFCLENBQUMsSUFBc0I7UUFDcEQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO2VBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7ZUFDekIsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztlQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO2VBQzdCLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7ZUFDM0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztlQUMxQixDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFNTSxLQUFLLFVBQVUsSUFBSSxDQUFDLElBQWM7UUFDeEMsSUFBSSxJQUFzQixDQUFDO1FBRTNCLElBQUksQ0FBQztZQUNKLElBQUksR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0IsT0FBTztRQUNSLENBQUM7UUFFRCxLQUFLLE1BQU0sVUFBVSxJQUFJLDBCQUFtQixFQUFFLENBQUM7WUFDOUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGlCQUFPLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDcEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLFVBQVUsOEJBQThC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