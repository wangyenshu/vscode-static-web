/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/common/configuration", "vs/base/browser/browser", "vs/workbench/common/contributions", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, platform_1, nls_1, configurationRegistry_1, platform_2, configuration_1, browser_1, contributions_1, windowTitle_1, customEditorLabelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    // Configuration
    (function registerConfiguration() {
        // Migration support
        (0, contributions_1.registerWorkbenchContribution2)(configuration_1.ConfigurationMigrationWorkbenchContribution.ID, configuration_1.ConfigurationMigrationWorkbenchContribution, 4 /* WorkbenchPhase.Eventually */);
        // Dynamic Configuration
        (0, contributions_1.registerWorkbenchContribution2)(configuration_1.DynamicWorkbenchSecurityConfiguration.ID, configuration_1.DynamicWorkbenchSecurityConfiguration, 3 /* WorkbenchPhase.AfterRestored */);
        // Workbench
        registry.registerConfiguration({
            ...configuration_1.workbenchConfigurationNodeBase,
            'properties': {
                'workbench.editor.titleScrollbarSizing': {
                    type: 'string',
                    enum: ['default', 'large'],
                    enumDescriptions: [
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.default', "The default size."),
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.large', "Increases the size, so it can be grabbed more easily with the mouse.")
                    ],
                    description: (0, nls_1.localize)('tabScrollbarHeight', "Controls the height of the scrollbars used for tabs and breadcrumbs in the editor title area."),
                    default: 'default',
                },
                ["workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */]: {
                    'type': 'string',
                    'enum': ["multiple" /* EditorTabsMode.MULTIPLE */, "single" /* EditorTabsMode.SINGLE */, "none" /* EditorTabsMode.NONE */],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.showTabs.multiple', "Each editor is displayed as a tab in the editor title area."),
                        (0, nls_1.localize)('workbench.editor.showTabs.single', "The active editor is displayed as a single large tab in the editor title area."),
                        (0, nls_1.localize)('workbench.editor.showTabs.none', "The editor title area is not displayed."),
                    ],
                    'description': (0, nls_1.localize)('showEditorTabs', "Controls whether opened editors should show as individual tabs, one single large tab or if the title area should not be shown."),
                    'default': 'multiple'
                },
                ["workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */]: {
                    'type': 'string',
                    'enum': ["default" /* EditorActionsLocation.DEFAULT */, "titleBar" /* EditorActionsLocation.TITLEBAR */, "hidden" /* EditorActionsLocation.HIDDEN */],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'workbench.editor.editorActionsLocation.default' }, "Show editor actions in the window title bar when {0} is set to {1}. Otherwise, editor actions are shown in the editor tab bar.", '`#workbench.editor.showTabs#`', '`none`'),
                        (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'workbench.editor.editorActionsLocation.titleBar' }, "Show editor actions in the window title bar. If {0} is set to {1}, editor actions are hidden.", '`#window.customTitleBarVisibility#`', '`never`'),
                        (0, nls_1.localize)('workbench.editor.editorActionsLocation.hidden', "Editor actions are not shown."),
                    ],
                    'markdownDescription': (0, nls_1.localize)('editorActionsLocation', "Controls where the editor actions are shown."),
                    'default': 'default'
                },
                'workbench.editor.wrapTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'wrapTabs' }, "Controls whether tabs should be wrapped over multiple lines when exceeding available space or whether a scrollbar should appear instead. This value is ignored when {0} is not set to '{1}'.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.scrollToSwitchTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'scrollToSwitchTabs' }, "Controls whether scrolling over tabs will open them or not. By default tabs will only reveal upon scrolling, but not open. You can press and hold the Shift-key while scrolling to change this behavior for that duration. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.highlightModifiedTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'highlightModifiedTabs' }, "Controls whether a top border is drawn on tabs for editors that have unsaved changes. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', `multiple`),
                    'default': false
                },
                'workbench.editor.decorations.badges': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.badges', "Controls whether editor file decorations should use badges."),
                    'default': true
                },
                'workbench.editor.decorations.colors': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.colors', "Controls whether editor file decorations should use colors."),
                    'default': true
                },
                [customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED]: {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('workbench.editor.label.enabled', "Controls whether the custom workbench editor labels should be applied."),
                    'default': true,
                },
                [customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS]: {
                    'type': 'object',
                    'markdownDescription': (() => {
                        let customEditorLabelDescription = (0, nls_1.localize)('workbench.editor.label.patterns', "Controls the rendering of the editor label. Each __Item__ is a pattern that matches a file path. Both relative and absolute file paths are supported. In case multiple patterns match, the longest matching path will be picked. Each __Value__ is the template for the rendered editor when the __Item__ matches. Variables are substituted based on the context:");
                        customEditorLabelDescription += '\n- ' + [
                            (0, nls_1.localize)('workbench.editor.label.dirname', "`${dirname}`: name of the folder in which the file is located (e.g. `root/folder/file.txt -> folder`)."),
                            (0, nls_1.localize)('workbench.editor.label.nthdirname', "`${dirname(N)}`: name of the nth parent folder in which the file is located (e.g. `N=1: root/folder/file.txt -> root`). Folders can be picked from the start of the path by using negative numbers (e.g. `N=-1: root/folder/file.txt -> root`). If the __Item__ is an absolute pattern path, the first folder (`N=-1`) refers to the first folder in the absoulte path, otherwise it corresponds to the workspace folder."),
                            (0, nls_1.localize)('workbench.editor.label.filename', "`${filename}`: name of the file without the file extension (e.g. `root/folder/file.txt -> file`)."),
                            (0, nls_1.localize)('workbench.editor.label.extname', "`${extname}`: the file extension (e.g. `root/folder/file.txt -> txt`)."),
                        ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
                        customEditorLabelDescription += '\n\n' + (0, nls_1.localize)('customEditorLabelDescriptionExample', "Example: `\"**/static/**/*.html\": \"${filename} - ${dirname} (${extname})\"` will render a file `root/static/folder/file.html` as `file - folder (html)`.");
                        return customEditorLabelDescription;
                    })(),
                    additionalProperties: {
                        type: 'string',
                        markdownDescription: (0, nls_1.localize)('workbench.editor.label.template', "The template which should be rendered when the pattern mtches. May include the variables ${dirname}, ${filename} and ${extname}."),
                        minLength: 1,
                        pattern: '.*[a-zA-Z0-9].*'
                    },
                    'default': {}
                },
                'workbench.editor.labelFormat': {
                    'type': 'string',
                    'enum': ['default', 'short', 'medium', 'long'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.labelFormat.default', "Show the name of the file. When tabs are enabled and two files have the same name in one group the distinguishing sections of each file's path are added. When tabs are disabled, the path relative to the workspace folder is shown if the editor is active."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.short', "Show the name of the file followed by its directory name."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.medium', "Show the name of the file followed by its path relative to the workspace folder."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.long', "Show the name of the file followed by its absolute path.")
                    ],
                    'default': 'default',
                    'description': (0, nls_1.localize)('tabDescription', "Controls the format of the label for an editor."),
                },
                'workbench.editor.untitled.labelFormat': {
                    'type': 'string',
                    'enum': ['content', 'name'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.content', "The name of the untitled file is derived from the contents of its first line unless it has an associated file path. It will fallback to the name in case the line is empty or contains no word characters."),
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.name', "The name of the untitled file is not derived from the contents of the file."),
                    ],
                    'default': 'content',
                    'description': (0, nls_1.localize)('untitledLabelFormat', "Controls the format of the label for an untitled editor."),
                },
                'workbench.editor.empty.hint': {
                    'type': 'string',
                    'enum': ['text', 'hidden'],
                    'default': 'text',
                    'markdownDescription': (0, nls_1.localize)("workbench.editor.empty.hint", "Controls if the empty editor text hint should be visible in the editor.")
                },
                'workbench.editor.languageDetection': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.languageDetection', "Controls whether the language in a text editor is automatically detected unless the language has been explicitly set by the language picker. This can also be scoped by language so you can specify which languages you do not want to be switched off of. This is useful for languages like Markdown that often contain other languages that might trick language detection into thinking it's the embedded language and not Markdown."),
                    scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.historyBasedLanguageDetection': {
                    type: 'boolean',
                    default: true,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.historyBasedLanguageDetection', "Enables use of editor history in language detection. This causes automatic language detection to favor languages that have been recently opened and allows for automatic language detection to operate with smaller inputs."),
                },
                'workbench.editor.preferHistoryBasedLanguageDetection': {
                    type: 'boolean',
                    default: false,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.preferBasedLanguageDetection', "When enabled, a language detection model that takes into account editor history will be given higher precedence."),
                },
                'workbench.editor.languageDetectionHints': {
                    type: 'object',
                    default: { 'untitledEditors': true, 'notebookEditors': true },
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints', "When enabled, shows a Status bar Quick Fix when the editor language doesn't match detected content language."),
                    additionalProperties: false,
                    properties: {
                        untitledEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.editors', "Show in untitled text editors"),
                        },
                        notebookEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.notebook', "Show in notebook editors"),
                        }
                    }
                },
                'workbench.editor.tabActionLocation': {
                    type: 'string',
                    enum: ['left', 'right'],
                    default: 'right',
                    markdownDescription: (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'tabActionLocation' }, "Controls the position of the editor's tabs action buttons (close, unpin). This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.tabActionCloseVisibility': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.tabActionCloseVisibility', "Controls the visibility of the tab close action button.")
                },
                'workbench.editor.tabActionUnpinVisibility': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.tabActionUnpinVisibility', "Controls the visibility of the tab unpin action button.")
                },
                'workbench.editor.tabSizing': {
                    'type': 'string',
                    'enum': ['fit', 'shrink', 'fixed'],
                    'default': 'fit',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.tabSizing.fit', "Always keep tabs large enough to show the full editor label."),
                        (0, nls_1.localize)('workbench.editor.tabSizing.shrink', "Allow tabs to get smaller when the available space is not enough to show all tabs at once."),
                        (0, nls_1.localize)('workbench.editor.tabSizing.fixed', "Make all tabs the same size, while allowing them to get smaller when the available space is not enough to show all tabs at once.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'tabSizing' }, "Controls the size of editor tabs. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.tabSizingFixedMinWidth': {
                    'type': 'number',
                    'default': 50,
                    'minimum': 38,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabSizingFixedMinWidth' }, "Controls the minimum width of tabs when {0} size is set to {1}.", '`#workbench.editor.tabSizing#`', '`fixed`')
                },
                'workbench.editor.tabSizingFixedMaxWidth': {
                    'type': 'number',
                    'default': 160,
                    'minimum': 38,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabSizingFixedMaxWidth' }, "Controls the maximum width of tabs when {0} size is set to {1}.", '`#workbench.editor.tabSizing#`', '`fixed`')
                },
                'window.density.editorTabHeight': {
                    'type': 'string',
                    'enum': ['default', 'compact'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.tabHeight' }, "Controls the height of editor tabs. Also applies to the title control bar when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.pinnedTabSizing': {
                    'type': 'string',
                    'enum': ['normal', 'compact', 'shrink'],
                    'default': 'normal',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.normal', "A pinned tab inherits the look of non pinned tabs."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.compact', "A pinned tab will show in a compact form with only icon or first letter of the editor name."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.shrink', "A pinned tab shrinks to a compact fixed size showing parts of the editor name.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'pinnedTabSizing' }, "Controls the size of pinned editor tabs. Pinned tabs are sorted to the beginning of all opened tabs and typically do not close until unpinned. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`')
                },
                'workbench.editor.pinnedTabsOnSeparateRow': {
                    'type': 'boolean',
                    'default': false,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'workbench.editor.pinnedTabsOnSeparateRow' }, "When enabled, displays pinned tabs in a separate row above all other tabs. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                },
                'workbench.editor.preventPinnedEditorClose': {
                    'type': 'string',
                    'enum': ['keyboardAndMouse', 'keyboard', 'mouse', 'never'],
                    'default': 'keyboardAndMouse',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.always', "Always prevent closing the pinned editor when using mouse middle click or keyboard."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.onlyKeyboard', "Prevent closing the pinned editor when using the keyboard."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.onlyMouse', "Prevent closing the pinned editor when using mouse middle click."),
                        (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose.never', "Never prevent closing a pinned editor.")
                    ],
                    description: (0, nls_1.localize)('workbench.editor.preventPinnedEditorClose', "Controls whether pinned editors should close when keyboard or middle mouse click is used for closing."),
                },
                'workbench.editor.splitSizing': {
                    'type': 'string',
                    'enum': ['auto', 'distribute', 'split'],
                    'default': 'auto',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitSizingAuto', "Splits the active editor group to equal parts, unless all editor groups are already in equal parts. In that case, splits all the editor groups to equal parts."),
                        (0, nls_1.localize)('workbench.editor.splitSizingDistribute', "Splits all the editor groups to equal parts."),
                        (0, nls_1.localize)('workbench.editor.splitSizingSplit', "Splits the active editor group to equal parts.")
                    ],
                    'description': (0, nls_1.localize)('splitSizing', "Controls the size of editor groups when splitting them.")
                },
                'workbench.editor.splitOnDragAndDrop': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('splitOnDragAndDrop', "Controls if editor groups can be split from drag and drop operations by dropping an editor or file on the edges of the editor area.")
                },
                'workbench.editor.dragToOpenWindow': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('dragToOpenWindow', "Controls if editors can be dragged out of the window to open them in a new window. Press and hold the `Alt` key while dragging to toggle this dynamically.")
                },
                'workbench.editor.focusRecentEditorAfterClose': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('focusRecentEditorAfterClose', "Controls whether editors are closed in most recently used order or from left to right."),
                    'default': true
                },
                'workbench.editor.showIcons': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('showIcons', "Controls whether opened editors should show with an icon or not. This requires a file icon theme to be enabled as well."),
                    'default': true
                },
                'workbench.editor.enablePreview': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('enablePreview', "Controls whether opened editors show as preview editors. Preview editors do not stay open, are reused until explicitly set to be kept open (via double-click or editing), and show file names in italics."),
                    'default': true
                },
                'workbench.editor.enablePreviewFromQuickOpen': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'enablePreviewFromQuickOpen' }, "Controls whether editors opened from Quick Open show as preview editors. Preview editors do not stay open, and are reused until explicitly set to be kept open (via double-click or editing). When enabled, hold Ctrl before selection to open an editor as a non-preview. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.enablePreviewFromCodeNavigation': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'enablePreviewFromCodeNavigation' }, "Controls whether editors remain in preview when a code navigation is started from them. Preview editors do not stay open, and are reused until explicitly set to be kept open (via double-click or editing). This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'default': false
                },
                'workbench.editor.closeOnFileDelete': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFileDelete', "Controls whether editors showing a file that was opened during the session should close automatically when getting deleted or renamed by some other process. Disabling this will keep the editor open  on such an event. Note that deleting from within the application will always close the editor and that editors with unsaved changes will never close to preserve your data."),
                    'default': false
                },
                'workbench.editor.openPositioning': {
                    'type': 'string',
                    'enum': ['left', 'right', 'first', 'last'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1}, {2}, {3} will be a setting name rendered as a link'], key: 'editorOpenPositioning' }, "Controls where editors open. Select {0} or {1} to open editors to the left or right of the currently active one. Select {2} or {3} to open editors independently from the currently active one.", '`left`', '`right`', '`first`', '`last`')
                },
                'workbench.editor.openSideBySideDirection': {
                    'type': 'string',
                    'enum': ['right', 'down'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)('sideBySideDirection', "Controls the default direction of editors that are opened side by side (for example, from the Explorer). By default, editors will open on the right hand side of the currently active one. If changed to `down`, the editors will open below the currently active one.")
                },
                'workbench.editor.closeEmptyGroups': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeEmptyGroups', "Controls the behavior of empty editor groups when the last tab in the group is closed. When enabled, empty groups will automatically close. When disabled, empty groups will remain part of the grid."),
                    'default': true
                },
                'workbench.editor.revealIfOpen': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('revealIfOpen', "Controls whether an editor is revealed in any of the visible groups if opened. If disabled, an editor will prefer to open in the currently active editor group. If enabled, an already opened editor will be revealed instead of opened again in the currently active editor group. Note that there are some cases where this setting is ignored, such as when forcing an editor to open in a specific group or to the side of the currently active group."),
                    'default': false
                },
                'workbench.editor.mouseBackForwardToNavigate': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('mouseBackForwardToNavigate', "Enables the use of mouse buttons four and five for commands 'Go Back' and 'Go Forward'."),
                    'default': true
                },
                'workbench.editor.navigationScope': {
                    'type': 'string',
                    'enum': ['default', 'editorGroup', 'editor'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)('navigationScope', "Controls the scope of history navigation in editors for commands such as 'Go Back' and 'Go Forward'."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.navigationScopeDefault', "Navigate across all opened editors and editor groups."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditorGroup', "Navigate only in editors of the active editor group."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditor', "Navigate only in the active editor.")
                    ],
                },
                'workbench.editor.restoreViewState': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('restoreViewState', "Restores the last editor view state (such as scroll position) when re-opening editors after they have been closed. Editor view state is stored per editor group and discarded when a group closes. Use the {0} setting to use the last known view state across all editor groups in case no previous view state was found for a editor group.", '`#workbench.editor.sharedViewState#`'),
                    'default': true,
                    'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.sharedViewState': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('sharedViewState', "Preserves the most recent editor view state (such as scroll position) across all editor groups and restores that if no specific editor view state is found for the editor group."),
                    'default': false
                },
                'workbench.editor.splitInGroupLayout': {
                    'type': 'string',
                    'enum': ['vertical', 'horizontal'],
                    'default': 'horizontal',
                    'markdownDescription': (0, nls_1.localize)('splitInGroupLayout', "Controls the layout for when an editor is split in an editor group to be either vertical or horizontal."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutVertical', "Editors are positioned from top to bottom."),
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutHorizontal', "Editors are positioned from left to right.")
                    ]
                },
                'workbench.editor.centeredLayoutAutoResize': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('centeredLayoutAutoResize', "Controls if the centered layout should automatically resize to maximum width when more than one group is open. Once only one group is open it will resize back to the original centered width.")
                },
                'workbench.editor.centeredLayoutFixedWidth': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('centeredLayoutDynamicWidth', "Controls whether the centered layout tries to maintain constant width when the window is resized.")
                },
                'workbench.editor.doubleClickTabToToggleEditorGroupSizes': {
                    'type': 'string',
                    'enum': ['maximize', 'expand', 'off'],
                    'default': 'expand',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'doubleClickTabToToggleEditorGroupSizes' }, "Controls how the editor group is resized when double clicking on a tab. This value is ignored when {0} is not set to {1}.", '`#workbench.editor.showTabs#`', '`multiple`'),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.maximize', "All other editor groups are hidden and the current editor group is maximized to take up the entire editor area."),
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.expand', "The editor group takes as much space as possible by making all other editor groups as small as possible."),
                        (0, nls_1.localize)('workbench.editor.doubleClickTabToToggleEditorGroupSizes.off', "No editor group is resized when double clicking on a tab.")
                    ]
                },
                'workbench.editor.limit.enabled': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsEnablement', "Controls if the number of opened editors should be limited or not. When enabled, less recently used editors will close to make space for newly opening editors.")
                },
                'workbench.editor.limit.value': {
                    'type': 'number',
                    'default': 10,
                    'exclusiveMinimum': 0,
                    'markdownDescription': (0, nls_1.localize)('limitEditorsMaximum', "Controls the maximum number of opened editors. Use the {0} setting to control this limit per editor group or across all groups.", '`#workbench.editor.limit.perEditorGroup#`')
                },
                'workbench.editor.limit.excludeDirty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsExcludeDirty', "Controls if the maximum number of opened editors should exclude dirty editors for counting towards the configured limit.")
                },
                'workbench.editor.limit.perEditorGroup': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('perEditorGroup', "Controls if the limit of maximum opened editors should apply per editor group or across all editor groups.")
                },
                'workbench.localHistory.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('localHistoryEnabled', "Controls whether local file history is enabled. When enabled, the file contents of an editor that is saved will be stored to a backup location to be able to restore or review the contents later. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileSize': {
                    'type': 'number',
                    'default': 256,
                    'minimum': 1,
                    'description': (0, nls_1.localize)('localHistoryMaxFileSize', "Controls the maximum size of a file (in KB) to be considered for local file history. Files that are larger will not be added to the local file history. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileEntries': {
                    'type': 'number',
                    'default': 50,
                    'minimum': 0,
                    'description': (0, nls_1.localize)('localHistoryMaxFileEntries', "Controls the maximum number of local file history entries per file. When the number of local file history entries exceeds this number for a file, the oldest entries will be discarded."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.exclude': {
                    'type': 'object',
                    'patternProperties': {
                        '.*': { 'type': 'boolean' }
                    },
                    'markdownDescription': (0, nls_1.localize)('exclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) for excluding files from the local file history. Glob patterns are always evaluated relative to the path of the workspace folder unless they are absolute paths. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.mergeWindow': {
                    'type': 'number',
                    'default': 10,
                    'minimum': 1,
                    'markdownDescription': (0, nls_1.localize)('mergeWindow', "Configure an interval in seconds during which the last entry in local file history is replaced with the entry that is being added. This helps reduce the overall number of entries that are added, for example when auto save is enabled. This setting is only applied to entries that have the same source of origin. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.commandPalette.history': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('commandHistory', "Controls the number of recently used commands to keep in history for the command palette. Set to 0 to disable command history."),
                    'default': 50,
                    'minimum': 0
                },
                'workbench.commandPalette.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('preserveInput', "Controls whether the last typed input to the command palette should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.commandPalette.experimental.suggestCommands': {
                    'type': 'boolean',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('suggestCommands', "Controls whether the command palette should have a list of commonly used commands."),
                    'default': false
                },
                'workbench.commandPalette.experimental.askChatLocation': {
                    'type': 'string',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('askChatLocation', "Controls where the command palette should ask chat questions."),
                    'default': 'chatView',
                    enum: ['chatView', 'quickChat'],
                    enumDescriptions: [
                        (0, nls_1.localize)('askChatLocation.chatView', "Ask chat questions in the Chat view."),
                        (0, nls_1.localize)('askChatLocation.quickChat', "Ask chat questions in Quick Chat.")
                    ]
                },
                'workbench.commandPalette.experimental.enableNaturalLanguageSearch': {
                    'type': 'boolean',
                    tags: ['experimental'],
                    'description': (0, nls_1.localize)('enableNaturalLanguageSearch', "Controls whether the command palette should include similar commands. You must have an extension installed that provides Natural Language support."),
                    'default': true
                },
                'workbench.quickOpen.closeOnFocusLost': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFocusLost', "Controls whether Quick Open should close automatically once it loses focus."),
                    'default': true
                },
                'workbench.quickOpen.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('workbench.quickOpen.preserveInput', "Controls whether the last typed input to Quick Open should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.settings.openDefaultSettings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultSettings', "Controls whether opening settings also opens an editor showing all default settings."),
                    'default': false
                },
                'workbench.settings.useSplitJSON': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('useSplitJSON', "Controls whether to use the split JSON editor when editing settings as JSON."),
                    'default': false
                },
                'workbench.settings.openDefaultKeybindings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultKeybindings', "Controls whether opening keybinding settings also opens an editor showing all default keybindings."),
                    'default': false
                },
                'workbench.sideBar.location': {
                    'type': 'string',
                    'enum': ['left', 'right'],
                    'default': 'left',
                    'description': (0, nls_1.localize)('sideBarLocation', "Controls the location of the primary side bar and activity bar. They can either show on the left or right of the workbench. The secondary side bar will show on the opposite side of the workbench.")
                },
                'workbench.panel.defaultLocation': {
                    'type': 'string',
                    'enum': ['left', 'bottom', 'right'],
                    'default': 'bottom',
                    'description': (0, nls_1.localize)('panelDefaultLocation', "Controls the default location of the panel (Terminal, Debug Console, Output, Problems) in a new workspace. It can either show at the bottom, right, or left of the editor area."),
                },
                'workbench.panel.opensMaximized': {
                    'type': 'string',
                    'enum': ['always', 'never', 'preserve'],
                    'default': 'preserve',
                    'description': (0, nls_1.localize)('panelOpensMaximized', "Controls whether the panel opens maximized. It can either always open maximized, never open maximized, or open to the last state it was in before being closed."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.panel.opensMaximized.always', "Always maximize the panel when opening it."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.never', "Never maximize the panel when opening it. The panel will open un-maximized."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.preserve', "Open the panel to the state that it was in, before it was closed.")
                    ]
                },
                'workbench.statusBar.visible': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('statusBarVisibility', "Controls the visibility of the status bar at the bottom of the workbench.")
                },
                ["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */]: {
                    'type': 'string',
                    'enum': ['default', 'top', 'bottom', 'hidden'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting'], key: 'activityBarLocation' }, "Controls the location of the Activity Bar relative to the Primary and Secondary Side Bars."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.activityBar.location.default', "Show the Activity Bar on the side of the Primary Side Bar and on top of the Secondary Side Bar."),
                        (0, nls_1.localize)('workbench.activityBar.location.top', "Show the Activity Bar on top of the Primary and Secondary Side Bars."),
                        (0, nls_1.localize)('workbench.activityBar.location.bottom', "Show the Activity Bar at the bottom of the Primary and Secondary Side Bars."),
                        (0, nls_1.localize)('workbench.activityBar.location.hide', "Hide the Activity Bar in the Primary and Secondary Side Bars.")
                    ],
                },
                'workbench.activityBar.iconClickBehavior': {
                    'type': 'string',
                    'enum': ['toggle', 'focus'],
                    'default': 'toggle',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0}, {1} will be a setting name rendered as a link'], key: 'activityBarIconClickBehavior' }, "Controls the behavior of clicking an Activity Bar icon in the workbench. This value is ignored when {0} is not set to {1}.", '`#workbench.activityBar.location#`', '`default`'),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.toggle', "Hide the Primary Side Bar if the clicked item is already visible."),
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.focus', "Focus the Primary Side Bar if the clicked item is already visible.")
                    ]
                },
                'workbench.view.alwaysShowHeaderActions': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('viewVisibility', "Controls the visibility of view header actions. View header actions may either be always visible, or only visible when that view is focused or hovered over.")
                },
                'workbench.fontAliasing': {
                    'type': 'string',
                    'enum': ['default', 'antialiased', 'none', 'auto'],
                    'default': 'default',
                    'description': (0, nls_1.localize)('fontAliasing', "Controls font aliasing method in the workbench."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.fontAliasing.default', "Sub-pixel font smoothing. On most non-retina displays this will give the sharpest text."),
                        (0, nls_1.localize)('workbench.fontAliasing.antialiased', "Smooth the font on the level of the pixel, as opposed to the subpixel. Can make the font appear lighter overall."),
                        (0, nls_1.localize)('workbench.fontAliasing.none', "Disables font smoothing. Text will show with jagged sharp edges."),
                        (0, nls_1.localize)('workbench.fontAliasing.auto', "Applies `default` or `antialiased` automatically based on the DPI of displays.")
                    ],
                    'included': platform_2.isMacintosh
                },
                'workbench.settings.editor': {
                    'type': 'string',
                    'enum': ['ui', 'json'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('settings.editor.ui', "Use the settings UI editor."),
                        (0, nls_1.localize)('settings.editor.json', "Use the JSON file editor."),
                    ],
                    'description': (0, nls_1.localize)('settings.editor.desc', "Determines which settings editor to use by default."),
                    'default': 'ui',
                    'scope': 3 /* ConfigurationScope.WINDOW */
                },
                'workbench.hover.delay': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('workbench.hover.delay', "Controls the delay in milliseconds after which the hover is shown for workbench items (ex. some extension provided tree view items). Already visible items may require a refresh before reflecting this setting change."),
                    // Testing has indicated that on Windows and Linux 500 ms matches the native hovers most closely.
                    // On Mac, the delay is 1500.
                    'default': platform_2.isMacintosh ? 1500 : 500,
                    'minimum': 0
                },
                'workbench.reduceMotion': {
                    type: 'string',
                    description: (0, nls_1.localize)('workbench.reduceMotion', "Controls whether the workbench should render with fewer animations."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.reduceMotion.on', "Always render with reduced motion."),
                        (0, nls_1.localize)('workbench.reduceMotion.off', "Do not render with reduced motion"),
                        (0, nls_1.localize)('workbench.reduceMotion.auto', "Render with reduced motion based on OS configuration."),
                    ],
                    default: 'auto',
                    tags: ['accessibility'],
                    enum: ['on', 'off', 'auto']
                },
                ["workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */]: {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': platform_2.isWeb ?
                        (0, nls_1.localize)('layoutControlEnabledWeb', "Controls whether the layout control in the title bar is shown.") :
                        (0, nls_1.localize)({ key: 'layoutControlEnabled', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Controls whether the layout control is shown in the custom title bar. This setting only has an effect when {0} is not set to {1}.", '`#window.customTitleBarVisibility#`', '`never`')
                },
                'workbench.layoutControl.type': {
                    'type': 'string',
                    'enum': ['menu', 'toggles', 'both'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('layoutcontrol.type.menu', "Shows a single button with a dropdown of layout options."),
                        (0, nls_1.localize)('layoutcontrol.type.toggles', "Shows several buttons for toggling the visibility of the panels and side bar."),
                        (0, nls_1.localize)('layoutcontrol.type.both', "Shows both the dropdown and toggle buttons."),
                    ],
                    'default': 'both',
                    'description': (0, nls_1.localize)('layoutControlType', "Controls whether the layout control in the custom title bar is displayed as a single menu button or with multiple UI toggles."),
                },
                'workbench.tips.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('tips.enabled', "When enabled, will show the watermark tips when no editor is open.")
                },
            }
        });
        // Window
        let windowTitleDescription = (0, nls_1.localize)('windowTitle', "Controls the window title based on the current context such as the opened workspace or active editor. Variables are substituted based on the context:");
        windowTitleDescription += '\n- ' + [
            (0, nls_1.localize)('activeEditorShort', "`${activeEditorShort}`: the file name (e.g. myFile.txt)."),
            (0, nls_1.localize)('activeEditorMedium', "`${activeEditorMedium}`: the path of the file relative to the workspace folder (e.g. myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeEditorLong', "`${activeEditorLong}`: the full path of the file (e.g. /Users/Development/myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeFolderShort', "`${activeFolderShort}`: the name of the folder the file is contained in (e.g. myFileFolder)."),
            (0, nls_1.localize)('activeFolderMedium', "`${activeFolderMedium}`: the path of the folder the file is contained in, relative to the workspace folder (e.g. myFolder/myFileFolder)."),
            (0, nls_1.localize)('activeFolderLong', "`${activeFolderLong}`: the full path of the folder the file is contained in (e.g. /Users/Development/myFolder/myFileFolder)."),
            (0, nls_1.localize)('folderName', "`${folderName}`: name of the workspace folder the file is contained in (e.g. myFolder)."),
            (0, nls_1.localize)('folderPath', "`${folderPath}`: file path of the workspace folder the file is contained in (e.g. /Users/Development/myFolder)."),
            (0, nls_1.localize)('rootName', "`${rootName}`: name of the workspace with optional remote name and workspace indicator if applicable (e.g. myFolder, myRemoteFolder [SSH] or myWorkspace (Workspace))."),
            (0, nls_1.localize)('rootNameShort', "`${rootNameShort}`: shortened name of the workspace without suffixes (e.g. myFolder, myRemoteFolder or myWorkspace)."),
            (0, nls_1.localize)('rootPath', "`${rootPath}`: file path of the opened workspace or folder (e.g. /Users/Development/myWorkspace)."),
            (0, nls_1.localize)('profileName', "`${profileName}`: name of the profile in which the workspace is opened (e.g. Data Science (Profile)). Ignored if default profile is used."),
            (0, nls_1.localize)('appName', "`${appName}`: e.g. VS Code."),
            (0, nls_1.localize)('remoteName', "`${remoteName}`: e.g. SSH"),
            (0, nls_1.localize)('dirty', "`${dirty}`: an indicator for when the active editor has unsaved changes."),
            (0, nls_1.localize)('focusedView', "`${focusedView}`: the name of the view that is currently focused."),
            (0, nls_1.localize)('activeRepositoryName', "`${activeRepositoryName}`: the name of the active repository (e.g. vscode)."),
            (0, nls_1.localize)('activeRepositoryBranchName', "`${activeRepositoryBranchName}`: the name of the active branch in the active repository (e.g. main)."),
            (0, nls_1.localize)('separator', "`${separator}`: a conditional separator (\" - \") that only shows when surrounded by variables with values or static text.")
        ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.title': {
                    'type': 'string',
                    'default': windowTitle_1.defaultWindowTitle,
                    'markdownDescription': windowTitleDescription
                },
                'window.titleSeparator': {
                    'type': 'string',
                    'default': windowTitle_1.defaultWindowTitleSeparator,
                    'markdownDescription': (0, nls_1.localize)("window.titleSeparator", "Separator used by {0}.", '`#window.title#`')
                },
                ["window.commandCenter" /* LayoutSettings.COMMAND_CENTER */]: {
                    type: 'boolean',
                    default: true,
                    markdownDescription: platform_2.isWeb ?
                        (0, nls_1.localize)('window.commandCenterWeb', "Show command launcher together with the window title.") :
                        (0, nls_1.localize)({ key: 'window.commandCenter', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Show command launcher together with the window title. This setting only has an effect when {0} is not set to {1}.", '`#window.customTitleBarVisibility#`', '`never`')
                },
                'window.menuBarVisibility': {
                    'type': 'string',
                    'enum': ['classic', 'visible', 'toggle', 'hidden', 'compact'],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)('window.menuBarVisibility.classic', "Menu is displayed at the top of the window and only hidden in full screen mode."),
                        (0, nls_1.localize)('window.menuBarVisibility.visible', "Menu is always visible at the top of the window even in full screen mode."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.menuBarVisibility.toggle.mac', "Menu is hidden but can be displayed at the top of the window by executing the `Focus Application Menu` command.") :
                            (0, nls_1.localize)('window.menuBarVisibility.toggle', "Menu is hidden but can be displayed at the top of the window via the Alt key."),
                        (0, nls_1.localize)('window.menuBarVisibility.hidden', "Menu is always hidden."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.menuBarVisibility.compact.web', "Menu is displayed as a compact button in the side bar.") :
                            (0, nls_1.localize)({ key: 'window.menuBarVisibility.compact', comment: ['{0}, {1} is a placeholder for a setting identifier.'] }, "Menu is displayed as a compact button in the side bar. This value is ignored when {0} is {1}.", '`#window.titleBarStyle#`', '`native`')
                    ],
                    'default': platform_2.isWeb ? 'compact' : 'classic',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('menuBarVisibility.mac', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and executing `Focus Application Menu` will show it. A setting of 'compact' will move the menu into the side bar.") :
                        (0, nls_1.localize)('menuBarVisibility', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and a single press of the Alt key will show it. A setting of 'compact' will move the menu into the side bar."),
                    'included': platform_2.isWindows || platform_2.isLinux || platform_2.isWeb
                },
                'window.enableMenuBarMnemonics': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('enableMenuBarMnemonics', "Controls whether the main menus can be opened via Alt-key shortcuts. Disabling mnemonics allows to bind these Alt-key shortcuts to editor commands instead."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.customMenuBarAltFocus': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('customMenuBarAltFocus', "Controls whether the menu bar will be focused by pressing the Alt-key. This setting has no effect on toggling the menu bar with the Alt-key."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.openFilesInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFilesInNewWindow.on', "Files will open in a new window."),
                        (0, nls_1.localize)('window.openFilesInNewWindow.off', "Files will open in the window with the files' folder open or the last active window."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.openFilesInNewWindow.defaultMac', "Files will open in the window with the files' folder open or the last active window unless opened via the Dock or from Finder.") :
                            (0, nls_1.localize)('window.openFilesInNewWindow.default', "Files will open in a new window unless picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'off',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('openFilesInNewWindowMac', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).") :
                        (0, nls_1.localize)('openFilesInNewWindow', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openFoldersInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFoldersInNewWindow.on', "Folders will open in a new window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.off', "Folders will replace the last active window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.default', "Folders will open in a new window unless a folder is picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openFoldersInNewWindow', "Controls whether folders should open in a new window or replace the last active window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.confirmBeforeClose': {
                    'type': 'string',
                    'enum': ['always', 'keyboardOnly', 'never'],
                    'enumDescriptions': [
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.always.web', "Always try to ask for confirmation. Note that browsers may still decide to close a tab or window without confirmation.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.always', "Always ask for confirmation."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly.web', "Only ask for confirmation if a keybinding was used to close the window. Note that detection may not be possible in some cases.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly', "Only ask for confirmation if a keybinding was used."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.never.web', "Never explicitly ask for confirmation unless data loss is imminent.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.never', "Never explicitly ask for confirmation.")
                    ],
                    'default': (platform_2.isWeb && !(0, browser_1.isStandalone)()) ? 'keyboardOnly' : 'never', // on by default in web, unless PWA, never on desktop
                    'markdownDescription': platform_2.isWeb ?
                        (0, nls_1.localize)('confirmBeforeCloseWeb', "Controls whether to show a confirmation dialog before closing the browser tab or window. Note that even if enabled, browsers may still decide to close a tab or window without confirmation and that this setting is only a hint that may not work in all cases.") :
                        (0, nls_1.localize)('confirmBeforeClose', "Controls whether to show a confirmation dialog before closing a window or quitting the application."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */
                }
            }
        });
        // Problems
        registry.registerConfiguration({
            ...configuration_1.problemsConfigurationNodeBase,
            'properties': {
                'problems.visibility': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('problems.visibility', "Controls whether the problems are visible throughout the editor and workbench."),
                },
            }
        });
        // Zen Mode
        registry.registerConfiguration({
            'id': 'zenMode',
            'order': 9,
            'title': (0, nls_1.localize)('zenModeConfigurationTitle', "Zen Mode"),
            'type': 'object',
            'properties': {
                'zenMode.fullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.fullScreen', "Controls whether turning on Zen Mode also puts the workbench into full screen mode.")
                },
                'zenMode.centerLayout': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.centerLayout', "Controls whether turning on Zen Mode also centers the layout.")
                },
                'zenMode.showTabs': {
                    'type': 'string',
                    'enum': ['multiple', 'single', 'none'],
                    'description': (0, nls_1.localize)('zenMode.showTabs', "Controls whether turning on Zen Mode should show multiple editor tabs, a single editor tab, or hide the editor title area completely."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('zenMode.showTabs.multiple', "Each editor is displayed as a tab in the editor title area."),
                        (0, nls_1.localize)('zenMode.showTabs.single', "The active editor is displayed as a single large tab in the editor title area."),
                        (0, nls_1.localize)('zenMode.showTabs.none', "The editor title area is not displayed."),
                    ],
                    'default': 'multiple'
                },
                'zenMode.hideStatusBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideStatusBar', "Controls whether turning on Zen Mode also hides the status bar at the bottom of the workbench.")
                },
                'zenMode.hideActivityBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideActivityBar', "Controls whether turning on Zen Mode also hides the activity bar either at the left or right of the workbench.")
                },
                'zenMode.hideLineNumbers': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideLineNumbers', "Controls whether turning on Zen Mode also hides the editor line numbers.")
                },
                'zenMode.restore': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.restore', "Controls whether a window should restore to Zen Mode if it was exited in Zen Mode.")
                },
                'zenMode.silentNotifications': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.silentNotifications', "Controls whether notifications do not disturb mode should be enabled while in Zen Mode. If true, only error notifications will pop out.")
                }
            }
        });
    })();
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.activityBar.visible', migrateFn: (value) => {
                const result = [];
                if (value !== undefined) {
                    result.push(['workbench.activityBar.visible', { value: undefined }]);
                }
                if (value === false) {
                    result.push(["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, { value: "hidden" /* ActivityBarPosition.HIDDEN */ }]);
                }
                return result;
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: "workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, migrateFn: (value) => {
                const results = [];
                if (value === 'side') {
                    results.push(["workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, { value: "default" /* ActivityBarPosition.DEFAULT */ }]);
                }
                return results;
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.editor.doubleClickTabToToggleEditorGroupSizes', migrateFn: (value) => {
                const results = [];
                if (typeof value === 'boolean') {
                    value = value ? 'expand' : 'off';
                    results.push(['workbench.editor.doubleClickTabToToggleEditorGroupSizes', { value }]);
                }
                return results;
            }
        }, {
            key: "workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, migrateFn: (value) => {
                const results = [];
                if (typeof value === 'boolean') {
                    value = value ? "multiple" /* EditorTabsMode.MULTIPLE */ : "single" /* EditorTabsMode.SINGLE */;
                    results.push(["workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, { value }]);
                }
                return results;
            }
        }, {
            key: 'workbench.editor.tabCloseButton', migrateFn: (value) => {
                const result = [];
                if (value === 'left' || value === 'right') {
                    result.push(['workbench.editor.tabActionLocation', { value }]);
                }
                else if (value === 'off') {
                    result.push(['workbench.editor.tabActionCloseVisibility', { value: false }]);
                }
                return result;
            }
        }, {
            key: 'zenMode.hideTabs', migrateFn: (value) => {
                const result = [['zenMode.hideTabs', { value: undefined }]];
                if (value === true) {
                    result.push(['zenMode.showTabs', { value: 'single' }]);
                }
                return result;
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3dvcmtiZW5jaC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsTUFBTSxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTVGLGdCQUFnQjtJQUNoQixDQUFDLFNBQVMscUJBQXFCO1FBRTlCLG9CQUFvQjtRQUNwQixJQUFBLDhDQUE4QixFQUFDLDJEQUEyQyxDQUFDLEVBQUUsRUFBRSwyREFBMkMsb0NBQTRCLENBQUM7UUFFdkosd0JBQXdCO1FBQ3hCLElBQUEsOENBQThCLEVBQUMscURBQXFDLENBQUMsRUFBRSxFQUFFLHFEQUFxQyx1Q0FBK0IsQ0FBQztRQUU5SSxZQUFZO1FBQ1osUUFBUSxDQUFDLHFCQUFxQixDQUFDO1lBQzlCLEdBQUcsOENBQThCO1lBQ2pDLFlBQVksRUFBRTtnQkFDYix1Q0FBdUMsRUFBRTtvQkFDeEMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztvQkFDMUIsZ0JBQWdCLEVBQUU7d0JBQ2pCLElBQUEsY0FBUSxFQUFDLCtDQUErQyxFQUFFLG1CQUFtQixDQUFDO3dCQUM5RSxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSxzRUFBc0UsQ0FBQztxQkFDL0g7b0JBQ0QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLCtGQUErRixDQUFDO29CQUM1SSxPQUFPLEVBQUUsU0FBUztpQkFDbEI7Z0JBQ0QsbUVBQWlDLEVBQUU7b0JBQ2xDLE1BQU0sRUFBRSxRQUFRO29CQUNoQixNQUFNLEVBQUUsa0hB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