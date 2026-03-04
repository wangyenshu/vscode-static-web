/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform", "vs/platform/registry/common/platform", "vs/base/common/codicons", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/product/common/product", "vs/workbench/common/configuration"], function (require, exports, configurationRegistry_1, nls_1, terminal_1, platform_1, platform_2, codicons_1, terminalPlatformConfiguration_1, product_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultTerminalFontSize = void 0;
    exports.registerTerminalConfiguration = registerTerminalConfiguration;
    const terminalDescriptors = '\n- ' + [
        '`\${cwd}`: ' + (0, nls_1.localize)("cwd", "the terminal's current working directory"),
        '`\${cwdFolder}`: ' + (0, nls_1.localize)('cwdFolder', "the terminal's current working directory, displayed for multi-root workspaces or in a single root workspace when the value differs from the initial working directory. On Windows, this will only be displayed when shell integration is enabled."),
        '`\${workspaceFolder}`: ' + (0, nls_1.localize)('workspaceFolder', "the workspace in which the terminal was launched"),
        '`\${local}`: ' + (0, nls_1.localize)('local', "indicates a local terminal in a remote workspace"),
        '`\${process}`: ' + (0, nls_1.localize)('process', "the name of the terminal process"),
        '`\${separator}`: ' + (0, nls_1.localize)('separator', "a conditional separator {0} that only shows when surrounded by variables with values or static text.", '(` - `)'),
        '`\${sequence}`: ' + (0, nls_1.localize)('sequence', "the name provided to the terminal by the process"),
        '`\${task}`: ' + (0, nls_1.localize)('task', "indicates this terminal is associated with a task"),
    ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
    let terminalTitle = (0, nls_1.localize)('terminalTitle', "Controls the terminal title. Variables are substituted based on the context:");
    terminalTitle += terminalDescriptors;
    let terminalDescription = (0, nls_1.localize)('terminalDescription', "Controls the terminal description, which appears to the right of the title. Variables are substituted based on the context:");
    terminalDescription += terminalDescriptors;
    exports.defaultTerminalFontSize = platform_1.isMacintosh ? 12 : 14;
    const terminalConfiguration = {
        id: 'terminal',
        order: 100,
        title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            ["terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.sendKeybindingsToShell', "Dispatches most keybindings to the terminal instead of the workbench, overriding {0}, which can be used alternatively for fine tuning.", '`#terminal.integrated.commandsToSkipShell#`'),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.tabs.defaultColor" /* TerminalSettingId.TabsDefaultColor */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.defaultColor', "A theme color ID to associate with terminal icons by default."),
                ...terminalPlatformConfiguration_1.terminalColorSchema,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.defaultIcon', "A codicon ID to associate with terminal icons by default."),
                ...terminalPlatformConfiguration_1.terminalIconSchema,
                default: codicons_1.Codicon.terminal.id,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.enabled', 'Controls whether terminal tabs display as a list to the side of the terminal. When this is disabled a dropdown will display instead.'),
                type: 'boolean',
                default: true,
            },
            ["terminal.integrated.tabs.enableAnimation" /* TerminalSettingId.TabsEnableAnimation */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.enableAnimation', 'Controls whether terminal tab statuses support animation (eg. in progress tasks).'),
                type: 'boolean',
                default: true,
            },
            ["terminal.integrated.tabs.hideCondition" /* TerminalSettingId.TabsHideCondition */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.hideCondition', 'Controls whether the terminal tabs view will hide under certain conditions.'),
                type: 'string',
                enum: ['never', 'singleTerminal', 'singleGroup'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.never', "Never hide the terminal tabs view"),
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.singleTerminal', "Hide the terminal tabs view when there is only a single terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.singleGroup', "Hide the terminal tabs view when there is only a single terminal group opened"),
                ],
                default: 'singleTerminal',
            },
            ["terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal', 'Shows the active terminal information in the view. This is particularly useful when the title within the tabs aren\'t visible.'),
                type: 'string',
                enum: ['always', 'singleTerminal', 'singleTerminalOrNarrow', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.always', "Always show the active terminal"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.singleTerminal', "Show the active terminal when it is the only terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.singleTerminalOrNarrow', "Show the active terminal when it is the only terminal opened or when the tabs view is in its narrow textless state"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.never', "Never show the active terminal"),
                ],
                default: 'singleTerminalOrNarrow',
            },
            ["terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.showActions', 'Controls whether terminal split and kill buttons are displays next to the new terminal button.'),
                type: 'string',
                enum: ['always', 'singleTerminal', 'singleTerminalOrNarrow', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.always', "Always show the actions"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.singleTerminal', "Show the actions when it is the only terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.singleTerminalOrNarrow', "Show the actions when it is the only terminal opened or when the tabs view is in its narrow textless state"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.never', "Never show the actions"),
                ],
                default: 'singleTerminalOrNarrow',
            },
            ["terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */]: {
                type: 'string',
                enum: ['left', 'right'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.location.left', "Show the terminal tabs view to the left of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.tabs.location.right', "Show the terminal tabs view to the right of the terminal")
                ],
                default: 'right',
                description: (0, nls_1.localize)('terminal.integrated.tabs.location', "Controls the location of the terminal tabs, either to the left or right of the actual terminal(s).")
            },
            ["terminal.integrated.defaultLocation" /* TerminalSettingId.DefaultLocation */]: {
                type: 'string',
                enum: ["editor" /* TerminalLocationString.Editor */, "view" /* TerminalLocationString.TerminalView */],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.defaultLocation.editor', "Create terminals in the editor"),
                    (0, nls_1.localize)('terminal.integrated.defaultLocation.view', "Create terminals in the terminal view")
                ],
                default: 'view',
                description: (0, nls_1.localize)('terminal.integrated.defaultLocation', "Controls where newly created terminals will appear.")
            },
            ["terminal.integrated.tabs.focusMode" /* TerminalSettingId.TabsFocusMode */]: {
                type: 'string',
                enum: ['singleClick', 'doubleClick'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.focusMode.singleClick', "Focus the terminal when clicking a terminal tab"),
                    (0, nls_1.localize)('terminal.integrated.tabs.focusMode.doubleClick', "Focus the terminal when double-clicking a terminal tab")
                ],
                default: 'doubleClick',
                description: (0, nls_1.localize)('terminal.integrated.tabs.focusMode', "Controls whether focusing the terminal of a tab happens on double or single click.")
            },
            ["terminal.integrated.macOptionIsMeta" /* TerminalSettingId.MacOptionIsMeta */]: {
                description: (0, nls_1.localize)('terminal.integrated.macOptionIsMeta', "Controls whether to treat the option key as the meta key in the terminal on macOS."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.macOptionClickForcesSelection" /* TerminalSettingId.MacOptionClickForcesSelection */]: {
                description: (0, nls_1.localize)('terminal.integrated.macOptionClickForcesSelection', "Controls whether to force selection when using Option+click on macOS. This will force a regular (line) selection and disallow the use of column selection mode. This enables copying and pasting using the regular terminal selection, for example, when mouse mode is enabled in tmux."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.altClickMovesCursor" /* TerminalSettingId.AltClickMovesCursor */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.altClickMovesCursor', "If enabled, alt/option + click will reposition the prompt cursor to underneath the mouse when {0} is set to {1} (the default value). This may not work reliably depending on your shell.", '`#editor.multiCursorModifier#`', '`\'alt\'`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.copyOnSelection" /* TerminalSettingId.CopyOnSelection */]: {
                description: (0, nls_1.localize)('terminal.integrated.copyOnSelection', "Controls whether text selected in the terminal will be copied to the clipboard."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning', "Controls whether to show a warning dialog when pasting multiple lines into the terminal."),
                type: 'string',
                enum: ['auto', 'always', 'never'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.auto', "Enable the warning but do not show it when:\n\n- Bracketed paste mode is enabled (the shell supports multi-line paste natively)\n- The paste is handled by the shell's readline (in the case of pwsh)"),
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.always', "Always show the warning if the text contains a new line."),
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.never', "Never show the warning.")
                ],
                default: 'auto'
            },
            ["terminal.integrated.drawBoldTextInBrightColors" /* TerminalSettingId.DrawBoldTextInBrightColors */]: {
                description: (0, nls_1.localize)('terminal.integrated.drawBoldTextInBrightColors', "Controls whether bold text in the terminal will always use the \"bright\" ANSI color variant."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.fontFamily', "Controls the font family of the terminal. Defaults to {0}'s value.", '`#editor.fontFamily#`'),
                type: 'string'
            },
            // TODO: Support font ligatures
            // 'terminal.integrated.fontLigatures': {
            // 	'description': localize('terminal.integrated.fontLigatures', "Controls whether font ligatures are enabled in the terminal."),
            // 	'type': 'boolean',
            // 	'default': false
            // },
            ["terminal.integrated.fontSize" /* TerminalSettingId.FontSize */]: {
                description: (0, nls_1.localize)('terminal.integrated.fontSize', "Controls the font size in pixels of the terminal."),
                type: 'number',
                default: exports.defaultTerminalFontSize,
                minimum: 6,
                maximum: 100
            },
            ["terminal.integrated.letterSpacing" /* TerminalSettingId.LetterSpacing */]: {
                description: (0, nls_1.localize)('terminal.integrated.letterSpacing', "Controls the letter spacing of the terminal. This is an integer value which represents the number of additional pixels to add between characters."),
                type: 'number',
                default: terminal_1.DEFAULT_LETTER_SPACING
            },
            ["terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */]: {
                description: (0, nls_1.localize)('terminal.integrated.lineHeight', "Controls the line height of the terminal. This number is multiplied by the terminal font size to get the actual line-height in pixels."),
                type: 'number',
                default: terminal_1.DEFAULT_LINE_HEIGHT
            },
            ["terminal.integrated.minimumContrastRatio" /* TerminalSettingId.MinimumContrastRatio */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.minimumContrastRatio', "When set, the foreground color of each cell will change to try meet the contrast ratio specified. Note that this will not apply to `powerline` characters per #146406. Example values:\n\n- 1: Do nothing and use the standard theme colors.\n- 4.5: [WCAG AA compliance (minimum)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) (default).\n- 7: [WCAG AAA compliance (enhanced)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast7.html).\n- 21: White on black or black on white."),
                type: 'number',
                default: 4.5,
                tags: ['accessibility']
            },
            ["terminal.integrated.tabStopWidth" /* TerminalSettingId.TabStopWidth */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.tabStopWidth', "The number of cells in a tab stop."),
                type: 'number',
                minimum: 1,
                default: 8
            },
            ["terminal.integrated.fastScrollSensitivity" /* TerminalSettingId.FastScrollSensitivity */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`."),
                type: 'number',
                default: 5
            },
            ["terminal.integrated.mouseWheelScrollSensitivity" /* TerminalSettingId.MouseWheelScrollSensitivity */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaY` of mouse wheel scroll events."),
                type: 'number',
                default: 1
            },
            ["terminal.integrated.bellDuration" /* TerminalSettingId.BellDuration */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.bellDuration', "The number of milliseconds to show the bell within a terminal tab when triggered."),
                type: 'number',
                default: 1000
            },
            ["terminal.integrated.fontWeight" /* TerminalSettingId.FontWeight */]: {
                'anyOf': [
                    {
                        type: 'number',
                        minimum: terminal_1.MINIMUM_FONT_WEIGHT,
                        maximum: terminal_1.MAXIMUM_FONT_WEIGHT,
                        errorMessage: (0, nls_1.localize)('terminal.integrated.fontWeightError', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: terminal_1.SUGGESTIONS_FONT_WEIGHT,
                    }
                ],
                description: (0, nls_1.localize)('terminal.integrated.fontWeight', "The font weight to use within the terminal for non-bold text. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000."),
                default: 'normal'
            },
            ["terminal.integrated.fontWeightBold" /* TerminalSettingId.FontWeightBold */]: {
                'anyOf': [
                    {
                        type: 'number',
                        minimum: terminal_1.MINIMUM_FONT_WEIGHT,
                        maximum: terminal_1.MAXIMUM_FONT_WEIGHT,
                        errorMessage: (0, nls_1.localize)('terminal.integrated.fontWeightError', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: terminal_1.SUGGESTIONS_FONT_WEIGHT,
                    }
                ],
                description: (0, nls_1.localize)('terminal.integrated.fontWeightBold', "The font weight to use within the terminal for bold text. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000."),
                default: 'bold'
            },
            ["terminal.integrated.cursorBlinking" /* TerminalSettingId.CursorBlinking */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorBlinking', "Controls whether the terminal cursor blinks."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.cursorStyle" /* TerminalSettingId.CursorStyle */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorStyle', "Controls the style of terminal cursor when the terminal is focused."),
                enum: ['block', 'line', 'underline'],
                default: 'block'
            },
            ["terminal.integrated.cursorStyleInactive" /* TerminalSettingId.CursorStyleInactive */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorStyleInactive', "Controls the style of terminal cursor when the terminal is not focused."),
                enum: ['outline', 'block', 'line', 'underline', 'none'],
                default: 'outline'
            },
            ["terminal.integrated.cursorWidth" /* TerminalSettingId.CursorWidth */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.cursorWidth', "Controls the width of the cursor when {0} is set to {1}.", '`#terminal.integrated.cursorStyle#`', '`line`'),
                type: 'number',
                default: 1
            },
            ["terminal.integrated.scrollback" /* TerminalSettingId.Scrollback */]: {
                description: (0, nls_1.localize)('terminal.integrated.scrollback', "Controls the maximum number of lines the terminal keeps in its buffer. We pre-allocate memory based on this value in order to ensure a smooth experience. As such, as the value increases, so will the amount of memory."),
                type: 'number',
                default: 1000
            },
            ["terminal.integrated.detectLocale" /* TerminalSettingId.DetectLocale */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.detectLocale', "Controls whether to detect and set the `$LANG` environment variable to a UTF-8 compliant option since VS Code's terminal only supports UTF-8 encoded data coming from the shell."),
                type: 'string',
                enum: ['auto', 'off', 'on'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.detectLocale.auto', "Set the `$LANG` environment variable if the existing variable does not exist or it does not end in `'.UTF-8'`."),
                    (0, nls_1.localize)('terminal.integrated.detectLocale.off', "Do not set the `$LANG` environment variable."),
                    (0, nls_1.localize)('terminal.integrated.detectLocale.on', "Always set the `$LANG` environment variable.")
                ],
                default: 'auto'
            },
            ["terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */]: {
                type: 'string',
                enum: ['auto', 'on', 'off', 'canvas'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.auto', "Let VS Code detect which renderer will give the best experience."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.on', "Enable GPU acceleration within the terminal."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.off', "Disable GPU acceleration within the terminal. The terminal will render much slower when GPU acceleration is off but it should reliably work on all systems."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.canvas', "Use the terminal's fallback canvas renderer which uses a 2d context instead of webgl which may perform better on some systems. Note that some features are limited in the canvas renderer like opaque selection.")
                ],
                default: 'auto',
                description: (0, nls_1.localize)('terminal.integrated.gpuAcceleration', "Controls whether the terminal will leverage the GPU to do its rendering.")
            },
            ["terminal.integrated.tabs.separator" /* TerminalSettingId.TerminalTitleSeparator */]: {
                'type': 'string',
                'default': ' - ',
                'markdownDescription': (0, nls_1.localize)("terminal.integrated.tabs.separator", "Separator used by {0} and {1}.", `\`#${"terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */}#\``, `\`#${"terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */}#\``)
            },
            ["terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */]: {
                'type': 'string',
                'default': '${process}',
                'markdownDescription': terminalTitle
            },
            ["terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */]: {
                'type': 'string',
                'default': '${task}${separator}${local}${separator}${cwdFolder}',
                'markdownDescription': terminalDescription
            },
            ["terminal.integrated.rightClickBehavior" /* TerminalSettingId.RightClickBehavior */]: {
                type: 'string',
                enum: ['default', 'copyPaste', 'paste', 'selectWord', 'nothing'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.default', "Show the context menu."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.copyPaste', "Copy when there is a selection, otherwise paste."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.paste', "Paste on right click."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.selectWord', "Select the word under the cursor and show the context menu."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.nothing', "Do nothing and pass event to terminal.")
                ],
                default: platform_1.isMacintosh ? 'selectWord' : platform_1.isWindows ? 'copyPaste' : 'default',
                description: (0, nls_1.localize)('terminal.integrated.rightClickBehavior', "Controls how terminal reacts to right click.")
            },
            ["terminal.integrated.middleClickBehavior" /* TerminalSettingId.MiddleClickBehavior */]: {
                type: 'string',
                enum: ['default', 'paste'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.middleClickBehavior.default', "The platform default to focus the terminal. On Linux this will also paste the selection."),
                    (0, nls_1.localize)('terminal.integrated.middleClickBehavior.paste', "Paste on middle click."),
                ],
                default: 'default',
                description: (0, nls_1.localize)('terminal.integrated.middleClickBehavior', "Controls how terminal reacts to middle click.")
            },
            ["terminal.integrated.cwd" /* TerminalSettingId.Cwd */]: {
                restricted: true,
                description: (0, nls_1.localize)('terminal.integrated.cwd', "An explicit start path where the terminal will be launched, this is used as the current working directory (cwd) for the shell process. This may be particularly useful in workspace settings if the root directory is not a convenient cwd."),
                type: 'string',
                default: undefined,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.confirmOnExit" /* TerminalSettingId.ConfirmOnExit */]: {
                description: (0, nls_1.localize)('terminal.integrated.confirmOnExit', "Controls whether to confirm when the window closes if there are active terminal sessions."),
                type: 'string',
                enum: ['never', 'always', 'hasChildProcesses'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.never', "Never confirm."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.always', "Always confirm if there are terminals."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.hasChildProcesses', "Confirm if there are any terminals that have child processes."),
                ],
                default: 'never'
            },
            ["terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */]: {
                description: (0, nls_1.localize)('terminal.integrated.confirmOnKill', "Controls whether to confirm killing terminals when they have child processes. When set to editor, terminals in the editor area will be marked as changed when they have child processes. Note that child process detection may not work well for shells like Git Bash which don't run their processes as child processes of the shell."),
                type: 'string',
                enum: ['never', 'editor', 'panel', 'always'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.never', "Never confirm."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.editor', "Confirm if the terminal is in the editor."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.panel', "Confirm if the terminal is in the panel."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.always', "Confirm if the terminal is either in the editor or panel."),
                ],
                default: 'editor'
            },
            ["terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */]: {
                markdownDeprecationMessage: (0, nls_1.localize)('terminal.integrated.enableBell', "This is now deprecated. Instead use the `terminal.integrated.enableVisualBell` and `accessibility.signals.terminalBell` settings."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */]: {
                description: (0, nls_1.localize)('terminal.integrated.enableVisualBell', "Controls whether the visual terminal bell is enabled. This shows up next to the terminal's name."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.commandsToSkipShell" /* TerminalSettingId.CommandsToSkipShell */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.commandsToSkipShell', "A set of command IDs whose keybindings will not be sent to the shell but instead always be handled by VS Code. This allows keybindings that would normally be consumed by the shell to act instead the same as when the terminal is not focused, for example `Ctrl+P` to launch Quick Open.\n\n&nbsp;\n\nMany commands are skipped by default. To override a default and pass that command's keybinding to the shell instead, add the command prefixed with the `-` character. For example add `-workbench.action.quickOpen` to allow `Ctrl+P` to reach the shell.\n\n&nbsp;\n\nThe following list of default skipped commands is truncated when viewed in Settings Editor. To see the full list, {1} and search for the first command from the list below.\n\n&nbsp;\n\nDefault Skipped Commands:\n\n{0}", terminal_1.DEFAULT_COMMANDS_TO_SKIP_SHELL.sort().map(command => `- ${command}`).join('\n'), `[${(0, nls_1.localize)('openDefaultSettingsJson', "open the default settings JSON")}](command:workbench.action.openRawDefaultSettings '${(0, nls_1.localize)('openDefaultSettingsJson.capitalized', "Open Default Settings (JSON)")}')`),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            ["terminal.integrated.allowChords" /* TerminalSettingId.AllowChords */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.allowChords', "Whether or not to allow chord keybindings in the terminal. Note that when this is true and the keystroke results in a chord it will bypass {0}, setting this to false is particularly useful when you want ctrl+k to go to your shell (not VS Code).", '`#terminal.integrated.commandsToSkipShell#`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.allowMnemonics" /* TerminalSettingId.AllowMnemonics */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.allowMnemonics', "Whether to allow menubar mnemonics (for example Alt+F) to trigger the open of the menubar. Note that this will cause all alt keystrokes to skip the shell when true. This does nothing on macOS."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.env.osx" /* TerminalSettingId.EnvMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.osx', "Object with environment variables that will be added to the VS Code process to be used by the terminal on macOS. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.env.linux" /* TerminalSettingId.EnvLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.linux', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Linux. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.env.windows" /* TerminalSettingId.EnvWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.windows', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Windows. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.environmentChangesIndicator" /* TerminalSettingId.EnvironmentChangesIndicator */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator', "Whether to display the environment changes indicator on each terminal which explains whether extensions have made, or want to make changes to the terminal's environment."),
                type: 'string',
                enum: ['off', 'on', 'warnonly'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.off', "Disable the indicator."),
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.on', "Enable the indicator."),
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.warnonly', "Only show the warning indicator when a terminal's environment is 'stale', not the information indicator that shows a terminal has had its environment modified by an extension."),
                ],
                default: 'warnonly'
            },
            ["terminal.integrated.environmentChangesRelaunch" /* TerminalSettingId.EnvironmentChangesRelaunch */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.environmentChangesRelaunch', "Whether to relaunch terminals automatically if extensions want to contribute to their environment and have not been interacted with yet."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.showExitAlert" /* TerminalSettingId.ShowExitAlert */]: {
                description: (0, nls_1.localize)('terminal.integrated.showExitAlert', "Controls whether to show the alert \"The terminal process terminated with exit code\" when exit code is non-zero."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.splitCwd" /* TerminalSettingId.SplitCwd */]: {
                description: (0, nls_1.localize)('terminal.integrated.splitCwd', "Controls the working directory a split terminal starts with."),
                type: 'string',
                enum: ['workspaceRoot', 'initial', 'inherited'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.splitCwd.workspaceRoot', "A new split terminal will use the workspace root as the working directory. In a multi-root workspace a choice for which root folder to use is offered."),
                    (0, nls_1.localize)('terminal.integrated.splitCwd.initial', "A new split terminal will use the working directory that the parent terminal started with."),
                    (0, nls_1.localize)('terminal.integrated.splitCwd.inherited', "On macOS and Linux, a new split terminal will use the working directory of the parent terminal. On Windows, this behaves the same as initial."),
                ],
                default: 'inherited'
            },
            ["terminal.integrated.windowsEnableConpty" /* TerminalSettingId.WindowsEnableConpty */]: {
                description: (0, nls_1.localize)('terminal.integrated.windowsEnableConpty', "Whether to use ConPTY for Windows terminal process communication (requires Windows 10 build number 18309+). Winpty will be used if this is false."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.wordSeparators" /* TerminalSettingId.WordSeparators */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.wordSeparators', "A string containing all characters to be considered word separators when double-clicking to select word and in the fallback 'word' link detection. Since this is used for link detection, including characters such as `:` that are used when detecting links will cause the line and column part of links like `file:10:5` to be ignored."),
                type: 'string',
                // allow-any-unicode-next-line
                default: ' ()[]{}\',"`─‘’“”|'
            },
            ["terminal.integrated.enableFileLinks" /* TerminalSettingId.EnableFileLinks */]: {
                description: (0, nls_1.localize)('terminal.integrated.enableFileLinks', "Whether to enable file links in terminals. Links can be slow when working on a network drive in particular because each file link is verified against the file system. Changing this will take effect only in new terminals."),
                type: 'string',
                enum: ['off', 'on', 'notRemote'],
                enumDescriptions: [
                    (0, nls_1.localize)('enableFileLinks.off', "Always off."),
                    (0, nls_1.localize)('enableFileLinks.on', "Always on."),
                    (0, nls_1.localize)('enableFileLinks.notRemote', "Enable only when not in a remote workspace.")
                ],
                default: 'on'
            },
            ["terminal.integrated.allowedLinkSchemes" /* TerminalSettingId.AllowedLinkSchemes */]: {
                description: (0, nls_1.localize)('terminal.integrated.allowedLinkSchemes', "An array of strings containing the URI schemes that the terminal is allowed to open links for. By default, only a small subset of possible schemes are allowed for security reasons."),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: [
                    'file',
                    'http',
                    'https',
                    'mailto',
                    'vscode',
                    'vscode-insiders',
                ]
            },
            ["terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */]: {
                type: 'string',
                enum: ['6', '11'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.unicodeVersion.six', "Version 6 of Unicode. This is an older version which should work better on older systems."),
                    (0, nls_1.localize)('terminal.integrated.unicodeVersion.eleven', "Version 11 of Unicode. This version provides better support on modern systems that use modern versions of Unicode.")
                ],
                default: '11',
                description: (0, nls_1.localize)('terminal.integrated.unicodeVersion', "Controls what version of Unicode to use when evaluating the width of characters in the terminal. If you experience emoji or other wide characters not taking up the right amount of space or backspace either deleting too much or too little then you may want to try tweaking this setting.")
            },
            ["terminal.integrated.localEchoLatencyThreshold" /* TerminalSettingId.LocalEchoLatencyThreshold */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoLatencyThreshold', "Length of network delay, in milliseconds, where local edits will be echoed on the terminal without waiting for server acknowledgement. If '0', local echo will always be on, and if '-1' it will be disabled."),
                type: 'integer',
                minimum: -1,
                default: 30,
            },
            ["terminal.integrated.localEchoEnabled" /* TerminalSettingId.LocalEchoEnabled */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.localEchoEnabled', "When local echo should be enabled. This will override {0}", '`#terminal.integrated.localEchoLatencyThreshold#`'),
                type: 'string',
                enum: ['on', 'off', 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.on', "Always enabled"),
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.off', "Always disabled"),
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.auto', "Enabled only for remote workspaces")
                ],
                default: 'auto'
            },
            ["terminal.integrated.localEchoExcludePrograms" /* TerminalSettingId.LocalEchoExcludePrograms */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoExcludePrograms', "Local echo will be disabled when any of these program names are found in the terminal title."),
                type: 'array',
                items: {
                    type: 'string',
                    uniqueItems: true
                },
                default: terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE,
            },
            ["terminal.integrated.localEchoStyle" /* TerminalSettingId.LocalEchoStyle */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoStyle', "Terminal style of locally echoed text; either a font style or an RGB color."),
                default: 'dim',
                anyOf: [
                    {
                        enum: ['bold', 'dim', 'italic', 'underlined', 'inverted', '#ff0000'],
                    },
                    {
                        type: 'string',
                        format: 'color-hex',
                    }
                ]
            },
            ["terminal.integrated.enablePersistentSessions" /* TerminalSettingId.EnablePersistentSessions */]: {
                description: (0, nls_1.localize)('terminal.integrated.enablePersistentSessions', "Persist terminal sessions/history for the workspace across window reloads."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.persistentSessionReviveProcess" /* TerminalSettingId.PersistentSessionReviveProcess */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess', "When the terminal process must be shut down (for example on window or application close), this determines when the previous terminal session contents/history should be restored and processes be recreated when the workspace is next opened.\n\nCaveats:\n\n- Restoring of the process current working directory depends on whether it is supported by the shell.\n- Time to persist the session during shutdown is limited, so it may be aborted when using high-latency remote connections."),
                type: 'string',
                enum: ['onExit', 'onExitAndWindowClose', 'never'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.onExit', "Revive the processes after the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu)."),
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.onExitAndWindowClose', "Revive the processes after the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu), or when the window is closed."),
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.never', "Never restore the terminal buffers or recreate the process.")
                ],
                default: 'onExit'
            },
            ["terminal.integrated.hideOnStartup" /* TerminalSettingId.HideOnStartup */]: {
                description: (0, nls_1.localize)('terminal.integrated.hideOnStartup', "Whether to hide the terminal view on startup, avoiding creating a terminal when there are no persistent sessions."),
                type: 'string',
                enum: ['never', 'whenEmpty', 'always'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('hideOnStartup.never', "Never hide the terminal view on startup."),
                    (0, nls_1.localize)('hideOnStartup.whenEmpty', "Only hide the terminal when there are no persistent sessions restored."),
                    (0, nls_1.localize)('hideOnStartup.always', "Always hide the terminal, even when there are persistent sessions restored.")
                ],
                default: 'never'
            },
            ["terminal.integrated.customGlyphs" /* TerminalSettingId.CustomGlyphs */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.customGlyphs', "Whether to draw custom glyphs for block element and box drawing characters instead of using the font, which typically yields better rendering with continuous lines. Note that this doesn't work when {0} is disabled.", `\`#${"terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */}#\``),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.rescaleOverlappingGlyphs" /* TerminalSettingId.RescaleOverlappingGlyphs */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.rescaleOverlappingGlyphs', "Whether to rescale glyphs horizontally that are a single cell wide but have glyphs that would overlap following cell(s). This typically happens for ambiguous width characters (eg. the roman numeral characters U+2160+) which aren't featured in monospace fonts. Emoji glyphs are never rescaled."),
                type: 'boolean',
                default: product_1.default.quality !== 'stable'
            },
            ["terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.autoReplies', "A set of messages that, when encountered in the terminal, will be automatically responded to. Provided the message is specific enough, this can help automate away common responses.\n\nRemarks:\n\n- Use {0} to automatically respond to the terminate batch job prompt on Windows.\n- The message includes escape sequences so the reply might not happen with styled text.\n- Each reply can only happen once every second.\n- Use {1} in the reply to mean the enter key.\n- To unset a default key, set the value to null.\n- Restart VS Code if new don't apply.", '`"Terminate batch job (Y/N)": "Y\\r"`', '`"\\r"`'),
                type: 'object',
                additionalProperties: {
                    oneOf: [{
                            type: 'string',
                            description: (0, nls_1.localize)('terminal.integrated.autoReplies.reply', "The reply to send to the process.")
                        },
                        { type: 'null' }]
                },
                default: {}
            },
            ["terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.enabled', "Determines whether or not shell integration is auto-injected to support features like enhanced command tracking and current working directory detection. \n\nShell integration works by injecting the shell with a startup script. The script gives VS Code insight into what is happening within the terminal.\n\nSupported shells:\n\n- Linux/macOS: bash, fish, pwsh, zsh\n - Windows: pwsh, git bash\n\nThis setting applies only when terminals are created, so you will need to restart your terminals for it to take effect.\n\n Note that the script injection may not work if you have custom arguments defined in the terminal profile, have enabled {1}, have a [complex bash `PROMPT_COMMAND`](https://code.visualstudio.com/docs/editor/integrated-terminal#_complex-bash-promptcommand), or other unsupported setup. To disable decorations, see {0}", '`#terminal.integrated.shellIntegrations.decorationsEnabled#`', '`#editor.accessibilitySupport#`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled', "When shell integration is enabled, adds a decoration for each command."),
                type: 'string',
                enum: ['both', 'gutter', 'overviewRuler', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.both', "Show decorations in the gutter (left) and overview ruler (right)"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.gutter', "Show gutter decorations to the left of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.overviewRuler', "Show overview ruler decorations to the right of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.never', "Do not show decorations"),
                ],
                default: 'both'
            },
            ["terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.history', "Controls the number of recently used commands to keep in the terminal command history. Set to 0 to disable terminal command history."),
                type: 'number',
                default: 100
            },
            ["terminal.integrated.shellIntegration.suggestEnabled" /* TerminalSettingId.ShellIntegrationSuggestEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.suggestEnabled', "Enables experimental terminal Intellisense suggestions for supported shells when {0} is set to {1}. If shell integration is installed manually, {2} needs to be set to {3} before calling the script.", '`#terminal.integrated.shellIntegration.enabled#`', '`true`', '`VSCODE_SUGGEST`', '`1`'),
                type: 'boolean',
                default: false,
                markdownDeprecationMessage: (0, nls_1.localize)('suggestEnabled.deprecated', 'This is an experimental setting and may break the terminal! Use at your own risk.')
            },
            ["terminal.integrated.smoothScrolling" /* TerminalSettingId.SmoothScrolling */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.smoothScrolling', "Controls whether the terminal will scroll using an animation."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.ignoreBracketedPasteMode" /* TerminalSettingId.IgnoreBracketedPasteMode */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.ignoreBracketedPasteMode', "Controls whether the terminal will ignore bracketed paste mode even if the terminal was put into the mode, omitting the {0} and {1} sequences when pasting. This is useful when the shell is not respecting the mode which can happen in sub-shells for example.", '`\\x1b[200~`', '`\\x1b[201~`'),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableImages" /* TerminalSettingId.EnableImages */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.enableImages', "Enables image support in the terminal, this will only work when {0} is enabled. Both sixel and iTerm's inline image protocol are supported on Linux and macOS, Windows support will light up automatically when ConPTY passes through the sequences. Images will currently not be restored between window reloads/reconnects.", `\`#${"terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */}#\``),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.focusAfterRun', "Controls whether the terminal, accessible buffer, or neither will be focused after `Terminal: Run Selected Text In Active Terminal` has been run."),
                enum: ['terminal', 'accessible-buffer', 'none'],
                default: 'none',
                tags: ['accessibility'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.terminal', "Always focus the terminal."),
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.accessible-buffer', "Always focus the accessible buffer."),
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.none', "Do nothing."),
                ]
            },
            ["terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleViewPreserveCursorPosition', "Preserve the cursor position on reopen of the terminal's accessible view rather than setting it to the bottom of the buffer."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleViewFocusOnCommandExecution', "Focus the terminal accessible view when a command is executed."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.stickyScroll.enabled', "Shows the current command at the top of the terminal."),
                type: 'boolean',
                default: product_1.default.quality !== 'stable'
            },
            ["terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.stickyScroll.maxLineCount', "Defines the maximum number of sticky lines to show. Sticky scroll lines will never exceed 40% of the viewport regardless of this setting."),
                type: 'number',
                default: 5,
                minimum: 1,
                maximum: 10
            },
            ["terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */]: {
                markdownDescription: platform_1.isMacintosh
                    ? (0, nls_1.localize)('terminal.integrated.mouseWheelZoom.mac', "Zoom the font of the terminal when using mouse wheel and holding `Cmd`.")
                    : (0, nls_1.localize)('terminal.integrated.mouseWheelZoom', "Zoom the font of the terminal when using mouse wheel and holding `Ctrl`."),
                type: 'boolean',
                default: false
            },
        }
    };
    function registerTerminalConfiguration() {
        const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration(terminalConfiguration);
    }
    platform_2.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: "terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */,
            migrateFn: (enableBell, accessor) => {
                const configurationKeyValuePairs = [];
                let announcement = accessor('accessibility.signals.terminalBell')?.announcement ?? accessor('accessibility.alert.terminalBell');
                if (announcement !== undefined && typeof announcement !== 'string') {
                    announcement = announcement ? 'auto' : 'off';
                }
                configurationKeyValuePairs.push(['accessibility.signals.terminalBell', { value: { sound: enableBell ? 'on' : 'off', announcement } }]);
                configurationKeyValuePairs.push(["terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */, { value: undefined }]);
                configurationKeyValuePairs.push(["terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */, { value: enableBell }]);
                return configurationKeyValuePairs;
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvckJoRyxzRUFHQztJQTFxQkQsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLEdBQUc7UUFDcEMsYUFBYSxHQUFHLElBQUEsY0FBUSxFQUFDLEtBQUssRUFBRSwwQ0FBMEMsQ0FBQztRQUMzRSxtQkFBbUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsbVBBQW1QLENBQUM7UUFDaFMseUJBQXlCLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0RBQWtELENBQUM7UUFDM0csZUFBZSxHQUFHLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxrREFBa0QsQ0FBQztRQUN2RixpQkFBaUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsa0NBQWtDLENBQUM7UUFDM0UsbUJBQW1CLEdBQUcsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLHNHQUFzRyxFQUFFLFNBQVMsQ0FBQztRQUM5SixrQkFBa0IsR0FBRyxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsa0RBQWtELENBQUM7UUFDN0YsY0FBYyxHQUFHLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxtREFBbUQsQ0FBQztLQUN0RixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHVGQUF1RjtJQUV2RyxJQUFJLGFBQWEsR0FBRyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsOEVBQThFLENBQUMsQ0FBQztJQUM5SCxhQUFhLElBQUksbUJBQW1CLENBQUM7SUFFckMsSUFBSSxtQkFBbUIsR0FBRyxJQUFB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