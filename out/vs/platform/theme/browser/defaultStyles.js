define(["require", "exports", "vs/platform/theme/common/colorRegistry", "vs/base/common/color"], function (require, exports, colorRegistry_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultMenuStyles = exports.defaultSelectBoxStyles = exports.defaultListStyles = exports.defaultBreadcrumbsWidgetStyles = exports.defaultCountBadgeStyles = exports.defaultFindWidgetStyles = exports.defaultInputBoxStyles = exports.defaultDialogStyles = exports.defaultCheckboxStyles = exports.defaultToggleStyles = exports.defaultProgressBarStyles = exports.defaultButtonStyles = exports.defaultKeybindingLabelStyles = void 0;
    exports.getKeybindingLabelStyles = getKeybindingLabelStyles;
    exports.getButtonStyles = getButtonStyles;
    exports.getProgressBarStyles = getProgressBarStyles;
    exports.getToggleStyles = getToggleStyles;
    exports.getCheckboxStyles = getCheckboxStyles;
    exports.getDialogStyle = getDialogStyle;
    exports.getInputBoxStyle = getInputBoxStyle;
    exports.getCountBadgeStyle = getCountBadgeStyle;
    exports.getBreadcrumbsWidgetStyles = getBreadcrumbsWidgetStyles;
    exports.getListStyles = getListStyles;
    exports.getSelectBoxStyles = getSelectBoxStyles;
    exports.getMenuStyles = getMenuStyles;
    function overrideStyles(override, styles) {
        const result = { ...styles };
        for (const key in override) {
            const val = override[key];
            result[key] = val !== undefined ? (0, colorRegistry_1.asCssVariable)(val) : undefined;
        }
        return result;
    }
    exports.defaultKeybindingLabelStyles = {
        keybindingLabelBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBackground),
        keybindingLabelForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelForeground),
        keybindingLabelBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBorder),
        keybindingLabelBottomBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBottomBorder),
        keybindingLabelShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow)
    };
    function getKeybindingLabelStyles(override) {
        return overrideStyles(override, exports.defaultKeybindingLabelStyles);
    }
    exports.defaultButtonStyles = {
        buttonForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonForeground),
        buttonSeparator: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSeparator),
        buttonBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBackground),
        buttonHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonHoverBackground),
        buttonSecondaryForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryForeground),
        buttonSecondaryBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryBackground),
        buttonSecondaryHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryHoverBackground),
        buttonBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBorder),
    };
    function getButtonStyles(override) {
        return overrideStyles(override, exports.defaultButtonStyles);
    }
    exports.defaultProgressBarStyles = {
        progressBarBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.progressBarBackground)
    };
    function getProgressBarStyles(override) {
        return overrideStyles(override, exports.defaultProgressBarStyles);
    }
    exports.defaultToggleStyles = {
        inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
        inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
        inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground)
    };
    function getToggleStyles(override) {
        return overrideStyles(override, exports.defaultToggleStyles);
    }
    exports.defaultCheckboxStyles = {
        checkboxBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxBackground),
        checkboxBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxBorder),
        checkboxForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxForeground)
    };
    function getCheckboxStyles(override) {
        return overrideStyles(override, exports.defaultCheckboxStyles);
    }
    exports.defaultDialogStyles = {
        dialogBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetBackground),
        dialogForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetForeground),
        dialogShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
        dialogBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder),
        errorIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsErrorIconForeground),
        warningIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsWarningIconForeground),
        infoIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsInfoIconForeground),
        textLinkForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.textLinkForeground)
    };
    function getDialogStyle(override) {
        return overrideStyles(override, exports.defaultDialogStyles);
    }
    exports.defaultInputBoxStyles = {
        inputBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputBackground),
        inputForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputForeground),
        inputBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputBorder),
        inputValidationInfoBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoBorder),
        inputValidationInfoBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoBackground),
        inputValidationInfoForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoForeground),
        inputValidationWarningBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningBorder),
        inputValidationWarningBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningBackground),
        inputValidationWarningForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningForeground),
        inputValidationErrorBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorBorder),
        inputValidationErrorBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorBackground),
        inputValidationErrorForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorForeground)
    };
    function getInputBoxStyle(override) {
        return overrideStyles(override, exports.defaultInputBoxStyles);
    }
    exports.defaultFindWidgetStyles = {
        listFilterWidgetBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetBackground),
        listFilterWidgetOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetOutline),
        listFilterWidgetNoMatchesOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetNoMatchesOutline),
        listFilterWidgetShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetShadow),
        inputBoxStyles: exports.defaultInputBoxStyles,
        toggleStyles: exports.defaultToggleStyles
    };
    exports.defaultCountBadgeStyles = {
        badgeBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeBackground),
        badgeForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeForeground),
        badgeBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)
    };
    function getCountBadgeStyle(override) {
        return overrideStyles(override, exports.defaultCountBadgeStyles);
    }
    exports.defaultBreadcrumbsWidgetStyles = {
        breadcrumbsBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsBackground),
        breadcrumbsForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsForeground),
        breadcrumbsHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsFocusForeground),
        breadcrumbsFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsFocusForeground),
        breadcrumbsFocusAndSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsActiveSelectionForeground)
    };
    function getBreadcrumbsWidgetStyles(override) {
        return overrideStyles(override, exports.defaultBreadcrumbsWidgetStyles);
    }
    exports.defaultListStyles = {
        listBackground: undefined,
        listInactiveFocusForeground: undefined,
        listFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusBackground),
        listFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusForeground),
        listFocusOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusOutline),
        listActiveSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionBackground),
        listActiveSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionForeground),
        listActiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionIconForeground),
        listFocusAndSelectionOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusAndSelectionOutline),
        listFocusAndSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionBackground),
        listFocusAndSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionForeground),
        listInactiveSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionBackground),
        listInactiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionIconForeground),
        listInactiveSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionForeground),
        listInactiveFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveFocusBackground),
        listInactiveFocusOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveFocusOutline),
        listHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverBackground),
        listHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverForeground),
        listDropOverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listDropOverBackground),
        listDropBetweenBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listDropBetweenBackground),
        listSelectionOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        listHoverOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        treeIndentGuidesStroke: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.treeIndentGuidesStroke),
        treeInactiveIndentGuidesStroke: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.treeInactiveIndentGuidesStroke),
        treeStickyScrollBackground: undefined,
        treeStickyScrollBorder: undefined,
        treeStickyScrollShadow: undefined,
        tableColumnsBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.tableColumnsBorder),
        tableOddRowsBackgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.tableOddRowsBackgroundColor),
    };
    function getListStyles(override) {
        return overrideStyles(override, exports.defaultListStyles);
    }
    exports.defaultSelectBoxStyles = {
        selectBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBackground),
        selectListBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectListBackground),
        selectForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectForeground),
        decoratorRightForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupForeground),
        selectBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder),
        focusBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.focusBorder),
        listFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusBackground),
        listInactiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusIconForeground),
        listFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusForeground),
        listFocusOutline: (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.activeContrastBorder, color_1.Color.transparent.toString()),
        listHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverBackground),
        listHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverForeground),
        listHoverOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        selectListBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetBorder),
        listBackground: undefined,
        listActiveSelectionBackground: undefined,
        listActiveSelectionForeground: undefined,
        listActiveSelectionIconForeground: undefined,
        listFocusAndSelectionBackground: undefined,
        listDropOverBackground: undefined,
        listDropBetweenBackground: undefined,
        listInactiveSelectionBackground: undefined,
        listInactiveSelectionForeground: undefined,
        listInactiveFocusBackground: undefined,
        listInactiveFocusOutline: undefined,
        listSelectionOutline: undefined,
        listFocusAndSelectionForeground: undefined,
        listFocusAndSelectionOutline: undefined,
        listInactiveFocusForeground: undefined,
        tableColumnsBorder: undefined,
        tableOddRowsBackgroundColor: undefined,
        treeIndentGuidesStroke: undefined,
        treeInactiveIndentGuidesStroke: undefined,
        treeStickyScrollBackground: undefined,
        treeStickyScrollBorder: undefined,
        treeStickyScrollShadow: undefined
    };
    function getSelectBoxStyles(override) {
        return overrideStyles(override, exports.defaultSelectBoxStyles);
    }
    exports.defaultMenuStyles = {
        shadowColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
        borderColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuBorder),
        foregroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuForeground),
        backgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuBackground),
        selectionForegroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionForeground),
        selectionBackgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionBackground),
        selectionBorderColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionBorder),
        separatorColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSeparatorBackground),
        scrollbarShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarShadow),
        scrollbarSliderBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderBackground),
        scrollbarSliderHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderHoverBackground),
        scrollbarSliderActiveBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderActiveBackground)
    };
    function getMenuStyles(override) {
        return overrideStyles(override, exports.defaultMenuStyles);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdFN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RoZW1lL2Jyb3dzZXIvZGVmYXVsdFN0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBd0NBLDREQUVDO0lBWUQsMENBRUM7SUFNRCxvREFFQztJQVFELDBDQUVDO0lBUUQsOENBRUM7SUFhRCx3Q0FFQztJQWlCRCw0Q0FFQztJQWlCRCxnREFFQztJQVVELGdFQUVDO0lBa0NELHNDQUVDO0lBeUNELGdEQUVDO0lBaUJELHNDQUVDO0lBaE9ELFNBQVMsY0FBYyxDQUFJLFFBQTJCLEVBQUUsTUFBUztRQUNoRSxNQUFNLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxFQUE0QyxDQUFDO1FBQ3ZFLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7WUFDNUIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLDZCQUFhLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNsRSxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRVksUUFBQSw0QkFBNEIsR0FBMkI7UUFDbkUseUJBQXlCLEVBQUUsSUFBQSw2QkFBYSxFQUFDLHlDQUF5QixDQUFDO1FBQ25FLHlCQUF5QixFQUFFLElBQUEsNkJBQWEsRUFBQyx5Q0FBeUIsQ0FBQztRQUNuRSxxQkFBcUIsRUFBRSxJQUFBLDZCQUFhLEVBQUMscUNBQXFCLENBQUM7UUFDM0QsMkJBQTJCLEVBQUUsSUFBQSw2QkFBYSxFQUFDLDJDQUEyQixDQUFDO1FBQ3ZFLHFCQUFxQixFQUFFLElBQUEsNkJBQWEsRUFB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