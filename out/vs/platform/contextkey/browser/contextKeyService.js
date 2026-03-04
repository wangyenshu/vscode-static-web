/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, iterator_1, lifecycle_1, objects_1, ternarySearchTree_1, uri_1, nls_1, commands_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextKeyService = exports.AbstractContextKeyService = exports.Context = void 0;
    exports.setContext = setContext;
    const KEYBINDING_CONTEXT_ATTR = 'data-keybinding-context';
    class Context {
        constructor(id, parent) {
            this._id = id;
            this._parent = parent;
            this._value = Object.create(null);
            this._value['_contextId'] = id;
        }
        get value() {
            return { ...this._value };
        }
        setValue(key, value) {
            // console.log('SET ' + key + ' = ' + value + ' ON ' + this._id);
            if (this._value[key] !== value) {
                this._value[key] = value;
                return true;
            }
            return false;
        }
        removeValue(key) {
            // console.log('REMOVE ' + key + ' FROM ' + this._id);
            if (key in this._value) {
                delete this._value[key];
                return true;
            }
            return false;
        }
        getValue(key) {
            const ret = this._value[key];
            if (typeof ret === 'undefined' && this._parent) {
                return this._parent.getValue(key);
            }
            return ret;
        }
        updateParent(parent) {
            this._parent = parent;
        }
        collectAllValues() {
            let result = this._parent ? this._parent.collectAllValues() : Object.create(null);
            result = { ...result, ...this._value };
            delete result['_contextId'];
            return result;
        }
    }
    exports.Context = Context;
    class NullContext extends Context {
        static { this.INSTANCE = new NullContext(); }
        constructor() {
            super(-1, null);
        }
        setValue(key, value) {
            return false;
        }
        removeValue(key) {
            return false;
        }
        getValue(key) {
            return undefined;
        }
        collectAllValues() {
            return Object.create(null);
        }
    }
    class ConfigAwareContextValuesContainer extends Context {
        static { this._keyPrefix = 'config.'; }
        constructor(id, _configurationService, emitter) {
            super(id, null);
            this._configurationService = _configurationService;
            this._values = ternarySearchTree_1.TernarySearchTree.forConfigKeys();
            this._listener = this._configurationService.onDidChangeConfiguration(event => {
                if (event.source === 7 /* ConfigurationTarget.DEFAULT */) {
                    // new setting, reset everything
                    const allKeys = Array.from(this._values, ([k]) => k);
                    this._values.clear();
                    emitter.fire(new ArrayContextKeyChangeEvent(allKeys));
                }
                else {
                    const changedKeys = [];
                    for (const configKey of event.affectedKeys) {
                        const contextKey = `config.${configKey}`;
                        const cachedItems = this._values.findSuperstr(contextKey);
                        if (cachedItems !== undefined) {
                            changedKeys.push(...iterator_1.Iterable.map(cachedItems, ([key]) => key));
                            this._values.deleteSuperstr(contextKey);
                        }
                        if (this._values.has(contextKey)) {
                            changedKeys.push(contextKey);
                            this._values.delete(contextKey);
                        }
                    }
                    emitter.fire(new ArrayContextKeyChangeEvent(changedKeys));
                }
            });
        }
        dispose() {
            this._listener.dispose();
        }
        getValue(key) {
            if (key.indexOf(ConfigAwareContextValuesContainer._keyPrefix) !== 0) {
                return super.getValue(key);
            }
            if (this._values.has(key)) {
                return this._values.get(key);
            }
            const configKey = key.substr(ConfigAwareContextValuesContainer._keyPrefix.length);
            const configValue = this._configurationService.getValue(configKey);
            let value = undefined;
            switch (typeof configValue) {
                case 'number':
                case 'boolean':
                case 'string':
                    value = configValue;
                    break;
                default:
                    if (Array.isArray(configValue)) {
                        value = JSON.stringify(configValue);
                    }
                    else {
                        value = configValue;
                    }
            }
            this._values.set(key, value);
            return value;
        }
        setValue(key, value) {
            return super.setValue(key, value);
        }
        removeValue(key) {
            return super.removeValue(key);
        }
        collectAllValues() {
            const result = Object.create(null);
            this._values.forEach((value, index) => result[index] = value);
            return { ...result, ...super.collectAllValues() };
        }
    }
    class ContextKey {
        constructor(service, key, defaultValue) {
            this._service = service;
            this._key = key;
            this._defaultValue = defaultValue;
            this.reset();
        }
        set(value) {
            this._service.setContext(this._key, value);
        }
        reset() {
            if (typeof this._defaultValue === 'undefined') {
                this._service.removeContext(this._key);
            }
            else {
                this._service.setContext(this._key, this._defaultValue);
            }
        }
        get() {
            return this._service.getContextKeyValue(this._key);
        }
    }
    class SimpleContextKeyChangeEvent {
        constructor(key) {
            this.key = key;
        }
        affectsSome(keys) {
            return keys.has(this.key);
        }
        allKeysContainedIn(keys) {
            return this.affectsSome(keys);
        }
    }
    class ArrayContextKeyChangeEvent {
        constructor(keys) {
            this.keys = keys;
        }
        affectsSome(keys) {
            for (const key of this.keys) {
                if (keys.has(key)) {
                    return true;
                }
            }
            return false;
        }
        allKeysContainedIn(keys) {
            return this.keys.every(key => keys.has(key));
        }
    }
    class CompositeContextKeyChangeEvent {
        constructor(events) {
            this.events = events;
        }
        affectsSome(keys) {
            for (const e of this.events) {
                if (e.affectsSome(keys)) {
                    return true;
                }
            }
            return false;
        }
        allKeysContainedIn(keys) {
            return this.events.every(evt => evt.allKeysContainedIn(keys));
        }
    }
    function allEventKeysInContext(event, context) {
        return event.allKeysContainedIn(new Set(Object.keys(context)));
    }
    class AbstractContextKeyService extends lifecycle_1.Disposable {
        constructor(myContextId) {
            super();
            this._onDidChangeContext = this._register(new event_1.PauseableEmitter({ merge: input => new CompositeContextKeyChangeEvent(input) }));
            this.onDidChangeContext = this._onDidChangeContext.event;
            this._isDisposed = false;
            this._myContextId = myContextId;
        }
        get contextId() {
            return this._myContextId;
        }
        createKey(key, defaultValue) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ContextKey(this, key, defaultValue);
        }
        bufferChangeEvents(callback) {
            this._onDidChangeContext.pause();
            try {
                callback();
            }
            finally {
                this._onDidChangeContext.resume();
            }
        }
        createScoped(domNode) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ScopedContextKeyService(this, domNode);
        }
        createOverlay(overlay = iterator_1.Iterable.empty()) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new OverlayContextKeyService(this, overlay);
        }
        contextMatchesRules(rules) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            const context = this.getContextValuesContainer(this._myContextId);
            const result = (rules ? rules.evaluate(context) : true);
            // console.group(rules.serialize() + ' -> ' + result);
            // rules.keys().forEach(key => { console.log(key, ctx[key]); });
            // console.groupEnd();
            return result;
        }
        getContextKeyValue(key) {
            if (this._isDisposed) {
                return undefined;
            }
            return this.getContextValuesContainer(this._myContextId).getValue(key);
        }
        setContext(key, value) {
            if (this._isDisposed) {
                return;
            }
            const myContext = this.getContextValuesContainer(this._myContextId);
            if (!myContext) {
                return;
            }
            if (myContext.setValue(key, value)) {
                this._onDidChangeContext.fire(new SimpleContextKeyChangeEvent(key));
            }
        }
        removeContext(key) {
            if (this._isDisposed) {
                return;
            }
            if (this.getContextValuesContainer(this._myContextId).removeValue(key)) {
                this._onDidChangeContext.fire(new SimpleContextKeyChangeEvent(key));
            }
        }
        getContext(target) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this.getContextValuesContainer(findContextAttr(target));
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
    }
    exports.AbstractContextKeyService = AbstractContextKeyService;
    let ContextKeyService = class ContextKeyService extends AbstractContextKeyService {
        constructor(configurationService) {
            super(0);
            this._contexts = new Map();
            this._lastContextId = 0;
            const myContext = this._register(new ConfigAwareContextValuesContainer(this._myContextId, configurationService, this._onDidChangeContext));
            this._contexts.set(this._myContextId, myContext);
            // Uncomment this to see the contexts continuously logged
            // let lastLoggedValue: string | null = null;
            // setInterval(() => {
            // 	let values = Object.keys(this._contexts).map((key) => this._contexts[key]);
            // 	let logValue = values.map(v => JSON.stringify(v._value, null, '\t')).join('\n');
            // 	if (lastLoggedValue !== logValue) {
            // 		lastLoggedValue = logValue;
            // 		console.log(lastLoggedValue);
            // 	}
            // }, 2000);
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._contexts.get(contextId) || NullContext.INSTANCE;
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ContextKeyService has been disposed`);
            }
            const id = (++this._lastContextId);
            this._contexts.set(id, new Context(id, this.getContextValuesContainer(parentContextId)));
            return id;
        }
        disposeContext(contextId) {
            if (!this._isDisposed) {
                this._contexts.delete(contextId);
            }
        }
        updateParent(_parentContextKeyService) {
            throw new Error('Cannot update parent of root ContextKeyService');
        }
    };
    exports.ContextKeyService = ContextKeyService;
    exports.ContextKeyService = ContextKeyService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ContextKeyService);
    class ScopedContextKeyService extends AbstractContextKeyService {
        constructor(parent, domNode) {
            super(parent.createChildContext());
            this._parentChangeListener = this._register(new lifecycle_1.MutableDisposable());
            this._parent = parent;
            this._updateParentChangeListener();
            this._domNode = domNode;
            if (this._domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
                let extraInfo = '';
                if (this._domNode.classList) {
                    extraInfo = Array.from(this._domNode.classList.values()).join(', ');
                }
                console.error(`Element already has context attribute${extraInfo ? ': ' + extraInfo : ''}`);
            }
            this._domNode.setAttribute(KEYBINDING_CONTEXT_ATTR, String(this._myContextId));
        }
        _updateParentChangeListener() {
            // Forward parent events to this listener. Parent will change.
            this._parentChangeListener.value = this._parent.onDidChangeContext(e => {
                const thisContainer = this._parent.getContextValuesContainer(this._myContextId);
                const thisContextValues = thisContainer.value;
                if (!allEventKeysInContext(e, thisContextValues)) {
                    this._onDidChangeContext.fire(e);
                }
            });
        }
        dispose() {
            if (this._isDisposed) {
                return;
            }
            this._parent.disposeContext(this._myContextId);
            this._domNode.removeAttribute(KEYBINDING_CONTEXT_ATTR);
            super.dispose();
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._parent.getContextValuesContainer(contextId);
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ScopedContextKeyService has been disposed`);
            }
            return this._parent.createChildContext(parentContextId);
        }
        disposeContext(contextId) {
            if (this._isDisposed) {
                return;
            }
            this._parent.disposeContext(contextId);
        }
        updateParent(parentContextKeyService) {
            if (this._parent === parentContextKeyService) {
                return;
            }
            const thisContainer = this._parent.getContextValuesContainer(this._myContextId);
            const oldAllValues = thisContainer.collectAllValues();
            this._parent = parentContextKeyService;
            this._updateParentChangeListener();
            const newParentContainer = this._parent.getContextValuesContainer(this._parent.contextId);
            thisContainer.updateParent(newParentContainer);
            const newAllValues = thisContainer.collectAllValues();
            const allValuesDiff = {
                ...(0, objects_1.distinct)(oldAllValues, newAllValues),
                ...(0, objects_1.distinct)(newAllValues, oldAllValues)
            };
            const changedKeys = Object.keys(allValuesDiff);
            this._onDidChangeContext.fire(new ArrayContextKeyChangeEvent(changedKeys));
        }
    }
    class OverlayContext {
        constructor(parent, overlay) {
            this.parent = parent;
            this.overlay = overlay;
        }
        getValue(key) {
            return this.overlay.has(key) ? this.overlay.get(key) : this.parent.getValue(key);
        }
    }
    class OverlayContextKeyService {
        get contextId() {
            return this.parent.contextId;
        }
        get onDidChangeContext() {
            return this.parent.onDidChangeContext;
        }
        constructor(parent, overlay) {
            this.parent = parent;
            this.overlay = new Map(overlay);
        }
        bufferChangeEvents(callback) {
            this.parent.bufferChangeEvents(callback);
        }
        createKey() {
            throw new Error('Not supported.');
        }
        getContext(target) {
            return new OverlayContext(this.parent.getContext(target), this.overlay);
        }
        getContextValuesContainer(contextId) {
            const parentContext = this.parent.getContextValuesContainer(contextId);
            return new OverlayContext(parentContext, this.overlay);
        }
        contextMatchesRules(rules) {
            const context = this.getContextValuesContainer(this.contextId);
            const result = (rules ? rules.evaluate(context) : true);
            return result;
        }
        getContextKeyValue(key) {
            return this.overlay.has(key) ? this.overlay.get(key) : this.parent.getContextKeyValue(key);
        }
        createScoped() {
            throw new Error('Not supported.');
        }
        createOverlay(overlay = iterator_1.Iterable.empty()) {
            return new OverlayContextKeyService(this, overlay);
        }
        updateParent() {
            throw new Error('Not supported.');
        }
    }
    function findContextAttr(domNode) {
        while (domNode) {
            if (domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
                const attr = domNode.getAttribute(KEYBINDING_CONTEXT_ATTR);
                if (attr) {
                    return parseInt(attr, 10);
                }
                return NaN;
            }
            domNode = domNode.parentElement;
        }
        return 0;
    }
    function setContext(accessor, contextKey, contextValue) {
        const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
        contextKeyService.createKey(String(contextKey), stringifyURIs(contextValue));
    }
    function stringifyURIs(contextValue) {
        return (0, objects_1.cloneAndChange)(contextValue, (obj) => {
            if (typeof obj === 'object' && obj.$mid === 1 /* MarshalledId.Uri */) {
                return uri_1.URI.revive(obj).toString();
            }
            if (obj instanceof uri_1.URI) {
                return obj.toString();
            }
            return undefined;
        });
    }
    commands_1.CommandsRegistry.registerCommand('_setContext', setContext);
    commands_1.CommandsRegistry.registerCommand({
        id: 'getContextKeyInfo',
        handler() {
            return [...contextkey_1.RawContextKey.all()].sort((a, b) => a.key.localeCompare(b.key));
        },
        metadata: {
            description: (0, nls_1.localize)('getContextKeyInfo', "A command that returns information about context keys"),
            args: []
        }
    });
    commands_1.CommandsRegistry.registerCommand('_generateContextKeyInfo', function () {
        const result = [];
        const seen = new Set();
        for (const info of contextkey_1.RawContextKey.all()) {
            if (!seen.has(info.key)) {
                seen.add(info.key);
                result.push(info);
            }
        }
        result.sort((a, b) => a.key.localeCompare(b.key));
        console.log(JSON.stringify(result, undefined, 2));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dEtleVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb250ZXh0a2V5L2Jyb3dzZXIvY29udGV4dEtleVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaWxCaEcsZ0NBR0M7SUFwa0JELE1BQU0sdUJBQXVCLEdBQUcseUJBQXlCLENBQUM7SUFFMUQsTUFBYSxPQUFPO1FBTW5CLFlBQVksRUFBVSxFQUFFLE1BQXNCO1lBQzdDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFXLEtBQUs7WUFDZixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVNLFFBQVEsQ0FBQyxHQUFXLEVBQUUsS0FBVTtZQUN0QyxpRUFBaUU7WUFDakUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sV0FBVyxDQUFDLEdBQVc7WUFDN0Isc0RBQXNEO1lBQ3RELElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEIsT0FB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