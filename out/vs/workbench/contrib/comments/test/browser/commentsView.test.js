/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/editor/common/core/range", "vs/workbench/contrib/comments/browser/commentsView", "vs/workbench/contrib/comments/browser/commentService", "vs/base/common/event", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/hover/browser/hover", "vs/platform/hover/test/browser/nullHoverService"], function (require, exports, assert, workbenchTestServices_1, range_1, commentsView_1, commentService_1, event_1, views_1, configuration_1, testConfigurationService_1, contextView_1, lifecycle_1, utils_1, hover_1, nullHoverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestViewDescriptorService = void 0;
    class TestCommentThread {
        isDocumentCommentThread() {
            return true;
        }
        constructor(commentThreadHandle, controllerHandle, threadId, resource, range, comments) {
            this.commentThreadHandle = commentThreadHandle;
            this.controllerHandle = controllerHandle;
            this.threadId = threadId;
            this.resource = resource;
            this.range = range;
            this.comments = comments;
            this.onDidChangeComments = new event_1.Emitter().event;
            this.onDidChangeInitialCollapsibleState = new event_1.Emitter().event;
            this.canReply = false;
            this.onDidChangeInput = new event_1.Emitter().event;
            this.onDidChangeRange = new event_1.Emitter().event;
            this.onDidChangeLabel = new event_1.Emitter().event;
            this.onDidChangeCollapsibleState = new event_1.Emitter().event;
            this.onDidChangeState = new event_1.Emitter().event;
            this.onDidChangeCanReply = new event_1.Emitter().event;
            this.isDisposed = false;
            this.isTemplate = false;
            this.label = undefined;
            this.contextValue = undefined;
        }
    }
    class TestCommentController {
        constructor() {
            this.id = 'test';
            this.label = 'Test Comments';
            this.owner = 'test';
            this.features = {};
        }
        createCommentThreadTemplate(resource, range) {
            throw new Error('Method not implemented.');
        }
        updateCommentThreadTemplate(threadHandle, range) {
            throw new Error('Method not implemented.');
        }
        deleteCommentThreadMain(commentThreadId) {
            throw new Error('Method not implemented.');
        }
        toggleReaction(uri, thread, comment, reaction, token) {
            throw new Error('Method not implemented.');
        }
        getDocumentComments(resource, token) {
            throw new Error('Method not implemented.');
        }
        getNotebookComments(resource, token) {
            throw new Error('Method not implemented.');
        }
        setActiveCommentAndThread(commentInfo) {
            throw new Error('Method not implemented.');
        }
    }
    class TestViewDescriptorService {
        constructor() {
            this.onDidChangeLocation = new event_1.Emitter().event;
        }
        getViewLocationById(id) {
            return 1 /* ViewContainerLocation.Panel */;
        }
        getViewDescriptorById(id) {
            return null;
        }
        getViewContainerByViewId(id) {
            return {
                id: 'comments',
                title: { value: 'Comments', original: 'Comments' },
                ctorDescriptor: {}
            };
        }
        getViewContainerModel(viewContainer) {
            const partialViewContainerModel = {
                onDidChangeContainerInfo: new event_1.Emitter().event
            };
            return partialViewContainerModel;
        }
        getDefaultContainerById(id) {
            return null;
        }
    }
    exports.TestViewDescriptorService = TestViewDescriptorService;
    suite('Comments View', function () {
        teardown(() => {
            instantiationService.dispose();
            commentService.dispose();
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let disposables;
        let instantiationService;
        let commentService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({}, disposables);
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(hover_1.IHoverService, nullHoverService_1.NullHoverService);
            instantiationService.stub(contextView_1.IContextViewService, {});
            instantiationService.stub(views_1.IViewDescriptorService, new TestViewDescriptorService());
            commentService = instantiationService.createInstance(commentService_1.CommentService);
            instantiationService.stub(commentService_1.ICommentService, commentService);
            commentService.registerCommentController('test', new TestCommentController());
        });
        test('collapse all', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.areAllCommentsExpanded(), true);
            view.collapseAll();
            assert.strictEqual(view.isSomeCommentsExpanded(), false);
            view.dispose();
        });
        test('expand all', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            view.collapseAll();
            assert.strictEqual(view.isSomeCommentsExpanded(), false);
            view.expandAll();
            assert.strictEqual(view.areAllCommentsExpanded(), true);
            view.dispose();
        });
        test('filter by text', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.setVisible(true);
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'This comment is a cat.', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'This comment is a dog.', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 2);
            view.getFilterWidget().setFilterText('cat');
            // Setting showResolved causes the filter to trigger for the purposes of this test.
            view.filters.showResolved = false;
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 1);
            view.clearFilterText();
            // Setting showResolved causes the filter to trigger for the purposes of this test.
            view.filters.showResolved = true;
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 2);
            view.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNWaWV3LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy90ZXN0L2Jyb3dzZXIvY29tbWVudHNWaWV3LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFNLGlCQUFpQjtRQUN0Qix1QkFBdUI7WUFDdEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsWUFBNEIsbUJBQTJCLEVBQ3RDLGdCQUF3QixFQUN4QixRQUFnQixFQUNoQixRQUFnQixFQUNoQixLQUFhLEVBQ2IsUUFBbUI7WUFMUix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQVE7WUFDdEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1lBQ3hCLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDaEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUNoQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsYUFBUSxHQUFSLFFBQVEsQ0FBVztZQUVwQyx3QkFBbUIsR0FBMEMsSUFBSSxlQUFPLEVBQWtDLENBQUMsS0FBSyxDQUFDO1lBQ2pILHVDQUFrQyxHQUFxRCxJQUFJLGVBQU8sRUFBNkMsQ0FBQyxLQUFLLENBQUM7WUFDdEosYUFBUSxHQUFZLEtBQUssQ0FBQztZQUMxQixxQkFBZ0IsR0FBb0MsSUFBSSxlQUFPLEVBQTRCLENBQUMsS0FBSyxDQUFDO1lBQ2xHLHFCQUFnQixHQUFrQixJQUFJLGVBQU8sRUFBVSxDQUFDLEtBQUssQ0FBQztZQUM5RCxxQkFBZ0IsR0FBOEIsSUFBSSxlQUFPLEVBQXNCLENBQUMsS0FBSyxDQUFDO1lBQ3RGLGdDQUEyQixHQUFxRCxJQUFJLGVBQU8sRUFBNkMsQ0FBQyxLQUFLLENBQUM7WUFDL0kscUJBQWdCLEdBQTBDLElBQUksZUFBTyxFQUFr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