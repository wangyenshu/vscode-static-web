/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stopwatch", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, stopwatch_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionSimpleWorker = void 0;
    exports.create = create;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new LanguageDetectionSimpleWorker(host, null);
    }
    /**
     * @internal
     */
    class LanguageDetectionSimpleWorker extends editorSimpleWorker_1.EditorSimpleWorker {
        constructor() {
            super(...arguments);
            this._regexpLoadFailed = false;
            this._loadFailed = false;
            this.modelIdToCoreId = new Map();
        }
        static { this.expectedRelativeConfidence = 0.2; }
        static { this.positiveConfidenceCorrectionBucket1 = 0.05; }
        static { this.positiveConfidenceCorrectionBucket2 = 0.025; }
        static { this.negativeConfidenceCorrection = 0.5; }
        async detectLanguage(uri, langBiases, preferHistory, supportedLangs) {
            const languages = [];
            const confidences = [];
            const stopWatch = new stopwatch_1.StopWatch();
            const documentTextSample = this.getTextForDetection(uri);
            if (!documentTextSample) {
                return;
            }
            const neuralResolver = async () => {
                for await (const language of this.detectLanguagesImpl(documentTextSample)) {
                    if (!this.modelIdToCoreId.has(language.languageId)) {
                        this.modelIdToCoreId.set(language.languageId, await this._host.fhr('getLanguageId', [language.languageId]));
                    }
                    const coreId = this.modelIdToCoreId.get(language.languageId);
                    if (coreId && (!supportedLangs?.length || supportedLangs.includes(coreId))) {
                        languages.push(coreId);
                        confidences.push(language.confidence);
                    }
                }
                stopWatch.stop();
                if (languages.length) {
                    this._host.fhr('sendTelemetryEvent', [languages, confidences, stopWatch.elapsed()]);
                    return languages[0];
                }
                return undefined;
            };
            const historicalResolver = async () => this.runRegexpModel(documentTextSample, langBiases ?? {}, supportedLangs);
            if (preferHistory) {
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
            }
            else {
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
            }
            return undefined;
        }
        getTextForDetection(uri) {
            const editorModel = this._getModel(uri);
            if (!editorModel) {
                return;
            }
            const end = editorModel.positionAt(10000);
            const content = editorModel.getValueInRange({
                startColumn: 1,
                startLineNumber: 1,
                endColumn: end.column,
                endLineNumber: end.lineNumber
            });
            return content;
        }
        async getRegexpModel() {
            if (this._regexpLoadFailed) {
                return;
            }
            if (this._regexpModel) {
                return this._regexpModel;
            }
            const uri = await this._host.fhr('getRegexpModelUri', []);
            try {
                this._regexpModel = await new Promise((resolve_1, reject_1) => { require([uri], resolve_1, reject_1); });
                return this._regexpModel;
            }
            catch (e) {
                this._regexpLoadFailed = true;
                // console.warn('error loading language detection model', e);
                return;
            }
        }
        async runRegexpModel(content, langBiases, supportedLangs) {
            const regexpModel = await this.getRegexpModel();
            if (!regexpModel) {
                return;
            }
            if (supportedLangs?.length) {
                // When using supportedLangs, normally computed biases are too extreme. Just use a "bitmask" of sorts.
                for (const lang of Object.keys(langBiases)) {
                    if (supportedLangs.includes(lang)) {
                        langBiases[lang] = 1;
                    }
                    else {
                        langBiases[lang] = 0;
                    }
                }
            }
            const detected = regexpModel.detect(content, langBiases, supportedLangs);
            return detected;
        }
        async getModelOperations() {
            if (this._modelOperations) {
                return this._modelOperations;
            }
            const uri = await this._host.fhr('getIndexJsUri', []);
            const { ModelOperations } = await new Promise((resolve_2, reject_2) => { require([uri], resolve_2, reject_2); });
            this._modelOperations = new ModelOperations({
                modelJsonLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getModelJsonUri', []));
                    try {
                        const modelJSON = await response.json();
                        return modelJSON;
                    }
                    catch (e) {
                        const message = `Failed to parse model JSON.`;
                        throw new Error(message);
                    }
                },
                weightsLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getWeightsUri', []));
                    const buffer = await response.arrayBuffer();
                    return buffer;
                }
            });
            return this._modelOperations;
        }
        // This adjusts the language confidence scores to be more accurate based on:
        // * VS Code's language usage
        // * Languages with 'problematic' syntaxes that have caused incorrect language detection
        adjustLanguageConfidence(modelResult) {
            switch (modelResult.languageId) {
                // For the following languages, we increase the confidence because
                // these are commonly used languages in VS Code and supported
                // by the model.
                case 'js':
                case 'html':
                case 'json':
                case 'ts':
                case 'css':
                case 'py':
                case 'xml':
                case 'php':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket1;
                    break;
                // case 'yaml': // YAML has been know to cause incorrect language detection because the language is pretty simple. We don't want to increase the confidence for this.
                case 'cpp':
                case 'sh':
                case 'java':
                case 'cs':
                case 'c':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket2;
                    break;
                // For the following languages, we need to be extra confident that the language is correct because
                // we've had issues like #131912 that caused incorrect guesses. To enforce this, we subtract the
                // negativeConfidenceCorrection from the confidence.
                // languages that are provided by default in VS Code
                case 'bat':
                case 'ini':
                case 'makefile':
                case 'sql':
                // languages that aren't provided by default in VS Code
                case 'csv':
                case 'toml':
                    // Other considerations for negativeConfidenceCorrection that
                    // aren't built in but suported by the model include:
                    // * Assembly, TeX - These languages didn't have clear language modes in the community
                    // * Markdown, Dockerfile - These languages are simple but they embed other languages
                    modelResult.confidence -= LanguageDetectionSimpleWorker.negativeConfidenceCorrection;
                    break;
                default:
                    break;
            }
            return modelResult;
        }
        async *detectLanguagesImpl(content) {
            if (this._loadFailed) {
                return;
            }
            let modelOperations;
            try {
                modelOperations = await this.getModelOperations();
            }
            catch (e) {
                console.log(e);
                this._loadFailed = true;
                return;
            }
            let modelResults;
            try {
                modelResults = await modelOperations.runModel(content);
            }
            catch (e) {
                console.warn(e);
            }
            if (!modelResults
                || modelResults.length === 0
                || modelResults[0].confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                return;
            }
            const firstModelResult = this.adjustLanguageConfidence(modelResults[0]);
            if (firstModelResult.confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                return;
            }
            const possibleLanguages = [firstModelResult];
            for (let current of modelResults) {
                if (current === firstModelResult) {
                    continue;
                }
                current = this.adjustLanguageConfidence(current);
                const currentHighest = possibleLanguages[possibleLanguages.length - 1];
                if (currentHighest.confidence - current.confidence >= LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                    while (possibleLanguages.length) {
                        yield possibleLanguages.shift();
                    }
                    if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                        possibleLanguages.push(current);
                        continue;
                    }
                    return;
                }
                else {
                    if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                        possibleLanguages.push(current);
                        continue;
                    }
                    return;
                }
            }
        }
    }
    exports.LanguageDetectionSimpleWorker = LanguageDetectionSimpleWorker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb25TaW1wbGVXb3JrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGFuZ3VhZ2VEZXRlY3Rpb24vYnJvd3Nlci9sYW5ndWFnZURldGVjdGlvblNpbXBsZVdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsd0JBRUM7SUFORDs7O09BR0c7SUFDSCxTQUFnQixNQUFNLENBQUMsSUFBdUI7UUFDN0MsT0FBTyxJQUFJLDZCQUE2QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLDZCQUE4QixTQUFRLHVDQUFrQjtRQUFyRTs7WUFPUyxzQkFBaUIsR0FBWSxLQUFLLENBQUM7WUFHbkMsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUFFN0Isb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQStPckQsQ0FBQztpQkExUHdCLCtCQUEwQixHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUNqQyx3Q0FBbUMsR0FBRyxJQUFJLEFBQVAsQ0FBUTtpQkFDM0Msd0NBQW1DLEdBQUcsS0FBSyxBQUFSLENBQVM7aUJBQzVDLGlDQUE0QixHQUFHLEdBQUcsQUFBTixDQUFPO1FBVXBELEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBVyxFQUFFLFVBQThDLEVBQUUsYUFBc0IsRUFBRSxjQUF5QjtZQUN6SSxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7WUFDL0IsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lB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