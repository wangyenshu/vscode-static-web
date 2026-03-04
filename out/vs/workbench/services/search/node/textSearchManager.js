/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/textfile/common/encoding", "vs/base/node/pfs", "vs/workbench/services/search/common/textSearchManager"], function (require, exports, encoding_1, pfs, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTextSearchManager = void 0;
    class NativeTextSearchManager extends textSearchManager_1.TextSearchManager {
        constructor(query, provider, _pfs = pfs, processType = 'searchProcess') {
            super({ query, provider }, {
                readdir: resource => _pfs.Promises.readdir(resource.fsPath),
                toCanonicalName: name => (0, encoding_1.toCanonicalName)(name)
            }, processType);
        }
    }
    exports.NativeTextSearchManager = NativeTextSearchManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL25vZGUvdGV4dFNlYXJjaE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsdUJBQXdCLFNBQVEscUNBQWlCO1FBRTdELFlBQVksS0FBaUIsRUFBRSxRQUE0QixFQUFFLE9BQW1CLEdBQUcsRUFBRSxjQUF3QyxlQUFlO1lBQzNJLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDMUIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDM0QsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBQSwwQkFBZSxFQUFDLElBQUksQ0FBQzthQUM5QyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQVJELDBEQVFDIn0=