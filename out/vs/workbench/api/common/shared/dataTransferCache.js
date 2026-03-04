/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer"], function (require, exports, arrays_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransferFileCache = void 0;
    class DataTransferFileCache {
        constructor() {
            this.requestIdPool = 0;
            this.dataTransferFiles = new Map();
        }
        add(dataTransfer) {
            const requestId = this.requestIdPool++;
            this.dataTransferFiles.set(requestId, (0, arrays_1.coalesce)(Array.from(dataTransfer, ([, item]) => item.asFile())));
            return {
                id: requestId,
                dispose: () => {
                    this.dataTransferFiles.delete(requestId);
                }
            };
        }
        async resolveFileData(requestId, dataItemId) {
            const files = this.dataTransferFiles.get(requestId);
            if (!files) {
                throw new Error('No data transfer found');
            }
            const file = files.find(file => file.id === dataItemId);
            if (!file) {
                throw new Error('No matching file found in data transfer');
            }
            return buffer_1.VSBuffer.wrap(await file.data());
        }
        dispose() {
            this.dataTransferFiles.clear();
        }
    }
    exports.DataTransferFileCache = DataTransferFileCache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyYW5zZmVyQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9zaGFyZWQvZGF0YVRyYW5zZmVyQ2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEscUJBQXFCO1FBQWxDO1lBRVMsa0JBQWEsR0FBRyxDQUFDLENBQUM7WUFDVCxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBNEQsQ0FBQztRQThCMUcsQ0FBQztRQTVCTyxHQUFHLENBQUMsWUFBcUM7WUFDL0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUEsaUJBQVEsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE9BQU87Z0JBQ04sRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQWlCLEVBQUUsVUFBa0I7WUFDMUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxVQUFVLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxPQUFPLGlCQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBakNELHNEQWlDQyJ9