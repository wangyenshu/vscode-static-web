/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters"], function (require, exports, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCompletionItem = void 0;
    class SimpleCompletionItem {
        constructor(completion) {
            this.completion = completion;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            // ensure lower-variants (perf)
            this.labelLow = this.completion.label.toLowerCase();
        }
    }
    exports.SimpleCompletionItem = SimpleCompletionItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tcGxldGlvbkl0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc3VnZ2VzdC9icm93c2VyL3NpbXBsZUNvbXBsZXRpb25JdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsTUFBYSxvQkFBb0I7UUFTaEMsWUFDVSxVQUE2QjtZQUE3QixlQUFVLEdBQVYsVUFBVSxDQUFtQjtZQU52QyxxQkFBcUI7WUFDckIsVUFBSyxHQUFlLG9CQUFVLENBQUMsT0FBTyxDQUFDO1lBT3RDLCtCQUErQjtZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JELENBQUM7S0FDRDtJQWZELG9EQWVDIn0=