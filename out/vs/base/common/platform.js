define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAndroid = exports.isEdge = exports.isSafari = exports.isFirefox = exports.isChrome = exports.OS = exports.OperatingSystem = exports.setTimeout0 = exports.setTimeout0IsFaster = exports.translationsConfigFile = exports.platformLocale = exports.locale = exports.Language = exports.language = exports.userAgent = exports.platform = exports.isCI = exports.isMobile = exports.isIOS = exports.webWorkerOrigin = exports.isWebWorker = exports.isWeb = exports.isElectron = exports.isNative = exports.isLinuxSnap = exports.isLinux = exports.isMacintosh = exports.isWindows = exports.Platform = exports.LANGUAGE_DEFAULT = void 0;
    exports.PlatformToString = PlatformToString;
    exports.isLittleEndian = isLittleEndian;
    exports.isBigSurOrNewer = isBigSurOrNewer;
    exports.LANGUAGE_DEFAULT = 'en';
    let _isWindows = false;
    let _isMacintosh = false;
    let _isLinux = false;
    let _isLinuxSnap = false;
    let _isNative = false;
    let _isWeb = false;
    let _isElectron = false;
    let _isIOS = false;
    let _isCI = false;
    let _isMobile = false;
    let _locale = undefined;
    let _language = exports.LANGUAGE_DEFAULT;
    let _platformLocale = exports.LANGUAGE_DEFAULT;
    let _translationsConfigFile = undefined;
    let _userAgent = undefined;
    const $globalThis = globalThis;
    let nodeProcess = undefined;
    if (typeof $globalThis.vscode !== 'undefined' && typeof $globalThis.vscode.process !== 'undefined') {
        // Native environment (sandboxed)
        nodeProcess = $globalThis.vscode.process;
    }
    else if (typeof process !== 'undefined' && typeof process?.versions?.node === 'string') {
        // Native environment (non-sandboxed)
        nodeProcess = process;
    }
    const isElectronProcess = typeof nodeProcess?.versions?.electron === 'string';
    const isElectronRenderer = isElectronProcess && nodeProcess?.type === 'renderer';
    // Native environment
    if (typeof nodeProcess === 'object') {
        _isWindows = (nodeProcess.platform === 'win32');
        _isMacintosh = (nodeProcess.platform === 'darwin');
        _isLinux = (nodeProcess.platform === 'linux');
        _isLinuxSnap = _isLinux && !!nodeProcess.env['SNAP'] && !!nodeProcess.env['SNAP_REVISION'];
        _isElectron = isElectronProcess;
        _isCI = !!nodeProcess.env['CI'] || !!nodeProcess.env['BUILD_ARTIFACTSTAGINGDIRECTORY'];
        _locale = exports.LANGUAGE_DEFAULT;
        _language = exports.LANGUAGE_DEFAULT;
        const rawNlsConfig = nodeProcess.env['VSCODE_NLS_CONFIG'];
        if (rawNlsConfig) {
            try {
                const nlsConfig = JSON.parse(rawNlsConfig);
                const resolved = nlsConfig.availableLanguages['*'];
                _locale = nlsConfig.locale;
                _platformLocale = nlsConfig.osLocale;
                // VSCode's default language is 'en'
                _language = resolved ? resolved : exports.LANGUAGE_DEFAULT;
                _translationsConfigFile = nlsConfig._translationsConfigFile;
            }
            catch (e) {
            }
        }
        _isNative = true;
    }
    // Web environment
    else if (typeof navigator === 'object' && !isElectronRenderer) {
        _userAgent = navigator.userAgent;
        _isWindows = _userAgent.indexOf('Windows') >= 0;
        _isMacintosh = _userAgent.indexOf('Macintosh') >= 0;
        _isIOS = (_userAgent.indexOf('Macintosh') >= 0 || _userAgent.indexOf('iPad') >= 0 || _userAgent.indexOf('iPhone') >= 0) && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
        _isLinux = _userAgent.indexOf('Linux') >= 0;
        _isMobile = _userAgent?.indexOf('Mobi') >= 0;
        _isWeb = true;
        const configuredLocale = nls.getConfiguredDefaultLocale(
        // This call _must_ be done in the file that calls `nls.getConfiguredDefaultLocale`
        // to ensure that the NLS AMD Loader plugin has been loaded and configured.
        // This is because the loader plugin decides what the default locale is based on
        // how it's able to resolve the strings.
        nls.localize({ key: 'ensureLoaderPluginIsLoaded', comment: ['{Locked}'] }, '_'));
        _locale = configuredLocale || exports.LANGUAGE_DEFAULT;
        _language = _locale;
        _platformLocale = navigator.language;
    }
    // Unknown environment
    else {
        console.error('Unable to resolve platform.');
    }
    var Platform;
    (function (Platform) {
        Platform[Platform["Web"] = 0] = "Web";
        Platform[Platform["Mac"] = 1] = "Mac";
        Platform[Platform["Linux"] = 2] = "Linux";
        Platform[Platform["Windows"] = 3] = "Windows";
    })(Platform || (exports.Platform = Platform = {}));
    function PlatformToString(platform) {
        switch (platform) {
            case 0 /* Platform.Web */: return 'Web';
            case 1 /* Platform.Mac */: return 'Mac';
            case 2 /* Platform.Linux */: return 'Linux';
            case 3 /* Platform.Windows */: return 'Windows';
        }
    }
    let _platform = 0 /* Platform.Web */;
    if (_isMacintosh) {
        _platform = 1 /* Platform.Mac */;
    }
    else if (_isWindows) {
        _platform = 3 /* Platform.Windows */;
    }
    else if (_isLinux) {
        _platform = 2 /* Platform.Linux */;
    }
    exports.isWindows = _isWindows;
    exports.isMacintosh = _isMacintosh;
    exports.isLinux = _isLinux;
    exports.isLinuxSnap = _isLinuxSnap;
    exports.isNative = _isNative;
    exports.isElectron = _isElectron;
    exports.isWeb = _isWeb;
    exports.isWebWorker = (_isWeb && typeof $globalThis.importScripts === 'function');
    exports.webWorkerOrigin = exports.isWebWorker ? $globalThis.origin : undefined;
    exports.isIOS = _isIOS;
    exports.isMobile = _isMobile;
    /**
     * Whether we run inside a CI environment, such as
     * GH actions or Azure Pipelines.
     */
    exports.isCI = _isCI;
    exports.platform = _platform;
    exports.userAgent = _userAgent;
    /**
     * The language used for the user interface. The format of
     * the string is all lower case (e.g. zh-tw for Traditional
     * Chinese)
     */
    exports.language = _language;
    var Language;
    (function (Language) {
        function value() {
            return exports.language;
        }
        Language.value = value;
        function isDefaultVariant() {
            if (exports.language.length === 2) {
                return exports.language === 'en';
            }
            else if (exports.language.length >= 3) {
                return exports.language[0] === 'e' && exports.language[1] === 'n' && exports.language[2] === '-';
            }
            else {
                return false;
            }
        }
        Language.isDefaultVariant = isDefaultVariant;
        function isDefault() {
            return exports.language === 'en';
        }
        Language.isDefault = isDefault;
    })(Language || (exports.Language = Language = {}));
    /**
     * The OS locale or the locale specified by --locale. The format of
     * the string is all lower case (e.g. zh-tw for Traditional
     * Chinese). The UI is not necessarily shown in the provided locale.
     */
    exports.locale = _locale;
    /**
     * This will always be set to the OS/browser's locale regardless of
     * what was specified by --locale. The format of the string is all
     * lower case (e.g. zh-tw for Traditional Chinese). The UI is not
     * necessarily shown in the provided locale.
     */
    exports.platformLocale = _platformLocale;
    /**
     * The translations that are available through language packs.
     */
    exports.translationsConfigFile = _translationsConfigFile;
    exports.setTimeout0IsFaster = (typeof $globalThis.postMessage === 'function' && !$globalThis.importScripts);
    /**
     * See https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#:~:text=than%204%2C%20then-,set%20timeout%20to%204,-.
     *
     * Works similarly to `setTimeout(0)` but doesn't suffer from the 4ms artificial delay
     * that browsers set when the nesting level is > 5.
     */
    exports.setTimeout0 = (() => {
        if (exports.setTimeout0IsFaster) {
            const pending = [];
            $globalThis.addEventListener('message', (e) => {
                if (e.data && e.data.vscodeScheduleAsyncWork) {
                    for (let i = 0, len = pending.length; i < len; i++) {
                        const candidate = pending[i];
                        if (candidate.id === e.data.vscodeScheduleAsyncWork) {
                            pending.splice(i, 1);
                            candidate.callback();
                            return;
                        }
                    }
                }
            });
            let lastId = 0;
            return (callback) => {
                const myId = ++lastId;
                pending.push({
                    id: myId,
                    callback: callback
                });
                $globalThis.postMessage({ vscodeScheduleAsyncWork: myId }, '*');
            };
        }
        return (callback) => setTimeout(callback);
    })();
    var OperatingSystem;
    (function (OperatingSystem) {
        OperatingSystem[OperatingSystem["Windows"] = 1] = "Windows";
        OperatingSystem[OperatingSystem["Macintosh"] = 2] = "Macintosh";
        OperatingSystem[OperatingSystem["Linux"] = 3] = "Linux";
    })(OperatingSystem || (exports.OperatingSystem = OperatingSystem = {}));
    exports.OS = (_isMacintosh || _isIOS ? 2 /* OperatingSystem.Macintosh */ : (_isWindows ? 1 /* OperatingSystem.Windows */ : 3 /* OperatingSystem.Linux */));
    let _isLittleEndian = true;
    let _isLittleEndianComputed = false;
    function isLittleEndian() {
        if (!_isLittleEndianComputed) {
            _isLittleEndianComputed = true;
            const test = new Uint8Array(2);
            test[0] = 1;
            test[1] = 2;
            const view = new Uint16Array(test.buffer);
            _isLittleEndian = (view[0] === (2 << 8) + 1);
        }
        return _isLittleEndian;
    }
    exports.isChrome = !!(exports.userAgent && exports.userAgent.indexOf('Chrome') >= 0);
    exports.isFirefox = !!(exports.userAgent && exports.userAgent.indexOf('Firefox') >= 0);
    exports.isSafari = !!(!exports.isChrome && (exports.userAgent && exports.userAgent.indexOf('Safari') >= 0));
    exports.isEdge = !!(exports.userAgent && exports.userAgent.indexOf('Edg/') >= 0);
    exports.isAndroid = !!(exports.userAgent && exports.userAgent.indexOf('Android') >= 0);
    function isBigSurOrNewer(osVersion) {
        return parseFloat(osVersion) >= 20;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9wbGF0Zm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBNElBLDRDQU9DO0lBZ0lELHdDQVVDO0lBUUQsMENBRUM7SUFqU1ksUUFBQSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFFckMsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztJQUN6QixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDckIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDbkIsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNuQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbEIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksT0FBTyxHQUF1QixTQUFTLENBQUM7SUFDNUMsSUFBSSxTQUFTLEdBQVcsd0JBQWdCLENBQUM7SUFDekMsSUFBSSxlQUFlLEdBQVcsd0JBQWdCLENBQUM7SUFDL0MsSUFBSSx1QkFBdUIsR0FBdUIsU0FBUyxDQUFDO0lBQzVELElBQUksVUFBVSxHQUF1QixTQUFTLENBQUM7SUFtQy9DLE1BQU0sV0FBVyxHQUFRLFVBQVUsQ0FBQztJQUVwQyxJQUFJLFdBQVcsR0FBNkIsU0FBUyxDQUFDO0lBQ3RELElBQUksT0FBTyxXQUFXLENBQUMsTUFBTSxLQUFLLFdBQVcsSUFBSSxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQ3BHLGlDQUFpQztRQUNqQyxX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