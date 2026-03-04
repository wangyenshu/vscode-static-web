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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/label/common/label", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/test/common/utils", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/customEditorLabelService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/common/workspace"], function (require, exports, assert, uri_1, workbenchTestServices_1, resourceEditorInput_1, label_1, files_1, lifecycle_1, filesConfigurationService_1, utils_1, textResourceConfiguration_1, configuration_1, customEditorLabelService_1, testConfigurationService_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceEditorInput', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let TestResourceEditorInput = class TestResourceEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
            constructor(resource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
                super(resource, resource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
                this.typeId = 'test.typeId';
            }
        };
        TestResourceEditorInput = __decorate([
            __param(1, label_1.ILabelService),
            __param(2, files_1.IFileService),
            __param(3, filesConfigurationService_1.IFilesConfigurationService),
            __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
            __param(5, customEditorLabelService_1.ICustomEditorLabelService)
        ], TestResourceEditorInput);
        async function createServices() {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            const customEditorLabelService = disposables.add(new customEditorLabelService_1.CustomEditorLabelService(testConfigurationService, instantiationService.get(workspace_1.IWorkspaceContextService)));
            instantiationService.stub(customEditorLabelService_1.ICustomEditorLabelService, customEditorLabelService);
            return [instantiationService, testConfigurationService, customEditorLabelService];
        }
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            const [instantiationService] = await createServices();
            const resource = uri_1.URI.from({ scheme: 'testResource', path: 'thePath/of/the/resource.txt' });
            const input = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource));
            assert.ok(input.getName().length > 0);
            assert.ok(input.getDescription(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getDescription(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getDescription(2 /* Verbosity.LONG */).length > 0);
            assert.ok(input.getTitle(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getTitle(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getTitle(2 /* Verbosity.LONG */).length > 0);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            assert.strictEqual(input.hasCapability(4 /* EditorInputCapabilities.Untitled */), true);
        });
        test('custom editor name', async () => {
            const [instantiationService, testConfigurationService, customEditorLabelService] = await createServices();
            const resource1 = uri_1.URI.from({ scheme: 'testResource', path: 'thePath/of/the/resource.txt' });
            const resource2 = uri_1.URI.from({ scheme: 'testResource', path: 'theOtherPath/of/the/resource.md' });
            const input1 = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource1));
            const input2 = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource2));
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS, {
                '**/theOtherPath/**': 'Label 1',
                '**/*.txt': 'Label 2',
                '**/resource.txt': 'Label 3',
            });
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS; }, source: 2 /* ConfigurationTarget.USER */ });
            let label1Name = '';
            let label2Name = '';
            disposables.add(customEditorLabelService.onDidChange(() => {
                label1Name = input1.getName();
                label2Name = input2.getName();
            }));
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, true);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'Label 3');
            assert.ok(label2Name === 'Label 1');
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, false);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'resource.txt');
            assert.ok(label2Name === 'resource.md');
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, true);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS, {
                'thePath/**/resource.txt': 'Label 4',
                'thePath/of/*/resource.txt': 'Label 5',
            });
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'Label 5');
            assert.ok(label2Name === 'resource.md');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VFZGl0b3JJbnB1dC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvcmVzb3VyY2VFZGl0b3JJbnB1dC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBbUJoRyxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBRWpDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsaURBQTJCO1lBSWhFLFlBQ0MsUUFBYSxFQUNFLFlBQTJCLEVBQzVCLFdBQXlCLEVBQ1gseUJBQXFELEVBQzlDLGdDQUFtRSxFQUMzRSx3QkFBbUQ7Z0JBRTlFLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0NBQWdDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztnQkFWcEksV0FBTSxHQUFHLGFBQWEsQ0FBQztZQVdoQyxDQUFDO1NBQ0QsQ0FBQTtRQWRLLHVCQUF1QjtZQU0xQixXQUFBLHFCQUFhLENBQUE7WUFDYixXQUFBLG9CQUFZLENBQUE7WUFDWixXQUFBLHNEQUEwQixDQUFBO1lBQzFCLFdBQUEsNkRBQWlDLENBQUE7WUFDakMsV0FBQSxvREFBeUIsQ0FBQTtXQVZ0Qix1QkFBdUIsQ0FjNUI7UUFFRCxLQUFLLFVBQVUsY0FBYztZQUM1QixNQUFNLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ2hFLG9CQUFvQixDQUFDLElB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