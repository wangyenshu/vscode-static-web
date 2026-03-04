/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/request/common/request", "vs/base/node/pfs", "vs/base/common/path", "assert", "vs/base/common/cancellation", "vs/platform/request/node/requestService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/log/common/log", "vs/base/test/common/mock", "vs/base/common/network", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/workbench.desktop.main"], function (require, exports, platform_1, colorRegistry_1, request_1, pfs, path, assert, cancellation_1, requestService_1, testConfigurationService_1, log_1, mock_1, network_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.experimental = void 0;
    exports.experimental = []; // 'settings.modifiedItemForeground', 'editorUnnecessary.foreground' ];
    const knwonVariablesFileName = 'vscode-known-variables.json';
    suite('Color Registry', function () {
        test(`update colors in ${knwonVariablesFileName}`, async function () {
            const varFilePath = network_1.FileAccess.asFileUri(`vs/../../build/lib/stylelint/${knwonVariablesFileName}`).fsPath;
            const content = (await pfs.Promises.readFile(varFilePath)).toString();
            const variablesInfo = JSON.parse(content);
            const colorsArray = variablesInfo.colors;
            assert.ok(colorsArray && colorsArray.length > 0, '${knwonVariablesFileName} contains no color descriptions');
            const colors = new Set(colorsArray);
            const updatedColors = [];
            const missing = [];
            const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
            for (const color of themingRegistry.getColors()) {
                const id = (0, colorRegistry_1.asCssVariableName)(color.id);
                if (!colors.has(id)) {
                    if (!color.deprecationMessage) {
                        missing.push(id);
                    }
                }
                else {
                    colors.delete(id);
                }
                updatedColors.push(id);
            }
            const superfluousKeys = [...colors.keys()];
            let errorText = '';
            if (missing.length > 0) {
                errorText += `\n\Adding the following colors:\n\n${JSON.stringify(missing, undefined, '\t')}\n`;
            }
            if (superfluousKeys.length > 0) {
                errorText += `\n\Removing the following colors:\n\n${superfluousKeys.join('\n')}\n`;
            }
            if (errorText.length > 0) {
                updatedColors.sort();
                variablesInfo.colors = updatedColors;
                await pfs.Promises.writeFile(varFilePath, JSON.stringify(variablesInfo, undefined, '\t'));
                assert.fail(`\n\Updating ${path.normalize(varFilePath)}.\nPlease verify and commit.\n\n${errorText}\n`);
            }
        });
        test('all colors listed in theme-color.md', async function () {
            // avoid importing the TestEnvironmentService as it brings in a duplicate registration of the file editor input factory.
            const environmentService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.args = { _: [] };
                }
            };
            const docUrl = 'https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md';
            const reqContext = await new requestService_1.RequestService(new testConfigurationService_1.TestConfigurationService(), environmentService, new log_1.NullLogService(), new workbenchTestServices_1.TestLoggerService()).request({ url: docUrl }, cancellation_1.CancellationToken.None);
            const content = (await (0, request_1.asTextOrError)(reqContext));
            const expression = /-\s*\`([\w\.]+)\`: (.*)/g;
            let m;
            const colorsInDoc = Object.create(null);
            let nColorsInDoc = 0;
            while (m = expression.exec(content)) {
                colorsInDoc[m[1]] = { description: m[2], offset: m.index, length: m.length };
                nColorsInDoc++;
            }
            assert.ok(nColorsInDoc > 0, 'theme-color.md contains to color descriptions');
            const missing = Object.create(null);
            const descriptionDiffs = Object.create(null);
            const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
            for (const color of themingRegistry.getColors()) {
                if (!colorsInDoc[color.id]) {
                    if (!color.deprecationMessage) {
                        missing[color.id] = getDescription(color);
                    }
                }
                else {
                    const docDescription = colorsInDoc[color.id].description;
                    const specDescription = getDescription(color);
                    if (docDescription !== specDescription) {
                        descriptionDiffs[color.id] = { docDescription, specDescription };
                    }
                    delete colorsInDoc[color.id];
                }
            }
            const colorsInExtensions = await getColorsFromExtension();
            for (const colorId in colorsInExtensions) {
                if (!colorsInDoc[colorId]) {
                    missing[colorId] = colorsInExtensions[colorId];
                }
                else {
                    delete colorsInDoc[colorId];
                }
            }
            for (const colorId of exports.experimental) {
                if (missing[colorId]) {
                    delete missing[colorId];
                }
                if (colorsInDoc[colorId]) {
                    assert.fail(`Color ${colorId} found in doc but marked experimental. Please remove from experimental list.`);
                }
            }
            const superfluousKeys = Object.keys(colorsInDoc);
            const undocumentedKeys = Object.keys(missing).map(k => `\`${k}\`: ${missing[k]}`);
            let errorText = '';
            if (undocumentedKeys.length > 0) {
                errorText += `\n\nAdd the following colors:\n\n${undocumentedKeys.join('\n')}\n`;
            }
            if (superfluousKeys.length > 0) {
                errorText += `\n\Remove the following colors:\n\n${superfluousKeys.join('\n')}\n`;
            }
            if (errorText.length > 0) {
                assert.fail(`\n\nOpen https://github.dev/microsoft/vscode-docs/blob/vnext/api/references/theme-color.md#50${errorText}`);
            }
        });
    });
    function getDescription(color) {
        let specDescription = color.description;
        if (color.deprecationMessage) {
            specDescription = specDescription + ' ' + color.deprecationMessage;
        }
        return specDescription;
    }
    async function getColorsFromExtension() {
        const extPath = network_1.FileAccess.asFileUri('vs/../../extensions').fsPath;
        const extFolders = await pfs.Promises.readDirsInDir(extPath);
        const result = Object.create(null);
        for (const folder of extFolders) {
            try {
                const packageJSON = JSON.parse((await pfs.Promises.readFile(path.join(extPath, folder, 'package.json'))).toString());
                const contributes = packageJSON['contributes'];
                if (contributes) {
                    const colors = contributes['colors'];
                    if (colors) {
                        for (const color of colors) {
                            const colorId = color['id'];
                            if (colorId) {
                                result[colorId] = colorId['description'];
                            }
                        }
                    }
                }
            }
            catch (e) {
                // ignore
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JSZWdpc3RyeS5yZWxlYXNlVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RoZW1lcy90ZXN0L25vZGUvY29sb3JSZWdpc3RyeS5yZWxlYXNlVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4Qm5GLFFBQUEsWUFBWSxHQUFhLEVBQUUsQ0FBQyxDQUFDLHVFQUF1RTtJQUdqSCxNQUFNLHNCQUFzQixHQUFHLDZCQUE2QixDQUFDO0lBRTdELEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtRQUV2QixJQUFJLENBQUMsb0JBQW9CLHNCQUFzQixFQUFFLEVBQUUsS0FBSztZQUN2RCxNQUFNLFdBQVcsR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0Msc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUMxRyxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUV0RSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxNQUFrQixDQUFDO1lBRXJELE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLDBEQUEwRCxDQUFDLENBQUM7WUFFN0csTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFcEMsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNuQixNQUFNLGVBQWUsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsMEJBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2xGLEtBQUssTUFBTSxLQUFLLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sRUFBRSxHQUFHLElBQUEsaUNBQWlCLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV2QyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUM7d0JBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xCLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTNDLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNuQixJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLFNBQVMsSUFBSSxzQ0FBc0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDakcsQ0FBQztZQUNELElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsU0FBUyxJQUFJLHdDQUF3QyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckYsQ0FBQztZQUVELElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNyQixhQUFhLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztnQkFDckMsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRTFGLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxtQ0FBbUMsU0FBUyxJQUFJLENBQUMsQ0FBQztZQUN6RyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSztZQUNoRCx3SEFBd0g7WUFDeEgsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBNkI7Z0JBQS9DOztvQkFBMkQsU0FBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUFDLENBQUM7YUFBQSxDQUFDO1lBRTlHLE1BQU0sTUFBTSxHQUFHLDRGQUE0RixDQUFDO1lBRTVHLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSwrQkFBYyxDQUFDLElBQUksbURBQXdCLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLG9CQUFjLEVBQUUsRUFBRSxJQUFJLHlDQUFpQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaE0sTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUEsdUJBQWEsRUFBQyxVQUFVLENBQUMsQ0FBRSxDQUFDO1lBRW5ELE1BQU0sVUFBVSxHQUFHLDBCQUEwQixDQUFDO1lBRTlDLElBQUksQ0FBeUIsQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBZ0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRSxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDckIsT0FBTyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzdFLFlBQVksRUFBRSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQUUsK0NBQStDLENBQUMsQ0FBQztZQUU3RSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sZ0JBQWdCLEdBQXNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFaEYsTUFBTSxlQUFlLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLDBCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsRixLQUFLLE1BQU0sS0FBSyxJQUFJLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUM7d0JBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMzQyxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztvQkFDekQsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxJQUFJLGNBQWMsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDeEMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxDQUFDO29CQUNsRSxDQUFDO29CQUNELE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLGtCQUFrQixHQUFHLE1BQU0sc0JBQXNCLEVBQUUsQ0FBQztZQUMxRCxLQUFLLE1BQU0sT0FBTyxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDO1lBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxvQkFBWSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QixDQUFDO2dCQUNELElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxPQUFPLDhFQUE4RSxDQUFDLENBQUM7Z0JBQzdHLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUdsRixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDbkIsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLFNBQVMsSUFBSSxvQ0FBb0MsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDbEYsQ0FBQztZQUNELElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsU0FBUyxJQUFJLHNDQUFzQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDbkYsQ0FBQztZQUVELElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxnR0FBZ0csU0FBUyxFQUFFLENBQUMsQ0FBQztZQUMxSCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsY0FBYyxDQUFDLEtBQXdCO1FBQy9DLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDeEMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUM5QixlQUFlLEdBQUcsZUFBZSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7UUFDcEUsQ0FBQztRQUNELE9BQU8sZUFBZSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxLQUFLLFVBQVUsc0JBQXNCO1FBQ3BDLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ25FLE1BQU0sVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0QsTUFBTSxNQUFNLEdBQTZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNySCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQy9DLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDckMsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDWixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUM1QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7NEJBQzVCLElBQUksT0FBTyxFQUFFLENBQUM7Z0NBQ2IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQzs0QkFDMUMsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLFNBQVM7WUFDVixDQUFDO1FBRUYsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9