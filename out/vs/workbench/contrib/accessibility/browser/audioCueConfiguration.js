/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.audioCueFeatureBase = void 0;
    exports.registerAudioCueConfiguration = registerAudioCueConfiguration;
    exports.audioCueFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'on', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('audioCues.enabled.auto', "Enable audio cue when a screen reader is attached."),
            (0, nls_1.localize)('audioCues.enabled.on', "Enable audio cue."),
            (0, nls_1.localize)('audioCues.enabled.off', "Disable audio cue.")
        ],
        tags: ['accessibility'],
    };
    const markdownDeprecationMessage = (0, nls_1.localize)('audioCues.enabled.deprecated', "This setting is deprecated. Use `signals` settings instead.");
    const soundDeprecatedFeatureBase = {
        ...exports.audioCueFeatureBase,
        markdownDeprecationMessage
    };
    function registerAudioCueConfiguration() {
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
            scope: 4 /* ConfigurationScope.RESOURCE */,
            'properties': {
                'audioCues.enabled': {
                    markdownDeprecationMessage: 'Deprecated. Use the specific setting for each audio cue instead (`audioCues.*`).',
                    tags: ['accessibility']
                },
                'audioCues.volume': {
                    markdownDeprecationMessage: 'Deprecated. Use `accessibility.signals.sounds.volume` instead.',
                    tags: ['accessibility']
                },
                'audioCues.debouncePositionChanges': {
                    'description': (0, nls_1.localize)('audioCues.debouncePositionChanges', "Whether or not position changes should be debounced"),
                    'type': 'boolean',
                    'default': false,
                    tags: ['accessibility'],
                    'markdownDeprecationMessage': (0, nls_1.localize)('audioCues.debouncePositionChangesDeprecated', 'This setting is deprecated, instead use the `signals.debouncePositionChanges` setting.')
                },
                'audioCues.lineHasBreakpoint': {
                    'description': (0, nls_1.localize)('audioCues.lineHasBreakpoint', "Plays a sound when the active line has a breakpoint."),
                    ...soundDeprecatedFeatureBase
                },
                'audioCues.lineHasInlineSuggestion': {
                    'description': (0, nls_1.localize)('audioCues.lineHasInlineSuggestion', "Plays a sound when the active line has an inline suggestion."),
                    ...soundDeprecatedFeatureBase
                },
                'audioCues.lineHasError': {
                    'description': (0, nls_1.localize)('audioCues.lineHasError', "Plays a sound when the active line has an error."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.lineHasFoldedArea': {
                    'description': (0, nls_1.localize)('audioCues.lineHasFoldedArea', "Plays a sound when the active line has a folded area that can be unfolded."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.lineHasWarning': {
                    'description': (0, nls_1.localize)('audioCues.lineHasWarning', "Plays a sound when the active line has a warning."),
                    ...soundDeprecatedFeatureBase,
                    default: 'off',
                },
                'audioCues.onDebugBreak': {
                    'description': (0, nls_1.localize)('audioCues.onDebugBreak', "Plays a sound when the debugger stopped on a breakpoint."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.noInlayHints': {
                    'description': (0, nls_1.localize)('audioCues.noInlayHints', "Plays a sound when trying to read a line with inlay hints that has no inlay hints."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.taskCompleted': {
                    'description': (0, nls_1.localize)('audioCues.taskCompleted', "Plays a sound when a task is completed."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.taskFailed': {
                    'description': (0, nls_1.localize)('audioCues.taskFailed', "Plays a sound when a task fails (non-zero exit code)."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.terminalCommandFailed': {
                    'description': (0, nls_1.localize)('audioCues.terminalCommandFailed', "Plays a sound when a terminal command fails (non-zero exit code)."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.terminalQuickFix': {
                    'description': (0, nls_1.localize)('audioCues.terminalQuickFix', "Plays a sound when terminal Quick Fixes are available."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.terminalBell': {
                    'description': (0, nls_1.localize)('audioCues.terminalBell', "Plays a sound when the terminal bell is ringing."),
                    ...soundDeprecatedFeatureBase,
                    default: 'on'
                },
                'audioCues.diffLineInserted': {
                    'description': (0, nls_1.localize)('audioCues.diffLineInserted', "Plays a sound when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.diffLineDeleted': {
                    'description': (0, nls_1.localize)('audioCues.diffLineDeleted', "Plays a sound when the focus moves to a deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.diffLineModified': {
                    'description': (0, nls_1.localize)('audioCues.diffLineModified', "Plays a sound when the focus moves to a modified line in Accessible Diff Viewer mode or to the next/previous change."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.notebookCellCompleted': {
                    'description': (0, nls_1.localize)('audioCues.notebookCellCompleted', "Plays a sound when a notebook cell execution is successfully completed."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.notebookCellFailed': {
                    'description': (0, nls_1.localize)('audioCues.notebookCellFailed', "Plays a sound when a notebook cell execution fails."),
                    ...soundDeprecatedFeatureBase,
                },
                'audioCues.chatRequestSent': {
                    'description': (0, nls_1.localize)('audioCues.chatRequestSent', "Plays a sound when a chat request is made."),
                    ...soundDeprecatedFeatureBase,
                    default: 'off'
                },
                'audioCues.chatResponsePending': {
                    'description': (0, nls_1.localize)('audioCues.chatResponsePending', "Plays a sound on loop while the response is pending."),
                    ...soundDeprecatedFeatureBase,
                    default: 'auto'
                },
                'audioCues.chatResponseReceived': {
                    'description': (0, nls_1.localize)('audioCues.chatResponseReceived', "Plays a sound on loop while the response has been received."),
                    ...soundDeprecatedFeatureBase,
                    default: 'off'
                },
                'audioCues.clear': {
                    'description': (0, nls_1.localize)('audioCues.clear', "Plays a sound when a feature is cleared (for example, the terminal, Debug Console, or Output channel). When this is disabled, an ARIA alert will announce 'Cleared'."),
                    ...soundDeprecatedFeatureBase,
                    default: 'off'
                },
                'audioCues.save': {
                    'markdownDescription': (0, nls_1.localize)('audioCues.save', "Plays a sound when a file is saved. Also see {0}", '`#accessibility.alert.save#`'),
                    'type': 'string',
                    'enum': ['userGesture', 'always', 'never'],
                    'default': 'never',
                    'enumDescriptions': [
                        (0, nls_1.localize)('audioCues.save.userGesture', "Plays the audio cue when a user explicitly saves a file."),
                        (0, nls_1.localize)('audioCues.save.always', "Plays the audio cue whenever a file is saved, including auto save."),
                        (0, nls_1.localize)('audioCues.save.never', "Never plays the audio cue.")
                    ],
                    tags: ['accessibility'],
                    markdownDeprecationMessage
                },
                'audioCues.format': {
                    'markdownDescription': (0, nls_1.localize)('audioCues.format', "Plays a sound when a file or notebook is formatted. Also see {0}", '`#accessibility.alert.format#`'),
                    'type': 'string',
                    'enum': ['userGesture', 'always', 'never'],
                    'default': 'never',
                    'enumDescriptions': [
                        (0, nls_1.localize)('audioCues.format.userGesture', "Plays the audio cue when a user explicitly formats a file."),
                        (0, nls_1.localize)('audioCues.format.always', "Plays the audio cue whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                        (0, nls_1.localize)('audioCues.format.never', "Never plays the audio cue.")
                    ],
                    tags: ['accessibility'],
                    markdownDeprecationMessage
                },
            },
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW9DdWVDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL2F1ZGlvQ3VlQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQmhHLHNFQXlJQztJQXpKWSxRQUFBLG1CQUFtQixHQUFpQztRQUNoRSxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztRQUM3QixTQUFTLEVBQUUsTUFBTTtRQUNqQixrQkFBa0IsRUFBRTtZQUNuQixJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxvREFBb0QsQ0FBQztZQUN4RixJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxtQkFBbUIsQ0FBQztZQUNyRCxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxvQkFBb0IsQ0FBQztTQUN2RDtRQUNELElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQztLQUN2QixDQUFDO0lBQ0YsTUFBTSwwQkFBMEIsR0FBRyxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSw2REFBNkQsQ0FBQyxDQUFDO0lBQzNJLE1BQU0sMEJBQTBCLEdBQWlDO1FBQ2hFLEdBQUcsMkJBQW1CO1FBQ3RCLDBCQUEwQjtLQUMxQixDQUFDO0lBQ0YsU0FBZ0IsNkJBQTZCO1FBQzVDLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztZQUNoRyxLQUFLLHFDQUE2QjtZQUNsQyxZQUFZLEVBQUU7Z0JBQ2IsbUJBQW1CLEVBQUU7b0JBQ3BCLDBCQUEwQixFQUFFLGtGQUFrRjtvQkFDOUcsSUFBSSxFQUFFLENBQUMsZUFBZSxD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