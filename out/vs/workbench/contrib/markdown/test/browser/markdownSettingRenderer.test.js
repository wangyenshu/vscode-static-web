define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/registry/common/platform", "vs/workbench/contrib/markdown/browser/markdownSettingRenderer"], function (require, exports, assert, uri_1, utils_1, configurationRegistry_1, testConfigurationService_1, platform_1, markdownSettingRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configuration = {
        'id': 'examples',
        'title': 'Examples',
        'type': 'object',
        'properties': {
            'example.booleanSetting': {
                'type': 'boolean',
                'default': false,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.booleanSetting2': {
                'type': 'boolean',
                'default': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.stringSetting': {
                'type': 'string',
                'default': 'one',
                'scope': 1 /* ConfigurationScope.APPLICATION */
            },
            'example.numberSetting': {
                'type': 'number',
                'default': 3,
                'scope': 1 /* ConfigurationScope.APPLICATION */
            }
        }
    };
    class MarkdownConfigurationService extends testConfigurationService_1.TestConfigurationService {
        async updateValue(key, value) {
            const [section, setting] = key.split('.');
            return this.setUserConfiguration(section, { [setting]: value });
        }
    }
    suite('Markdown Setting Renderer Test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let configurationService;
        let preferencesService;
        let contextMenuService;
        let settingRenderer;
        suiteSetup(() => {
            configurationService = new MarkdownConfigurationService();
            preferencesService = {};
            contextMenuService = {};
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(configuration);
            settingRenderer = new markdownSettingRenderer_1.SimpleSettingRenderer(configurationService, contextMenuService, preferencesService, { publicLog2: () => { } }, { writeText: async () => { } });
        });
        suiteTeardown(() => {
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).deregisterConfigurations([configuration]);
        });
        test('render code setting button with value', () => {
            const htmlRenderer = settingRenderer.getHtmlRenderer();
            const htmlNoValue = '<code codesetting="example.booleanSetting">';
            const renderedHtmlNoValue = htmlRenderer(htmlNoValue);
            assert.strictEqual(renderedHtmlNoValue, `<code tabindex="0"><a href="code-setting://example.booleanSetting" class="codesetting" title="View or change setting" aria-role="button"><svg width="14" height="14" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/></svg>
			<span class="separator"></span>
			<span class="setting-name">example.booleanSetting</span>
		</a></code><code>`);
        });
        test('actions with no value', () => {
            const uri = uri_1.URI.parse(settingRenderer.settingToUriString('example.booleanSetting'));
            const actions = settingRenderer.getActions(uri);
            assert.strictEqual(actions?.length, 2);
            assert.strictEqual(actions[0].label, 'View "Example: Boolean Setting" in Settings');
        });
        test('actions with value + updating and restoring', async () => {
            await configurationService.setUserConfiguration('example', { stringSetting: 'two' });
            const uri = uri_1.URI.parse(settingRenderer.settingToUriString('example.stringSetting', 'three'));
            const verifyOriginalState = (actions) => {
                assert.strictEqual(actions?.length, 3);
                assert.strictEqual(actions[0].label, 'Set "Example: String Setting" to "three"');
                assert.strictEqual(actions[1].label, 'View in Settings');
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'two');
                return true;
            };
            const actions = settingRenderer.getActions(uri);
            if (verifyOriginalState(actions)) {
                // Update the value
                await actions[0].run();
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'three');
                const actionsUpdated = settingRenderer.getActions(uri);
                assert.strictEqual(actionsUpdated?.length, 3);
                assert.strictEqual(actionsUpdated[0].label, 'Restore value of "Example: String Setting"');
                assert.strictEqual(actions[1].label, 'View in Settings');
                assert.strictEqual(actions[2].label, 'Copy Setting ID');
                assert.strictEqual(configurationService.getValue('example.stringSetting'), 'three');
                // Restore the value
                await actionsUpdated[0].run();
                verifyOriginalState(settingRenderer.getActions(uri));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TZXR0aW5nUmVuZGVyZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtkb3duL3Rlc3QvYnJvd3Nlci9tYXJrZG93blNldHRpbmdSZW5kZXJlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWVBLE1BQU0sYUFBYSxHQUF1QjtRQUN6QyxJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsVUFBVTtRQUNuQixNQUFNLEVBQUUsUUFBUTtRQUNoQixZQUFZLEVBQUU7WUFDYix3QkFBd0IsRUFBRTtnQkFDekIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixPQUFPLHdDQUFnQzthQUN2QztZQUNELHlCQUF5QixFQUFFO2dCQUMxQixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsT0FBTyx3Q0FBZ0M7YUFDdkM7WUFDRCx1QkFBdUIsRUFBRTtnQkFDeEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixPQUFPLHdDQUFnQzthQUN2QztZQUNELHVCQUF1QixFQUFFO2dCQUN4QixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osT0FBTyx3Q0FBZ0M7YUFDdkM7U0FDRDtLQUNELENBQUM7SUFFRixNQUFNLDRCQUE2QixTQUFRLG1EQUF3QjtRQUN6RCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQVcsRUFBRSxLQUFVO1lBQ2pELE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFD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