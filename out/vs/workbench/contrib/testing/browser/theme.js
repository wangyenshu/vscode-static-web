/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, color_1, nls_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testStatesToRetiredIconColors = exports.testingRetiredColorIconSkipped = exports.testingRetiredColorIconUnset = exports.testingRetiredColorIconQueued = exports.testingRetiredColorIconPassed = exports.testingRetiredColorIconFailed = exports.testingRetiredColorIconErrored = exports.testStatesToIconColors = exports.testMessageSeverityColors = exports.testingCoverCountBadgeForeground = exports.testingCoverCountBadgeBackground = exports.testingUncoveredGutterBackground = exports.testingUncoveredBorder = exports.testingUncoveredBackground = exports.testingUncoveredBranchBackground = exports.testingCoveredGutterBackground = exports.testingCoveredBorder = exports.testingCoveredBackground = exports.testingPeekMessageHeaderBackground = exports.testingPeekHeaderBackground = exports.testingMessagePeekBorder = exports.testingPeekBorder = exports.testingColorIconSkipped = exports.testingColorIconUnset = exports.testingColorIconQueued = exports.testingColorRunAction = exports.testingColorIconPassed = exports.testingColorIconErrored = exports.testingColorIconFailed = void 0;
    exports.testingColorIconFailed = (0, colorRegistry_1.registerColor)('testing.iconFailed', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconFailed', "Color for the 'failed' icon in the test explorer."));
    exports.testingColorIconErrored = (0, colorRegistry_1.registerColor)('testing.iconErrored', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconErrored', "Color for the 'Errored' icon in the test explorer."));
    exports.testingColorIconPassed = (0, colorRegistry_1.registerColor)('testing.iconPassed', {
        dark: '#73c991',
        light: '#73c991',
        hcDark: '#73c991',
        hcLight: '#007100'
    }, (0, nls_1.localize)('testing.iconPassed', "Color for the 'passed' icon in the test explorer."));
    exports.testingColorRunAction = (0, colorRegistry_1.registerColor)('testing.runAction', {
        dark: exports.testingColorIconPassed,
        light: exports.testingColorIconPassed,
        hcDark: exports.testingColorIconPassed,
        hcLight: exports.testingColorIconPassed
    }, (0, nls_1.localize)('testing.runAction', "Color for 'run' icons in the editor."));
    exports.testingColorIconQueued = (0, colorRegistry_1.registerColor)('testing.iconQueued', {
        dark: '#cca700',
        light: '#cca700',
        hcDark: '#cca700',
        hcLight: '#cca700'
    }, (0, nls_1.localize)('testing.iconQueued', "Color for the 'Queued' icon in the test explorer."));
    exports.testingColorIconUnset = (0, colorRegistry_1.registerColor)('testing.iconUnset', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconUnset', "Color for the 'Unset' icon in the test explorer."));
    exports.testingColorIconSkipped = (0, colorRegistry_1.registerColor)('testing.iconSkipped', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconSkipped', "Color for the 'Skipped' icon in the test explorer."));
    exports.testingPeekBorder = (0, colorRegistry_1.registerColor)('testing.peekBorder', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testingMessagePeekBorder = (0, colorRegistry_1.registerColor)('testing.messagePeekBorder', {
        dark: colorRegistry_1.editorInfoForeground,
        light: colorRegistry_1.editorInfoForeground,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.messagePeekBorder', 'Color of the peek view borders and arrow when peeking a logged message.'));
    exports.testingPeekHeaderBackground = (0, colorRegistry_1.registerColor)('testing.peekHeaderBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testingPeekMessageHeaderBackground = (0, colorRegistry_1.registerColor)('testing.messagePeekHeaderBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, 0.1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, 0.1),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.messagePeekHeaderBackground', 'Color of the peek view borders and arrow when peeking a logged message.'));
    exports.testingCoveredBackground = (0, colorRegistry_1.registerColor)('testing.coveredBackground', {
        dark: colorRegistry_1.diffInserted,
        light: colorRegistry_1.diffInserted,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.coveredBackground', 'Background color of text that was covered.'));
    exports.testingCoveredBorder = (0, colorRegistry_1.registerColor)('testing.coveredBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.testingCoveredBackground, 0.75),
        light: (0, colorRegistry_1.transparent)(exports.testingCoveredBackground, 0.75),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.coveredBorder', 'Border color of text that was covered.'));
    exports.testingCoveredGutterBackground = (0, colorRegistry_1.registerColor)('testing.coveredGutterBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.diffInserted, 0.6),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.diffInserted, 0.6),
        hcDark: colorRegistry_1.chartsGreen,
        hcLight: colorRegistry_1.chartsGreen
    }, (0, nls_1.localize)('testing.coveredGutterBackground', 'Gutter color of regions where code was covered.'));
    exports.testingUncoveredBranchBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredBranchBackground', {
        dark: (0, colorRegistry_1.opaque)((0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 2), colorRegistry_1.editorBackground),
        light: (0, colorRegistry_1.opaque)((0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 2), colorRegistry_1.editorBackground),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.uncoveredBranchBackground', 'Background of the widget shown for an uncovered branch.'));
    exports.testingUncoveredBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredBackground', {
        dark: colorRegistry_1.diffRemoved,
        light: colorRegistry_1.diffRemoved,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.uncoveredBackground', 'Background color of text that was not covered.'));
    exports.testingUncoveredBorder = (0, colorRegistry_1.registerColor)('testing.uncoveredBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.testingUncoveredBackground, 0.75),
        light: (0, colorRegistry_1.transparent)(exports.testingUncoveredBackground, 0.75),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.uncoveredBorder', 'Border color of text that was not covered.'));
    exports.testingUncoveredGutterBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredGutterBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 1.5),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 1.5),
        hcDark: colorRegistry_1.chartsRed,
        hcLight: colorRegistry_1.chartsRed
    }, (0, nls_1.localize)('testing.uncoveredGutterBackground', 'Gutter color of regions where code not covered.'));
    exports.testingCoverCountBadgeBackground = (0, colorRegistry_1.registerColor)('testing.coverCountBadgeBackground', {
        dark: colorRegistry_1.badgeBackground,
        light: colorRegistry_1.badgeBackground,
        hcDark: colorRegistry_1.badgeBackground,
        hcLight: colorRegistry_1.badgeBackground
    }, (0, nls_1.localize)('testing.coverCountBadgeBackground', 'Background for the badge indicating execution count'));
    exports.testingCoverCountBadgeForeground = (0, colorRegistry_1.registerColor)('testing.coverCountBadgeForeground', {
        dark: colorRegistry_1.badgeForeground,
        light: colorRegistry_1.badgeForeground,
        hcDark: colorRegistry_1.badgeForeground,
        hcLight: colorRegistry_1.badgeForeground
    }, (0, nls_1.localize)('testing.coverCountBadgeForeground', 'Foreground for the badge indicating execution count'));
    exports.testMessageSeverityColors = {
        [0 /* TestMessageType.Error */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.error.decorationForeground', { dark: colorRegistry_1.editorErrorForeground, light: colorRegistry_1.editorErrorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, (0, nls_1.localize)('testing.message.error.decorationForeground', 'Text color of test error messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.error.lineBackground', { dark: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), light: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.error.marginBackground', 'Margin color beside error messages shown inline in the editor.')),
        },
        [1 /* TestMessageType.Output */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.info.decorationForeground', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5) }, (0, nls_1.localize)('testing.message.info.decorationForeground', 'Text color of test info messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.info.lineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.info.marginBackground', 'Margin color beside info messages shown inline in the editor.')),
        },
    };
    exports.testStatesToIconColors = {
        [6 /* TestResultState.Errored */]: exports.testingColorIconErrored,
        [4 /* TestResultState.Failed */]: exports.testingColorIconFailed,
        [3 /* TestResultState.Passed */]: exports.testingColorIconPassed,
        [1 /* TestResultState.Queued */]: exports.testingColorIconQueued,
        [0 /* TestResultState.Unset */]: exports.testingColorIconUnset,
        [5 /* TestResultState.Skipped */]: exports.testingColorIconSkipped,
    };
    exports.testingRetiredColorIconErrored = (0, colorRegistry_1.registerColor)('testing.iconErrored.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7)
    }, (0, nls_1.localize)('testing.iconErrored.retired', "Retired color for the 'Errored' icon in the test explorer."));
    exports.testingRetiredColorIconFailed = (0, colorRegistry_1.registerColor)('testing.iconFailed.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7)
    }, (0, nls_1.localize)('testing.iconFailed.retired', "Retired color for the 'failed' icon in the test explorer."));
    exports.testingRetiredColorIconPassed = (0, colorRegistry_1.registerColor)('testing.iconPassed.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7)
    }, (0, nls_1.localize)('testing.iconPassed.retired', "Retired color for the 'passed' icon in the test explorer."));
    exports.testingRetiredColorIconQueued = (0, colorRegistry_1.registerColor)('testing.iconQueued.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7)
    }, (0, nls_1.localize)('testing.iconQueued.retired', "Retired color for the 'Queued' icon in the test explorer."));
    exports.testingRetiredColorIconUnset = (0, colorRegistry_1.registerColor)('testing.iconUnset.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7)
    }, (0, nls_1.localize)('testing.iconUnset.retired', "Retired color for the 'Unset' icon in the test explorer."));
    exports.testingRetiredColorIconSkipped = (0, colorRegistry_1.registerColor)('testing.iconSkipped.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7)
    }, (0, nls_1.localize)('testing.iconSkipped.retired', "Retired color for the 'Skipped' icon in the test explorer."));
    exports.testStatesToRetiredIconColors = {
        [6 /* TestResultState.Errored */]: exports.testingRetiredColorIconErrored,
        [4 /* TestResultState.Failed */]: exports.testingRetiredColorIconFailed,
        [3 /* TestResultState.Passed */]: exports.testingRetiredColorIconPassed,
        [1 /* TestResultState.Queued */]: exports.testingRetiredColorIconQueued,
        [0 /* TestResultState.Unset */]: exports.testingRetiredColorIconUnset,
        [5 /* TestResultState.Skipped */]: exports.testingRetiredColorIconSkipped,
    };
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorBg = theme.getColor(colorRegistry_1.editorBackground);
        const missBadgeBackground = editorBg && theme.getColor(exports.testingUncoveredBackground)?.transparent(2).makeOpaque(editorBg);
        collector.addRule(`
	.coverage-deco-inline.coverage-deco-hit.coverage-deco-hovered {
		background: ${theme.getColor(exports.testingCoveredBackground)?.transparent(1.3)};
		outline-color: ${theme.getColor(exports.testingCoveredBorder)?.transparent(2)};
	}
	.coverage-deco-inline.coverage-deco-miss.coverage-deco-hovered {
		background: ${theme.getColor(exports.testingUncoveredBackground)?.transparent(1.3)};
		outline-color: ${theme.getColor(exports.testingUncoveredBorder)?.transparent(2)};
	}
	.coverage-deco-branch-miss-indicator::before {
		border-color: ${missBadgeBackground?.transparent(1.3)};
		background-color: ${missBadgeBackground};
	}
	`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGhlbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUW5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLG9CQUFvQixFQUFFO1FBQ3pFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxtREFBbUQsQ0FBQyxDQUFDLENBQUM7SUFFM0UsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMscUJBQXFCLEVBQUU7UUFDM0UsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsU0FBUztRQUNoQixNQUFNLEVBQUUsU0FBUztRQUNqQixPQUFPLEVBQUUsU0FBUztLQUNsQixFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLG9EQUFvRCxDQUFDLENBQUMsQ0FBQztJQUU3RSxRQUFBLHNCQUFzQixHQUFHLElBQUEsNkJBQWEsRUFBQyxvQkFBb0IsRUFBRTtRQUN6RSxJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxTQUFTO0tBQ2xCLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsbURBQW1ELENBQUMsQ0FBQyxDQUFDO0lBRTNFLFFBQUEscUJBQXFCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLG1CQUFtQixFQUFFO1FBQ3ZFLElBQUksRUFBRSw4QkFBc0I7UUFDNUIsS0FBSyxFQUFFLDhCQUFzQjtRQUM3QixNQUFNLEVB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