/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls"], function (require, exports, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localizeManifest = localizeManifest;
    function localizeManifest(logger, extensionManifest, translations, fallbackTranslations) {
        try {
            replaceNLStrings(logger, extensionManifest, translations, fallbackTranslations);
        }
        catch (error) {
            logger.error(error?.message ?? error);
            /*Ignore Error*/
        }
        return extensionManifest;
    }
    /**
     * This routine makes the following assumptions:
     * The root element is an object literal
     */
    function replaceNLStrings(logger, extensionManifest, messages, originalMessages) {
        const processEntry = (obj, key, command) => {
            const value = obj[key];
            if ((0, types_1.isString)(value)) {
                const str = value;
                const length = str.length;
                if (length > 1 && str[0] === '%' && str[length - 1] === '%') {
                    const messageKey = str.substr(1, length - 2);
                    let translated = messages[messageKey];
                    // If the messages come from a language pack they might miss some keys
                    // Fill them from the original messages.
                    if (translated === undefined && originalMessages) {
                        translated = originalMessages[messageKey];
                    }
                    const message = typeof translated === 'string' ? translated : translated?.message;
                    // This branch returns ILocalizedString's instead of Strings so that the Command Palette can contain both the localized and the original value.
                    const original = originalMessages?.[messageKey];
                    const originalMessage = typeof original === 'string' ? original : original?.message;
                    if (!message) {
                        if (!originalMessage) {
                            logger.warn(`[${extensionManifest.name}]: ${(0, nls_1.localize)('missingNLSKey', "Couldn't find message for key {0}.", messageKey)}`);
                        }
                        return;
                    }
                    if (
                    // if we are translating the title or category of a command
                    command && (key === 'title' || key === 'category') &&
                        // and the original value is not the same as the translated value
                        originalMessage && originalMessage !== message) {
                        const localizedString = {
                            value: message,
                            original: originalMessage
                        };
                        obj[key] = localizedString;
                    }
                    else {
                        obj[key] = message;
                    }
                }
            }
            else if ((0, types_1.isObject)(value)) {
                for (const k in value) {
                    if (value.hasOwnProperty(k)) {
                        k === 'commands' ? processEntry(value, k, true) : processEntry(value, k, command);
                    }
                }
            }
            else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    processEntry(value, i, command);
                }
            }
        };
        for (const key in extensionManifest) {
            if (extensionManifest.hasOwnProperty(key)) {
                processEntry(extensionManifest, key);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTmxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uTmxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLDRDQVFDO0lBUkQsU0FBZ0IsZ0JBQWdCLENBQUMsTUFBZSxFQUFFLGlCQUFxQyxFQUFFLFlBQTJCLEVBQUUsb0JBQW9DO1FBQ3pKLElBQUksQ0FBQztZQUNKLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUM7WUFDdEMsZ0JBQWdCO1FBQ2pCLENBQUM7UUFDRCxPQUFPLGlCQUFpQixDQUFDO0lBQzFCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGdCQUFnQixDQUFDLE1BQWUsRUFBRSxpQkFBcUMsRUFBRSxRQUF1QixFQUFFLGdCQUFnQztRQUMxSSxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQVEsRUFBRSxHQUFvQixFQUFFLE9BQWlCLEVBQUUsRUFBRTtZQUMxRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxHQUFHLEdBQVcsS0FBSyxDQUFDO2dCQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUMxQixJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcs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