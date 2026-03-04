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
define(["require", "exports", "vs/base/common/uuid", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/workbench/contrib/webview/common/webview", "vs/base/common/map", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/editor/common/languages/language", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uuid_1, tokenization_1, languages_1, markdownDocumentRenderer_1, platform_1, resources_1, types_1, webview_1, map_1, files_1, notification_1, language_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedDetailsRenderer = void 0;
    let GettingStartedDetailsRenderer = class GettingStartedDetailsRenderer {
        constructor(fileService, notificationService, extensionService, languageService) {
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.languageService = languageService;
            this.mdCache = new map_1.ResourceMap();
            this.svgCache = new map_1.ResourceMap();
        }
        async renderMarkdown(path, base) {
            const content = await this.readAndCacheStepMarkdown(path, base);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            const inDev = document.location.protocol === 'http:';
            const imgSrcCsp = inDev ? 'img-src https: data: http:' : 'img-src https: data:';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${imgSrcCsp}; media-src https:; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					body > img {
						align-self: flex-start;
					}
					body > img[centered] {
						align-self: center;
					}
					body {
						display: flex;
						flex-direction: column;
						padding: 0;
						height: inherit;
					}
					.theme-picker-row {
						display: flex;
						justify-content: center;
						gap: 32px;
					}
					checklist {
						display: flex;
						gap: 32px;
						flex-direction: column;
					}
					checkbox {
						display: flex;
						flex-direction: column;
						align-items: center;
						margin: 5px;
						cursor: pointer;
					}
					checkbox > img {
						margin-bottom: 8px !important;
					}
					checkbox.checked > img {
						box-sizing: border-box;
					}
					checkbox.checked > img {
						outline: 2px solid var(--vscode-focusBorder);
						outline-offset: 4px;
						border-radius: 4px;
					}
					.theme-picker-link {
						margin-top: 16px;
						color: var(--vscode-textLink-foreground);
					}
					blockquote > p:first-child {
						margin-top: 0;
					}
					body > * {
						margin-block-end: 0.25em;
						margin-block-start: 0.25em;
					}
					vertically-centered {
						padding-top: 5px;
						padding-bottom: 5px;
						display: flex;
						justify-content: center;
						flex-direction: column;
					}
					html {
						height: 100%;
						padding-right: 32px;
					}
					h1 {
						font-size: 19.5px;
					}
					h2 {
						font-size: 18.5px;
					}
				</style>
			</head>
			<body>
				<vertically-centered>
					${content}
				</vertically-centered>
			</body>
			<script nonce="${nonce}">
				const vscode = acquireVsCodeApi();

				document.querySelectorAll('[when-checked]').forEach(el => {
					el.addEventListener('click', () => {
						vscode.postMessage(el.getAttribute('when-checked'));
					});
				});

				let ongoingLayout = undefined;
				const doLayout = () => {
					document.querySelectorAll('vertically-centered').forEach(element => {
						element.style.marginTop = Math.max((document.body.clientHeight - element.scrollHeight) * 3/10, 0) + 'px';
					});
					ongoingLayout = undefined;
				};

				const layout = () => {
					if (ongoingLayout) {
						clearTimeout(ongoingLayout);
					}
					ongoingLayout = setTimeout(doLayout, 0);
				};

				layout();

				document.querySelectorAll('img').forEach(element => {
					element.onload = layout;
				})

				window.addEventListener('message', event => {
					if (event.data.layoutMeNow) {
						layout();
					}
					if (event.data.enabledContextKeys) {
						document.querySelectorAll('.checked').forEach(element => element.classList.remove('checked'))
						for (const key of event.data.enabledContextKeys) {
							document.querySelectorAll('[checked-on="' + key + '"]').forEach(element => element.classList.add('checked'))
						}
					}
				});
		</script>
		</html>`;
        }
        async renderSVG(path) {
            const content = await this.readAndCacheSVGFile(path);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					svg {
						position: fixed;
						height: 100%;
						width: 80%;
						left: 50%;
						top: 50%;
						max-width: 530px;
						min-width: 350px;
						transform: translate(-50%,-50%);
					}
				</style>
			</head>
			<body>
				${content}
			</body>
		</html>`;
        }
        async readAndCacheSVGFile(path) {
            if (!this.svgCache.has(path)) {
                const contents = await this.readContentsOfPath(path, false);
                this.svgCache.set(path, contents);
            }
            return (0, types_1.assertIsDefined)(this.svgCache.get(path));
        }
        async readAndCacheStepMarkdown(path, base) {
            if (!this.mdCache.has(path)) {
                const contents = await this.readContentsOfPath(path);
                const markdownContents = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(transformUris(contents, base), this.extensionService, this.languageService, true, true);
                this.mdCache.set(path, markdownContents);
            }
            return (0, types_1.assertIsDefined)(this.mdCache.get(path));
        }
        async readContentsOfPath(path, useModuleId = true) {
            try {
                const moduleId = JSON.parse(path.query).moduleId;
                if (useModuleId && moduleId) {
                    const contents = await new Promise(c => {
                        require([moduleId], content => {
                            c(content.default());
                        });
                    });
                    return contents;
                }
            }
            catch { }
            try {
                const localizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${platform_1.language}.md`) });
                const generalizedLocale = platform_1.language?.replace(/-.*$/, '');
                const generalizedLocalizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${generalizedLocale}.md`) });
                const fileExists = (file) => this.fileService
                    .stat(file)
                    .then((stat) => !!stat.size) // Double check the file actually has content for fileSystemProviders that fake `stat`. #131809
                    .catch(() => false);
                const [localizedFileExists, generalizedLocalizedFileExists] = await Promise.all([
                    fileExists(localizedPath),
                    fileExists(generalizedLocalizedPath),
                ]);
                const bytes = await this.fileService.readFile(localizedFileExists
                    ? localizedPath
                    : generalizedLocalizedFileExists
                        ? generalizedLocalizedPath
                        : path);
                return bytes.value.toString();
            }
            catch (e) {
                this.notificationService.error('Error reading markdown document at `' + path + '`: ' + e);
                return '';
            }
        }
    };
    exports.GettingStartedDetailsRenderer = GettingStartedDetailsRenderer;
    exports.GettingStartedDetailsRenderer = GettingStartedDetailsRenderer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, notification_1.INotificationService),
        __param(2, extensions_1.IExtensionService),
        __param(3, language_1.ILanguageService)
    ], GettingStartedDetailsRenderer);
    const transformUri = (src, base) => {
        const path = (0, resources_1.joinPath)(base, src);
        return (0, webview_1.asWebviewUri)(path).toString(true);
    };
    const transformUris = (content, base) => content
        .replace(/src="([^"]*)"/g, (_, src) => {
        if (src.startsWith('https://')) {
            return `src="${src}"`;
        }
        return `src="${transformUri(src, base)}"`;
    })
        .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, title, src) => {
        if (src.startsWith('https://')) {
            return `![${title}](${src})`;
        }
        return `![${title}](${transformUri(src, base)})`;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWREZXRhaWxzUmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvYnJvd3Nlci9nZXR0aW5nU3RhcnRlZERldGFpbHNSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO1FBSXpDLFlBQ2UsV0FBMEMsRUFDbEMsbUJBQTBELEVBQzdELGdCQUFvRCxFQUNyRCxlQUFrRDtZQUhyQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDcEMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBUDdELFlBQU8sR0FBRyxJQUFJLGlCQUFXLEVBQVUsQ0FBQztZQUNwQyxhQUFRLEdBQUcsSUFBSSxpQkFBVyxFQUFVLENBQUM7UUFPekMsQ0FBQztRQUVMLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBUyxFQUFFLElBQVM7WUFDeEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sS0FBSyxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1lBQzdCLE1BQU0sUUFBUSxHQUFHLGdDQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXBELE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSwyQ0FBNEIsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRW5FLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FB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