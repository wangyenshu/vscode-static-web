/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindingParser", "vs/platform/contextkey/common/contextkey"], function (require, exports, keybindingParser_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputBuilder = exports.KeybindingIO = void 0;
    class KeybindingIO {
        static writeKeybindingItem(out, item) {
            if (!item.resolvedKeybinding) {
                return;
            }
            const quotedSerializedKeybinding = JSON.stringify(item.resolvedKeybinding.getUserSettingsLabel());
            out.write(`{ "key": ${rightPaddedString(quotedSerializedKeybinding + ',', 25)} "command": `);
            const quotedSerializedWhen = item.when ? JSON.stringify(item.when.serialize()) : '';
            const quotedSerializeCommand = JSON.stringify(item.command);
            if (quotedSerializedWhen.length > 0) {
                out.write(`${quotedSerializeCommand},`);
                out.writeLine();
                out.write(`                                     "when": ${quotedSerializedWhen}`);
            }
            else {
                out.write(`${quotedSerializeCommand}`);
            }
            if (item.commandArgs) {
                out.write(',');
                out.writeLine();
                out.write(`                                     "args": ${JSON.stringify(item.commandArgs)}`);
            }
            out.write(' }');
        }
        static readUserKeybindingItem(input) {
            const keybinding = 'key' in input && typeof input.key === 'string'
                ? keybindingParser_1.KeybindingParser.parseKeybinding(input.key)
                : null;
            const when = 'when' in input && typeof input.when === 'string'
                ? contextkey_1.ContextKeyExpr.deserialize(input.when)
                : undefined;
            const command = 'command' in input && typeof input.command === 'string'
                ? input.command
                : null;
            const commandArgs = 'args' in input && typeof input.args !== 'undefined'
                ? input.args
                : undefined;
            return {
                keybinding,
                command,
                commandArgs,
                when,
                _sourceKey: 'key' in input && typeof input.key === 'string' ? input.key : undefined,
            };
        }
    }
    exports.KeybindingIO = KeybindingIO;
    function rightPaddedString(str, minChars) {
        if (str.length < minChars) {
            return str + (new Array(minChars - str.length).join(' '));
        }
        return str;
    }
    class OutputBuilder {
        constructor() {
            this._lines = [];
            this._currentLine = '';
        }
        write(str) {
            this._currentLine += str;
        }
        writeLine(str = '') {
            this._lines.push(this._currentLine + str);
            this._currentLine = '';
        }
        toString() {
            this.writeLine();
            return this._lines.join('\n');
        }
    }
    exports.OutputBuilder = OutputBuilder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0lPLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvY29tbW9uL2tleWJpbmRpbmdJTy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxZQUFZO1FBRWpCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFrQixFQUFFLElBQTRCO1lBQ2pGLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQUNsRyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksaUJBQWlCLENBQUMsMEJBQTBCLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU3RixNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDcEYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1RCxJQUFJLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLHNCQUFzQixHQUFHLENBQUMsQ0FBQztnQkFDeEMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixHQUFHLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxvQkFB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