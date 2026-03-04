/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/base/common/async", "vs/workbench/contrib/chat/common/chatWordCounter"], function (require, exports, editOperation_1, async_1, chatWordCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.performAsyncTextEdit = performAsyncTextEdit;
    exports.asProgressiveEdit = asProgressiveEdit;
    async function performAsyncTextEdit(model, edit, progress, obs) {
        const [id] = model.deltaDecorations([], [{
                range: edit.range,
                options: {
                    description: 'asyncTextEdit',
                    stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */
                }
            }]);
        let first = true;
        for await (const part of edit.newText) {
            if (model.isDisposed()) {
                break;
            }
            const range = model.getDecorationRange(id);
            if (!range) {
                throw new Error('FAILED to perform async replace edit because the anchor decoration was removed');
            }
            const edit = first
                ? editOperation_1.EditOperation.replace(range, part) // first edit needs to override the "anchor"
                : editOperation_1.EditOperation.insert(range.getEndPosition(), part);
            obs?.start();
            model.pushEditOperations(null, [edit], (undoEdits) => {
                progress?.report(undoEdits);
                return null;
            });
            obs?.stop();
            first = false;
        }
    }
    function asProgressiveEdit(interval, edit, wordsPerSec, token) {
        wordsPerSec = Math.max(30, wordsPerSec);
        const stream = new async_1.AsyncIterableSource();
        let newText = edit.text ?? '';
        interval.cancelAndSet(() => {
            const r = (0, chatWordCounter_1.getNWords)(newText, 1);
            stream.emitOne(r.value);
            newText = newText.substring(r.value.length);
            if (r.isFullString) {
                interval.cancel();
                stream.resolve();
                d.dispose();
            }
        }, 1000 / wordsPerSec);
        // cancel ASAP
        const d = token.onCancellationRequested(() => {
            interval.cancel();
            stream.resolve();
            d.dispose();
        });
        return {
            range: edit.range,
            newText: stream.asyncIterable
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLG9EQWlDQztJQUVELDhDQThCQztJQWpFTSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsS0FBaUIsRUFBRSxJQUFtQixFQUFFLFFBQTJDLEVBQUUsR0FBbUI7UUFFbEosTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixPQUFPLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLGVBQWU7b0JBQzVCLFVBQVUsNkRBQXFEO2lCQUMvRDthQUNELENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksS0FBSyxFQUFFLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUV2QyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixNQUFNO1lBQ1AsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO1lBQ25HLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxLQUFLO2dCQUNqQixDQUFDLENBQUMsNkJBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLDRDQUE0QztnQkFDakYsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0RCxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDYixLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtnQkFDcEQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztZQUNILEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUNaLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGlCQUFpQixDQUFDLFFBQXVCLEVBQUUsSUFBb0MsRUFBRSxXQUFtQixFQUFFLEtBQXdCO1FBRTdJLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUV4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLDJCQUFtQixFQUFVLENBQUM7UUFDakQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFOUIsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7WUFDMUIsTUFBTSxDQUFDLEdBQUcsSUFBQSwyQkFBUyxFQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNwQixRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsQ0FBQztRQUVGLENBQUMsRUFBRSxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUM7UUFFdkIsY0FBYztRQUNkLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7WUFDNUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU87WUFDTixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxhQUFhO1NBQzdCLENBQUM7SUFDSCxDQUFDIn0=