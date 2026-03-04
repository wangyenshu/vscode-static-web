/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/uuid"], function (require, exports, arrays_1, iterator_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UriList = exports.VSDataTransfer = void 0;
    exports.createStringDataTransferItem = createStringDataTransferItem;
    exports.createFileDataTransferItem = createFileDataTransferItem;
    exports.matchesMimeType = matchesMimeType;
    function createStringDataTransferItem(stringOrPromise) {
        return {
            asString: async () => stringOrPromise,
            asFile: () => undefined,
            value: typeof stringOrPromise === 'string' ? stringOrPromise : undefined,
        };
    }
    function createFileDataTransferItem(fileName, uri, data) {
        const file = { id: (0, uuid_1.generateUuid)(), name: fileName, uri, data };
        return {
            asString: async () => '',
            asFile: () => file,
            value: undefined,
        };
    }
    class VSDataTransfer {
        constructor() {
            this._entries = new Map();
        }
        get size() {
            let size = 0;
            for (const _ of this._entries) {
                size++;
            }
            return size;
        }
        has(mimeType) {
            return this._entries.has(this.toKey(mimeType));
        }
        matches(pattern) {
            const mimes = [...this._entries.keys()];
            if (iterator_1.Iterable.some(this, ([_, item]) => item.asFile())) {
                mimes.push('files');
            }
            return matchesMimeType_normalized(normalizeMimeType(pattern), mimes);
        }
        get(mimeType) {
            return this._entries.get(this.toKey(mimeType))?.[0];
        }
        /**
         * Add a new entry to this data transfer.
         *
         * This does not replace existing entries for `mimeType`.
         */
        append(mimeType, value) {
            const existing = this._entries.get(mimeType);
            if (existing) {
                existing.push(value);
            }
            else {
                this._entries.set(this.toKey(mimeType), [value]);
            }
        }
        /**
         * Set the entry for a given mime type.
         *
         * This replaces all existing entries for `mimeType`.
         */
        replace(mimeType, value) {
            this._entries.set(this.toKey(mimeType), [value]);
        }
        /**
         * Remove all entries for `mimeType`.
         */
        delete(mimeType) {
            this._entries.delete(this.toKey(mimeType));
        }
        /**
         * Iterate over all `[mime, item]` pairs in this data transfer.
         *
         * There may be multiple entries for each mime type.
         */
        *[Symbol.iterator]() {
            for (const [mine, items] of this._entries) {
                for (const item of items) {
                    yield [mine, item];
                }
            }
        }
        toKey(mimeType) {
            return normalizeMimeType(mimeType);
        }
    }
    exports.VSDataTransfer = VSDataTransfer;
    function normalizeMimeType(mimeType) {
        return mimeType.toLowerCase();
    }
    function matchesMimeType(pattern, mimeTypes) {
        return matchesMimeType_normalized(normalizeMimeType(pattern), mimeTypes.map(normalizeMimeType));
    }
    function matchesMimeType_normalized(normalizedPattern, normalizedMimeTypes) {
        // Anything wildcard
        if (normalizedPattern === '*/*') {
            return normalizedMimeTypes.length > 0;
        }
        // Exact match
        if (normalizedMimeTypes.includes(normalizedPattern)) {
            return true;
        }
        // Wildcard, such as `image/*`
        const wildcard = normalizedPattern.match(/^([a-z]+)\/([a-z]+|\*)$/i);
        if (!wildcard) {
            return false;
        }
        const [_, type, subtype] = wildcard;
        if (subtype === '*') {
            return normalizedMimeTypes.some(mime => mime.startsWith(type + '/'));
        }
        return false;
    }
    exports.UriList = Object.freeze({
        // http://amundsen.com/hypermedia/urilist/
        create: (entries) => {
            return (0, arrays_1.distinct)(entries.map(x => x.toString())).join('\r\n');
        },
        split: (str) => {
            return str.split('\r\n');
        },
        parse: (str) => {
            return exports.UriList.split(str).filter(value => !value.startsWith('#'));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyYW5zZmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZGF0YVRyYW5zZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsb0VBTUM7SUFFRCxnRUFPQztJQWlIRCwwQ0FJQztJQXBJRCxTQUFnQiw0QkFBNEIsQ0FBQyxlQUF5QztRQUNyRixPQUFPO1lBQ04sUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsZUFBZTtZQUNyQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztZQUN2QixLQUFLLEVBQUUsT0FBTyxlQUFlLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFNBQVM7U0FDeEUsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxRQUFnQixFQUFFLEdBQW9CLEVBQUUsSUFBK0I7UUFDakgsTUFBTSxJQUFJLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBQSxtQkFBWSxHQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDL0QsT0FBTztZQUNOLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLEVBQUU7WUFDeEIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUk7WUFDbEIsS0FBSyxFQUFFLFNBQVM7U0FDaEIsQ0FBQztJQUNILENBQUM7SUFnQ0QsTUFBYSxjQUFjO1FBQTNCO1lBRWtCLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztRQXlFcEUsQ0FBQztRQXZFQSxJQUFXLElBQUk7WUFDZCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7WUFDYixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxFQUFFLENBQUM7WUFDUixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQWdCO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTSxPQUFPLENBQUMsT0FBZTtZQUM3QixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sMEJBQTBCLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRDs7OztXQUlHO1FBQ0ksTUFBTSxDQUFDLFFBQWdCLEVBQUUsS0FBd0I7WUFDdkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0MsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSSxPQUFPLENBQUMsUUFBZ0IsRUFBRSxLQUF3QjtZQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsUUFBZ0I7WUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDeEIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFFBQWdCO1lBQzdCLE9BQU8saUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBM0VELHdDQTJFQztJQUVELFNBQVMsaUJBQWlCLENBQUMsUUFBZ0I7UUFDMUMsT0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxPQUFlLEVBQUUsU0FBNEI7UUFDNUUsT0FBTywwQkFBMEIsQ0FDaEMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQzFCLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxTQUFTLDBCQUEwQixDQUFDLGlCQUF5QixFQUFFLG1CQUFzQztRQUNwRyxvQkFBb0I7UUFDcEIsSUFBSSxpQkFBaUIsS0FBSyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxPQUFPLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELGNBQWM7UUFDZCxJQUFJLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDckQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsOEJBQThCO1FBQzlCLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNmLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUNwQyxJQUFJLE9BQU8sS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNyQixPQUFPLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUdZLFFBQUEsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDcEMsMENBQTBDO1FBQzFDLE1BQU0sRUFBRSxDQUFDLE9BQW9DLEVBQVUsRUFBRTtZQUN4RCxPQUFPLElBQUEsaUJBQVEsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELEtBQUssRUFBRSxDQUFDLEdBQVcsRUFBWSxFQUFFO1lBQ2hDLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBQ0QsS0FBSyxFQUFFLENBQUMsR0FBVyxFQUFZLEVBQUU7WUFDaEMsT0FBTyxlQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7S0FDRCxDQUFDLENBQUMifQ==