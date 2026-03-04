/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stream", "vs/base/common/buffer", "vs/amdX", "vs/base/common/cancellation"], function (require, exports, stream_1, buffer_1, amdX_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUPPORTED_ENCODINGS = exports.DecodeStreamError = exports.DecodeStreamErrorKind = exports.UTF8_BOM = exports.UTF16le_BOM = exports.UTF16be_BOM = exports.UTF16le = exports.UTF16be = exports.UTF8_with_bom = exports.UTF8 = void 0;
    exports.isUTFEncoding = isUTFEncoding;
    exports.toDecodeStream = toDecodeStream;
    exports.toEncodeReadable = toEncodeReadable;
    exports.encodingExists = encodingExists;
    exports.toNodeEncoding = toNodeEncoding;
    exports.detectEncodingByBOMFromBuffer = detectEncodingByBOMFromBuffer;
    exports.toCanonicalName = toCanonicalName;
    exports.detectEncodingFromBuffer = detectEncodingFromBuffer;
    exports.UTF8 = 'utf8';
    exports.UTF8_with_bom = 'utf8bom';
    exports.UTF16be = 'utf16be';
    exports.UTF16le = 'utf16le';
    function isUTFEncoding(encoding) {
        return [exports.UTF8, exports.UTF8_with_bom, exports.UTF16be, exports.UTF16le].some(utfEncoding => utfEncoding === encoding);
    }
    exports.UTF16be_BOM = [0xFE, 0xFF];
    exports.UTF16le_BOM = [0xFF, 0xFE];
    exports.UTF8_BOM = [0xEF, 0xBB, 0xBF];
    const ZERO_BYTE_DETECTION_BUFFER_MAX_LEN = 512; // number of bytes to look at to decide about a file being binary or not
    const NO_ENCODING_GUESS_MIN_BYTES = 512; // when not auto guessing the encoding, small number of bytes are enough
    const AUTO_ENCODING_GUESS_MIN_BYTES = 512 * 8; // with auto guessing we want a lot more content to be read for guessing
    const AUTO_ENCODING_GUESS_MAX_BYTES = 512 * 128; // set an upper limit for the number of bytes we pass on to jschardet
    var DecodeStreamErrorKind;
    (function (DecodeStreamErrorKind) {
        /**
         * Error indicating that the stream is binary even
         * though `acceptTextOnly` was specified.
         */
        DecodeStreamErrorKind[DecodeStreamErrorKind["STREAM_IS_BINARY"] = 1] = "STREAM_IS_BINARY";
    })(DecodeStreamErrorKind || (exports.DecodeStreamErrorKind = DecodeStreamErrorKind = {}));
    class DecodeStreamError extends Error {
        constructor(message, decodeStreamErrorKind) {
            super(message);
            this.decodeStreamErrorKind = decodeStreamErrorKind;
        }
    }
    exports.DecodeStreamError = DecodeStreamError;
    class DecoderStream {
        /**
         * This stream will only load iconv-lite lazily if the encoding
         * is not UTF-8. This ensures that for most common cases we do
         * not pay the price of loading the module from disk.
         *
         * We still need to be careful when converting UTF-8 to a string
         * though because we read the file in chunks of Buffer and thus
         * need to decode it via TextDecoder helper that is available
         * in browser and node.js environments.
         */
        static async create(encoding) {
            let decoder = undefined;
            if (encoding !== exports.UTF8) {
                const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
                decoder = iconv.getDecoder(toNodeEncoding(encoding));
            }
            else {
                const utf8TextDecoder = new TextDecoder();
                decoder = {
                    write(buffer) {
                        return utf8TextDecoder.decode(buffer, {
                            // Signal to TextDecoder that potentially more data is coming
                            // and that we are calling `decode` in the end to consume any
                            // remainders
                            stream: true
                        });
                    },
                    end() {
                        return utf8TextDecoder.decode();
                    }
                };
            }
            return new DecoderStream(decoder);
        }
        constructor(iconvLiteDecoder) {
            this.iconvLiteDecoder = iconvLiteDecoder;
        }
        write(buffer) {
            return this.iconvLiteDecoder.write(buffer);
        }
        end() {
            return this.iconvLiteDecoder.end();
        }
    }
    function toDecodeStream(source, options) {
        const minBytesRequiredForDetection = options.minBytesRequiredForDetection ?? options.guessEncoding ? AUTO_ENCODING_GUESS_MIN_BYTES : NO_ENCODING_GUESS_MIN_BYTES;
        return new Promise((resolve, reject) => {
            const target = (0, stream_1.newWriteableStream)(strings => strings.join(''));
            const bufferedChunks = [];
            let bytesBuffered = 0;
            let decoder = undefined;
            const cts = new cancellation_1.CancellationTokenSource();
            const createDecoder = async () => {
                try {
                    // detect encoding from buffer
                    const detected = await detectEncodingFromBuffer({
                        buffer: buffer_1.VSBuffer.concat(bufferedChunks),
                        bytesRead: bytesBuffered
                    }, options.guessEncoding);
                    // throw early if the source seems binary and
                    // we are instructed to only accept text
                    if (detected.seemsBinary && options.acceptTextOnly) {
                        throw new DecodeStreamError('Stream is binary but only text is accepted for decoding', 1 /* DecodeStreamErrorKind.STREAM_IS_BINARY */);
                    }
                    // ensure to respect overwrite of encoding
                    detected.encoding = await options.overwriteEncoding(detected.encoding);
                    // decode and write buffered content
                    decoder = await DecoderStream.create(detected.encoding);
                    const decoded = decoder.write(buffer_1.VSBuffer.concat(bufferedChunks).buffer);
                    target.write(decoded);
                    bufferedChunks.length = 0;
                    bytesBuffered = 0;
                    // signal to the outside our detected encoding and final decoder stream
                    resolve({
                        stream: target,
                        detected
                    });
                }
                catch (error) {
                    // Stop handling anything from the source and target
                    cts.cancel();
                    target.destroy();
                    reject(error);
                }
            };
            (0, stream_1.listenStream)(source, {
                onData: async (chunk) => {
                    // if the decoder is ready, we just write directly
                    if (decoder) {
                        target.write(decoder.write(chunk.buffer));
                    }
                    // otherwise we need to buffer the data until the stream is ready
                    else {
                        bufferedChunks.push(chunk);
                        bytesBuffered += chunk.byteLength;
                        // buffered enough data for encoding detection, create stream
                        if (bytesBuffered >= minBytesRequiredForDetection) {
                            // pause stream here until the decoder is ready
                            source.pause();
                            await createDecoder();
                            // resume stream now that decoder is ready but
                            // outside of this stack to reduce recursion
                            setTimeout(() => source.resume());
                        }
                    }
                },
                onError: error => target.error(error), // simply forward to target
                onEnd: async () => {
                    // we were still waiting for data to do the encoding
                    // detection. thus, wrap up starting the stream even
                    // without all the data to get things going
                    if (!decoder) {
                        await createDecoder();
                    }
                    // end the target with the remainders of the decoder
                    target.end(decoder?.end());
                }
            }, cts.token);
        });
    }
    async function toEncodeReadable(readable, encoding, options) {
        const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
        const encoder = iconv.getEncoder(toNodeEncoding(encoding), options);
        let bytesWritten = false;
        let done = false;
        return {
            read() {
                if (done) {
                    return null;
                }
                const chunk = readable.read();
                if (typeof chunk !== 'string') {
                    done = true;
                    // If we are instructed to add a BOM but we detect that no
                    // bytes have been written, we must ensure to return the BOM
                    // ourselves so that we comply with the contract.
                    if (!bytesWritten && options?.addBOM) {
                        switch (encoding) {
                            case exports.UTF8:
                            case exports.UTF8_with_bom:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF8_BOM));
                            case exports.UTF16be:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF16be_BOM));
                            case exports.UTF16le:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF16le_BOM));
                        }
                    }
                    const leftovers = encoder.end();
                    if (leftovers && leftovers.length > 0) {
                        bytesWritten = true;
                        return buffer_1.VSBuffer.wrap(leftovers);
                    }
                    return null;
                }
                bytesWritten = true;
                return buffer_1.VSBuffer.wrap(encoder.write(chunk));
            }
        };
    }
    async function encodingExists(encoding) {
        const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
        return iconv.encodingExists(toNodeEncoding(encoding));
    }
    function toNodeEncoding(enc) {
        if (enc === exports.UTF8_with_bom || enc === null) {
            return exports.UTF8; // iconv does not distinguish UTF 8 with or without BOM, so we need to help it
        }
        return enc;
    }
    function detectEncodingByBOMFromBuffer(buffer, bytesRead) {
        if (!buffer || bytesRead < exports.UTF16be_BOM.length) {
            return null;
        }
        const b0 = buffer.readUInt8(0);
        const b1 = buffer.readUInt8(1);
        // UTF-16 BE
        if (b0 === exports.UTF16be_BOM[0] && b1 === exports.UTF16be_BOM[1]) {
            return exports.UTF16be;
        }
        // UTF-16 LE
        if (b0 === exports.UTF16le_BOM[0] && b1 === exports.UTF16le_BOM[1]) {
            return exports.UTF16le;
        }
        if (bytesRead < exports.UTF8_BOM.length) {
            return null;
        }
        const b2 = buffer.readUInt8(2);
        // UTF-8
        if (b0 === exports.UTF8_BOM[0] && b1 === exports.UTF8_BOM[1] && b2 === exports.UTF8_BOM[2]) {
            return exports.UTF8_with_bom;
        }
        return null;
    }
    // we explicitly ignore a specific set of encodings from auto guessing
    // - ASCII: we never want this encoding (most UTF-8 files would happily detect as
    //          ASCII files and then you could not type non-ASCII characters anymore)
    // - UTF-16: we have our own detection logic for UTF-16
    // - UTF-32: we do not support this encoding in VSCode
    const IGNORE_ENCODINGS = ['ascii', 'utf-16', 'utf-32'];
    /**
     * Guesses the encoding from buffer.
     */
    async function guessEncodingByBuffer(buffer) {
        const jschardet = await (0, amdX_1.importAMDNodeModule)('jschardet', 'dist/jschardet.min.js');
        // ensure to limit buffer for guessing due to https://github.com/aadsm/jschardet/issues/53
        const limitedBuffer = buffer.slice(0, AUTO_ENCODING_GUESS_MAX_BYTES);
        // before guessing jschardet calls toString('binary') on input if it is a Buffer,
        // since we are using it inside browser environment as well we do conversion ourselves
        // https://github.com/aadsm/jschardet/blob/v2.1.1/src/index.js#L36-L40
        const binaryString = encodeLatin1(limitedBuffer.buffer);
        const guessed = jschardet.detect(binaryString);
        if (!guessed || !guessed.encoding) {
            return null;
        }
        const enc = guessed.encoding.toLowerCase();
        if (0 <= IGNORE_ENCODINGS.indexOf(enc)) {
            return null; // see comment above why we ignore some encodings
        }
        return toIconvLiteEncoding(guessed.encoding);
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    function encodeLatin1(buffer) {
        let result = '';
        for (let i = 0; i < buffer.length; i++) {
            result += String.fromCharCode(buffer[i]);
        }
        return result;
    }
    /**
     * The encodings that are allowed in a settings file don't match the canonical encoding labels specified by WHATWG.
     * See https://encoding.spec.whatwg.org/#names-and-labels
     * Iconv-lite strips all non-alphanumeric characters, but ripgrep doesn't. For backcompat, allow these labels.
     */
    function toCanonicalName(enc) {
        switch (enc) {
            case 'shiftjis':
                return 'shift-jis';
            case 'utf16le':
                return 'utf-16le';
            case 'utf16be':
                return 'utf-16be';
            case 'big5hkscs':
                return 'big5-hkscs';
            case 'eucjp':
                return 'euc-jp';
            case 'euckr':
                return 'euc-kr';
            case 'koi8r':
                return 'koi8-r';
            case 'koi8u':
                return 'koi8-u';
            case 'macroman':
                return 'x-mac-roman';
            case 'utf8bom':
                return 'utf8';
            default: {
                const m = enc.match(/windows(\d+)/);
                if (m) {
                    return 'windows-' + m[1];
                }
                return enc;
            }
        }
    }
    function detectEncodingFromBuffer({ buffer, bytesRead }, autoGuessEncoding) {
        // Always first check for BOM to find out about encoding
        let encoding = detectEncodingByBOMFromBuffer(buffer, bytesRead);
        // Detect 0 bytes to see if file is binary or UTF-16 LE/BE
        // unless we already know that this file has a UTF-16 encoding
        let seemsBinary = false;
        if (encoding !== exports.UTF16be && encoding !== exports.UTF16le && buffer) {
            let couldBeUTF16LE = true; // e.g. 0xAA 0x00
            let couldBeUTF16BE = true; // e.g. 0x00 0xAA
            let containsZeroByte = false;
            // This is a simplified guess to detect UTF-16 BE or LE by just checking if
            // the first 512 bytes have the 0-byte at a specific location. For UTF-16 LE
            // this would be the odd byte index and for UTF-16 BE the even one.
            // Note: this can produce false positives (a binary file that uses a 2-byte
            // encoding of the same format as UTF-16) and false negatives (a UTF-16 file
            // that is using 4 bytes to encode a character).
            for (let i = 0; i < bytesRead && i < ZERO_BYTE_DETECTION_BUFFER_MAX_LEN; i++) {
                const isEndian = (i % 2 === 1); // assume 2-byte sequences typical for UTF-16
                const isZeroByte = (buffer.readUInt8(i) === 0);
                if (isZeroByte) {
                    containsZeroByte = true;
                }
                // UTF-16 LE: expect e.g. 0xAA 0x00
                if (couldBeUTF16LE && (isEndian && !isZeroByte || !isEndian && isZeroByte)) {
                    couldBeUTF16LE = false;
                }
                // UTF-16 BE: expect e.g. 0x00 0xAA
                if (couldBeUTF16BE && (isEndian && isZeroByte || !isEndian && !isZeroByte)) {
                    couldBeUTF16BE = false;
                }
                // Return if this is neither UTF16-LE nor UTF16-BE and thus treat as binary
                if (isZeroByte && !couldBeUTF16LE && !couldBeUTF16BE) {
                    break;
                }
            }
            // Handle case of 0-byte included
            if (containsZeroByte) {
                if (couldBeUTF16LE) {
                    encoding = exports.UTF16le;
                }
                else if (couldBeUTF16BE) {
                    encoding = exports.UTF16be;
                }
                else {
                    seemsBinary = true;
                }
            }
        }
        // Auto guess encoding if configured
        if (autoGuessEncoding && !seemsBinary && !encoding && buffer) {
            return guessEncodingByBuffer(buffer.slice(0, bytesRead)).then(guessedEncoding => {
                return {
                    seemsBinary: false,
                    encoding: guessedEncoding
                };
            });
        }
        return { seemsBinary, encoding };
    }
    exports.SUPPORTED_ENCODINGS = {
        utf8: {
            labelLong: 'UTF-8',
            labelShort: 'UTF-8',
            order: 1,
            alias: 'utf8bom'
        },
        utf8bom: {
            labelLong: 'UTF-8 with BOM',
            labelShort: 'UTF-8 with BOM',
            encodeOnly: true,
            order: 2,
            alias: 'utf8'
        },
        utf16le: {
            labelLong: 'UTF-16 LE',
            labelShort: 'UTF-16 LE',
            order: 3
        },
        utf16be: {
            labelLong: 'UTF-16 BE',
            labelShort: 'UTF-16 BE',
            order: 4
        },
        windows1252: {
            labelLong: 'Western (Windows 1252)',
            labelShort: 'Windows 1252',
            order: 5
        },
        iso88591: {
            labelLong: 'Western (ISO 8859-1)',
            labelShort: 'ISO 8859-1',
            order: 6
        },
        iso88593: {
            labelLong: 'Western (ISO 8859-3)',
            labelShort: 'ISO 8859-3',
            order: 7
        },
        iso885915: {
            labelLong: 'Western (ISO 8859-15)',
            labelShort: 'ISO 8859-15',
            order: 8
        },
        macroman: {
            labelLong: 'Western (Mac Roman)',
            labelShort: 'Mac Roman',
            order: 9
        },
        cp437: {
            labelLong: 'DOS (CP 437)',
            labelShort: 'CP437',
            order: 10
        },
        windows1256: {
            labelLong: 'Arabic (Windows 1256)',
            labelShort: 'Windows 1256',
            order: 11
        },
        iso88596: {
            labelLong: 'Arabic (ISO 8859-6)',
            labelShort: 'ISO 8859-6',
            order: 12
        },
        windows1257: {
            labelLong: 'Baltic (Windows 1257)',
            labelShort: 'Windows 1257',
            order: 13
        },
        iso88594: {
            labelLong: 'Baltic (ISO 8859-4)',
            labelShort: 'ISO 8859-4',
            order: 14
        },
        iso885914: {
            labelLong: 'Celtic (ISO 8859-14)',
            labelShort: 'ISO 8859-14',
            order: 15
        },
        windows1250: {
            labelLong: 'Central European (Windows 1250)',
            labelShort: 'Windows 1250',
            order: 16
        },
        iso88592: {
            labelLong: 'Central European (ISO 8859-2)',
            labelShort: 'ISO 8859-2',
            order: 17
        },
        cp852: {
            labelLong: 'Central European (CP 852)',
            labelShort: 'CP 852',
            order: 18
        },
        windows1251: {
            labelLong: 'Cyrillic (Windows 1251)',
            labelShort: 'Windows 1251',
            order: 19
        },
        cp866: {
            labelLong: 'Cyrillic (CP 866)',
            labelShort: 'CP 866',
            order: 20
        },
        iso88595: {
            labelLong: 'Cyrillic (ISO 8859-5)',
            labelShort: 'ISO 8859-5',
            order: 21
        },
        koi8r: {
            labelLong: 'Cyrillic (KOI8-R)',
            labelShort: 'KOI8-R',
            order: 22
        },
        koi8u: {
            labelLong: 'Cyrillic (KOI8-U)',
            labelShort: 'KOI8-U',
            order: 23
        },
        iso885913: {
            labelLong: 'Estonian (ISO 8859-13)',
            labelShort: 'ISO 8859-13',
            order: 24
        },
        windows1253: {
            labelLong: 'Greek (Windows 1253)',
            labelShort: 'Windows 1253',
            order: 25
        },
        iso88597: {
            labelLong: 'Greek (ISO 8859-7)',
            labelShort: 'ISO 8859-7',
            order: 26
        },
        windows1255: {
            labelLong: 'Hebrew (Windows 1255)',
            labelShort: 'Windows 1255',
            order: 27
        },
        iso88598: {
            labelLong: 'Hebrew (ISO 8859-8)',
            labelShort: 'ISO 8859-8',
            order: 28
        },
        iso885910: {
            labelLong: 'Nordic (ISO 8859-10)',
            labelShort: 'ISO 8859-10',
            order: 29
        },
        iso885916: {
            labelLong: 'Romanian (ISO 8859-16)',
            labelShort: 'ISO 8859-16',
            order: 30
        },
        windows1254: {
            labelLong: 'Turkish (Windows 1254)',
            labelShort: 'Windows 1254',
            order: 31
        },
        iso88599: {
            labelLong: 'Turkish (ISO 8859-9)',
            labelShort: 'ISO 8859-9',
            order: 32
        },
        windows1258: {
            labelLong: 'Vietnamese (Windows 1258)',
            labelShort: 'Windows 1258',
            order: 33
        },
        gbk: {
            labelLong: 'Simplified Chinese (GBK)',
            labelShort: 'GBK',
            order: 34
        },
        gb18030: {
            labelLong: 'Simplified Chinese (GB18030)',
            labelShort: 'GB18030',
            order: 35
        },
        cp950: {
            labelLong: 'Traditional Chinese (Big5)',
            labelShort: 'Big5',
            order: 36
        },
        big5hkscs: {
            labelLong: 'Traditional Chinese (Big5-HKSCS)',
            labelShort: 'Big5-HKSCS',
            order: 37
        },
        shiftjis: {
            labelLong: 'Japanese (Shift JIS)',
            labelShort: 'Shift JIS',
            order: 38
        },
        eucjp: {
            labelLong: 'Japanese (EUC-JP)',
            labelShort: 'EUC-JP',
            order: 39
        },
        euckr: {
            labelLong: 'Korean (EUC-KR)',
            labelShort: 'EUC-KR',
            order: 40
        },
        windows874: {
            labelLong: 'Thai (Windows 874)',
            labelShort: 'Windows 874',
            order: 41
        },
        iso885911: {
            labelLong: 'Latin/Thai (ISO 8859-11)',
            labelShort: 'ISO 8859-11',
            order: 42
        },
        koi8ru: {
            labelLong: 'Cyrillic (KOI8-RU)',
            labelShort: 'KOI8-RU',
            order: 43
        },
        koi8t: {
            labelLong: 'Tajik (KOI8-T)',
            labelShort: 'KOI8-T',
            order: 44
        },
        gb2312: {
            labelLong: 'Simplified Chinese (GB 2312)',
            labelShort: 'GB 2312',
            order: 45
        },
        cp865: {
            labelLong: 'Nordic DOS (CP 865)',
            labelShort: 'CP 865',
            order: 46
        },
        cp850: {
            labelLong: 'Western European DOS (CP 850)',
            labelShort: 'CP 850',
            order: 47
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvY29tbW9uL2VuY29kaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxzQ0FFQztJQWlHRCx3Q0FnR0M7SUFFRCw0Q0ErQ0M7SUFFRCx3Q0FJQztJQUVELHdDQU1DO0lBRUQsc0VBOEJDO0lBOERELDBDQStCQztJQWNELDREQWtFQztJQXRkWSxRQUFBLElBQUksR0FBRyxNQUFNLENBQUM7SUFDZCxRQUFBLGFBQWEsR0FBRyxTQUFTLENBQUM7SUFDMUIsUUFBQSxPQUFPLEdBQUcsU0FBUyxDQUFDO0lBQ3BCLFFBQUEsT0FBTyxHQUFHLFNBQVMsQ0FBQztJQUlqQyxTQUFnQixhQUFhLENBQUMsUUFBZ0I7UUFDN0MsT0FBTyxDQUFDLFlBQUksRUFBRSxxQkFBYSxFQUFFLGVBQU8sRUFBRSxlQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVZLFFBQUEsV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNCLFFBQUEsV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNCLFFBQUEsUUFBUSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUzQyxNQUFNLGtDQUFrQyxHQUFHLEdBQUcsQ0FBQyxDQUFFLHdFQUF3RTtJQUN6SCxNQUFNLDJCQUEyQixHQUFHLEdBQUcsQ0FBQyxDQUFJLHdFQUF3RTtJQUNwSCxNQUFNLDZCQUE2QixHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBRyx3RUFBd0U7SUFD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