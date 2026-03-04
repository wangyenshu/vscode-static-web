/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "fs/promises", "readline", "vs/base/common/platform"], function (require, exports, fs_1, promises_1, readline_1, Platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOSReleaseInfo = getOSReleaseInfo;
    async function getOSReleaseInfo(errorLogger) {
        if (Platform.isMacintosh || Platform.isWindows) {
            return;
        }
        // Extract release information on linux based systems
        // using the identifiers specified in
        // https://www.freedesktop.org/software/systemd/man/os-release.html
        let handle;
        for (const filePath of ['/etc/os-release', '/usr/lib/os-release', '/etc/lsb-release']) {
            try {
                handle = await (0, promises_1.open)(filePath, fs_1.constants.R_OK);
                break;
            }
            catch (err) { }
        }
        if (!handle) {
            errorLogger('Unable to retrieve release information from known identifier paths.');
            return;
        }
        try {
            const osReleaseKeys = new Set([
                'ID',
                'DISTRIB_ID',
                'ID_LIKE',
                'VERSION_ID',
                'DISTRIB_RELEASE',
            ]);
            const releaseInfo = {
                id: 'unknown'
            };
            for await (const line of (0, readline_1.createInterface)({ input: handle.createReadStream(), crlfDelay: Infinity })) {
                if (!line.includes('=')) {
                    continue;
                }
                const key = line.split('=')[0].toUpperCase().trim();
                if (osReleaseKeys.has(key)) {
                    const value = line.split('=')[1].replace(/"/g, '').toLowerCase().trim();
                    if (key === 'ID' || key === 'DISTRIB_ID') {
                        releaseInfo.id = value;
                    }
                    else if (key === 'ID_LIKE') {
                        releaseInfo.id_like = value;
                    }
                    else if (key === 'VERSION_ID' || key === 'DISTRIB_RELEASE') {
                        releaseInfo.version_id = value;
                    }
                }
            }
            return releaseInfo;
        }
        catch (err) {
            errorLogger(err);
        }
        return;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3NSZWxlYXNlSW5mby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9vc1JlbGVhc2VJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLDRDQXdEQztJQXhETSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsV0FBaUM7UUFDdkUsSUFBSSxRQUFRLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNoRCxPQUFPO1FBQ1IsQ0FBQztRQUVELHFEQUFxRDtRQUNyRCxxQ0FBcUM7UUFDckMsbUVBQW1FO1FBQ25FLElBQUksTUFBOEIsQ0FBQztRQUNuQyxLQUFLLE1BQU0sUUFBUSxJQUFJLENBQUMsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1lBQ3ZGLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsTUFBTSxJQUFBLGVBQUksRUFBQyxRQUFRLEVBQUUsY0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoRCxNQUFNO1lBQ1AsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDYixXQUFXLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUNuRixPQUFPO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQztZQUNKLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDO2dCQUM3QixJQUFJO2dCQUNKLFlBQVk7Z0JBQ1osU0FBUztnQkFDVCxZQUFZO2dCQUNaLGlCQUFpQjthQUNqQixDQUFDLENBQUM7WUFDSCxNQUFNLFdBQVcsR0FBZ0I7Z0JBQ2hDLEVBQUUsRUFBRSxTQUFTO2FBQ2IsQ0FBQztZQUVGLElBQUksS0FBSyxFQUFFLE1BQU0sSUFBSSxJQUFJLElBQUEsMEJBQVMsRUFBQyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMvRixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDeEUsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxZQUFZLEVBQUUsQ0FBQzt3QkFDMUMsV0FBVyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUM7b0JBQ3hCLENBQUM7eUJBQU0sSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQzlCLFdBQVcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUM3QixDQUFDO3lCQUFNLElBQUksR0FBRyxLQUFLLFlBQVksSUFBSSxHQUFHLEtBQUssaUJBQWlCLEVBQUUsQ0FBQzt3QkFDOUQsV0FBVyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNkLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsT0FBTztJQUNSLENBQUMifQ==