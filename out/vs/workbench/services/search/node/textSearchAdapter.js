/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/pfs", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, pfs, ripgrepTextSearchEngine_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextSearchEngineAdapter = void 0;
    class TextSearchEngineAdapter {
        constructor(query) {
            this.query = query;
        }
        search(token, onResult, onMessage) {
            if ((!this.query.folderQueries || !this.query.folderQueries.length) && (!this.query.extraFileResources || !this.query.extraFileResources.length)) {
                return Promise.resolve({
                    type: 'success',
                    limitHit: false,
                    stats: {
                        type: 'searchProcess'
                    }
                });
            }
            const pretendOutputChannel = {
                appendLine(msg) {
                    onMessage({ message: msg });
                }
            };
            const textSearchManager = new textSearchManager_1.NativeTextSearchManager(this.query, new ripgrepTextSearchEngine_1.RipgrepTextSearchEngine(pretendOutputChannel), pfs);
            return new Promise((resolve, reject) => {
                return textSearchManager
                    .search(matches => {
                    onResult(matches.map(fileMatchToSerialized));
                }, token)
                    .then(c => resolve({ limitHit: c.limitHit, type: 'success', stats: c.stats }), reject);
            });
        }
    }
    exports.TextSearchEngineAdapter = TextSearchEngineAdapter;
    function fileMatchToSerialized(match) {
        return {
            path: match.resource && match.resource.fsPath,
            results: match.results,
            numMatches: (match.results || []).reduce((sum, r) => {
                if (!!r.ranges) {
                    const m = r;
                    return sum + (Array.isArray(m.ranges) ? m.ranges.length : 1);
                }
                else {
                    return sum + 1;
                }
            }, 0)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaEFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL25vZGUvdGV4dFNlYXJjaEFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsdUJBQXVCO1FBRW5DLFlBQW9CLEtBQWlCO1lBQWpCLFVBQUssR0FBTCxLQUFLLENBQVk7UUFBSSxDQUFDO1FBRTFDLE1BQU0sQ0FBQyxLQUF3QixFQUFFLFFBQW1ELEVBQUUsU0FBOEM7WUFDbkksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDbEosT0FBTyxPQUFPLENBQUMsT0FBTyxDQUEyQjtvQkFDaEQsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFvQjt3QkFDeEIsSUFBSSxFQUFFLGVBQWU7cUJBQ3JCO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLG9CQUFvQixHQUFHO2dCQUM1QixVQUFVLENBQUMsR0FBVztvQkFDckIsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzdCLENBQUM7YUFDRCxDQUFDO1lBQ0YsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDJDQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxpREFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFILE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3RDLE9BQU8saUJBQWlCO3FCQUN0QixNQUFNLENBQ04sT0FBTyxDQUFDLEVBQUU7b0JBQ1QsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLEVBQ0QsS0FBSyxDQUFDO3FCQUNOLElBQUksQ0FDSixDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQThCLENBQUMsRUFDbkcsTUFBTSxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQWpDRCwwREFpQ0M7SUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQWlCO1FBQy9DLE9BQU87WUFDTixJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU07WUFDN0MsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuRCxJQUFJLENBQUMsQ0FBb0IsQ0FBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNwQyxNQUFNLENBQUMsR0FBcUIsQ0FBQyxDQUFDO29CQUM5QixPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ0wsQ0FBQztJQUNILENBQUMifQ==