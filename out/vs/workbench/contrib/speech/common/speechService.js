/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform"], function (require, exports, nls_1, contextkey_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SPEECH_LANGUAGES = exports.SPEECH_LANGUAGE_CONFIG = exports.KeywordRecognitionStatus = exports.SpeechToTextStatus = exports.SpeechToTextInProgress = exports.HasSpeechProvider = exports.ISpeechService = void 0;
    exports.speechLanguageConfigToLanguage = speechLanguageConfigToLanguage;
    exports.ISpeechService = (0, instantiation_1.createDecorator)('speechService');
    exports.HasSpeechProvider = new contextkey_1.RawContextKey('hasSpeechProvider', false, { type: 'string', description: (0, nls_1.localize)('hasSpeechProvider', "A speech provider is registered to the speech service.") });
    exports.SpeechToTextInProgress = new contextkey_1.RawContextKey('speechToTextInProgress', false, { type: 'string', description: (0, nls_1.localize)('speechToTextInProgress', "A speech-to-text session is in progress.") });
    var SpeechToTextStatus;
    (function (SpeechToTextStatus) {
        SpeechToTextStatus[SpeechToTextStatus["Started"] = 1] = "Started";
        SpeechToTextStatus[SpeechToTextStatus["Recognizing"] = 2] = "Recognizing";
        SpeechToTextStatus[SpeechToTextStatus["Recognized"] = 3] = "Recognized";
        SpeechToTextStatus[SpeechToTextStatus["Stopped"] = 4] = "Stopped";
        SpeechToTextStatus[SpeechToTextStatus["Error"] = 5] = "Error";
    })(SpeechToTextStatus || (exports.SpeechToTextStatus = SpeechToTextStatus = {}));
    var KeywordRecognitionStatus;
    (function (KeywordRecognitionStatus) {
        KeywordRecognitionStatus[KeywordRecognitionStatus["Recognized"] = 1] = "Recognized";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Stopped"] = 2] = "Stopped";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Canceled"] = 3] = "Canceled";
    })(KeywordRecognitionStatus || (exports.KeywordRecognitionStatus = KeywordRecognitionStatus = {}));
    exports.SPEECH_LANGUAGE_CONFIG = 'accessibility.voice.speechLanguage';
    exports.SPEECH_LANGUAGES = {
        ['da-DK']: {
            name: (0, nls_1.localize)('speechLanguage.da-DK', "Danish (Denmark)")
        },
        ['de-DE']: {
            name: (0, nls_1.localize)('speechLanguage.de-DE', "German (Germany)")
        },
        ['en-AU']: {
            name: (0, nls_1.localize)('speechLanguage.en-AU', "English (Australia)")
        },
        ['en-CA']: {
            name: (0, nls_1.localize)('speechLanguage.en-CA', "English (Canada)")
        },
        ['en-GB']: {
            name: (0, nls_1.localize)('speechLanguage.en-GB', "English (United Kingdom)")
        },
        ['en-IE']: {
            name: (0, nls_1.localize)('speechLanguage.en-IE', "English (Ireland)")
        },
        ['en-IN']: {
            name: (0, nls_1.localize)('speechLanguage.en-IN', "English (India)")
        },
        ['en-NZ']: {
            name: (0, nls_1.localize)('speechLanguage.en-NZ', "English (New Zealand)")
        },
        ['en-US']: {
            name: (0, nls_1.localize)('speechLanguage.en-US', "English (United States)")
        },
        ['es-ES']: {
            name: (0, nls_1.localize)('speechLanguage.es-ES', "Spanish (Spain)")
        },
        ['es-MX']: {
            name: (0, nls_1.localize)('speechLanguage.es-MX', "Spanish (Mexico)")
        },
        ['fr-CA']: {
            name: (0, nls_1.localize)('speechLanguage.fr-CA', "French (Canada)")
        },
        ['fr-FR']: {
            name: (0, nls_1.localize)('speechLanguage.fr-FR', "French (France)")
        },
        ['hi-IN']: {
            name: (0, nls_1.localize)('speechLanguage.hi-IN', "Hindi (India)")
        },
        ['it-IT']: {
            name: (0, nls_1.localize)('speechLanguage.it-IT', "Italian (Italy)")
        },
        ['ja-JP']: {
            name: (0, nls_1.localize)('speechLanguage.ja-JP', "Japanese (Japan)")
        },
        ['ko-KR']: {
            name: (0, nls_1.localize)('speechLanguage.ko-KR', "Korean (South Korea)")
        },
        ['nl-NL']: {
            name: (0, nls_1.localize)('speechLanguage.nl-NL', "Dutch (Netherlands)")
        },
        ['pt-PT']: {
            name: (0, nls_1.localize)('speechLanguage.pt-PT', "Portuguese (Portugal)")
        },
        ['pt-BR']: {
            name: (0, nls_1.localize)('speechLanguage.pt-BR', "Portuguese (Brazil)")
        },
        ['ru-RU']: {
            name: (0, nls_1.localize)('speechLanguage.ru-RU', "Russian (Russia)")
        },
        ['sv-SE']: {
            name: (0, nls_1.localize)('speechLanguage.sv-SE', "Swedish (Sweden)")
        },
        ['tr-TR']: {
            // allow-any-unicode-next-line
            name: (0, nls_1.localize)('speechLanguage.tr-TR', "Turkish (Türkiye)")
        },
        ['zh-CN']: {
            name: (0, nls_1.localize)('speechLanguage.zh-CN', "Chinese (Simplified, China)")
        },
        ['zh-HK']: {
            name: (0, nls_1.localize)('speechLanguage.zh-HK', "Chinese (Traditional, Hong Kong)")
        },
        ['zh-TW']: {
            name: (0, nls_1.localize)('speechLanguage.zh-TW', "Chinese (Traditional, Taiwan)")
        }
    };
    function speechLanguageConfigToLanguage(config, lang = platform_1.language) {
        if (typeof config === 'string') {
            if (config === 'auto') {
                if (lang !== 'en') {
                    const langParts = lang.split('-');
                    return speechLanguageConfigToLanguage(`${langParts[0]}-${(langParts[1] ?? langParts[0]).toUpperCase()}`);
                }
            }
            else {
                if (exports.SPEECH_LANGUAGES[config]) {
                    return config;
                }
            }
        }
        return 'en-US';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NwZWVjaC9jb21tb24vc3BlZWNoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzTGhHLHdFQWdCQztJQTNMWSxRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBRWxFLFFBQUEsaUJBQWlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1CQUFtQixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLHdEQUF3RCxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3JNLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBT25OLElBQVksa0JBTVg7SUFORCxXQUFZLGtCQUFrQjtRQUM3QixpRUFBVyxDQUFBO1FBQ1gseUVBQWUsQ0FBQTtRQUNmLHVFQUFjLENBQUE7UUFDZCxpRUFBVyxDQUFBO1FBQ1gsNkRBQVMsQ0FBQTtJQUNWLENBQUMsRUFOVyxrQkFBa0Isa0NBQWxCLGtCQUFrQixRQU03QjtJQVdELElBQVksd0JBSVg7SUFKRCxXQUFZLHdCQUF3QjtRQUNuQyxtRkFBYyxDQUFBO1FBQ2QsNkVBQVcsQ0FBQTtRQUNYLCtFQUFZLENBQUE7SUFDYixDQUFDLEVBSlcsd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFJbkM7SUF3RFksUUFBQSxzQkFBc0IsR0FBRyxvQ0FBb0Ms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