/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/diff/linesDiffComputers"], function (require, exports, lifecycle_1, linesDiffComputers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDiffProviderFactoryService = void 0;
    class TestDiffProviderFactoryService {
        createDiffProvider() {
            return new SyncDocumentDiffProvider();
        }
    }
    exports.TestDiffProviderFactoryService = TestDiffProviderFactoryService;
    class SyncDocumentDiffProvider {
        constructor() {
            this.onDidChange = () => (0, lifecycle_1.toDisposable)(() => { });
        }
        computeDiff(original, modified, options, cancellationToken) {
            const result = linesDiffComputers_1.linesDiffComputers.getDefault().computeDiff(original.getLinesContent(), modified.getLinesContent(), options);
            return Promise.resolve({
                changes: result.changes,
                quitEarly: result.hitTimeout,
                identical: original.getValue() === modified.getValue(),
                moves: result.moves,
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdERpZmZQcm92aWRlckZhY3RvcnlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9kaWZmL3Rlc3REaWZmUHJvdmlkZXJGYWN0b3J5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSw4QkFBOEI7UUFFMUMsa0JBQWtCO1lBQ2pCLE9BQU8sSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQUxELHdFQUtDO0lBRUQsTUFBTSx3QkFBd0I7UUFBOUI7WUFXQyxnQkFBVyxHQUFnQixHQUFHLEVBQUUsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQVhBLFdBQVcsQ0FBQyxRQUFvQixFQUFFLFFBQW9CLEVBQUUsT0FBcUMsRUFBRSxpQkFBb0M7WUFDbEksTUFBTSxNQUFNLEdBQUcsdUNBQWtCLENBQUMsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsRUFBRSxRQUFRLENBQUMsZUFBZSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUgsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUN0QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxNQUFNLENBQUMsVUFBVTtnQkFDNUIsU0FBUyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxRQUFRLENBQUMsUUFBUSxFQUFFO2dCQUN0RCxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7YUFDbkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUdEIn0=