/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/network"], function (require, exports, assert, path, pfs_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertResolveKeyboardEvent = assertResolveKeyboardEvent;
    exports.assertResolveKeybinding = assertResolveKeybinding;
    exports.readRawMapping = readRawMapping;
    exports.assertMapping = assertMapping;
    function toIResolvedKeybinding(kb) {
        return {
            label: kb.getLabel(),
            ariaLabel: kb.getAriaLabel(),
            electronAccelerator: kb.getElectronAccelerator(),
            userSettingsLabel: kb.getUserSettingsLabel(),
            isWYSIWYG: kb.isWYSIWYG(),
            isMultiChord: kb.hasMultipleChords(),
            dispatchParts: kb.getDispatchChords(),
            singleModifierDispatchParts: kb.getSingleModifierDispatchChords()
        };
    }
    function assertResolveKeyboardEvent(mapper, keyboardEvent, expected) {
        const actual = toIResolvedKeybinding(mapper.resolveKeyboardEvent(keyboardEvent));
        assert.deepStrictEqual(actual, expected);
    }
    function assertResolveKeybinding(mapper, keybinding, expected) {
        const actual = mapper.resolveKeybinding(keybinding).map(toIResolvedKeybinding);
        assert.deepStrictEqual(actual, expected);
    }
    function readRawMapping(file) {
        return pfs_1.Promises.readFile(network_1.FileAccess.asFileUri(`vs/workbench/services/keybinding/test/node/${file}.js`).fsPath).then((buff) => {
            const contents = buff.toString();
            const func = new Function('define', contents); // CodeQL [SM01632] This is used in tests and we read the files as JS to avoid slowing down TS compilation
            let rawMappings = null;
            func(function (value) {
                rawMappings = value;
            });
            return rawMappings;
        });
    }
    function assertMapping(writeFileIfDifferent, mapper, file) {
        const filePath = path.normalize(network_1.FileAccess.asFileUri(`vs/workbench/services/keybinding/test/node/${file}`).fsPath);
        return pfs_1.Promises.readFile(filePath).then((buff) => {
            const expected = buff.toString().replace(/\r\n/g, '\n');
            const actual = mapper.dumpDebugInfo().replace(/\r\n/g, '\n');
            if (actual !== expected && writeFileIfDifferent) {
                const destPath = filePath.replace(/[\/\\]out[\/\\]vs[\/\\]workbench/, '/src/vs/workbench');
                pfs_1.Promises.writeFile(destPath, actual);
            }
            assert.deepStrictEqual(actual, expected);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRNYXBwZXJUZXN0VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy90ZXN0L25vZGUva2V5Ym9hcmRNYXBwZXJUZXN0VXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQ2hHLGdFQUdDO0lBRUQsMERBR0M7SUFFRCx3Q0FVQztJQUVELHNDQVlDO0lBL0NELFNBQVMscUJBQXFCLENBQUMsRUFBc0I7UUFDcEQsT0FBTztZQUNOLEtBQUssRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFO1lBQ3BCLFNBQVMsRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFO1lBQzVCLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRTtZQUNoRCxpQkFBaUIsRUFBRSxFQUFFLENBQUMsb0JBQW9CLEVBQUU7WUFDNUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUU7WUFDekIsWUFBWSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtZQUNwQyxhQUFhLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFO1lBQ3JDLDJCQUEyQixFQUFFLEVBQUUsQ0FBQywrQkFBK0IsRUFBRTtTQUNqRSxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLE1BQXVCLEVBQUUsYUFBNkIsRUFBRSxRQUE2QjtRQUMvSCxNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBZ0IsdUJBQXVCLENBQUMsTUFBdUIsRUFBRSxVQUFzQixFQUFFLFFBQStCO1FBQ3ZILE1BQU0sTUFBTSxHQUEwQixNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDdEcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBSSxJQUFZO1FBQzdDLE9BQU8sY0FBUSxDQUFDLFFBQVEsQ0FBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyw4Q0FBOEMsSUFBSSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUM1SCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUEsMEdBQTBHO1lBQ3hKLElBQUksV0FBVyxHQUFhLElBQUksQ0FBQztZQUNqQyxJQUFJLENBQUMsVUFBVSxLQUFRO2dCQUN0QixXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxXQUFZLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLG9CQUE2QixFQUFFLE1BQXVCLEVBQUUsSUFBWTtRQUNqRyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLDhDQUE4QyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5ILE9BQU8sY0FBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RCxJQUFJLE1BQU0sS0FBSyxRQUFRLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO2dCQUMzRixjQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=