/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon"], function (require, exports, sinon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mockObject = void 0;
    exports.mock = mock;
    function mock() {
        return function () { };
    }
    // Creates an object object that returns sinon mocks for every property. Optionally
    // takes base properties.
    const mockObject = () => (properties) => {
        return new Proxy({ ...properties }, {
            get(target, key) {
                if (!target.hasOwnProperty(key)) {
                    target[key] = (0, sinon_1.stub)();
                }
                return target[key];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            },
        });
    };
    exports.mockObject = mockObject;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vbW9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsb0JBRUM7SUFGRCxTQUFnQixJQUFJO1FBQ25CLE9BQU8sY0FBYyxDQUFRLENBQUM7SUFDL0IsQ0FBQztJQUlELG1GQUFtRjtJQUNuRix5QkFBeUI7SUFDbEIsTUFBTSxVQUFVLEdBQUcsR0FBcUIsRUFBRSxDQUFDLENBQTZCLFVBQWUsRUFBMkIsRUFBRTtRQUMxSCxPQUFPLElBQUksS0FBSyxDQUFDLEVBQUUsR0FBRyxVQUFVLEVBQVMsRUFBRTtZQUMxQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUc7Z0JBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUEsWUFBSSxHQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBRUQsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUs7Z0JBQ3JCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ3BCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztTQUNELENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztJQWRXLFFBQUEsVUFBVSxjQWNyQiJ9