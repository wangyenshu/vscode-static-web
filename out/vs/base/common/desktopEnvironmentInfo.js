/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDesktopEnvironment = getDesktopEnvironment;
    // Define the enumeration for Desktop Environments
    var DesktopEnvironment;
    (function (DesktopEnvironment) {
        DesktopEnvironment["UNKNOWN"] = "UNKNOWN";
        DesktopEnvironment["CINNAMON"] = "CINNAMON";
        DesktopEnvironment["DEEPIN"] = "DEEPIN";
        DesktopEnvironment["GNOME"] = "GNOME";
        DesktopEnvironment["KDE3"] = "KDE3";
        DesktopEnvironment["KDE4"] = "KDE4";
        DesktopEnvironment["KDE5"] = "KDE5";
        DesktopEnvironment["KDE6"] = "KDE6";
        DesktopEnvironment["PANTHEON"] = "PANTHEON";
        DesktopEnvironment["UNITY"] = "UNITY";
        DesktopEnvironment["XFCE"] = "XFCE";
        DesktopEnvironment["UKUI"] = "UKUI";
        DesktopEnvironment["LXQT"] = "LXQT";
    })(DesktopEnvironment || (DesktopEnvironment = {}));
    const kXdgCurrentDesktopEnvVar = 'XDG_CURRENT_DESKTOP';
    const kKDESessionEnvVar = 'KDE_SESSION_VERSION';
    function getDesktopEnvironment() {
        const xdgCurrentDesktop = process_1.env[kXdgCurrentDesktopEnvVar];
        if (xdgCurrentDesktop) {
            const values = xdgCurrentDesktop.split(':').map(value => value.trim()).filter(value => value.length > 0);
            for (const value of values) {
                switch (value) {
                    case 'Unity': {
                        const desktopSessionUnity = process_1.env['DESKTOP_SESSION'];
                        if (desktopSessionUnity && desktopSessionUnity.includes('gnome-fallback')) {
                            return DesktopEnvironment.GNOME;
                        }
                        return DesktopEnvironment.UNITY;
                    }
                    case 'Deepin':
                        return DesktopEnvironment.DEEPIN;
                    case 'GNOME':
                        return DesktopEnvironment.GNOME;
                    case 'X-Cinnamon':
                        return DesktopEnvironment.CINNAMON;
                    case 'KDE': {
                        const kdeSession = process_1.env[kKDESessionEnvVar];
                        if (kdeSession === '5') {
                            return DesktopEnvironment.KDE5;
                        }
                        if (kdeSession === '6') {
                            return DesktopEnvironment.KDE6;
                        }
                        return DesktopEnvironment.KDE4;
                    }
                    case 'Pantheon':
                        return DesktopEnvironment.PANTHEON;
                    case 'XFCE':
                        return DesktopEnvironment.XFCE;
                    case 'UKUI':
                        return DesktopEnvironment.UKUI;
                    case 'LXQt':
                        return DesktopEnvironment.LXQT;
                }
            }
        }
        const desktopSession = process_1.env['DESKTOP_SESSION'];
        if (desktopSession) {
            switch (desktopSession) {
                case 'deepin':
                    return DesktopEnvironment.DEEPIN;
                case 'gnome':
                case 'mate':
                    return DesktopEnvironment.GNOME;
                case 'kde4':
                case 'kde-plasma':
                    return DesktopEnvironment.KDE4;
                case 'kde':
                    if (kKDESessionEnvVar in process_1.env) {
                        return DesktopEnvironment.KDE4;
                    }
                    return DesktopEnvironment.KDE3;
                case 'xfce':
                case 'xubuntu':
                    return DesktopEnvironment.XFCE;
                case 'ukui':
                    return DesktopEnvironment.UKUI;
            }
        }
        if ('GNOME_DESKTOP_SESSION_ID' in process_1.env) {
            return DesktopEnvironment.GNOME;
        }
        if ('KDE_FULL_SESSION' in process_1.env) {
            if (kKDESessionEnvVar in process_1.env) {
                return DesktopEnvironment.KDE4;
            }
            return DesktopEnvironment.KDE3;
        }
        return DesktopEnvironment.UNKNOWN;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVza3RvcEVudmlyb25tZW50SW5mby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2Rlc2t0b3BFbnZpcm9ubWVudEluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3QmhHLHNEQXlFQztJQTdGRCxrREFBa0Q7SUFDbEQsSUFBSyxrQkFjSjtJQWRELFdBQUssa0JBQWtCO1FBQ3RCLHlDQUFtQixDQUFBO1FBQ25CLDJDQUFxQixDQUFBO1FBQ3JCLHVDQUFpQixDQUFBO1FBQ2pCLHFDQUFlLENBQUE7UUFDZixtQ0FBYSxDQUFBO1FBQ2IsbUNBQWEsQ0FBQTtRQUNiLG1DQUFhLENBQUE7UUFDYixtQ0FBYSxDQUFBO1FBQ2IsMkNBQXFCLENBQUE7UUFDckIscUNBQWUsQ0FBQTtRQUNmLG1DQUFhLENBQUE7UUFDYixtQ0FBYSxDQUFBO1FBQ2IsbUNBQWEsQ0FBQTtJQUNkLENBQUMsRUFkSSxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBY3RCO0lBRUQsTUFBTSx3QkFBd0IsR0FBRyxxQkFBcUIsQ0FBQztJQUN2RCxNQUFNLGlCQUFpQixHQUFHLHFCQUFxQixDQUFDO0lBRWhELFNBQWdCLHFCQUFxQjtRQUNwQyxNQUFNLGlCQUFpQixHQUFHLGFBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3hELElBQUksaUJBQWlCLEVBQUUsQ0FBQztZQUN2QixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6RyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixRQUFRLEtBQUssRUFBRSxDQUFDO29CQUNmLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQzt3QkFDZCxNQUFNLG1CQUFtQixHQUFHLGFBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3dCQUNuRCxJQUFJLG1CQUFtQixJQUFJLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7NEJBQzNFLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxDQUFDO3dCQUNqQyxDQUFDO3dCQUVELE9BQU8sa0JBQWtCLENBQUMsS0FBSyxDQUFDO29CQUNqQyxDQUFDO29CQUNELEtBQUssUUFBUTt3QkFDWixPQUFPLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztvQkFDbEMsS0FBSyxPQUFPO3dCQUNYLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxDQUFDO29CQUNqQyxLQUFLLFlBQVk7d0JBQ2hCLE9BQU8sa0JBQWtCLENBQUMsUUFBUSxDQUFDO29CQUNwQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ1osTUFBTSxVQUFVLEdBQUcsYUFBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7d0JBQzFDLElBQUksVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDOzRCQUFDLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO3dCQUFDLENBQUM7d0JBQzNELElBQUksVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDOzRCQUFDLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO3dCQUFDLENBQUM7d0JBQzNELE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO29CQUNoQyxDQUFDO29CQUNELEtBQUssVUFBVTt3QkFDZCxPQUFPLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztvQkFDcEMsS0FBSyxNQUFNO3dCQUNWLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO29CQUNoQyxLQUFLLE1BQU07d0JBQ1YsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLEtBQUssTUFBTTt3QkFDVixPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxjQUFjLEdBQUcsYUFBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDOUMsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixRQUFRLGNBQWMsRUFBRSxDQUFDO2dCQUN4QixLQUFLLFFBQVE7b0JBQ1osT0FBTyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xDLEtBQUssT0FBTyxDQUFDO2dCQUNiLEtBQUssTUFBTTtvQkFDVixPQUFPLGtCQUFrQixDQUFDLEtBQUssQ0FBQztnQkFDakMsS0FBSyxNQUFNLENBQUM7Z0JBQ1osS0FBSyxZQUFZO29CQUNoQixPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQztnQkFDaEMsS0FBSyxLQUFLO29CQUNULElBQUksaUJBQWlCLElBQUksYUFBRyxFQUFFLENBQUM7d0JBQzlCLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO29CQUNoQyxDQUFDO29CQUNELE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxLQUFLLE1BQU0sQ0FBQztnQkFDWixLQUFLLFNBQVM7b0JBQ2IsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLEtBQUssTUFBTTtvQkFDVixPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksMEJBQTBCLElBQUksYUFBRyxFQUFFLENBQUM7WUFDdkMsT0FBTyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7UUFDakMsQ0FBQztRQUNELElBQUksa0JBQWtCLElBQUksYUFBRyxFQUFFLENBQUM7WUFDL0IsSUFBSSxpQkFBaUIsSUFBSSxhQUFHLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7WUFDaEMsQ0FBQztZQUNELE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxPQUFPLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztJQUNuQyxDQUFDIn0=