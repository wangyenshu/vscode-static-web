/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dnd", "vs/base/common/dataTransfer", "vs/base/common/mime", "vs/base/common/uri", "vs/platform/dnd/browser/dnd"], function (require, exports, dnd_1, dataTransfer_1, mime_1, uri_1, dnd_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toVSDataTransfer = toVSDataTransfer;
    exports.toExternalVSDataTransfer = toExternalVSDataTransfer;
    function toVSDataTransfer(dataTransfer) {
        const vsDataTransfer = new dataTransfer_1.VSDataTransfer();
        for (const item of dataTransfer.items) {
            const type = item.type;
            if (item.kind === 'string') {
                const asStringValue = new Promise(resolve => item.getAsString(resolve));
                vsDataTransfer.append(type, (0, dataTransfer_1.createStringDataTransferItem)(asStringValue));
            }
            else if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    vsDataTransfer.append(type, createFileDataTransferItemFromFile(file));
                }
            }
        }
        return vsDataTransfer;
    }
    function createFileDataTransferItemFromFile(file) {
        const uri = file.path ? uri_1.URI.parse(file.path) : undefined;
        return (0, dataTransfer_1.createFileDataTransferItem)(file.name, uri, async () => {
            return new Uint8Array(await file.arrayBuffer());
        });
    }
    const INTERNAL_DND_MIME_TYPES = Object.freeze([
        dnd_2.CodeDataTransfers.EDITORS,
        dnd_2.CodeDataTransfers.FILES,
        dnd_1.DataTransfers.RESOURCES,
        dnd_1.DataTransfers.INTERNAL_URI_LIST,
    ]);
    function toExternalVSDataTransfer(sourceDataTransfer, overwriteUriList = false) {
        const vsDataTransfer = toVSDataTransfer(sourceDataTransfer);
        // Try to expose the internal uri-list type as the standard type
        const uriList = vsDataTransfer.get(dnd_1.DataTransfers.INTERNAL_URI_LIST);
        if (uriList) {
            vsDataTransfer.replace(mime_1.Mimes.uriList, uriList);
        }
        else {
            if (overwriteUriList || !vsDataTransfer.has(mime_1.Mimes.uriList)) {
                // Otherwise, fallback to adding dragged resources to the uri list
                const editorData = [];
                for (const item of sourceDataTransfer.items) {
                    const file = item.getAsFile();
                    if (file) {
                        const path = file.path;
                        try {
                            if (path) {
                                editorData.push(uri_1.URI.file(path).toString());
                            }
                            else {
                                editorData.push(uri_1.URI.parse(file.name, true).toString());
                            }
                        }
                        catch {
                            // Parsing failed. Leave out from list
                        }
                    }
                }
                if (editorData.length) {
                    vsDataTransfer.replace(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(dataTransfer_1.UriList.create(editorData)));
                }
            }
        }
        for (const internal of INTERNAL_DND_MIME_TYPES) {
            vsDataTransfer.delete(internal);
        }
        return vsDataTransfer;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvZG5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLDRDQWVDO0lBZ0JELDREQXNDQztJQXJFRCxTQUFnQixnQkFBZ0IsQ0FBQyxZQUEwQjtRQUMxRCxNQUFNLGNBQWMsR0FBRyxJQUFJLDZCQUFjLEVBQUUsQ0FBQztRQUM1QyxLQUFLLE1BQU0sSUFBSSxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLENBQVMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUEsMkNBQTRCLEVBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMxRSxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFTLGtDQUFrQyxDQUFDLElBQVU7UUFDckQsTUFBTSxHQUFHLEdBQUks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