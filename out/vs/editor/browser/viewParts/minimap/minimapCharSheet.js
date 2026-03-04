/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCharIndex = exports.allCharCodes = exports.Constants = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["START_CH_CODE"] = 32] = "START_CH_CODE";
        Constants[Constants["END_CH_CODE"] = 126] = "END_CH_CODE";
        Constants[Constants["UNKNOWN_CODE"] = 65533] = "UNKNOWN_CODE";
        Constants[Constants["CHAR_COUNT"] = 96] = "CHAR_COUNT";
        Constants[Constants["SAMPLED_CHAR_HEIGHT"] = 16] = "SAMPLED_CHAR_HEIGHT";
        Constants[Constants["SAMPLED_CHAR_WIDTH"] = 10] = "SAMPLED_CHAR_WIDTH";
        Constants[Constants["BASE_CHAR_HEIGHT"] = 2] = "BASE_CHAR_HEIGHT";
        Constants[Constants["BASE_CHAR_WIDTH"] = 1] = "BASE_CHAR_WIDTH";
        Constants[Constants["RGBA_CHANNELS_CNT"] = 4] = "RGBA_CHANNELS_CNT";
        Constants[Constants["RGBA_SAMPLED_ROW_WIDTH"] = 3840] = "RGBA_SAMPLED_ROW_WIDTH";
    })(Constants || (exports.Constants = Constants = {}));
    exports.allCharCodes = (() => {
        const v = [];
        for (let i = 32 /* Constants.START_CH_CODE */; i <= 126 /* Constants.END_CH_CODE */; i++) {
            v.push(i);
        }
        v.push(65533 /* Constants.UNKNOWN_CODE */);
        return v;
    })();
    const getCharIndex = (chCode, fontScale) => {
        chCode -= 32 /* Constants.START_CH_CODE */;
        if (chCode < 0 || chCode > 96 /* Constants.CHAR_COUNT */) {
            if (fontScale <= 2) {
                // for smaller scales, we can get away with using any ASCII character...
                return (chCode + 96 /* Constants.CHAR_COUNT */) % 96 /* Constants.CHAR_COUNT */;
            }
            return 96 /* Constants.CHAR_COUNT */ - 1; // unknown symbol
        }
        return chCode;
    };
    exports.getCharIndex = getCharIndex;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJTaGVldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9taW5pbWFwL21pbmltYXBDaGFyU2hlZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLElBQWtCLFNBY2pCO0lBZEQsV0FBa0IsU0FBUztRQUMxQiw0REFBa0IsQ0FBQTtRQUNsQix5REFBaUIsQ0FBQTtRQUNqQiw2REFBb0IsQ0FBQTtRQUNwQixzREFBNEMsQ0FBQTtRQUU1Qyx3RUFBd0IsQ0FBQTtRQUN4QixzRUFBdUIsQ0FBQTtRQUV2QixpRUFBb0IsQ0FBQTtRQUNwQiwrREFBbUIsQ0FBQTtRQUVuQixtRUFBcUIsQ0FBQTtRQUNyQixnRkFBNEUsQ0FBQTtJQUM3RSxDQUFDLEVBZGlCLFNBQVMseUJBQVQsU0FBUyxRQWMxQjtJQUVZLFFBQUEsWUFBWSxHQUEwQixDQUFDLEdBQUcsRUFBRTtRQUN4RCxNQUFNLENBQUMsR0FBYSxFQUFFLENBQUM7UUFDdkIsS0FBSyxJQUFJLENBQUMsbUNBQTBCLEVBQUUsQ0FBQyxtQ0FBeUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO1FBRUQsQ0FBQyxDQUFDLElBQUksb0NBQXdCLENBQUM7UUFDL0IsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDLENBQUMsRUFBRSxDQUFDO0lBRUUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxNQUFjLEVBQUUsU0FBaUIsRUFBRSxFQUFFO1FBQ2pFLE1BQU0sb0NBQTJCLENBQUM7UUFDbEMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sZ0NBQXVCLEVBQUUsQ0FBQztZQUNqRCxJQUFJLFNBQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsd0VBQXdFO2dCQUN4RSxPQUFPLENBQUMsTUFBTSxnQ0FBdUIsQ0FBQyxnQ0FBdUIsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsT0FBTyxnQ0FBdUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCO1FBQ25ELENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMsQ0FBQztJQVhXLFFBQUEsWUFBWSxnQkFXdkIifQ==