/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/hash"], function (require, exports, buffer_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha1Hex = sha1Hex;
    async function sha1Hex(str) {
        // Prefer to use browser's crypto module
        if (globalThis?.crypto?.subtle) {
            // Careful to use `dontUseNodeBuffer` when passing the
            // buffer to the browser `crypto` API. Users reported
            // native crashes in certain cases that we could trace
            // back to passing node.js `Buffer` around
            // (https://github.com/microsoft/vscode/issues/114227)
            const buffer = buffer_1.VSBuffer.fromString(str, { dontUseNodeBuffer: true }).buffer;
            const hash = await globalThis.crypto.subtle.digest({ name: 'sha-1' }, buffer);
            return (0, hash_1.toHexString)(hash);
        }
        // Otherwise fallback to `StringSHA1`
        else {
            const computer = new hash_1.StringSHA1();
            computer.update(str);
            return computer.digest();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9oYXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLDBCQXVCQztJQXZCTSxLQUFLLFVBQVUsT0FBTyxDQUFDLEdBQVc7UUFFeEMsd0NBQXdDO1FBQ3hDLElBQUksVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUVoQyxzREFBc0Q7WUFDdEQscURBQXFEO1lBQ3JELHNEQUFzRDtZQUN0RCwwQ0FBMEM7WUFDMUMsc0RBQXNEO1lBQ3RELE1BQU0sTUFBTSxHQUFHLGlCQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzVFLE1BQU0sSUFBSSxHQUFHLE1BQU0sVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTlFLE9BQU8sSUFBQSxrQkFBVyxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxxQ0FBcUM7YUFDaEMsQ0FBQztZQUNMLE1BQU0sUUFBUSxHQUFHLElBQUksaUJBQVUsRUFBRSxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFckIsT0FBTyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDMUIsQ0FBQztJQUNGLENBQUMifQ==