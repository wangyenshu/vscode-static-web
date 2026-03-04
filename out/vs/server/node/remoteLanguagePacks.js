/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/network", "vs/base/common/path", "vs/base/node/languagePacks", "vs/platform/product/common/product"], function (require, exports, fs, network_1, path, lp, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalNLSConfiguration = void 0;
    exports.getNLSConfiguration = getNLSConfiguration;
    const metaData = path.join(network_1.FileAccess.asFileUri('').fsPath, 'nls.metadata.json');
    const _cache = new Map();
    function exists(file) {
        return new Promise(c => fs.exists(file, c));
    }
    function getNLSConfiguration(language, userDataPath) {
        return exists(metaData).then((fileExists) => {
            if (!fileExists || !product_1.default.commit) {
                // console.log(`==> MetaData or commit unknown. Using default language.`);
                // The OS Locale on the remote side really doesn't matter, so we return the default locale
                return Promise.resolve({ locale: 'en', osLocale: 'en', availableLanguages: {} });
            }
            const key = `${language}||${userDataPath}`;
            let result = _cache.get(key);
            if (!result) {
                // The OS Locale on the remote side really doesn't matter, so we pass in the same language
                result = lp.getNLSConfiguration(product_1.default.commit, userDataPath, metaData, language, language).then(value => {
                    if (InternalNLSConfiguration.is(value)) {
                        value._languagePackSupport = true;
                    }
                    return value;
                });
                _cache.set(key, result);
            }
            return result;
        });
    }
    var InternalNLSConfiguration;
    (function (InternalNLSConfiguration) {
        function is(value) {
            const candidate = value;
            return candidate && typeof candidate._languagePackId === 'string';
        }
        InternalNLSConfiguration.is = is;
    })(InternalNLSConfiguration || (exports.InternalNLSConfiguration = InternalNLSConfiguration = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlTGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL3JlbW90ZUxhbmd1YWdlUGFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxrREFxQkM7SUE1QkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUNqRixNQUFNLE1BQU0sR0FBOEMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUVwRSxTQUFTLE1BQU0sQ0FBQyxJQUFZO1FBQzNCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxRQUFnQixFQUFFLFlBQW9CO1FBQ3pFLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQzNDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxpQkFBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQywwRUFBMEU7Z0JBQzFFLDBGQUEwRjtnQkFDMUYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEYsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLEdBQUcsUUFBUSxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQzNDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLDBGQUEwRjtnQkFDMUYsTUFBTSxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3hHLElBQUksd0JBQXdCLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3hDLEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7b0JBQ25DLENBQUM7b0JBQ0QsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekIsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsSUFBaUIsd0JBQXdCLENBS3hDO0lBTEQsV0FBaUIsd0JBQXdCO1FBQ3hDLFNBQWdCLEVBQUUsQ0FBQyxLQUEwQjtZQUM1QyxNQUFNLFNBQVMsR0FBZ0MsS0FBb0MsQ0FBQztZQUNwRixPQUFPLFNBQVMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxlQUFlLEtBQUssUUFBUSxDQUFDO1FBQ25FLENBQUM7UUFIZSwyQkFBRSxLQUdqQixDQUFBO0lBQ0YsQ0FBQyxFQUxnQix3QkFBd0Isd0NBQXhCLHdCQUF3QixRQUt4QyJ9