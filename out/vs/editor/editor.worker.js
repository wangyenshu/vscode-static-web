/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/worker/simpleWorker", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, simpleWorker_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initialize = initialize;
    let initialized = false;
    function initialize(foreignModule) {
        if (initialized) {
            return;
        }
        initialized = true;
        const simpleWorker = new simpleWorker_1.SimpleWorkerServer((msg) => {
            globalThis.postMessage(msg);
        }, (host) => new editorSimpleWorker_1.EditorSimpleWorker(host, foreignModule));
        globalThis.onmessage = (e) => {
            simpleWorker.onmessage(e.data);
        };
    }
    globalThis.onmessage = (e) => {
        // Ignore first message in this case and initialize if not yet initialized
        if (!initialized) {
            initialize(null);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLndvcmtlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9lZGl0b3Iud29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLGdDQWFDO0lBZkQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBRXhCLFNBQWdCLFVBQVUsQ0FBQyxhQUFrQjtRQUM1QyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU87UUFDUixDQUFDO1FBQ0QsV0FBVyxHQUFHLElBQUksQ0FBQztRQUVuQixNQUFNLFlBQVksR0FBRyxJQUFJLGlDQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbkQsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDLEVBQUUsQ0FBQyxJQUF1QixFQUFFLEVBQUUsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRTdFLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFlLEVBQUUsRUFBRTtZQUMxQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUM7SUFDSCxDQUFDO0lBRUQsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO1FBQzFDLDBFQUEwRTtRQUMxRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEIsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUM7SUFDRixDQUFDLENBQUMifQ==