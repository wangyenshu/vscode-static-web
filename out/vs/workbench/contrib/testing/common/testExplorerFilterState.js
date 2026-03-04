var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, glob_1, lifecycle_1, instantiation_1, storage_1, observableValue_1, storedValue_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestFilterTerm = exports.TestExplorerFilterState = exports.ITestExplorerFilterState = void 0;
    exports.ITestExplorerFilterState = (0, instantiation_1.createDecorator)('testingFilterState');
    const tagRe = /!?@([^ ,:]+)/g;
    const trimExtraWhitespace = (str) => str.replace(/\s\s+/g, ' ').trim();
    let TestExplorerFilterState = class TestExplorerFilterState extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.focusEmitter = new event_1.Emitter();
            /**
             * Mapping of terms to whether they're included in the text.
             */
            this.termFilterState = {};
            /** @inheritdoc */
            this.globList = [];
            /** @inheritdoc */
            this.includeTags = new Set();
            /** @inheritdoc */
            this.excludeTags = new Set();
            /** @inheritdoc */
            this.text = this._register(new observableValue_1.MutableObservableValue(''));
            /** @inheritdoc */
            this.fuzzy = this._register(observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'testHistoryFuzzy',
                scope: 0 /* StorageScope.PROFILE */,
                target: 0 /* StorageTarget.USER */,
            }, this.storageService), false));
            this.reveal = this._register(new observableValue_1.MutableObservableValue(undefined));
            this.onDidRequestInputFocus = this.focusEmitter.event;
        }
        /** @inheritdoc */
        focusInput() {
            this.focusEmitter.fire();
        }
        /** @inheritdoc */
        setText(text) {
            if (text === this.text.value) {
                return;
            }
            this.termFilterState = {};
            this.globList = [];
            this.includeTags.clear();
            this.excludeTags.clear();
            let globText = '';
            let lastIndex = 0;
            for (const match of text.matchAll(tagRe)) {
                let nextIndex = match.index + match[0].length;
                const tag = match[0];
                if (allTestFilterTerms.includes(tag)) {
                    this.termFilterState[tag] = true;
                }
                // recognize and parse @ctrlId:tagId or quoted like @ctrlId:"tag \\"id"
                if (text[nextIndex] === ':') {
                    nextIndex++;
                    let delimiter = text[nextIndex];
                    if (delimiter !== `"` && delimiter !== `'`) {
                        delimiter = ' ';
                    }
                    else {
                        nextIndex++;
                    }
                    let tagId = '';
                    while (nextIndex < text.length && text[nextIndex] !== delimiter) {
                        if (text[nextIndex] === '\\') {
                            tagId += text[nextIndex + 1];
                            nextIndex += 2;
                        }
                        else {
                            tagId += text[nextIndex];
                            nextIndex++;
                        }
                    }
                    if (match[0].startsWith('!')) {
                        this.excludeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    else {
                        this.includeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    nextIndex++;
                }
                globText += text.slice(lastIndex, match.index);
                lastIndex = nextIndex;
            }
            globText += text.slice(lastIndex).trim();
            if (globText.length) {
                for (const filter of (0, glob_1.splitGlobAware)(globText, ',').map(s => s.trim()).filter(s => !!s.length)) {
                    if (filter.startsWith('!')) {
                        this.globList.push({ include: false, text: filter.slice(1).toLowerCase() });
                    }
                    else {
                        this.globList.push({ include: true, text: filter.toLowerCase() });
                    }
                }
            }
            this.text.value = text; // purposely afterwards so everything is updated when the change event happen
        }
        /** @inheritdoc */
        isFilteringFor(term) {
            return !!this.termFilterState[term];
        }
        /** @inheritdoc */
        toggleFilteringFor(term, shouldFilter) {
            const text = this.text.value.trim();
            if (shouldFilter !== false && !this.termFilterState[term]) {
                this.setText(text ? `${text} ${term}` : term);
            }
            else if (shouldFilter !== true && this.termFilterState[term]) {
                this.setText(trimExtraWhitespace(text.replace(term, '')));
            }
        }
    };
    exports.TestExplorerFilterState = TestExplorerFilterState;
    exports.TestExplorerFilterState = TestExplorerFilterState = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExplorerFilterState);
    var TestFilterTerm;
    (function (TestFilterTerm) {
        TestFilterTerm["Failed"] = "@failed";
        TestFilterTerm["Executed"] = "@executed";
        TestFilterTerm["CurrentDoc"] = "@doc";
        TestFilterTerm["Hidden"] = "@hidden";
    })(TestFilterTerm || (exports.TestFilterTerm = TestFilterTerm = {}));
    const allTestFilterTerms = [
        "@failed" /* TestFilterTerm.Failed */,
        "@executed" /* TestFilterTerm.Executed */,
        "@doc" /* TestFilterTerm.CurrentDoc */,
        "@hidden" /* TestFilterTerm.Hidden */,
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4cGxvcmVyRmlsdGVyU3RhdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0RXhwbG9yZXJGaWx0ZXJTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBa0VhLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQixvQkFBb0IsQ0FBQyxDQUFDO0lBRXhHLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQztJQUM5QixNQUFNLG1CQUFtQixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV4RSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBK0J0RCxZQUE2QixjQUFnRDtZQUM1RSxLQUFLLEVBQUUsQ0FBQztZQURxQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUE3QjVELGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNwRDs7ZUFFRztZQUNLLG9CQUFlLEdBQXFDLEVBQUUsQ0FBQztZQUUvRCxrQkFBa0I7WUFDWCxhQUFRLEdBQXlDLEVBQUUsQ0FBQztZQUUzRCxrQkFBa0I7WUFDWCxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFFdkMsa0JBQWtCO1lBQ1gsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBRXZDLGtCQUFrQjtZQUNGLFNBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0NBQXNCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV0RSxrQkFBa0I7WUFDRixVQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3Q0FB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