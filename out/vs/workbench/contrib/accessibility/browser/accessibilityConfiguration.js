/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/configuration", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/types"], function (require, exports, nls_1, configurationRegistry_1, platform_1, contextkey_1, configuration_1, accessibilitySignalService_1, speechService_1, lifecycle_1, event_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicSpeechAccessibilityConfiguration = exports.SpeechTimeoutDefault = exports.AccessibilityVoiceSettingId = exports.announcementFeatureBase = exports.soundFeatureBase = exports.accessibilityConfigurationNodeBase = exports.AccessibleViewProviderId = exports.AccessibilityVerbositySettingId = exports.ViewDimUnfocusedOpacityProperties = exports.AccessibilityWorkbenchSettingId = exports.accessibleViewContainsCodeBlocks = exports.accessibleViewInCodeBlock = exports.accessibleViewCurrentProviderId = exports.accessibleViewOnLastLine = exports.accessibleViewGoToSymbolSupported = exports.accessibleViewVerbosityEnabled = exports.accessibleViewSupportsNavigation = exports.accessibleViewIsShown = exports.accessibilityHelpIsShown = void 0;
    exports.registerAccessibilityConfiguration = registerAccessibilityConfiguration;
    exports.accessibilityHelpIsShown = new contextkey_1.RawContextKey('accessibilityHelpIsShown', false, true);
    exports.accessibleViewIsShown = new contextkey_1.RawContextKey('accessibleViewIsShown', false, true);
    exports.accessibleViewSupportsNavigation = new contextkey_1.RawContextKey('accessibleViewSupportsNavigation', false, true);
    exports.accessibleViewVerbosityEnabled = new contextkey_1.RawContextKey('accessibleViewVerbosityEnabled', false, true);
    exports.accessibleViewGoToSymbolSupported = new contextkey_1.RawContextKey('accessibleViewGoToSymbolSupported', false, true);
    exports.accessibleViewOnLastLine = new contextkey_1.RawContextKey('accessibleViewOnLastLine', false, true);
    exports.accessibleViewCurrentProviderId = new contextkey_1.RawContextKey('accessibleViewCurrentProviderId', undefined, undefined);
    exports.accessibleViewInCodeBlock = new contextkey_1.RawContextKey('accessibleViewInCodeBlock', undefined, undefined);
    exports.accessibleViewContainsCodeBlocks = new contextkey_1.RawContextKey('accessibleViewContainsCodeBlocks', undefined, undefined);
    /**
     * Miscellaneous settings tagged with accessibility and implemented in the accessibility contrib but
     * were better to live under workbench for discoverability.
     */
    var AccessibilityWorkbenchSettingId;
    (function (AccessibilityWorkbenchSettingId) {
        AccessibilityWorkbenchSettingId["DimUnfocusedEnabled"] = "accessibility.dimUnfocused.enabled";
        AccessibilityWorkbenchSettingId["DimUnfocusedOpacity"] = "accessibility.dimUnfocused.opacity";
        AccessibilityWorkbenchSettingId["HideAccessibleView"] = "accessibility.hideAccessibleView";
        AccessibilityWorkbenchSettingId["AccessibleViewCloseOnKeyPress"] = "accessibility.accessibleView.closeOnKeyPress";
    })(AccessibilityWorkbenchSettingId || (exports.AccessibilityWorkbenchSettingId = AccessibilityWorkbenchSettingId = {}));
    var ViewDimUnfocusedOpacityProperties;
    (function (ViewDimUnfocusedOpacityProperties) {
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Default"] = 0.75] = "Default";
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Minimum"] = 0.2] = "Minimum";
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Maximum"] = 1] = "Maximum";
    })(ViewDimUnfocusedOpacityProperties || (exports.ViewDimUnfocusedOpacityProperties = ViewDimUnfocusedOpacityProperties = {}));
    var AccessibilityVerbositySettingId;
    (function (AccessibilityVerbositySettingId) {
        AccessibilityVerbositySettingId["Terminal"] = "accessibility.verbosity.terminal";
        AccessibilityVerbositySettingId["DiffEditor"] = "accessibility.verbosity.diffEditor";
        AccessibilityVerbositySettingId["Chat"] = "accessibility.verbosity.panelChat";
        AccessibilityVerbositySettingId["InlineChat"] = "accessibility.verbosity.inlineChat";
        AccessibilityVerbositySettingId["TerminalChat"] = "accessibility.verbosity.terminalChat";
        AccessibilityVerbositySettingId["InlineCompletions"] = "accessibility.verbosity.inlineCompletions";
        AccessibilityVerbositySettingId["KeybindingsEditor"] = "accessibility.verbosity.keybindingsEditor";
        AccessibilityVerbositySettingId["Notebook"] = "accessibility.verbosity.notebook";
        AccessibilityVerbositySettingId["Editor"] = "accessibility.verbosity.editor";
        AccessibilityVerbositySettingId["Hover"] = "accessibility.verbosity.hover";
        AccessibilityVerbositySettingId["Notification"] = "accessibility.verbosity.notification";
        AccessibilityVerbositySettingId["EmptyEditorHint"] = "accessibility.verbosity.emptyEditorHint";
        AccessibilityVerbositySettingId["Comments"] = "accessibility.verbosity.comments";
        AccessibilityVerbositySettingId["DiffEditorActive"] = "accessibility.verbosity.diffEditorActive";
    })(AccessibilityVerbositySettingId || (exports.AccessibilityVerbositySettingId = AccessibilityVerbositySettingId = {}));
    var AccessibleViewProviderId;
    (function (AccessibleViewProviderId) {
        AccessibleViewProviderId["Terminal"] = "terminal";
        AccessibleViewProviderId["TerminalChat"] = "terminal-chat";
        AccessibleViewProviderId["TerminalHelp"] = "terminal-help";
        AccessibleViewProviderId["DiffEditor"] = "diffEditor";
        AccessibleViewProviderId["Chat"] = "panelChat";
        AccessibleViewProviderId["InlineChat"] = "inlineChat";
        AccessibleViewProviderId["InlineCompletions"] = "inlineCompletions";
        AccessibleViewProviderId["KeybindingsEditor"] = "keybindingsEditor";
        AccessibleViewProviderId["Notebook"] = "notebook";
        AccessibleViewProviderId["Editor"] = "editor";
        AccessibleViewProviderId["Hover"] = "hover";
        AccessibleViewProviderId["Notification"] = "notification";
        AccessibleViewProviderId["EmptyEditorHint"] = "emptyEditorHint";
        AccessibleViewProviderId["Comments"] = "comments";
    })(AccessibleViewProviderId || (exports.AccessibleViewProviderId = AccessibleViewProviderId = {}));
    const baseVerbosityProperty = {
        type: 'boolean',
        default: true,
        tags: ['accessibility']
    };
    const markdownDeprecationMessage = (0, nls_1.localize)('accessibility.announcement.deprecationMessage', "This setting is deprecated. Use the `signals` settings instead.");
    const baseAlertProperty = {
        type: 'boolean',
        default: true,
        tags: ['accessibility'],
        markdownDeprecationMessage
    };
    exports.accessibilityConfigurationNodeBase = Object.freeze({
        id: 'accessibility',
        title: (0, nls_1.localize)('accessibilityConfigurationTitle', "Accessibility"),
        type: 'object'
    });
    exports.soundFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'on', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('sound.enabled.auto', "Enable sound when a screen reader is attached."),
            (0, nls_1.localize)('sound.enabled.on', "Enable sound."),
            (0, nls_1.localize)('sound.enabled.off', "Disable sound.")
        ],
        tags: ['accessibility'],
    };
    const signalFeatureBase = {
        'type': 'object',
        'tags': ['accessibility'],
        additionalProperties: false,
        default: {
            sound: 'auto',
            announcement: 'auto'
        }
    };
    exports.announcementFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('announcement.enabled.auto', "Enable announcement, will only play when in screen reader optimized mode."),
            (0, nls_1.localize)('announcement.enabled.off', "Disable announcement.")
        ],
        tags: ['accessibility'],
    };
    const defaultNoAnnouncement = {
        'type': 'object',
        'tags': ['accessibility'],
        additionalProperties: false,
        'default': {
            'sound': 'auto',
        }
    };
    const configuration = {
        ...exports.accessibilityConfigurationNodeBase,
        scope: 4 /* ConfigurationScope.RESOURCE */,
        properties: {
            ["accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */]: {
                description: (0, nls_1.localize)('verbosity.terminal.description', 'Provide information about how to access the terminal accessibility help menu when the terminal is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.diffEditor" /* AccessibilityVerbositySettingId.DiffEditor */]: {
                description: (0, nls_1.localize)('verbosity.diffEditor.description', 'Provide information about how to navigate changes in the diff editor when it is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */]: {
                description: (0, nls_1.localize)('verbosity.chat.description', 'Provide information about how to access the chat help menu when the chat input is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */]: {
                description: (0, nls_1.localize)('verbosity.interactiveEditor.description', 'Provide information about how to access the inline editor chat accessibility help menu and alert with hints that describe how to use the feature when the input is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.inlineCompletions" /* AccessibilityVerbositySettingId.InlineCompletions */]: {
                description: (0, nls_1.localize)('verbosity.inlineCompletions.description', 'Provide information about how to access the inline completions hover and Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.keybindingsEditor" /* AccessibilityVerbositySettingId.KeybindingsEditor */]: {
                description: (0, nls_1.localize)('verbosity.keybindingsEditor.description', 'Provide information about how to change a keybinding in the keybindings editor when a row is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */]: {
                description: (0, nls_1.localize)('verbosity.notebook', 'Provide information about how to focus the cell container or inner editor when a notebook cell is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */]: {
                description: (0, nls_1.localize)('verbosity.hover', 'Provide information about how to open the hover in an Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.notification" /* AccessibilityVerbositySettingId.Notification */]: {
                description: (0, nls_1.localize)('verbosity.notification', 'Provide information about how to open the notification in an Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */]: {
                description: (0, nls_1.localize)('verbosity.emptyEditorHint', 'Provide information about relevant actions in an empty text editor.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */]: {
                description: (0, nls_1.localize)('verbosity.comments', 'Provide information about actions that can be taken in the comment widget or in a file which contains comments.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */]: {
                description: (0, nls_1.localize)('verbosity.diffEditorActive', 'Indicate when a diff editor becomes the active editor.'),
                ...baseVerbosityProperty
            },
            ["accessibility.alert.save" /* AccessibilityAlertSettingId.Save */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.save', "Indicates when a file is saved. Also see {0}.", '`#audioCues.save#`'),
                'enum': ['userGesture', 'always', 'never'],
                'default': 'always',
                'enumDescriptions': [
                    (0, nls_1.localize)('announcement.save.userGesture', "Indicates when a file is saved via user gesture."),
                    (0, nls_1.localize)('announcement.save.always', "Indicates whenever is a file is saved, including auto save."),
                    (0, nls_1.localize)('announcement.save.never', "Never alerts.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
            ["accessibility.alert.clear" /* AccessibilityAlertSettingId.Clear */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.clear', "Indicates when a feature is cleared (for example, the terminal, Debug Console, or Output channel). Also see {0}.", '`#audioCues.clear#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.format" /* AccessibilityAlertSettingId.Format */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.format', "Indicates when a file or notebook cell is formatted. Also see {0}.", '`#audioCues.format#`'),
                'type': 'string',
                'enum': ['userGesture', 'always', 'never'],
                'default': 'always',
                'enumDescriptions': [
                    (0, nls_1.localize)('announcement.format.userGesture', "Indicates when a file is formatted via user gesture."),
                    (0, nls_1.localize)('announcement.format.always', "Indicates whenever is a file is formatted, including auto save, on cell execution, and more."),
                    (0, nls_1.localize)('announcement.format.never', "Never alerts.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
            ["accessibility.alert.breakpoint" /* AccessibilityAlertSettingId.Breakpoint */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.breakpoint', "Indicates when the debugger breaks. Also see {0}.", '`#audioCues.onDebugBreak#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.error" /* AccessibilityAlertSettingId.Error */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.error', "Indicates when the active line has an error. Also see {0}.", '`#audioCues.lineHasError#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.warning" /* AccessibilityAlertSettingId.Warning */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.warning', "Indicates when the active line has a warning. Also see {0}.", '`#audioCues.lineHasWarning#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.foldedArea" /* AccessibilityAlertSettingId.FoldedArea */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.foldedArea', "Indicates when the active line has a folded area that can be unfolded. Also see {0}.", '`#audioCues.lineHasFoldedArea#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalQuickFix" /* AccessibilityAlertSettingId.TerminalQuickFix */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalQuickFix', "Indicates when there is an available terminal quick fix. Also see {0}.", '`#audioCues.terminalQuickFix#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalBell" /* AccessibilityAlertSettingId.TerminalBell */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalBell', "Indicates when the terminal bell is activated."),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalCommandFailed" /* AccessibilityAlertSettingId.TerminalCommandFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalCommandFailed', "Indicates when a terminal command fails (non-zero exit code). Also see {0}.", '`#audioCues.terminalCommandFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.taskFailed" /* AccessibilityAlertSettingId.TaskFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.taskFailed', "Indicates when a task fails (non-zero exit code). Also see {0}.", '`#audioCues.taskFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.taskCompleted" /* AccessibilityAlertSettingId.TaskCompleted */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.taskCompleted', "Indicates when a task completes successfully (zero exit code). Also see {0}.", '`#audioCues.taskCompleted#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.chatRequestSent" /* AccessibilityAlertSettingId.ChatRequestSent */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.chatRequestSent', "Indicates when a chat request is sent. Also see {0}.", '`#audioCues.chatRequestSent#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.chatResponseProgress" /* AccessibilityAlertSettingId.Progress */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.progress', "Indicates when a chat response is pending. Also see {0}.", '`#audioCues.chatResponsePending#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.noInlayHints" /* AccessibilityAlertSettingId.NoInlayHints */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.noInlayHints', "Indicates when there are no inlay hints. Also see {0}.", '`#audioCues.noInlayHints#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.lineHasBreakpoint" /* AccessibilityAlertSettingId.LineHasBreakpoint */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.lineHasBreakpoint', "Indicates when on a line with a breakpoint. Also see {0}.", '`#audioCues.lineHasBreakpoint#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.notebookCellCompleted" /* AccessibilityAlertSettingId.NotebookCellCompleted */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.notebookCellCompleted', "Indicates when a notebook cell completes successfully. Also see {0}.", '`#audioCues.notebookCellCompleted#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.notebookCellFailed" /* AccessibilityAlertSettingId.NotebookCellFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.notebookCellFailed', "Indicates when a notebook cell fails. Also see {0}.", '`#audioCues.notebookCellFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.onDebugBreak" /* AccessibilityAlertSettingId.OnDebugBreak */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.onDebugBreak', "Indicates when the debugger breaks. Also see {0}.", '`#audioCues.onDebugBreak#`'),
                ...baseAlertProperty
            },
            ["accessibility.accessibleView.closeOnKeyPress" /* AccessibilityWorkbenchSettingId.AccessibleViewCloseOnKeyPress */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleView.closeOnKeyPress', "On keypress, close the Accessible View and focus the element from which it was invoked."),
                type: 'boolean',
                default: true
            },
            'accessibility.signals.sounds.volume': {
                'description': (0, nls_1.localize)('accessibility.signals.sounds.volume', "The volume of the sounds in percent (0-100)."),
                'type': 'number',
                'minimum': 0,
                'maximum': 100,
                'default': 70,
                tags: ['accessibility']
            },
            'accessibility.signals.debouncePositionChanges': {
                'description': (0, nls_1.localize)('accessibility.signals.debouncePositionChanges', "Whether or not position changes should be debounced"),
                'type': 'boolean',
                'default': false,
                tags: ['accessibility']
            },
            'accessibility.signals.lineHasBreakpoint': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint', "Plays a signal when the active line has a breakpoint."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint.sound', "Plays a sound when the active line has a breakpoint."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint.announcement', "Indicates when the active line has a breakpoint."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.lineHasInlineSuggestion': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasInlineSuggestion', "Indicates when the active line has an inline suggestion."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasInlineSuggestion.sound', "Plays a sound when the active line has an inline suggestion."),
                        ...exports.soundFeatureBase,
                        'default': 'off'
                    }
                }
            },
            'accessibility.signals.lineHasError': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasError', "Indicates when the active line has an error."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasError.sound', "Plays a sound when the active line has an error."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasError.announcement', "Indicates when the active line has an error."),
                        ...exports.announcementFeatureBase,
                        default: 'off'
                    },
                },
            },
            'accessibility.signals.lineHasFoldedArea': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea', "Indicates when the active line has a folded area that can be unfolded."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea.sound', "Plays a sound when the active line has a folded area that can be unfolded."),
                        ...exports.soundFeatureBase,
                        default: 'off'
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea.announcement', "Indicates when the active line has a folded area that can be unfolded."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.lineHasWarning': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning', "Plays a signal when the active line has a warning."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning.sound', "Plays a sound when the active line has a warning."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning.announcement', "Indicates when the active line has a warning."),
                        ...exports.announcementFeatureBase,
                        default: 'off'
                    },
                },
            },
            'accessibility.signals.positionHasError': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.positionHasError', "Plays a signal when the active line has a warning."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.positionHasError.sound', "Plays a sound when the active line has a warning."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.positionHasError.announcement', "Indicates when the active line has a warning."),
                        ...exports.announcementFeatureBase,
                        default: 'on'
                    },
                },
            },
            'accessibility.signals.positionHasWarning': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.positionHasWarning', "Plays a signal when the active line has a warning."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.positionHasWarning.sound', "Plays a sound when the active line has a warning."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.positionHasWarning.announcement', "Indicates when the active line has a warning."),
                        ...exports.announcementFeatureBase,
                        default: 'on'
                    },
                },
            },
            'accessibility.signals.onDebugBreak': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak', "Plays a signal when the debugger stopped on a breakpoint."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak.sound', "Plays a sound when the debugger stopped on a breakpoint."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak.announcement', "Indicates when the debugger stopped on a breakpoint."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.noInlayHints': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.noInlayHints', "Plays a signal when trying to read a line with inlay hints that has no inlay hints."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.noInlayHints.sound', "Plays a sound when trying to read a line with inlay hints that has no inlay hints."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.noInlayHints.announcement', "Indicates when trying to read a line with inlay hints that has no inlay hints."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.taskCompleted': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.taskCompleted', "Plays a signal when a task is completed."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskCompleted.sound', "Plays a sound when a task is completed."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskCompleted.announcement', "Indicates when a task is completed."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.taskFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.taskFailed', "Plays a signal when a task fails (non-zero exit code)."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskFailed.sound', "Plays a sound when a task fails (non-zero exit code)."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskFailed.announcement', "Indicates when a task fails (non-zero exit code)."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalCommandFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed', "Plays a signal when a terminal command fails (non-zero exit code) or when a command with such an exit code is navigated to in the accessible view."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed.sound', "Plays a sound when a terminal command fails (non-zero exit code) or when a command with such an exit code is navigated to in the accessible view."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed.announcement', "Indicates when a terminal command fails (non-zero exit code) or when a command with such an exit code is navigated to in the accessible view."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalQuickFix': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix', "Plays a signal when terminal Quick Fixes are available."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix.sound', "Plays a sound when terminal Quick Fixes are available."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix.announcement', "Indicates when terminal Quick Fixes are available."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalBell': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalBell', "Plays a signal when the terminal bell is ringing."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalBell.sound', "Plays a sound when the terminal bell is ringing."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalBell.announcement', "Indicates when the terminal bell is ringing."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.diffLineInserted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineInserted', "Indicates when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.sound', "Plays a sound when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...exports.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.diffLineModified': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineModified', "Indicates when the focus moves to an modified line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.diffLineModified.sound', "Plays a sound when the focus moves to a modified line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...exports.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.diffLineDeleted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineDeleted', "Indicates when the focus moves to an deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.diffLineDeleted.sound', "Plays a sound when the focus moves to an deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...exports.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.notebookCellCompleted': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted', "Plays a signal when a notebook cell execution is successfully completed."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted.sound', "Plays a sound when a notebook cell execution is successfully completed."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted.announcement', "Indicates when a notebook cell execution is successfully completed."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.notebookCellFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed', "Plays a signal when a notebook cell execution fails."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed.sound', "Plays a sound when a notebook cell execution fails."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed.announcement', "Indicates when a notebook cell execution fails."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.chatRequestSent': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent', "Plays a signal when a chat request is made."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent.sound', "Plays a sound when a chat request is made."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent.announcement', "Indicates when a chat request is made."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.progress': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.progress', "Plays a signal on loop while progress is occurring."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.progress.sound', "Plays a sound on loop while progress is occurring."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.progress.announcement', "Alerts on loop while progress is occurring."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.chatResponseReceived': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.chatResponseReceived', "Indicates when the response has been received."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatResponseReceived.sound', "Plays a sound on loop while the response has been received."),
                        ...exports.soundFeatureBase
                    },
                }
            },
            'accessibility.signals.voiceRecordingStarted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStarted', "Indicates when the voice recording has started."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStarted.sound', "Plays a sound when the voice recording has started."),
                        ...exports.soundFeatureBase,
                    },
                },
                'default': {
                    'sound': 'on'
                }
            },
            'accessibility.signals.voiceRecordingStopped': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStopped', "Indicates when the voice recording has stopped."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStopped.sound', "Plays a sound when the voice recording has stopped."),
                        ...exports.soundFeatureBase,
                        default: 'off'
                    },
                }
            },
            'accessibility.signals.clear': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.clear', "Plays a signal when a feature is cleared (for example, the terminal, Debug Console, or Output channel)."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.clear.sound', "Plays a sound when a feature is cleared."),
                        ...exports.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.clear.announcement', "Indicates when a feature is cleared."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.save': {
                'type': 'object',
                'tags': ['accessibility'],
                additionalProperties: false,
                'markdownDescription': (0, nls_1.localize)('accessibility.signals.save', "Plays a signal when a file is saved."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.save.sound', "Plays a sound when a file is saved."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.save.sound.userGesture', "Plays the audio cue when a user explicitly saves a file."),
                            (0, nls_1.localize)('accessibility.signals.save.sound.always', "Plays the audio cue whenever a file is saved, including auto save."),
                            (0, nls_1.localize)('accessibility.signals.save.sound.never', "Never plays the audio cue.")
                        ],
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.save.announcement', "Indicates when a file is saved."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.save.announcement.userGesture', "Announces when a user explicitly saves a file."),
                            (0, nls_1.localize)('accessibility.signals.save.announcement.always', "Announces whenever a file is saved, including auto save."),
                            (0, nls_1.localize)('accessibility.signals.save.announcement.never', "Never plays the audio cue.")
                        ],
                    },
                },
                default: {
                    'sound': 'never',
                    'announcement': 'never'
                }
            },
            'accessibility.signals.format': {
                'type': 'object',
                'tags': ['accessibility'],
                additionalProperties: false,
                'markdownDescription': (0, nls_1.localize)('accessibility.signals.format', "Plays a signal when a file or notebook is formatted."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.format.sound', "Plays a sound when a file or notebook is formatted."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.format.userGesture', "Plays the audio cue when a user explicitly formats a file."),
                            (0, nls_1.localize)('accessibility.signals.format.always', "Plays the audio cue whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                            (0, nls_1.localize)('accessibility.signals.format.never', "Never plays the audio cue.")
                        ],
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.format.announcement', "Indicates when a file or notebook is formatted."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.format.announcement.userGesture', "Announceswhen a user explicitly formats a file."),
                            (0, nls_1.localize)('accessibility.signals.format.announcement.always', "Announces whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                            (0, nls_1.localize)('accessibility.signals.format.announcement.never', "Never announces.")
                        ],
                    },
                },
                default: {
                    'sound': 'never',
                    'announcement': 'never'
                }
            },
        }
    };
    function registerAccessibilityConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        registry.registerConfiguration(configuration);
        registry.registerConfiguration({
            ...configuration_1.workbenchConfigurationNodeBase,
            properties: {
                ["accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */]: {
                    description: (0, nls_1.localize)('dimUnfocusedEnabled', 'Whether to dim unfocused editors and terminals, which makes it more clear where typed input will go to. This works with the majority of editors with the notable exceptions of those that utilize iframes like notebooks and extension webview editors.'),
                    type: 'boolean',
                    default: false,
                    tags: ['accessibility'],
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                },
                ["accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */]: {
                    markdownDescription: (0, nls_1.localize)('dimUnfocusedOpacity', 'The opacity fraction (0.2 to 1.0) to use for unfocused editors and terminals. This will only take effect when {0} is enabled.', `\`#${"accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */}#\``),
                    type: 'number',
                    minimum: 0.2 /* ViewDimUnfocusedOpacityProperties.Minimum */,
                    maximum: 1 /* ViewDimUnfocusedOpacityProperties.Maximum */,
                    default: 0.75 /* ViewDimUnfocusedOpacityProperties.Default */,
                    tags: ['accessibility'],
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                },
                ["accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */]: {
                    description: (0, nls_1.localize)('accessibility.hideAccessibleView', "Controls whether the Accessible View is hidden."),
                    type: 'boolean',
                    default: false,
                    tags: ['accessibility']
                }
            }
        });
    }
    var AccessibilityVoiceSettingId;
    (function (AccessibilityVoiceSettingId) {
        AccessibilityVoiceSettingId["SpeechTimeout"] = "accessibility.voice.speechTimeout";
        AccessibilityVoiceSettingId["SpeechLanguage"] = "accessibility.voice.speechLanguage";
    })(AccessibilityVoiceSettingId || (exports.AccessibilityVoiceSettingId = AccessibilityVoiceSettingId = {}));
    exports.SpeechTimeoutDefault = 1200;
    let DynamicSpeechAccessibilityConfiguration = class DynamicSpeechAccessibilityConfiguration extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.dynamicSpeechAccessibilityConfiguration'; }
        constructor(speechService) {
            super();
            this.speechService = speechService;
            this._register(event_1.Event.runAndSubscribe(speechService.onDidChangeHasSpeechProvider, () => this.updateConfiguration()));
        }
        updateConfiguration() {
            if (!this.speechService.hasSpeechProvider) {
                return; // these settings require a speech provider
            }
            const languages = this.getLanguages();
            const languagesSorted = Object.keys(languages).sort((langA, langB) => {
                return languages[langA].name.localeCompare(languages[langB].name);
            });
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...exports.accessibilityConfigurationNodeBase,
                properties: {
                    ["accessibility.voice.speechTimeout" /* AccessibilityVoiceSettingId.SpeechTimeout */]: {
                        'markdownDescription': (0, nls_1.localize)('voice.speechTimeout', "The duration in milliseconds that voice speech recognition remains active after you stop speaking. For example in a chat session, the transcribed text is submitted automatically after the timeout is met. Set to `0` to disable this feature."),
                        'type': 'number',
                        'default': exports.SpeechTimeoutDefault,
                        'minimum': 0,
                        'tags': ['accessibility']
                    },
                    ["accessibility.voice.speechLanguage" /* AccessibilityVoiceSettingId.SpeechLanguage */]: {
                        'markdownDescription': (0, nls_1.localize)('voice.speechLanguage', "The language that voice speech recognition should recognize. Select `auto` to use the configured display language if possible. Note that not all display languages maybe supported by speech recognition"),
                        'type': 'string',
                        'enum': languagesSorted,
                        'default': 'auto',
                        'tags': ['accessibility'],
                        'enumDescriptions': languagesSorted.map(key => languages[key].name),
                        'enumItemLabels': languagesSorted.map(key => languages[key].name)
                    }
                }
            });
        }
        getLanguages() {
            return {
                ['auto']: {
                    name: (0, nls_1.localize)('speechLanguage.auto', "Auto (Use Display Language)")
                },
                ...speechService_1.SPEECH_LANGUAGES
            };
        }
    };
    exports.DynamicSpeechAccessibilityConfiguration = DynamicSpeechAccessibilityConfiguration;
    exports.DynamicSpeechAccessibilityConfiguration = DynamicSpeechAccessibilityConfiguration = __decorate([
        __param(0, speechService_1.ISpeechService)
    ], DynamicSpeechAccessibilityConfiguration);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'audioCues.volume',
            migrateFn: (value, accessor) => {
                return [
                    ['accessibility.signals.sounds.volume', { value }],
                    ['audioCues.volume', { value: undefined }]
                ];
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'audioCues.debouncePositionChanges',
            migrateFn: (value, accessor) => {
                return [
                    ['accessibility.signals.debouncePositionChanges', { value }],
                    ['audioCues.debouncePositionChanges', { value: undefined }]
                ];
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'accessibility.signals.chatResponsePending',
            migrateFn: (value, accessor) => {
                return [
                    ['accessibility.signals.progress', { value }],
                    ['accessibility.signals.chatResponsePending', { value: undefined }],
                ];
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.map(item => item.legacySoundSettingsKey ? ({
        key: item.legacySoundSettingsKey,
        migrateFn: (sound, accessor) => {
            const configurationKeyValuePairs = [];
            const legacyAnnouncementSettingsKey = item.legacyAnnouncementSettingsKey;
            let announcement;
            if (legacyAnnouncementSettingsKey) {
                announcement = accessor(legacyAnnouncementSettingsKey) ?? undefined;
                if (announcement !== undefined && typeof announcement !== 'string') {
                    announcement = announcement ? 'auto' : 'off';
                }
            }
            configurationKeyValuePairs.push([`${item.legacySoundSettingsKey}`, { value: undefined }]);
            configurationKeyValuePairs.push([`${item.settingsKey}`, { value: announcement !== undefined ? { announcement, sound } : { sound } }]);
            return configurationKeyValuePairs;
        }
    }) : undefined).filter(types_1.isDefined));
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(i => !!i.legacyAnnouncementSettingsKey && !!i.legacySoundSettingsKey).map(item => ({
        key: item.legacyAnnouncementSettingsKey,
        migrateFn: (announcement, accessor) => {
            const configurationKeyValuePairs = [];
            const sound = accessor(item.settingsKey)?.sound || accessor(item.legacySoundSettingsKey);
            if (announcement !== undefined && typeof announcement !== 'string') {
                announcement = announcement ? 'auto' : 'off';
            }
            configurationKeyValuePairs.push([`${item.settingsKey}`, { value: announcement !== undefined ? { announcement, sound } : { sound } }]);
            configurationKeyValuePairs.push([`${item.legacyAnnouncementSettingsKey}`, { value: undefined }]);
            configurationKeyValuePairs.push([`${item.legacySoundSettingsKey}`, { value: undefined }]);
            return configurationKeyValuePairs;
        }
    })));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eUNvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvYWNjZXNzaWJpbGl0eUNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK3JCaEcsZ0ZBK0JDO0lBaHRCWSxRQUFBLHdCQUF3QixHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0YsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pGLFFBQUEsZ0NBQWdDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGtDQUFrQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRyxRQUFBLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0csUUFBQSxpQ0FBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUNBQW1DLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pILFFBQUEsd0JBQXdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRixRQUFBLCtCQUErQixHQUFHLElBQUksMEJBQWEsQ0FBUyxpQ0FBaUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckgsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzFHLFFBQUEs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