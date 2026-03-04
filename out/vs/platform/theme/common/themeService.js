/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/theme"], function (require, exports, codicons_1, event_1, lifecycle_1, instantiation_1, platform, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Themable = exports.Extensions = exports.FolderThemeIcon = exports.FileThemeIcon = exports.IThemeService = void 0;
    exports.themeColorFromId = themeColorFromId;
    exports.getThemeTypeSelector = getThemeTypeSelector;
    exports.registerThemingParticipant = registerThemingParticipant;
    exports.IThemeService = (0, instantiation_1.createDecorator)('themeService');
    function themeColorFromId(id) {
        return { id };
    }
    exports.FileThemeIcon = codicons_1.Codicon.file;
    exports.FolderThemeIcon = codicons_1.Codicon.folder;
    function getThemeTypeSelector(type) {
        switch (type) {
            case theme_1.ColorScheme.DARK: return 'vs-dark';
            case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return 'hc-black';
            case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return 'hc-light';
            default: return 'vs';
        }
    }
    // static theming participant
    exports.Extensions = {
        ThemingContribution: 'base.contributions.theming'
    };
    class ThemingRegistry {
        constructor() {
            this.themingParticipants = [];
            this.themingParticipants = [];
            this.onThemingParticipantAddedEmitter = new event_1.Emitter();
        }
        onColorThemeChange(participant) {
            this.themingParticipants.push(participant);
            this.onThemingParticipantAddedEmitter.fire(participant);
            return (0, lifecycle_1.toDisposable)(() => {
                const idx = this.themingParticipants.indexOf(participant);
                this.themingParticipants.splice(idx, 1);
            });
        }
        get onThemingParticipantAdded() {
            return this.onThemingParticipantAddedEmitter.event;
        }
        getThemingParticipants() {
            return this.themingParticipants;
        }
    }
    const themingRegistry = new ThemingRegistry();
    platform.Registry.add(exports.Extensions.ThemingContribution, themingRegistry);
    function registerThemingParticipant(participant) {
        return themingRegistry.onColorThemeChange(participant);
    }
    /**
     * Utility base class for all themable components.
     */
    class Themable extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
            this.theme = themeService.getColorTheme();
            // Hook up to theme changes
            this._register(this.themeService.onDidColorThemeChange(theme => this.onThemeChange(theme)));
        }
        onThemeChange(theme) {
            this.theme = theme;
            this.updateStyles();
        }
        updateStyles() {
            // Subclasses to override
        }
        getColor(id, modify) {
            let color = this.theme.getColor(id);
            if (color && modify) {
                color = modify(color, this.theme);
            }
            return color ? color.toString() : null;
        }
    }
    exports.Themable = Themable;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvY29tbW9uL3RoZW1lU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsNENBRUM7SUFLRCxvREFPQztJQXNJRCxnRUFFQztJQXhKWSxRQUFBLGFBQWEsR0FBRyxJQUFBLCtCQUFlLEVBQWdCLGNBQWMsQ0FBQyxDQUFDO0lBRTVFLFNBQWdCLGdCQUFnQixDQUFDLEVBQW1CO1FBQ25ELE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUNmLENBQUM7SUFFWSxRQUFBLGFBQWEsR0FBRyxrQkFBTyxDQUFDLElBQUksQ0FBQztJQUM3QixRQUFBLGVBQWUsR0FBRyxrQkFBTyxDQUFDLE1BQU0sQ0FBQztJQUU5QyxTQUFnQixvQkFBb0IsQ0FBQyxJQUFpQjtRQUNyRCxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ2QsS0FBSyxtQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sU0FBUyxDQUFDO1lBQ3hDLEtBQUssbUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO1lBQ3ZELEtBQUssbUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO1lBQ3hELE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDO1FBQ3RCLENBQUM7SUFDRixDQUFDO0lBdUZELDZCQUE2QjtJQUNoQixRQUFBLFVBQVUsR0FBRztRQUN6QixtQkFBbUIsRUFBRSw0QkFBNEI7S0FDakQsQ0FBQztJQWNGLE1BQU0sZUFBZTtRQUlwQjtZQUhRLHdCQUFtQixHQUEwQixFQUFFLENBQUM7WUFJdkQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsZ0NBQWdDLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7UUFDNUUsQ0FBQztRQUVNLGtCQUFrQixDQUFDLFdBQWdDO1lBQ3pELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN4RCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQVcseUJBQXlCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQztRQUNwRCxDQUFDO1FBRU0sc0JBQXNCO1lBQzVCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQUVELE1BQU0sZUFBZSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7SUFDOUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQVUsQ0FBQyxtQkFBbUIsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUV2RSxTQUFnQiwwQkFBMEIsQ0FBQyxXQUFnQztRQUMxRSxPQUFPLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLFFBQVMsU0FBUSxzQkFBVTtRQUd2QyxZQUNXLFlBQTJCO1lBRXJDLEtBQUssRUFBRSxDQUFDO1lBRkUsaUJBQVksR0FBWixZQUFZLENBQWU7WUFJckMsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFMUMsMkJBQTJCO1lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFFUyxhQUFhLENBQUMsS0FBa0I7WUFDekMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFFbkIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxZQUFZO1lBQ1gseUJBQXlCO1FBQzFCLENBQUM7UUFFUyxRQUFRLENBQUMsRUFBVSxFQUFFLE1BQW9EO1lBQ2xGLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXBDLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN4QyxDQUFDO0tBQ0Q7SUFqQ0QsNEJBaUNDIn0=