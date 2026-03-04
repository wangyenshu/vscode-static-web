define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/contrib/chat/common/chatModel"], function (require, exports, htmlContent_1, resources_1, uri_1, chatModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentRefUrl = void 0;
    exports.annotateSpecialMarkdownContent = annotateSpecialMarkdownContent;
    exports.annotateVulnerabilitiesInText = annotateVulnerabilitiesInText;
    exports.extractVulnerabilitiesFromText = extractVulnerabilitiesFromText;
    exports.contentRefUrl = 'http://_vscodecontentref_'; // must be lowercase for URI
    function annotateSpecialMarkdownContent(response) {
        const result = [];
        for (const item of response) {
            const previousItem = result[result.length - 1];
            if (item.kind === 'inlineReference') {
                const location = 'uri' in item.inlineReference ? item.inlineReference : { uri: item.inlineReference };
                const printUri = uri_1.URI.parse(exports.contentRefUrl).with({ fragment: JSON.stringify(location) });
                const markdownText = `[${item.name || (0, resources_1.basename)(location.uri)}](${printUri.toString()})`;
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
            else if (item.kind === 'markdownContent' && previousItem?.kind === 'markdownContent' && (0, chatModel_1.canMergeMarkdownStrings)(previousItem.content, item.content)) {
                result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + item.content.value), kind: 'markdownContent' };
            }
            else if (item.kind === 'markdownVuln') {
                const vulnText = encodeURIComponent(JSON.stringify(item.vulnerabilities));
                const markdownText = `<vscode_annotation details='${vulnText}'>${item.content.value}</vscode_annotation>`;
                if (previousItem?.kind === 'markdownContent') {
                    // Since this is inside a codeblock, it needs to be merged into the previous markdown content.
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
            else {
                result.push(item);
            }
        }
        return result;
    }
    function annotateVulnerabilitiesInText(response) {
        const result = [];
        for (const item of response) {
            const previousItem = result[result.length - 1];
            if (item.kind === 'markdownContent') {
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + item.content.value, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push(item);
                }
            }
            else if (item.kind === 'markdownVuln') {
                const vulnText = encodeURIComponent(JSON.stringify(item.vulnerabilities));
                const markdownText = `<vscode_annotation details='${vulnText}'>${item.content.value}</vscode_annotation>`;
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
        }
        return result;
    }
    function extractVulnerabilitiesFromText(text) {
        const vulnerabilities = [];
        let newText = text;
        let match;
        while ((match = /<vscode_annotation details='(.*?)'>(.*?)<\/vscode_annotation>/ms.exec(newText)) !== null) {
            const [full, details, content] = match;
            const start = match.index;
            const textBefore = newText.substring(0, start);
            const linesBefore = textBefore.split('\n').length - 1;
            const linesInside = content.split('\n').length - 1;
            const previousNewlineIdx = textBefore.lastIndexOf('\n');
            const startColumn = start - (previousNewlineIdx + 1) + 1;
            const endPreviousNewlineIdx = (textBefore + content).lastIndexOf('\n');
            const endColumn = start + content.length - (endPreviousNewlineIdx + 1) + 1;
            try {
                const vulnDetails = JSON.parse(decodeURIComponent(details));
                vulnDetails.forEach(({ title, description }) => vulnerabilities.push({
                    title, description, range: { startLineNumber: linesBefore + 1, startColumn, endLineNumber: linesBefore + linesInside + 1, endColumn }
                }));
            }
            catch (err) {
                // Something went wrong with encoding this text, just ignore it
            }
            newText = newText.substring(0, start) + content + newText.substring(start + full.length);
        }
        return { newText, vulnerabilities };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9hbm5vdGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBYUEsd0VBOEJDO0lBUUQsc0VBc0JDO0lBRUQsd0VBNEJDO0lBNUZZLFFBQUEsYUFBYSxHQUFHLDJCQUEyQixDQUFDLENBQUMsNEJBQTRCO0lBRXRGLFNBQWdCLDhCQUE4QixDQUFDLFFBQXFEO1FBQ25HLE1BQU0sTUFBTSxHQUFzSCxFQUFFLENBQUM7UUFDckksS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxRQUFRLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEcsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxxQkFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RixNQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQztnQkFDeEYsSUFBSSxZQUFZLEVBQUUs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