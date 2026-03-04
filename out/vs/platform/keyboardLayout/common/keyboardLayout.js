/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/platform/instantiation/common/instantiation"], function (require, exports, keyCodes_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IKeyboardLayoutService = void 0;
    exports.areKeyboardLayoutsEqual = areKeyboardLayoutsEqual;
    exports.parseKeyboardLayoutDescription = parseKeyboardLayoutDescription;
    exports.getKeyboardLayoutId = getKeyboardLayoutId;
    exports.windowsKeyboardMappingEquals = windowsKeyboardMappingEquals;
    exports.macLinuxKeyboardMappingEquals = macLinuxKeyboardMappingEquals;
    exports.IKeyboardLayoutService = (0, instantiation_1.createDecorator)('keyboardLayoutService');
    function areKeyboardLayoutsEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        if (a.name && b.name && a.name === b.name) {
            return true;
        }
        if (a.id && b.id && a.id === b.id) {
            return true;
        }
        if (a.model &&
            b.model &&
            a.model === b.model &&
            a.layout === b.layout) {
            return true;
        }
        return false;
    }
    function parseKeyboardLayoutDescription(layout) {
        if (!layout) {
            return { label: '', description: '' };
        }
        if (layout.name) {
            // windows
            const windowsLayout = layout;
            return {
                label: windowsLayout.text,
                description: ''
            };
        }
        if (layout.id) {
            const macLayout = layout;
            if (macLayout.localizedName) {
                return {
                    label: macLayout.localizedName,
                    description: ''
                };
            }
            if (/^com\.apple\.keylayout\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^com\.apple\.keylayout\./, '').replace(/-/, ' '),
                    description: ''
                };
            }
            if (/^.*inputmethod\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^.*inputmethod\./, '').replace(/[-\.]/, ' '),
                    description: `Input Method (${macLayout.lang})`
                };
            }
            return {
                label: macLayout.lang,
                description: ''
            };
        }
        const linuxLayout = layout;
        return {
            label: linuxLayout.layout,
            description: ''
        };
    }
    function getKeyboardLayoutId(layout) {
        if (layout.name) {
            return layout.name;
        }
        if (layout.id) {
            return layout.id;
        }
        return layout.layout;
    }
    function windowsKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.vkey === b.vkey
            && a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function windowsKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!windowsKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
    function macLinuxKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function macLinuxKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!macLinuxKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXlib2FyZExheW91dC9jb21tb24va2V5Ym9hcmRMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0ZoRywwREFzQkM7SUFFRCx3RUFnREM7SUFFRCxrREFVQztJQWtCRCxvRUFnQkM7SUFpQkQsc0VBZ0JDO0lBak9ZLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix1QkFBdUIsQ0FBQyxDQUFDO0lBMEV2RyxTQUFnQix1QkFBdUIsQ0FBQyxDQUE2QixFQUFFLENBQTZCO1FBQ25HLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNkLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQWlDLENBQUUsQ0FBQyxJQUFJLElBQWlDLENBQUUsQ0FBQyxJQUFJLElBQWlDLENBQUUsQ0FBQyxJQUFJLEtBQWtDLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuSyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUE2QixDQUFFLENBQUMsRUFBRSxJQUE2QixDQUFFLENBQUMsRUFBRSxJQUE2QixDQUFFLENBQUMsRUFBRSxLQUE4QixDQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0ksT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBK0IsQ0FBRSxDQUFDLEtBQUs7WUFDWCxDQUFFLENBQUMsS0FBSztZQUNSLENBQUUsQ0FBQyxLQUFLLEtBQWdDLENBQUUsQ0FBQyxLQUFLO1lBQ2hELENBQUUsQ0FBQyxNQUFNLEtBQWdDLENBQUUsQ0FBQyxNQUFNLEVBQzVFLENBQUM7WUFDRixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFP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