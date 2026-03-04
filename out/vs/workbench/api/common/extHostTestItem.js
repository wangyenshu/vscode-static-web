define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/api/common/extHostTestingPrivateApi", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/uri"], function (require, exports, editorRange, extHostTestingPrivateApi_1, testId_1, testItemCollection_1, testTypes_1, Convert, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTestItemCollection = exports.TestItemRootImpl = exports.TestItemImpl = exports.toItemFromContext = void 0;
    const testItemPropAccessor = (api, defaultValue, equals, toUpdate) => {
        let value = defaultValue;
        return {
            enumerable: true,
            configurable: false,
            get() {
                return value;
            },
            set(newValue) {
                if (!equals(value, newValue)) {
                    const oldValue = value;
                    value = newValue;
                    api.listener?.(toUpdate(newValue, oldValue));
                }
            },
        };
    };
    const strictEqualComparator = (a, b) => a === b;
    const propComparators = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.isEqual(b);
        },
        label: strictEqualComparator,
        description: strictEqualComparator,
        sortText: strictEqualComparator,
        busy: strictEqualComparator,
        error: strictEqualComparator,
        canResolveChildren: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.find(t2 => t1.id === t2.id))) {
                return false;
            }
            return true;
        },
    };
    const evSetProps = (fn) => v => ({ op: 4 /* TestItemEventOp.SetProp */, update: fn(v) });
    const makePropDescriptors = (api, label) => ({
        range: (() => {
            let value;
            const updateProps = evSetProps(r => ({ range: editorRange.Range.lift(Convert.Range.from(r)) }));
            return {
                enumerable: true,
                configurable: false,
                get() {
                    return value;
                },
                set(newValue) {
                    api.listener?.({ op: 6 /* TestItemEventOp.DocumentSynced */ });
                    if (!propComparators.range(value, newValue)) {
                        value = newValue;
                        api.listener?.(updateProps(newValue));
                    }
                },
            };
        })(),
        label: testItemPropAccessor(api, label, propComparators.label, evSetProps(label => ({ label }))),
        description: testItemPropAccessor(api, undefined, propComparators.description, evSetProps(description => ({ description }))),
        sortText: testItemPropAccessor(api, undefined, propComparators.sortText, evSetProps(sortText => ({ sortText }))),
        canResolveChildren: testItemPropAccessor(api, false, propComparators.canResolveChildren, state => ({
            op: 2 /* TestItemEventOp.UpdateCanResolveChildren */,
            state,
        })),
        busy: testItemPropAccessor(api, false, propComparators.busy, evSetProps(busy => ({ busy }))),
        error: testItemPropAccessor(api, undefined, propComparators.error, evSetProps(error => ({ error: Convert.MarkdownString.fromStrict(error) || null }))),
        tags: testItemPropAccessor(api, [], propComparators.tags, (current, previous) => ({
            op: 1 /* TestItemEventOp.SetTags */,
            new: current.map(Convert.TestTag.from),
            old: previous.map(Convert.TestTag.from),
        })),
    });
    const toItemFromPlain = (item) => {
        const testId = testId_1.TestId.fromString(item.extId);
        const testItem = new TestItemImpl(testId.controllerId, testId.localId, item.label, uri_1.URI.revive(item.uri) || undefined);
        testItem.range = Convert.Range.to(item.range || undefined);
        testItem.description = item.description || undefined;
        testItem.sortText = item.sortText || undefined;
        testItem.tags = item.tags.map(t => Convert.TestTag.to({ id: (0, testTypes_1.denamespaceTestTag)(t).tagId }));
        return testItem;
    };
    const toItemFromContext = (context) => {
        let node;
        for (const test of context.tests) {
            const next = toItemFromPlain(test.item);
            (0, extHostTestingPrivateApi_1.getPrivateApiFor)(next).parent = node;
            node = next;
        }
        return node;
    };
    exports.toItemFromContext = toItemFromContext;
    class TestItemImpl {
        /**
         * Note that data is deprecated and here for back-compat only
         */
        constructor(controllerId, id, label, uri) {
            if (id.includes("\0" /* TestIdPathParts.Delimiter */)) {
                throw new Error(`Test IDs may not include the ${JSON.stringify(id)} symbol`);
            }
            const api = (0, extHostTestingPrivateApi_1.createPrivateApiFor)(this, controllerId);
            Object.defineProperties(this, {
                id: {
                    value: id,
                    enumerable: true,
                    writable: false,
                },
                uri: {
                    value: uri,
                    enumerable: true,
                    writable: false,
                },
                parent: {
                    enumerable: false,
                    get() {
                        return api.parent instanceof TestItemRootImpl ? undefined : api.parent;
                    },
                },
                children: {
                    value: (0, testItemCollection_1.createTestItemChildren)(api, extHostTestingPrivateApi_1.getPrivateApiFor, TestItemImpl),
                    enumerable: true,
                    writable: false,
                },
                ...makePropDescriptors(api, label),
            });
        }
    }
    exports.TestItemImpl = TestItemImpl;
    class TestItemRootImpl extends TestItemImpl {
        constructor(controllerId, label) {
            super(controllerId, controllerId, label, undefined);
            this._isRoot = true;
        }
    }
    exports.TestItemRootImpl = TestItemRootImpl;
    class ExtHostTestItemCollection extends testItemCollection_1.TestItemCollection {
        constructor(controllerId, controllerLabel, editors) {
            super({
                controllerId,
                getDocumentVersion: uri => uri && editors.getDocument(uri)?.version,
                getApiFor: extHostTestingPrivateApi_1.getPrivateApiFor,
                getChildren: (item) => item.children,
                root: new TestItemRootImpl(controllerId, controllerLabel),
                toITestItem: Convert.TestItem.from,
            });
        }
    }
    exports.ExtHostTestItemCollection = ExtHostTestItemCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RJdGVtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRlc3RJdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFjQSxNQUFNLG9CQUFvQixHQUFHLENBQzVCLEdBQXdCLEVBQ3hCLFlBQWdDLEVBQ2hDLE1BQWlFLEVBQ2pFLFFBQThGLEVBQzdGLEVBQUU7UUFDSCxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUM7UUFDekIsT0FBTztZQUNOLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1lBQ25CLEdBQUc7Z0JBQ0YsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsR0FBRyxDQUFDLFFBQTRCO2dCQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM5QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUM7b0JBQ3ZCLEtBQUssR0FBRyxRQUFRLENBQUM7b0JBQ2pCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLENBQUM7WUFDRixDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUMsQ0FBQztJQUlGLE1BQU0scUJBQXFCLEdBQUcsQ0FBSSxDQUFJLEVBQUUsQ0FBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXpELE1BQU0sZUFBZSxHQUF3RztRQUM1SCxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDZixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxPQUFPLElBQUksQ0FBQztZQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLENBQUMsSUFBSSxD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