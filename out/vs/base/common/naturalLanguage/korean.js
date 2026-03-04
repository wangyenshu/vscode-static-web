/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getKoreanAltChars = getKoreanAltChars;
    // allow-any-unicode-comment-file
    /**
     * Gets alternative Korean characters for the character code. This will return the ascii
     * character code(s) that a Hangul character may have been input with using a qwerty layout.
     *
     * This only aims to cover modern (not archaic) Hangul syllables.
     *
     * @param code The character code to get alternate characters for
     */
    function getKoreanAltChars(code) {
        const result = disassembleKorean(code);
        if (result && result.length > 0) {
            return new Uint32Array(result);
        }
        return undefined;
    }
    let codeBufferLength = 0;
    const codeBuffer = new Uint32Array(10);
    function disassembleKorean(code) {
        codeBufferLength = 0;
        // Initial consonants (초성)
        getCodesFromArray(code, modernConsonants, 4352 /* HangulRangeStartCode.InitialConsonant */);
        if (codeBufferLength > 0) {
            return codeBuffer.subarray(0, codeBufferLength);
        }
        // Vowels (중성)
        getCodesFromArray(code, modernVowels, 4449 /* HangulRangeStartCode.Vowel */);
        if (codeBufferLength > 0) {
            return codeBuffer.subarray(0, codeBufferLength);
        }
        // Final consonants (종성)
        getCodesFromArray(code, modernFinalConsonants, 4520 /* HangulRangeStartCode.FinalConsonant */);
        if (codeBufferLength > 0) {
            return codeBuffer.subarray(0, codeBufferLength);
        }
        // Hangul Compatibility Jamo
        getCodesFromArray(code, compatibilityJamo, 12593 /* HangulRangeStartCode.CompatibilityJamo */);
        if (codeBufferLength) {
            return codeBuffer.subarray(0, codeBufferLength);
        }
        // Hangul Syllables
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const hangulIndex = code - 0xAC00;
            const vowelAndFinalConsonantProduct = hangulIndex % 588;
            // 0-based starting at 0x1100
            const initialConsonantIndex = Math.floor(hangulIndex / 588);
            // 0-based starting at 0x1161
            const vowelIndex = Math.floor(vowelAndFinalConsonantProduct / 28);
            // 0-based starting at 0x11A8
            // Subtract 1 as the standard algorithm uses the 0 index to represent no
            // final consonant
            const finalConsonantIndex = vowelAndFinalConsonantProduct % 28 - 1;
            if (initialConsonantIndex < modernConsonants.length) {
                getCodesFromArray(initialConsonantIndex, modernConsonants, 0);
            }
            else if (4352 /* HangulRangeStartCode.InitialConsonant */ + initialConsonantIndex - 12593 /* HangulRangeStartCode.CompatibilityJamo */ < compatibilityJamo.length) {
                getCodesFromArray(4352 /* HangulRangeStartCode.InitialConsonant */ + initialConsonantIndex, compatibilityJamo, 12593 /* HangulRangeStartCode.CompatibilityJamo */);
            }
            if (vowelIndex < modernVowels.length) {
                getCodesFromArray(vowelIndex, modernVowels, 0);
            }
            else if (4449 /* HangulRangeStartCode.Vowel */ + vowelIndex - 12593 /* HangulRangeStartCode.CompatibilityJamo */ < compatibilityJamo.length) {
                getCodesFromArray(4449 /* HangulRangeStartCode.Vowel */ + vowelIndex - 12593 /* HangulRangeStartCode.CompatibilityJamo */, compatibilityJamo, 12593 /* HangulRangeStartCode.CompatibilityJamo */);
            }
            if (finalConsonantIndex >= 0) {
                if (finalConsonantIndex < modernFinalConsonants.length) {
                    getCodesFromArray(finalConsonantIndex, modernFinalConsonants, 0);
                }
                else if (4520 /* HangulRangeStartCode.FinalConsonant */ + finalConsonantIndex - 12593 /* HangulRangeStartCode.CompatibilityJamo */ < compatibilityJamo.length) {
                    getCodesFromArray(4520 /* HangulRangeStartCode.FinalConsonant */ + finalConsonantIndex - 12593 /* HangulRangeStartCode.CompatibilityJamo */, compatibilityJamo, 12593 /* HangulRangeStartCode.CompatibilityJamo */);
                }
            }
            if (codeBufferLength > 0) {
                return codeBuffer.subarray(0, codeBufferLength);
            }
        }
        return undefined;
    }
    function getCodesFromArray(code, array, arrayStartIndex) {
        // Verify the code is within the array's range
        if (code >= arrayStartIndex && code < arrayStartIndex + array.length) {
            addCodesToBuffer(array[code - arrayStartIndex]);
        }
    }
    function addCodesToBuffer(codes) {
        // NUL is ignored, this is used for archaic characters to avoid using a Map
        // for the data
        if (codes === 0 /* AsciiCode.NUL */) {
            return;
        }
        // Number stored in format: OptionalThirdCode << 16 | OptionalSecondCode << 8 | Code
        codeBuffer[codeBufferLength++] = codes & 0xFF;
        if (codes >> 8) {
            codeBuffer[codeBufferLength++] = (codes >> 8) & 0xFF;
        }
        if (codes >> 16) {
            codeBuffer[codeBufferLength++] = (codes >> 16) & 0xFF;
        }
    }
    var HangulRangeStartCode;
    (function (HangulRangeStartCode) {
        HangulRangeStartCode[HangulRangeStartCode["InitialConsonant"] = 4352] = "InitialConsonant";
        HangulRangeStartCode[HangulRangeStartCode["Vowel"] = 4449] = "Vowel";
        HangulRangeStartCode[HangulRangeStartCode["FinalConsonant"] = 4520] = "FinalConsonant";
        HangulRangeStartCode[HangulRangeStartCode["CompatibilityJamo"] = 12593] = "CompatibilityJamo";
    })(HangulRangeStartCode || (HangulRangeStartCode = {}));
    var AsciiCode;
    (function (AsciiCode) {
        AsciiCode[AsciiCode["NUL"] = 0] = "NUL";
        AsciiCode[AsciiCode["A"] = 65] = "A";
        AsciiCode[AsciiCode["B"] = 66] = "B";
        AsciiCode[AsciiCode["C"] = 67] = "C";
        AsciiCode[AsciiCode["D"] = 68] = "D";
        AsciiCode[AsciiCode["E"] = 69] = "E";
        AsciiCode[AsciiCode["F"] = 70] = "F";
        AsciiCode[AsciiCode["G"] = 71] = "G";
        AsciiCode[AsciiCode["H"] = 72] = "H";
        AsciiCode[AsciiCode["I"] = 73] = "I";
        AsciiCode[AsciiCode["J"] = 74] = "J";
        AsciiCode[AsciiCode["K"] = 75] = "K";
        AsciiCode[AsciiCode["L"] = 76] = "L";
        AsciiCode[AsciiCode["M"] = 77] = "M";
        AsciiCode[AsciiCode["N"] = 78] = "N";
        AsciiCode[AsciiCode["O"] = 79] = "O";
        AsciiCode[AsciiCode["P"] = 80] = "P";
        AsciiCode[AsciiCode["Q"] = 81] = "Q";
        AsciiCode[AsciiCode["R"] = 82] = "R";
        AsciiCode[AsciiCode["S"] = 83] = "S";
        AsciiCode[AsciiCode["T"] = 84] = "T";
        AsciiCode[AsciiCode["U"] = 85] = "U";
        AsciiCode[AsciiCode["V"] = 86] = "V";
        AsciiCode[AsciiCode["W"] = 87] = "W";
        AsciiCode[AsciiCode["X"] = 88] = "X";
        AsciiCode[AsciiCode["Y"] = 89] = "Y";
        AsciiCode[AsciiCode["Z"] = 90] = "Z";
        AsciiCode[AsciiCode["a"] = 97] = "a";
        AsciiCode[AsciiCode["b"] = 98] = "b";
        AsciiCode[AsciiCode["c"] = 99] = "c";
        AsciiCode[AsciiCode["d"] = 100] = "d";
        AsciiCode[AsciiCode["e"] = 101] = "e";
        AsciiCode[AsciiCode["f"] = 102] = "f";
        AsciiCode[AsciiCode["g"] = 103] = "g";
        AsciiCode[AsciiCode["h"] = 104] = "h";
        AsciiCode[AsciiCode["i"] = 105] = "i";
        AsciiCode[AsciiCode["j"] = 106] = "j";
        AsciiCode[AsciiCode["k"] = 107] = "k";
        AsciiCode[AsciiCode["l"] = 108] = "l";
        AsciiCode[AsciiCode["m"] = 109] = "m";
        AsciiCode[AsciiCode["n"] = 110] = "n";
        AsciiCode[AsciiCode["o"] = 111] = "o";
        AsciiCode[AsciiCode["p"] = 112] = "p";
        AsciiCode[AsciiCode["q"] = 113] = "q";
        AsciiCode[AsciiCode["r"] = 114] = "r";
        AsciiCode[AsciiCode["s"] = 115] = "s";
        AsciiCode[AsciiCode["t"] = 116] = "t";
        AsciiCode[AsciiCode["u"] = 117] = "u";
        AsciiCode[AsciiCode["v"] = 118] = "v";
        AsciiCode[AsciiCode["w"] = 119] = "w";
        AsciiCode[AsciiCode["x"] = 120] = "x";
        AsciiCode[AsciiCode["y"] = 121] = "y";
        AsciiCode[AsciiCode["z"] = 122] = "z";
    })(AsciiCode || (AsciiCode = {}));
    /**
     * Numbers that represent multiple ascii codes. These are precomputed at compile time to reduce
     * bundle and runtime overhead.
     */
    var AsciiCodeCombo;
    (function (AsciiCodeCombo) {
        AsciiCodeCombo[AsciiCodeCombo["fa"] = 24934] = "fa";
        AsciiCodeCombo[AsciiCodeCombo["fg"] = 26470] = "fg";
        AsciiCodeCombo[AsciiCodeCombo["fq"] = 29030] = "fq";
        AsciiCodeCombo[AsciiCodeCombo["fr"] = 29286] = "fr";
        AsciiCodeCombo[AsciiCodeCombo["ft"] = 29798] = "ft";
        AsciiCodeCombo[AsciiCodeCombo["fv"] = 30310] = "fv";
        AsciiCodeCombo[AsciiCodeCombo["fx"] = 30822] = "fx";
        AsciiCodeCombo[AsciiCodeCombo["hk"] = 27496] = "hk";
        AsciiCodeCombo[AsciiCodeCombo["hl"] = 27752] = "hl";
        AsciiCodeCombo[AsciiCodeCombo["ho"] = 28520] = "ho";
        AsciiCodeCombo[AsciiCodeCombo["ml"] = 27757] = "ml";
        AsciiCodeCombo[AsciiCodeCombo["nj"] = 27246] = "nj";
        AsciiCodeCombo[AsciiCodeCombo["nl"] = 27758] = "nl";
        AsciiCodeCombo[AsciiCodeCombo["np"] = 28782] = "np";
        AsciiCodeCombo[AsciiCodeCombo["qt"] = 29809] = "qt";
        AsciiCodeCombo[AsciiCodeCombo["rt"] = 29810] = "rt";
        AsciiCodeCombo[AsciiCodeCombo["sg"] = 26483] = "sg";
        AsciiCodeCombo[AsciiCodeCombo["sw"] = 30579] = "sw";
    })(AsciiCodeCombo || (AsciiCodeCombo = {}));
    /**
     * Hangul Jamo - Modern consonants #1
     *
     * Range U+1100..U+1112
     *
     * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
     * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * | U+110x | ᄀ | ᄁ | ᄂ | ᄃ | ᄄ | ᄅ | ᄆ | ᄇ | ᄈ | ᄉ | ᄊ | ᄋ | ᄌ | ᄍ | ᄎ | ᄏ |
     * | U+111x | ᄐ | ᄑ | ᄒ |
     */
    const modernConsonants = new Uint8Array([
        114 /* AsciiCode.r */, // ㄱ
        82 /* AsciiCode.R */, // ㄲ
        115 /* AsciiCode.s */, // ㄴ
        101 /* AsciiCode.e */, // ㄷ
        69 /* AsciiCode.E */, // ㄸ
        102 /* AsciiCode.f */, // ㄹ
        97 /* AsciiCode.a */, // ㅁ
        113 /* AsciiCode.q */, // ㅂ
        81 /* AsciiCode.Q */, // ㅃ
        116 /* AsciiCode.t */, // ㅅ
        84 /* AsciiCode.T */, // ㅆ
        100 /* AsciiCode.d */, // ㅇ
        119 /* AsciiCode.w */, // ㅈ
        87 /* AsciiCode.W */, // ㅉ
        99 /* AsciiCode.c */, // ㅊ
        122 /* AsciiCode.z */, // ㅋ
        120 /* AsciiCode.x */, // ㅌ
        118 /* AsciiCode.v */, // ㅍ
        103 /* AsciiCode.g */, // ㅎ
    ]);
    /**
     * Hangul Jamo - Modern Vowels
     *
     * Range U+1161..U+1175
     *
     * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
     * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * | U+116x |   | ᅡ | ᅢ | ᅣ | ᅤ | ᅥ | ᅦ | ᅧ | ᅨ | ᅩ | ᅪ | ᅫ | ᅬ | ᅭ | ᅮ | ᅯ |
     * | U+117x | ᅰ | ᅱ | ᅲ | ᅳ | ᅴ | ᅵ |
     */
    const modernVowels = new Uint16Array([
        107 /* AsciiCode.k */, //  -> ㅏ
        111 /* AsciiCode.o */, //  -> ㅐ
        105 /* AsciiCode.i */, //  -> ㅑ
        79 /* AsciiCode.O */, //  -> ㅒ
        106 /* AsciiCode.j */, //  -> ㅓ
        112 /* AsciiCode.p */, //  -> ㅔ
        117 /* AsciiCode.u */, //  -> ㅕ
        80 /* AsciiCode.P */, //  -> ㅖ
        104 /* AsciiCode.h */, //  -> ㅗ
        27496 /* AsciiCodeCombo.hk */, //  -> ㅘ
        28520 /* AsciiCodeCombo.ho */, //  -> ㅙ
        27752 /* AsciiCodeCombo.hl */, //  -> ㅚ
        121 /* AsciiCode.y */, //  -> ㅛ
        110 /* AsciiCode.n */, //  -> ㅜ
        27246 /* AsciiCodeCombo.nj */, //  -> ㅝ
        28782 /* AsciiCodeCombo.np */, //  -> ㅞ
        27758 /* AsciiCodeCombo.nl */, //  -> ㅟ
        98 /* AsciiCode.b */, //  -> ㅠ
        109 /* AsciiCode.m */, //  -> ㅡ
        27757 /* AsciiCodeCombo.ml */, //  -> ㅢ
        108 /* AsciiCode.l */, //  -> ㅣ
    ]);
    /**
     * Hangul Jamo - Modern Consonants #2
     *
     * Range U+11A8..U+11C2
     *
     * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
     * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * | U+11Ax |   |   |   |   |   |   |   |   | ᆨ | ᆩ | ᆪ | ᆫ | ᆬ | ᆭ | ᆮ | ᆯ |
     * | U+11Bx | ᆰ | ᆱ | ᆲ | ᆳ | ᆴ | ᆵ | ᆶ | ᆷ | ᆸ | ᆹ | ᆺ | ᆻ | ᆼ | ᆽ | ᆾ | ᆿ |
     * | U+11Cx | ᇀ | ᇁ | ᇂ |
     */
    const modernFinalConsonants = new Uint16Array([
        114 /* AsciiCode.r */, // ㄱ
        82 /* AsciiCode.R */, // ㄲ
        29810 /* AsciiCodeCombo.rt */, // ㄳ
        115 /* AsciiCode.s */, // ㄴ
        30579 /* AsciiCodeCombo.sw */, // ㄵ
        26483 /* AsciiCodeCombo.sg */, // ㄶ
        101 /* AsciiCode.e */, // ㄷ
        102 /* AsciiCode.f */, // ㄹ
        29286 /* AsciiCodeCombo.fr */, // ㄺ
        24934 /* AsciiCodeCombo.fa */, // ㄻ
        29030 /* AsciiCodeCombo.fq */, // ㄼ
        29798 /* AsciiCodeCombo.ft */, // ㄽ
        30822 /* AsciiCodeCombo.fx */, // ㄾ
        30310 /* AsciiCodeCombo.fv */, // ㄿ
        26470 /* AsciiCodeCombo.fg */, // ㅀ
        97 /* AsciiCode.a */, // ㅁ
        113 /* AsciiCode.q */, // ㅂ
        29809 /* AsciiCodeCombo.qt */, // ㅄ
        116 /* AsciiCode.t */, // ㅅ
        84 /* AsciiCode.T */, // ㅆ
        100 /* AsciiCode.d */, // ㅇ
        119 /* AsciiCode.w */, // ㅈ
        99 /* AsciiCode.c */, // ㅊ
        122 /* AsciiCode.z */, // ㅋ
        120 /* AsciiCode.x */, // ㅌ
        118 /* AsciiCode.v */, // ㅍ
        103 /* AsciiCode.g */, // ㅎ
    ]);
    /**
     * Hangul Compatibility Jamo
     *
     * Range U+3131..U+318F
     *
     * This includes range includes archaic jamo which we don't consider, these are
     * given the NUL character code in order to be ignored.
     *
     * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
     * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
     * | U+313x |   | ㄱ | ㄲ | ㄳ | ㄴ | ㄵ | ㄶ | ㄷ | ㄸ | ㄹ | ㄺ | ㄻ | ㄼ | ㄽ | ㄾ | ㄿ |
     * | U+314x | ㅀ | ㅁ | ㅂ | ㅃ | ㅄ | ㅅ | ㅆ | ㅇ | ㅈ | ㅉ | ㅊ | ㅋ | ㅌ | ㅍ | ㅎ | ㅏ |
     * | U+315x | ㅐ | ㅑ | ㅒ | ㅓ | ㅔ | ㅕ | ㅖ | ㅗ | ㅘ | ㅙ | ㅚ | ㅛ | ㅜ | ㅝ | ㅞ | ㅟ |
     * | U+316x | ㅠ | ㅡ | ㅢ | ㅣ | HF | ㅥ | ㅦ | ㅧ | ㅨ | ㅩ | ㅪ | ㅫ | ㅬ | ㅭ | ㅮ | ㅯ |
     * | U+317x | ㅰ | ㅱ | ㅲ | ㅳ | ㅴ | ㅵ | ㅶ | ㅷ | ㅸ | ㅹ | ㅺ | ㅻ | ㅼ | ㅽ | ㅾ | ㅿ |
     * | U+318x | ㆀ | ㆁ | ㆂ | ㆃ | ㆄ | ㆅ | ㆆ | ㆇ | ㆈ | ㆉ | ㆊ | ㆋ | ㆌ | ㆍ | ㆎ |
     */
    const compatibilityJamo = new Uint16Array([
        114 /* AsciiCode.r */, // ㄱ
        82 /* AsciiCode.R */, // ㄲ
        29810 /* AsciiCodeCombo.rt */, // ㄳ
        115 /* AsciiCode.s */, // ㄴ
        30579 /* AsciiCodeCombo.sw */, // ㄵ
        26483 /* AsciiCodeCombo.sg */, // ㄶ
        101 /* AsciiCode.e */, // ㄷ
        69 /* AsciiCode.E */, // ㄸ
        102 /* AsciiCode.f */, // ㄹ
        29286 /* AsciiCodeCombo.fr */, // ㄺ
        24934 /* AsciiCodeCombo.fa */, // ㄻ
        29030 /* AsciiCodeCombo.fq */, // ㄼ
        29798 /* AsciiCodeCombo.ft */, // ㄽ
        30822 /* AsciiCodeCombo.fx */, // ㄾ
        30310 /* AsciiCodeCombo.fv */, // ㄿ
        26470 /* AsciiCodeCombo.fg */, // ㅀ
        97 /* AsciiCode.a */, // ㅁ
        113 /* AsciiCode.q */, // ㅂ
        81 /* AsciiCode.Q */, // ㅃ
        29809 /* AsciiCodeCombo.qt */, // ㅄ
        116 /* AsciiCode.t */, // ㅅ
        84 /* AsciiCode.T */, // ㅆ
        100 /* AsciiCode.d */, // ㅇ
        119 /* AsciiCode.w */, // ㅈ
        87 /* AsciiCode.W */, // ㅉ
        99 /* AsciiCode.c */, // ㅊ
        122 /* AsciiCode.z */, // ㅋ
        120 /* AsciiCode.x */, // ㅌ
        118 /* AsciiCode.v */, // ㅍ
        103 /* AsciiCode.g */, // ㅎ
        107 /* AsciiCode.k */, // ㅏ
        111 /* AsciiCode.o */, // ㅐ
        105 /* AsciiCode.i */, // ㅑ
        79 /* AsciiCode.O */, // ㅒ
        106 /* AsciiCode.j */, // ㅓ
        112 /* AsciiCode.p */, // ㅔ
        117 /* AsciiCode.u */, // ㅕ
        80 /* AsciiCode.P */, // ㅖ
        104 /* AsciiCode.h */, // ㅗ
        27496 /* AsciiCodeCombo.hk */, // ㅘ
        28520 /* AsciiCodeCombo.ho */, // ㅙ
        27752 /* AsciiCodeCombo.hl */, // ㅚ
        121 /* AsciiCode.y */, // ㅛ
        110 /* AsciiCode.n */, // ㅜ
        27246 /* AsciiCodeCombo.nj */, // ㅝ
        28782 /* AsciiCodeCombo.np */, // ㅞ
        27758 /* AsciiCodeCombo.nl */, // ㅟ
        98 /* AsciiCode.b */, // ㅠ
        109 /* AsciiCode.m */, // ㅡ
        27757 /* AsciiCodeCombo.ml */, // ㅢ
        108 /* AsciiCode.l */, // ㅣ
        // HF: Hangul Filler (everything after this is archaic)
        // ㅥ
        // ㅦ
        // ㅧ
        // ㅨ
        // ㅩ
        // ㅪ
        // ㅫ
        // ㅬ
        // ㅮ
        // ㅯ
        // ㅰ
        // ㅱ
        // ㅲ
        // ㅳ
        // ㅴ
        // ㅵ
        // ㅶ
        // ㅷ
        // ㅸ
        // ㅹ
        // ㅺ
        // ㅻ
        // ㅼ
        // ㅽ
        // ㅾ
        // ㅿ
        // ㆀ
        // ㆁ
        // ㆂ
        // ㆃ
        // ㆄ
        // ㆅ
        // ㆆ
        // ㆇ
        // ㆈ
        // ㆉ
        // ㆊ
        // ㆋ
        // ㆌ
        // ㆍ
        // ㆎ
    ]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29yZWFuLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbmF0dXJhbExhbmd1YWdlL2tvcmVhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyw4Q0FNQztJQWhCRCxpQ0FBaUM7SUFFakM7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLGlCQUFpQixDQUFDLElBQVk7UUFDN0MsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxPQUFPLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBRUQsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkMsU0FBUyxpQkFBaUIsQ0FBQyxJQUFZO1FBQ3RDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUVyQiwwQkFBMEI7UUFDMUIsaUJBQWlCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixtREFBd0MsQ0FBQztRQUNqRixJQUFJLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFCLE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsY0FBYztRQUNkLGlCQUFpQixDQUFDLElBQUksRUFBRSxZQUFZLHdDQUE2QixDQUFDO1FBQ2xFLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxn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STsrQkFDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTsrQkFDSixJQUFJOytCQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTs4QkFDSixJQUFJOytCQUNKLElBQUk7dUNBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOytCQUNKLElBQUk7K0JBQ0osSUFBSTtLQUN2QixDQUFDLENBQUM7SUFFSDs7Ozs7Ozs7Ozs7Ozs7OztPQWdCRztJQUNILE1BQU0saUJBQWlCLEdBQUcsSUFBSSxXQUFXLENBQUM7K0JBQ3JCLElBQUk7OEJBQ0osSUFBSTt1Q0FDSixJQUFJOytCQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJOytCQUNKLElBQUk7OEJBQ0osSUFBSTsrQkFDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJO3VDQUNKLElBQUk7OEJBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7dUNBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7OEJBQ0osSUFBSTsrQkFDSixJQUFJOytCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOytCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOzhCQUNKLElBQUk7K0JBQ0osSUFBSTsrQkFDSixJQUFJOytCQUNKLElBQUk7OEJBQ0osSUFBSTsrQkFDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTt1Q0FDSixJQUFJOytCQUNKLElBQUk7K0JBQ0osSUFBSTt1Q0FDSixJQUFJO3VDQUNKLElBQUk7dUNBQ0osSUFBSTs4QkFDSixJQUFJOytCQUNKLElBQUk7dUNBQ0osSUFBSTsrQkFDSixJQUFJO1FBQ3hCLHVEQUF1RDtRQUN2RCxJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtLQUNKLENBQUMsQ0FBQyJ9