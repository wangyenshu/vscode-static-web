/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/marshalling", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput"], function (require, exports, errors_1, marshalling_1, mergeEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorSerializer = void 0;
    class MergeEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(editor) {
            return JSON.stringify(this.toJSON(editor));
        }
        toJSON(editor) {
            return {
                base: editor.base,
                input1: editor.input1,
                input2: editor.input2,
                result: editor.result,
            };
        }
        deserialize(instantiationService, raw) {
            try {
                const data = (0, marshalling_1.parse)(raw);
                return instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, data.base, new mergeEditorInput_1.MergeEditorInputData(data.input1.uri, data.input1.title, data.input1.detail, data.input1.description), new mergeEditorInput_1.MergeEditorInputData(data.input2.uri, data.input2.title, data.input2.detail, data.input2.description), data.result);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return undefined;
            }
        }
    }
    exports.MergeEditorSerializer = MergeEditorSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JTZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tZXJnZUVkaXRvclNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEscUJBQXFCO1FBQ2pDLFlBQVk7WUFDWCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxTQUFTLENBQUMsTUFBd0I7WUFDakMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQXdCO1lBQzlCLE9BQU87Z0JBQ04sSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUNqQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07Z0JBQ3JCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2FBQ3JCLENBQUM7UUFDSCxDQUFDO1FBRUQsV0FBVyxDQUFDLG9CQUEyQyxFQUFFLEdBQVc7WUFDbkUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxHQUF5QixJQUFBLG1CQUFLLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUN6QyxtQ0FBZ0IsRUFDaEIsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLHVDQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQ3pHLElBQUksdUNBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDekcsSUFBSSxDQUFDLE1BQU0sQ0FDWCxDQUFDO1lBQ0gsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsSUFBQSwwQkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWpDRCxzREFpQ0MifQ==