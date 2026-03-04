/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "url", "child_process", "http", "vs/base/common/process", "vs/base/common/path", "vs/platform/environment/node/argv", "vs/platform/environment/node/wait", "vs/platform/environment/node/stdin", "vs/base/common/async"], function (require, exports, _fs, _url, _cp, _http, process_1, path_1, argv_1, wait_1, stdin_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    const isSupportedForCmd = (optionId) => {
        switch (optionId) {
            case 'user-data-dir':
            case 'extensions-dir':
            case 'export-default-configuration':
            case 'install-source':
            case 'enable-smoke-test-driver':
            case 'extensions-download-dir':
            case 'builtin-extensions-dir':
            case 'telemetry':
                return false;
            default:
                return true;
        }
    };
    const isSupportedForPipe = (optionId) => {
        switch (optionId) {
            case 'version':
            case 'help':
            case 'folder-uri':
            case 'file-uri':
            case 'add':
            case 'diff':
            case 'merge':
            case 'wait':
            case 'goto':
            case 'reuse-window':
            case 'new-window':
            case 'status':
            case 'install-extension':
            case 'uninstall-extension':
            case 'update-extensions':
            case 'list-extensions':
            case 'force':
            case 'show-versions':
            case 'category':
            case 'verbose':
            case 'remote':
            case 'locate-shell-integration-path':
                return true;
            default:
                return false;
        }
    };
    const cliPipe = process.env['VSCODE_IPC_HOOK_CLI'];
    const cliCommand = process.env['VSCODE_CLIENT_COMMAND'];
    const cliCommandCwd = process.env['VSCODE_CLIENT_COMMAND_CWD'];
    const cliRemoteAuthority = process.env['VSCODE_CLI_AUTHORITY'];
    const cliStdInFilePath = process.env['VSCODE_STDIN_FILE_PATH'];
    async function main(desc, args) {
        if (!cliPipe && !cliCommand) {
            console.log('Command is only available in WSL or inside a Visual Studio Code terminal.');
            return;
        }
        // take the local options and remove the ones that don't apply
        const options = { ...argv_1.OPTIONS, gitCredential: { type: 'string' }, openExternal: { type: 'boolean' } };
        const isSupported = cliCommand ? isSupportedForCmd : isSupportedForPipe;
        for (const optionId in argv_1.OPTIONS) {
            const optId = optionId;
            if (!isSupported(optId)) {
                delete options[optId];
            }
        }
        if (cliPipe) {
            options['openExternal'] = { type: 'boolean' };
        }
        const errorReporter = {
            onMultipleValues: (id, usedValue) => {
                console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
            },
            onEmptyValue: (id) => {
                console.error(`Ignoring option '${id}': Value must not be empty.`);
            },
            onUnknownOption: (id) => {
                console.error(`Ignoring option '${id}': not supported for ${desc.executableName}.`);
            },
            onDeprecatedOption: (deprecatedOption, message) => {
                console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
            }
        };
        const parsedArgs = (0, argv_1.parseArgs)(args, options, errorReporter);
        const mapFileUri = cliRemoteAuthority ? mapFileToRemoteUri : (uri) => uri;
        const verbose = !!parsedArgs['verbose'];
        if (parsedArgs.help) {
            console.log((0, argv_1.buildHelpMessage)(desc.productName, desc.executableName, desc.version, options));
            return;
        }
        if (parsedArgs.version) {
            console.log((0, argv_1.buildVersionMessage)(desc.version, desc.commit));
            return;
        }
        if (parsedArgs['locate-shell-integration-path']) {
            let file;
            switch (parsedArgs['locate-shell-integration-path']) {
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
            console.log((0, path_1.resolve)(__dirname, '../..', 'workbench', 'contrib', 'terminal', 'browser', 'media', file));
            return;
        }
        if (cliPipe) {
            if (parsedArgs['openExternal']) {
                openInBrowser(parsedArgs['_'], verbose);
                return;
            }
        }
        let remote = parsedArgs.remote;
        if (remote === 'local' || remote === 'false' || remote === '') {
            remote = null; // null represent a local window
        }
        const folderURIs = (parsedArgs['folder-uri'] || []).map(mapFileUri);
        parsedArgs['folder-uri'] = folderURIs;
        const fileURIs = (parsedArgs['file-uri'] || []).map(mapFileUri);
        parsedArgs['file-uri'] = fileURIs;
        const inputPaths = parsedArgs['_'];
        let hasReadStdinArg = false;
        for (const input of inputPaths) {
            if (input === '-') {
                hasReadStdinArg = true;
            }
            else {
                translatePath(input, mapFileUri, folderURIs, fileURIs);
            }
        }
        parsedArgs['_'] = [];
        let readFromStdinPromise;
        if (hasReadStdinArg && (0, stdin_1.hasStdinWithoutTty)()) {
            try {
                let stdinFilePath = cliStdInFilePath;
                if (!stdinFilePath) {
                    stdinFilePath = (0, stdin_1.getStdinFilePath)();
                    const readFromStdinDone = new async_1.DeferredPromise();
                    await (0, stdin_1.readFromStdin)(stdinFilePath, verbose, () => readFromStdinDone.complete()); // throws error if file can not be written
                    if (!parsedArgs.wait) {
                        // if `--wait` is not provided, we keep this process alive
                        // for at least as long as the stdin stream is open to
                        // ensure that we read all the data.
                        readFromStdinPromise = readFromStdinDone.p;
                    }
                }
                // Make sure to open tmp file
                translatePath(stdinFilePath, mapFileUri, folderURIs, fileURIs);
                // Ignore adding this to history
                parsedArgs['skip-add-to-recently-opened'] = true;
                console.log(`Reading from stdin via: ${stdinFilePath}`);
            }
            catch (e) {
                console.log(`Failed to create file to read via stdin: ${e.toString()}`);
            }
        }
        if (parsedArgs.extensionDevelopmentPath) {
            parsedArgs.extensionDevelopmentPath = parsedArgs.extensionDevelopmentPath.map(p => mapFileUri(pathToURI(p).href));
        }
        if (parsedArgs.extensionTestsPath) {
            parsedArgs.extensionTestsPath = mapFileUri(pathToURI(parsedArgs['extensionTestsPath']).href);
        }
        const crashReporterDirectory = parsedArgs['crash-reporter-directory'];
        if (crashReporterDirectory !== undefined && !crashReporterDirectory.match(/^([a-zA-Z]:[\\\/])/)) {
            console.log(`The crash reporter directory '${crashReporterDirectory}' must be an absolute Windows path (e.g. c:/crashes)`);
            return;
        }
        if (cliCommand) {
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions'] || parsedArgs['update-extensions']) {
                const cmdLine = [];
                parsedArgs['install-extension']?.forEach(id => cmdLine.push('--install-extension', id));
                parsedArgs['uninstall-extension']?.forEach(id => cmdLine.push('--uninstall-extension', id));
                ['list-extensions', 'force', 'show-versions', 'category'].forEach(opt => {
                    const value = parsedArgs[opt];
                    if (value !== undefined) {
                        cmdLine.push(`--${opt}=${value}`);
                    }
                });
                if (parsedArgs['update-extensions']) {
                    cmdLine.push('--update-extensions');
                }
                const cp = _cp.fork((0, path_1.join)(__dirname, '../../../server-main.js'), cmdLine, { stdio: 'inherit' });
                cp.on('error', err => console.log(err));
                return;
            }
            const newCommandline = [];
            for (const key in parsedArgs) {
                const val = parsedArgs[key];
                if (typeof val === 'boolean') {
                    if (val) {
                        newCommandline.push('--' + key);
                    }
                }
                else if (Array.isArray(val)) {
                    for (const entry of val) {
                        newCommandline.push(`--${key}=${entry.toString()}`);
                    }
                }
                else if (val) {
                    newCommandline.push(`--${key}=${val.toString()}`);
                }
            }
            if (remote !== null) {
                newCommandline.push(`--remote=${remote || cliRemoteAuthority}`);
            }
            const ext = (0, path_1.extname)(cliCommand);
            if (ext === '.bat' || ext === '.cmd') {
                const processCwd = cliCommandCwd || (0, process_1.cwd)();
                if (verbose) {
                    console.log(`Invoking: cmd.exe /C ${cliCommand} ${newCommandline.join(' ')} in ${processCwd}`);
                }
                _cp.spawn('cmd.exe', ['/C', cliCommand, ...newCommandline], {
                    stdio: 'inherit',
                    cwd: processCwd
                });
            }
            else {
                const cliCwd = (0, path_1.dirname)(cliCommand);
                const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
                newCommandline.unshift('resources/app/out/cli.js');
                if (verbose) {
                    console.log(`Invoking: cd "${cliCwd}" && ELECTRON_RUN_AS_NODE=1 "${cliCommand}" "${newCommandline.join('" "')}"`);
                }
                if (runningInWSL2()) {
                    if (verbose) {
                        console.log(`Using pipes for output.`);
                    }
                    const cp = _cp.spawn(cliCommand, newCommandline, { cwd: cliCwd, env, stdio: ['inherit', 'pipe', 'pipe'] });
                    cp.stdout.on('data', data => process.stdout.write(data));
                    cp.stderr.on('data', data => process.stderr.write(data));
                }
                else {
                    _cp.spawn(cliCommand, newCommandline, { cwd: cliCwd, env, stdio: 'inherit' });
                }
            }
        }
        else {
            if (parsedArgs.status) {
                sendToPipe({
                    type: 'status'
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when requesting status:', e);
                });
                return;
            }
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions'] || parsedArgs['update-extensions']) {
                sendToPipe({
                    type: 'extensionManagement',
                    list: parsedArgs['list-extensions'] ? { showVersions: parsedArgs['show-versions'], category: parsedArgs['category'] } : undefined,
                    install: asExtensionIdOrVSIX(parsedArgs['install-extension']),
                    uninstall: asExtensionIdOrVSIX(parsedArgs['uninstall-extension']),
                    force: parsedArgs['force']
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when invoking the extension management command:', e);
                });
                return;
            }
            let waitMarkerFilePath = undefined;
            if (parsedArgs['wait']) {
                if (!fileURIs.length) {
                    console.log('At least one file must be provided to wait for.');
                    return;
                }
                waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(verbose);
            }
            sendToPipe({
                type: 'open',
                fileURIs,
                folderURIs,
                diffMode: parsedArgs.diff,
                mergeMode: parsedArgs.merge,
                addMode: parsedArgs.add,
                gotoLineMode: parsedArgs.goto,
                forceReuseWindow: parsedArgs['reuse-window'],
                forceNewWindow: parsedArgs['new-window'],
                waitMarkerFilePath,
                remoteAuthority: remote
            }, verbose).catch(e => {
                console.error('Error when invoking the open command:', e);
            });
            if (waitMarkerFilePath) {
                waitForFileDeleted(waitMarkerFilePath);
            }
            if (readFromStdinPromise) {
                await readFromStdinPromise;
            }
        }
    }
    function runningInWSL2() {
        if (!!process.env['WSL_DISTRO_NAME']) {
            try {
                return _cp.execSync('uname -r', { encoding: 'utf8' }).includes('-microsoft-');
            }
            catch (_e) {
                // Ignore
            }
        }
        return false;
    }
    async function waitForFileDeleted(path) {
        while (_fs.existsSync(path)) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    function openInBrowser(args, verbose) {
        const uris = [];
        for (const location of args) {
            try {
                if (/^(http|https|file):\/\//.test(location)) {
                    uris.push(_url.parse(location).href);
                }
                else {
                    uris.push(pathToURI(location).href);
                }
            }
            catch (e) {
                console.log(`Invalid url: ${location}`);
            }
        }
        if (uris.length) {
            sendToPipe({
                type: 'openExternal',
                uris
            }, verbose).catch(e => {
                console.error('Error when invoking the open external command:', e);
            });
        }
    }
    function sendToPipe(args, verbose) {
        if (verbose) {
            console.log(JSON.stringify(args, null, '  '));
        }
        return new Promise((resolve, reject) => {
            const message = JSON.stringify(args);
            if (!cliPipe) {
                console.log('Message ' + message);
                resolve('');
                return;
            }
            const opts = {
                socketPath: cliPipe,
                path: '/',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'accept': 'application/json'
                }
            };
            const req = _http.request(opts, res => {
                if (res.headers['content-type'] !== 'application/json') {
                    reject('Error in response: Invalid content type: Expected \'application/json\', is: ' + res.headers['content-type']);
                    return;
                }
                const chunks = [];
                res.setEncoding('utf8');
                res.on('data', chunk => {
                    chunks.push(chunk);
                });
                res.on('error', (err) => fatal('Error in response.', err));
                res.on('end', () => {
                    const content = chunks.join('');
                    try {
                        const obj = JSON.parse(content);
                        if (res.statusCode === 200) {
                            resolve(obj);
                        }
                        else {
                            reject(obj);
                        }
                    }
                    catch (e) {
                        reject('Error in response: Unable to parse response as JSON: ' + content);
                    }
                });
            });
            req.on('error', (err) => fatal('Error in request.', err));
            req.write(message);
            req.end();
        });
    }
    function asExtensionIdOrVSIX(inputs) {
        return inputs?.map(input => /\.vsix$/i.test(input) ? pathToURI(input).href : input);
    }
    function fatal(message, err) {
        console.error('Unable to connect to VS Code server: ' + message);
        console.error(err);
        process.exit(1);
    }
    const preferredCwd = process.env.PWD || (0, process_1.cwd)(); // prefer process.env.PWD as it does not follow symlinks
    function pathToURI(input) {
        input = input.trim();
        input = (0, path_1.resolve)(preferredCwd, input);
        return _url.pathToFileURL(input);
    }
    function translatePath(input, mapFileUri, folderURIS, fileURIS) {
        const url = pathToURI(input);
        const mappedUri = mapFileUri(url.href);
        try {
            const stat = _fs.lstatSync(_fs.realpathSync(input));
            if (stat.isFile()) {
                fileURIS.push(mappedUri);
            }
            else if (stat.isDirectory()) {
                folderURIS.push(mappedUri);
            }
            else if (input === '/dev/null') {
                // handle /dev/null passed to us by external tools such as `git difftool`
                fileURIS.push(mappedUri);
            }
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fileURIS.push(mappedUri);
            }
            else {
                console.log(`Problem accessing file ${input}. Ignoring file`, e);
            }
        }
    }
    function mapFileToRemoteUri(uri) {
        return uri.replace(/^file:\/\//, 'vscode-remote://' + cliRemoteAuthority);
    }
    const [, , productName, version, commit, executableName, ...remainingArgs] = process.argv;
    main({ productName, version, commit, executableName }, remainingArgs).then(null, err => {
        console.error(err.message || err.stack || err);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmNsaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL3NlcnZlci5jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1RmhHLG9CQXdRQztJQTVURCxNQUFNLGlCQUFpQixHQUFHLENBQUMsUUFBZ0MsRUFBRSxFQUFFO1FBQzlELFFBQVEsUUFBUSxFQUFFLENBQUM7WUFDbEIsS0FBSyxlQUFlLENBQUM7WUFDckIsS0FBSyxnQkFBZ0IsQ0FBQztZQUN0QixLQUFLLDhCQUE4QixDQUFDO1lBQ3BDLEtBQUssZ0JBQWdCLENBQUM7WUFDdEIsS0FBSywwQkFBMEIsQ0FBQztZQUNoQyxLQUFLLHlCQUF5QixDQUFDO1lBQy9CLEtBQUssd0JBQXdCLENBQUM7WUFDOUIsS0FBSyxXQUFXO2dCQUNmLE9BQU8sS0FBSyxDQUFDO1lBQ2Q7Z0JBQ0MsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQyxDQUFDO0lBRUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLFFBQWdDLEVBQUUsRUFBRTtRQUMvRCxRQUFRLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLEtBQUssU0FBUyxDQUFDO1lBQ2YsS0FBSyxNQUFNLENBQUM7WUFDWixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLE1BQU0sQ0FBQztZQUNaLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxjQUFjLENBQUM7WUFDcEIsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLG1CQUFtQixDQUFDO1lBQ3pCLEtBQUsscUJBQXFCLENBQUM7WUFDM0IsS0FBSyxtQkFB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