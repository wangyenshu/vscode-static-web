/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/platform/extensions/common/extensions"], function (require, exports, arrays_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Query = void 0;
    class Query {
        constructor(value, sortBy) {
            this.value = value;
            this.sortBy = sortBy;
            this.value = value.trim();
        }
        static suggestions(query) {
            const commands = ['installed', 'updates', 'enabled', 'disabled', 'builtin', 'featured', 'popular', 'recommended', 'recentlyPublished', 'workspaceUnsupported', 'deprecated', 'sort', 'category', 'tag', 'ext', 'id'];
            const subcommands = {
                'sort': ['installs', 'rating', 'name', 'publishedDate', 'updateDate'],
                'category': extensions_1.EXTENSION_CATEGORIES.map(c => `"${c.toLowerCase()}"`),
                'tag': [''],
                'ext': [''],
                'id': ['']
            };
            const queryContains = (substr) => query.indexOf(substr) > -1;
            const hasSort = subcommands.sort.some(subcommand => queryContains(`@sort:${subcommand}`));
            const hasCategory = subcommands.category.some(subcommand => queryContains(`@category:${subcommand}`));
            return (0, arrays_1.flatten)(commands.map(command => {
                if (hasSort && command === 'sort' || hasCategory && command === 'category') {
                    return [];
                }
                if (command in subcommands) {
                    return subcommands[command]
                        .map(subcommand => `@${command}:${subcommand}${subcommand === '' ? '' : ' '}`);
                }
                else {
                    return queryContains(`@${command}`) ? [] : [`@${command} `];
                }
            }));
        }
        static parse(value) {
            let sortBy = '';
            value = value.replace(/@sort:(\w+)(-\w*)?/g, (match, by, order) => {
                sortBy = by;
                return '';
            });
            return new Query(value, sortBy);
        }
        toString() {
            let result = this.value;
            if (this.sortBy) {
                result = `${result}${result ? ' ' : ''}@sort:${this.sortBy}`;
            }
            return result;
        }
        isValid() {
            return !/@outdated/.test(this.value);
        }
        equals(other) {
            return this.value === other.value && this.sortBy === other.sortBy;
        }
    }
    exports.Query = Query;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUXVlcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxLQUFLO1FBRWpCLFlBQW1CLEtBQWEsRUFBUyxNQUFjO1lBQXBDLFVBQUssR0FBTCxLQUFLLENBQVE7WUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ3RELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQWE7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFVLENBQUM7WUFDOU4sTUFBTSxXQUFXLEdBQUc7Z0JBQ25CLE1BQU0sRUFBRSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUM7Z0JBQ3JFLFVBQVUsRUFBRSxpQ0FBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDO2dCQUNqRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ1gsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNYLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUNELENBQUM7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