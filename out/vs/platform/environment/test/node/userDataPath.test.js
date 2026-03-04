/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/environment/node/argv", "vs/platform/environment/node/userDataPath", "vs/platform/product/common/product"], function (require, exports, assert, utils_1, argv_1, userDataPath_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('User data path', () => {
        test('getUserDataPath - default', () => {
            const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
            assert.ok(path.length > 0);
        });
        test('getUserDataPath - portable mode', () => {
            const origPortable = process.env['VSCODE_PORTABLE'];
            try {
                const portableDir = 'portable-dir';
                process.env['VSCODE_PORTABLE'] = portableDir;
                const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
                assert.ok(path.includes(portableDir));
            }
            finally {
                if (typeof origPortable === 'string') {
                    process.env['VSCODE_PORTABLE'] = origPortable;
                }
                else {
                    delete process.env['VSCODE_PORTABLE'];
                }
            }
        });
        test('getUserDataPath - --user-data-dir', () => {
            const cliUserDataDir = 'cli-data-dir';
            const args = (0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS);
            args['user-data-dir'] = cliUserDataDir;
            const path = (0, userDataPath_1.getUserDataPath)(args, product_1.default.nameShort);
            assert.ok(path.includes(cliUserDataDir));
        });
        test('getUserDataPath - VSCODE_APPDATA', () => {
            const origAppData = process.env['VSCODE_APPDATA'];
            try {
                const appDataDir = 'appdata-dir';
                process.env['VSCODE_APPDATA'] = appDataDir;
                const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
                assert.ok(path.includes(appDataDir));
            }
            finally {
                if (typeof origAppData === 'string') {
                    process.env['VSCODE_APPDATA'] = origAppData;
                }
                else {
                    delete process.env['VSCODE_APPDATA'];
                }
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQYXRoLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbnZpcm9ubWVudC90ZXN0L25vZGUvdXNlckRhdGFQYXRoLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQWUsRUFBQyxJQUFBLGdCQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFPLENBQUMsRUFBRSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7WUFDNUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQztnQkFDSixNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxXQUFXLENBQUM7Z0JBRTdDLE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQWUsRUFBQyxJQUFBLGdCQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFPLENBQUMsRUFBRSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDL0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDdEMsTUFBTSxJQUFJLEdBQUcsSUFBQSxnQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBTyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLGNBQWMsQ0FBQztZQUV2QyxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFlLEVBQUMsSUFBSSxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDO2dCQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsVUFBVSxDQUFDO2dCQUUzQyxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFlLEVBQUMsSUFBQSxnQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBTyxDQUFDLEVBQUUsaUJBQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxXQUFXLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9