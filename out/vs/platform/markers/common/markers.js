/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, severity_1, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMarkerService = exports.IMarkerData = exports.MarkerSeverity = exports.MarkerTag = void 0;
    var MarkerTag;
    (function (MarkerTag) {
        MarkerTag[MarkerTag["Unnecessary"] = 1] = "Unnecessary";
        MarkerTag[MarkerTag["Deprecated"] = 2] = "Deprecated";
    })(MarkerTag || (exports.MarkerTag = MarkerTag = {}));
    var MarkerSeverity;
    (function (MarkerSeverity) {
        MarkerSeverity[MarkerSeverity["Hint"] = 1] = "Hint";
        MarkerSeverity[MarkerSeverity["Info"] = 2] = "Info";
        MarkerSeverity[MarkerSeverity["Warning"] = 4] = "Warning";
        MarkerSeverity[MarkerSeverity["Error"] = 8] = "Error";
    })(MarkerSeverity || (exports.MarkerSeverity = MarkerSeverity = {}));
    (function (MarkerSeverity) {
        function compare(a, b) {
            return b - a;
        }
        MarkerSeverity.compare = compare;
        const _displayStrings = Object.create(null);
        _displayStrings[MarkerSeverity.Error] = (0, nls_1.localize)('sev.error', "Error");
        _displayStrings[MarkerSeverity.Warning] = (0, nls_1.localize)('sev.warning', "Warning");
        _displayStrings[MarkerSeverity.Info] = (0, nls_1.localize)('sev.info', "Info");
        function toString(a) {
            return _displayStrings[a] || '';
        }
        MarkerSeverity.toString = toString;
        function fromSeverity(severity) {
            switch (severity) {
                case severity_1.default.Error: return MarkerSeverity.Error;
                case severity_1.default.Warning: return MarkerSeverity.Warning;
                case severity_1.default.Info: return MarkerSeverity.Info;
                case severity_1.default.Ignore: return MarkerSeverity.Hint;
            }
        }
        MarkerSeverity.fromSeverity = fromSeverity;
        function toSeverity(severity) {
            switch (severity) {
                case MarkerSeverity.Error: return severity_1.default.Error;
                case MarkerSeverity.Warning: return severity_1.default.Warning;
                case MarkerSeverity.Info: return severity_1.default.Info;
                case MarkerSeverity.Hint: return severity_1.default.Ignore;
            }
        }
        MarkerSeverity.toSeverity = toSeverity;
    })(MarkerSeverity || (exports.MarkerSeverity = MarkerSeverity = {}));
    var IMarkerData;
    (function (IMarkerData) {
        const emptyString = '';
        function makeKey(markerData) {
            return makeKeyOptionalMessage(markerData, true);
        }
        IMarkerData.makeKey = makeKey;
        function makeKeyOptionalMessage(markerData, useMessage) {
            const result = [emptyString];
            if (markerData.source) {
                result.push(markerData.source.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.code) {
                if (typeof markerData.code === 'string') {
                    result.push(markerData.code.replace('¦', '\\¦'));
                }
                else {
                    result.push(markerData.code.value.replace('¦', '\\¦'));
                }
            }
            else {
                result.push(emptyString);
            }
            if (markerData.severity !== undefined && markerData.severity !== null) {
                result.push(MarkerSeverity.toString(markerData.severity));
            }
            else {
                result.push(emptyString);
            }
            // Modifed to not include the message as part of the marker key to work around
            // https://github.com/microsoft/vscode/issues/77475
            if (markerData.message && useMessage) {
                result.push(markerData.message.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startLineNumber !== undefined && markerData.startLineNumber !== null) {
                result.push(markerData.startLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startColumn !== undefined && markerData.startColumn !== null) {
                result.push(markerData.startColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endLineNumber !== undefined && markerData.endLineNumber !== null) {
                result.push(markerData.endLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endColumn !== undefined && markerData.endColumn !== null) {
                result.push(markerData.endColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            result.push(emptyString);
            return result.join('¦');
        }
        IMarkerData.makeKeyOptionalMessage = makeKeyOptionalMessage;
    })(IMarkerData || (exports.IMarkerData = IMarkerData = {}));
    exports.IMarkerService = (0, instantiation_1.createDecorator)('markerService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL21hcmtlcnMvY29tbW9uL21hcmtlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0NoRyxJQUFrQixTQUdqQjtJQUhELFdBQWtCLFNBQVM7UUFDMUIsdURBQWUsQ0FBQTtRQUNmLHFEQUFjLENBQUE7SUFDZixDQUFDLEVBSGlCLFNBQVMseUJBQVQsU0FBUyxRQUcxQjtJQUVELElBQVksY0FLWDtJQUxELFdBQVksY0FBYztRQUN6QixtREFBUSxDQUFBO1FBQ1IsbURBQVEsQ0FBQTtRQUNSLHlEQUFXLENBQUE7UUFDWCxxREFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUxXLGNBQWMsOEJBQWQsY0FBYyxRQUt6QjtJQUVELFdBQWlCLGNBQWM7UUFFOUIsU0FBZ0IsT0FBTyxDQUFDLENBQWlCLEVBQUUsQ0FBaUI7WUFDM0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsQ0FBQztRQUZlLHNCQUFPLFVBRXRCLENBQUE7UUFFRCxNQUFNLGVBQWUsR0FBZ0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RSxlQUFlLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN2RSxlQUFlLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM3RSxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVwRSxTQUFnQixRQUFRLENBQUMsQ0FBaUI7WUFDekMsT0FBTyxlQUFl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