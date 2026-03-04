/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localize = localize;
    exports.localize2 = localize2;
    exports.getConfiguredDefaultLocale = getConfiguredDefaultLocale;
    exports.load = load;
    exports.write = write;
    exports.writeFile = writeFile;
    exports.finishBuild = finishBuild;
    const buildMap = {};
    const buildMapKeys = {};
    const entryPoints = {};
    function localize(data, message, ...args) {
        throw new Error(`Not supported at build time!`);
    }
    function localize2(data, message, ...args) {
        throw new Error(`Not supported at build time!`);
    }
    function getConfiguredDefaultLocale() {
        throw new Error(`Not supported at build time!`);
    }
    /**
     * Invoked by the loader at build-time
     */
    function load(name, req, load, config) {
        if (!name || name.length === 0) {
            load({ localize, localize2, getConfiguredDefaultLocale });
        }
        else {
            req([name + '.nls', name + '.nls.keys'], function (messages, keys) {
                buildMap[name] = messages;
                buildMapKeys[name] = keys;
                load(messages);
            });
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function write(pluginName, moduleName, write) {
        const entryPoint = write.getEntryPoint();
        entryPoints[entryPoint] = entryPoints[entryPoint] || [];
        entryPoints[entryPoint].push(moduleName);
        if (moduleName !== entryPoint) {
            write.asModule(pluginName + '!' + moduleName, 'define([\'vs/nls\', \'vs/nls!' + entryPoint + '\'], function(nls, data) { return nls.create("' + moduleName + '", data); });');
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function writeFile(pluginName, moduleName, req, write, config) {
        if (entryPoints.hasOwnProperty(moduleName)) {
            const fileName = req.toUrl(moduleName + '.nls.js');
            const contents = [
                '/*---------------------------------------------------------',
                ' * Copyright (c) Microsoft Corporation. All rights reserved.',
                ' *--------------------------------------------------------*/'
            ], entries = entryPoints[moduleName];
            const data = {};
            for (let i = 0; i < entries.length; i++) {
                data[entries[i]] = buildMap[entries[i]];
            }
            contents.push('define("' + moduleName + '.nls", ' + JSON.stringify(data, null, '\t') + ');');
            write(fileName, contents.join('\r\n'));
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function finishBuild(write) {
        write('nls.metadata.json', JSON.stringify({
            keys: buildMapKeys,
            messages: buildMap,
            bundles: entryPoints
        }, null, '\t'));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmxzLmJ1aWxkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvbmxzLmJ1aWxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLDRCQUVDO0lBRUQsOEJBRUM7SUFFRCxnRUFFQztJQUtELG9CQVVDO0lBS0Qsc0JBU0M7SUFLRCw4QkFrQkM7SUFLRCxrQ0FNQztJQWxGRCxNQUFNLFFBQVEsR0FBaUMsRUFBRSxDQUFDO0lBQ2xELE1BQU0sWUFBWSxHQUFpQyxFQUFFLENBQUM7SUFDdEQsTUFBTSxXQUFXLEdBQXVDLEVBQUUsQ0FBQztJQU8zRCxTQUFnQixRQUFRLENBQUMsSUFBNEIsRUFBRSxPQUFlLEVBQUUsR0FBRyxJQUFzRDtRQUNoSSxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFNBQWdCLFNBQVMsQ0FBQyxJQUE0QixFQUFFLE9BQWUsRUFBRSxHQUFHLElBQXNEO1FBQ2pJLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCO1FBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixJQUFJLENBQUMsSUFBWSxFQUFFLEdBQStCLEVBQUUsSUFBbUMsRUFBRSxNQUF1QztRQUMvSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQzthQUFNLENBQUM7WUFDUCxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxFQUFFLElB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