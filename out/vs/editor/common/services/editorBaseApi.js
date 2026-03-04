/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/standalone/standaloneEnums"], function (require, exports, cancellation_1, event_1, keyCodes_1, uri_1, position_1, range_1, selection_1, languages_1, standaloneEnums) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyMod = void 0;
    exports.createMonacoBaseAPI = createMonacoBaseAPI;
    class KeyMod {
        static { this.CtrlCmd = 2048 /* ConstKeyMod.CtrlCmd */; }
        static { this.Shift = 1024 /* ConstKeyMod.Shift */; }
        static { this.Alt = 512 /* ConstKeyMod.Alt */; }
        static { this.WinCtrl = 256 /* ConstKeyMod.WinCtrl */; }
        static chord(firstPart, secondPart) {
            return (0, keyCodes_1.KeyChord)(firstPart, secondPart);
        }
    }
    exports.KeyMod = KeyMod;
    function createMonacoBaseAPI() {
        return {
            editor: undefined, // undefined override expected here
            languages: undefined, // undefined override expected here
            CancellationTokenSource: cancellation_1.CancellationTokenSource,
            Emitter: event_1.Emitter,
            KeyCode: standaloneEnums.KeyCode,
            KeyMod: KeyMod,
            Position: position_1.Position,
            Range: range_1.Range,
            Selection: selection_1.Selection,
            SelectionDirection: standaloneEnums.SelectionDirection,
            MarkerSeverity: standaloneEnums.MarkerSeverity,
            MarkerTag: standaloneEnums.MarkerTag,
            Uri: uri_1.URI,
            Token: languages_1.Token
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQmFzZUFwaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvZWRpdG9yQmFzZUFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLGtEQWlCQztJQTVCRCxNQUFhLE1BQU07aUJBQ0ssWUFBTyxrQ0FBK0I7aUJBQ3RDLFVBQUssZ0NBQTZCO2lCQUNsQyxRQUFHLDZCQUEyQjtpQkFDOUIsWUFBTyxpQ0FBK0I7UUFFdEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFpQixFQUFFLFVBQWtCO1lBQ3hELE9BQU8sSUFBQSxtQkFBUSxFQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN4QyxDQUFDOztJQVJGLHdCQVNDO0lBRUQsU0FBZ0IsbUJBQW1CO1FBQ2xDLE9BQU87WUFDTixNQUFNLEVBQUUsU0FBVSxFQUFFLG1DQUFtQztZQUN2RCxTQUFTLEVBQUUsU0FBVSxFQUFFLG1DQUFtQztZQUMxRCx1QkFBdUIsRUFBRSxzQ0FBdUI7WUFDaEQsT0FBTyxFQUFFLGVBQU87WUFDaEIsT0FBTyxFQUFFLGVBQWUsQ0FBQyxPQUFPO1lBQ2hDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLG1CQUFRO1lBQ2xCLEtBQUssRUFBRSxhQUFLO1lBQ1osU0FBUyxFQUFPLHFCQUFTO1lBQ3pCLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxrQkFBa0I7WUFDdEQsY0FBYyxFQUFFLGVBQWUsQ0FBQyxjQUFjO1lBQzlDLFNBQVMsRUFBRSxlQUFlLENBQUMsU0FBUztZQUNwQyxHQUFHLEVBQU8sU0FBRztZQUNiLEtBQUssRUFBRSxpQkFBSztTQUNaLENBQUM7SUFDSCxDQUFDIn0=