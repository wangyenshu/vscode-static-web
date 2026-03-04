define(["require", "exports", "stream", "vs/base/common/buffer"], function (require, exports, stream_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StreamSplitter = void 0;
    /**
     * A Transform stream that splits the input on the "splitter" substring.
     * The resulting chunks will contain (and trail with) the splitter match.
     * The last chunk when the stream ends will be emitted even if a splitter
     * is not encountered.
     */
    class StreamSplitter extends stream_1.Transform {
        constructor(splitter) {
            super();
            if (typeof splitter === 'number') {
                this.splitter = splitter;
                this.spitterLen = 1;
            }
            else {
                const buf = Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter);
                this.splitter = buf.length === 1 ? buf[0] : buf;
                this.spitterLen = buf.length;
            }
        }
        _transform(chunk, _encoding, callback) {
            if (!this.buffer) {
                this.buffer = chunk;
            }
            else {
                this.buffer = Buffer.concat([this.buffer, chunk]);
            }
            let offset = 0;
            while (offset < this.buffer.length) {
                const index = typeof this.splitter === 'number'
                    ? this.buffer.indexOf(this.splitter, offset)
                    : (0, buffer_1.binaryIndexOf)(this.buffer, this.splitter, offset);
                if (index === -1) {
                    break;
                }
                this.push(this.buffer.slice(offset, index + this.spitterLen));
                offset = index + this.spitterLen;
            }
            this.buffer = offset === this.buffer.length ? undefined : this.buffer.slice(offset);
            callback();
        }
        _flush(callback) {
            if (this.buffer) {
                this.push(this.buffer);
            }
            callback();
        }
    }
    exports.StreamSplitter = StreamSplitter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVN0cmVhbXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvbm9kZVN0cmVhbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQU9BOzs7OztPQUtHO0lBQ0gsTUFBYSxjQUFlLFNBQVEsa0JBQVM7UUFLNUMsWUFBWSxRQUFrQztZQUM3QyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNyQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRVEsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixFQUFFLFFBQW9EO1lBQ3pHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUVELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sS0FBSyxHQUFHLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRO29CQUM5QyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxJQUFBLHNCQUFhLEVBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNsQixNQUFNO2dCQUNQLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDbEMsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BGLFFBQVEsRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVRLE1BQU0sQ0FBQyxRQUFvRDtZQUNuRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEIsQ0FBQztZQUVELFFBQVEsRUFBRSxDQUFDO1FBQ1osQ0FBQztLQUNEO0lBaERELHdDQWdEQyJ9