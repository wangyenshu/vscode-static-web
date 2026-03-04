/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Severity;
    (function (Severity) {
        Severity[Severity["Ignore"] = 0] = "Ignore";
        Severity[Severity["Info"] = 1] = "Info";
        Severity[Severity["Warning"] = 2] = "Warning";
        Severity[Severity["Error"] = 3] = "Error";
    })(Severity || (Severity = {}));
    (function (Severity) {
        const _error = 'error';
        const _warning = 'warning';
        const _warn = 'warn';
        const _info = 'info';
        const _ignore = 'ignore';
        /**
         * Parses 'error', 'warning', 'warn', 'info' in call casings
         * and falls back to ignore.
         */
        function fromValue(value) {
            if (!value) {
                return Severity.Ignore;
            }
            if (strings.equalsIgnoreCase(_error, value)) {
                return Severity.Error;
            }
            if (strings.equalsIgnoreCase(_warning, value) || strings.equalsIgnoreCase(_warn, value)) {
                return Severity.Warning;
            }
            if (strings.equalsIgnoreCase(_info, value)) {
                return Severity.Info;
            }
            return Severity.Ignore;
        }
        Severity.fromValue = fromValue;
        function toString(severity) {
            switch (severity) {
                case Severity.Error: return _error;
                case Severity.Warning: return _warning;
                case Severity.Info: return _info;
                default: return _ignore;
            }
        }
        Severity.toString = toString;
    })(Severity || (Severity = {}));
    exports.default = Severity;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V2ZXJpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9zZXZlcml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUloRyxJQUFLLFFBS0o7SUFMRCxXQUFLLFFBQVE7UUFDWiwyQ0FBVSxDQUFBO1FBQ1YsdUNBQVEsQ0FBQTtRQUNSLDZDQUFXLENBQUE7UUFDWCx5Q0FBUyxDQUFBO0lBQ1YsQ0FBQyxFQUxJLFFBQVEsS0FBUixRQUFRLFFBS1o7SUFFRCxXQUFVLFFBQVE7UUFFakIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDckIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQztRQUV6Qjs7O1dBR0c7UUFDSCxTQUFnQixTQUFTLENBQUMsS0FBYTtZQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3hCLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6RixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDekIsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDdEIsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUN4QixDQUFDO1FBakJlLGtCQUFTLFlBaUJ4QixDQUFBO1FBRUQsU0FBZ0IsUUFBUSxDQUFDLFFBQWtCO1lBQzFDLFFBQVEsUUFBUSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sTUFBTSxDQUFDO2dCQUNuQyxLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQztnQkFDdkMsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUM7Z0JBQ2pDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBUGUsaUJBQVEsV0FPdkIsQ0FBQTtJQUNGLENBQUMsRUF2Q1MsUUFBUSxLQUFSLFFBQVEsUUF1Q2pCO0lBRUQsa0JBQWUsUUFBUSxDQUFDIn0=