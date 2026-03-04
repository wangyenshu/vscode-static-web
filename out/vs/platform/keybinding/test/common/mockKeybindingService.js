/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, event_1, keybindings_1, platform_1, keybindingResolver_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockKeybindingService = exports.MockScopableContextKeyService = exports.MockContextKeyService = void 0;
    class MockKeybindingContextKey {
        constructor(defaultValue) {
            this._defaultValue = defaultValue;
            this._value = this._defaultValue;
        }
        set(value) {
            this._value = value;
        }
        reset() {
            this._value = this._defaultValue;
        }
        get() {
            return this._value;
        }
    }
    class MockContextKeyService {
        constructor() {
            this._keys = new Map();
        }
        dispose() {
            //
        }
        createKey(key, defaultValue) {
            const ret = new MockKeybindingContextKey(defaultValue);
            this._keys.set(key, ret);
            return ret;
        }
        contextMatchesRules(rules) {
            return false;
        }
        get onDidChangeContext() {
            return event_1.Event.None;
        }
        bufferChangeEvents(callback) { callback(); }
        getContextKeyValue(key) {
            const value = this._keys.get(key);
            if (value) {
                return value.get();
            }
        }
        getContext(domNode) {
            return null;
        }
        createScoped(domNode) {
            return this;
        }
        createOverlay() {
            return this;
        }
        updateParent(_parentContextKeyService) {
            // no-op
        }
    }
    exports.MockContextKeyService = MockContextKeyService;
    class MockScopableContextKeyService extends MockContextKeyService {
        /**
         * Don't implement this for all tests since we rarely depend on this behavior and it isn't implemented fully
         */
        createScoped(domNote) {
            return new MockScopableContextKeyService();
        }
    }
    exports.MockScopableContextKeyService = MockScopableContextKeyService;
    class MockKeybindingService {
        constructor() {
            this.inChordMode = false;
        }
        get onDidUpdateKeybindings() {
            return event_1.Event.None;
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        getDefaultKeybindings() {
            return [];
        }
        getKeybindings() {
            return [];
        }
        resolveKeybinding(keybinding) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return this.resolveKeybinding(chord.toKeybinding())[0];
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        lookupKeybindings(commandId) {
            return [];
        }
        lookupKeybinding(commandId) {
            return undefined;
        }
        customKeybindingsCount() {
            return 0;
        }
        softDispatch(keybinding, target) {
            return keybindingResolver_1.NoMatchingKb;
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
        }
        dispatchEvent(e, target) {
            return false;
        }
        enableKeybindingHoldMode(commandId) {
            return undefined;
        }
        mightProducePrintableCharacter(e) {
            return false;
        }
        toggleLogging() {
            return false;
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution() {
            // noop
        }
    }
    exports.MockKeybindingService = MockKeybindingService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0tleWJpbmRpbmdTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy90ZXN0L2NvbW1vbi9tb2NrS2V5YmluZGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQU0sd0JBQXdCO1FBSTdCLFlBQVksWUFBMkI7WUFDdEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ2xDLENBQUM7UUFFTSxHQUFHLENBQUMsS0FBb0I7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDbEMsQ0FBQztRQUVNLEdBQUc7WUFDVCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBRUQsTUFBYSxxQkFBcUI7UUFBbEM7WUFHUyxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7UUFtQ3JELENBQUM7UUFqQ08sT0FBTztZQUNiLEVBQUU7UUFDSCxDQUFDO1FBQ00sU0FBUyxDQUE4QyxHQUFXLEVBQUUsWUFBMkI7WUFDckcsTUFBTSxHQUFHLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDekIsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBQ00sbUJBQW1CLENBQUMsS0FBMkI7WUFDckQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBVyxr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