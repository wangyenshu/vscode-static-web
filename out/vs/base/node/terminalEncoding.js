/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/platform"], function (require, exports, child_process_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveTerminalEncoding = resolveTerminalEncoding;
    const windowsTerminalEncodings = {
        '437': 'cp437', // United States
        '850': 'cp850', // Multilingual(Latin I)
        '852': 'cp852', // Slavic(Latin II)
        '855': 'cp855', // Cyrillic(Russian)
        '857': 'cp857', // Turkish
        '860': 'cp860', // Portuguese
        '861': 'cp861', // Icelandic
        '863': 'cp863', // Canadian - French
        '865': 'cp865', // Nordic
        '866': 'cp866', // Russian
        '869': 'cp869', // Modern Greek
        '936': 'cp936', // Simplified Chinese
        '1252': 'cp1252' // West European Latin
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    const UTF8 = 'utf8';
    async function resolveTerminalEncoding(verbose) {
        let rawEncodingPromise;
        // Support a global environment variable to win over other mechanics
        const cliEncodingEnv = process.env['VSCODE_CLI_ENCODING'];
        if (cliEncodingEnv) {
            if (verbose) {
                console.log(`Found VSCODE_CLI_ENCODING variable: ${cliEncodingEnv}`);
            }
            rawEncodingPromise = Promise.resolve(cliEncodingEnv);
        }
        // Windows: educated guess
        else if (platform_1.isWindows) {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "chcp" to detect terminal encoding...');
                }
                (0, child_process_1.exec)('chcp', (err, stdout, stderr) => {
                    if (stdout) {
                        if (verbose) {
                            console.log(`Output from "chcp" command is: ${stdout}`);
                        }
                        const windowsTerminalEncodingKeys = Object.keys(windowsTerminalEncodings);
                        for (const key of windowsTerminalEncodingKeys) {
                            if (stdout.indexOf(key) >= 0) {
                                return resolve(windowsTerminalEncodings[key]);
                            }
                        }
                    }
                    return resolve(undefined);
                });
            });
        }
        // Linux/Mac: use "locale charmap" command
        else {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "locale charmap" to detect terminal encoding...');
                }
                (0, child_process_1.exec)('locale charmap', (err, stdout, stderr) => resolve(stdout));
            });
        }
        const rawEncoding = await rawEncodingPromise;
        if (verbose) {
            console.log(`Detected raw terminal encoding: ${rawEncoding}`);
        }
        if (!rawEncoding || rawEncoding.toLowerCase() === 'utf-8' || rawEncoding.toLowerCase() === UTF8) {
            return UTF8;
        }
        return toIconvLiteEncoding(rawEncoding);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbmNvZGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS90ZXJtaW5hbEVuY29kaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0NoRywwREEyREM7SUF6RkQsTUFBTSx3QkFBd0IsR0FBRztRQUNoQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGdCQUFnQjtRQUNoQyxLQUFLLEVBQUUsT0FBTyxFQUFFLHdCQUF3QjtRQUN4QyxLQUFLLEVBQUUsT0FBTyxFQUFFLG1CQUFtQjtRQUNuQyxLQUFLLEVBQUUsT0FBTyxFQUFFLG9CQUFvQjtRQUNwQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFVBQVU7UUFDMUIsS0FBSyxFQUFFLE9BQU8sRUFBRSxhQUFhO1FBQzdCLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWTtRQUM1QixLQUFLLEVBQUUsT0FBTyxFQUFFLG9CQUFvQjtRQUNwQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVM7UUFDekIsS0FBSyxFQUFFLE9BQU8sRUFBRSxVQUFVO1FBQzFCLEtBQUssRUFBRSxPQUFPLEVBQUUsZUFBZTtRQUMvQixLQUFLLEVBQUUsT0FBTyxFQUFFLHFCQUFxQjtRQUNyQyxNQUFNLEVBQUUsUUFBUSxDQUFDLHNCQUFzQjtLQUN2QyxDQUFDO0lBRUYsU0FBUyxtQkFBbUIsQ0FBQyxZQUFvQjtRQUNoRCxNQUFNLHNCQUFzQixHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZGLE1BQU0sTUFBTSxHQUFHLDRCQUE0QixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFcEUsT0FBTyxNQUFNLElBQUksc0JBQXNCLENBQUM7SUFDekMsQ0FBQztJQUVELE1BQU0sNEJBQTRCLEdBQStCO1FB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