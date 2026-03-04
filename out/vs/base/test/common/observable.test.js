/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/base/test/common/utils"], function (require, exports, assert, event_1, observable_1, base_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggingObservableValue = exports.LoggingObserver = void 0;
    suite('observables', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        /**
         * Reads these tests to understand how to use observables.
         */
        suite('tutorial', () => {
            test('observable + autorun', () => {
                const log = new Log();
                // This creates a variable that stores a value and whose value changes can be observed.
                // The name is only used for debugging purposes.
                // The second arg is the initial value.
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                // This creates an autorun: It runs immediately and then again whenever any of the
                // dependencies change. Dependencies are tracked by reading observables with the `reader` parameter.
                //
                // The @description is only used for debugging purposes.
                // The autorun has to be disposed! This is very important.
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    // This code is run immediately.
                    // Use the `reader` to read observable values and track the dependency to them.
                    // If you use `observable.get()` instead of `observable.read(reader)`, you will just
                    // get the value and not subscribe to it.
                    log.log(`myAutorun.run(myObservable: ${myObservable.read(reader)})`);
                    // Now that all dependencies are tracked, the autorun is re-run whenever any of the
                    // dependencies change.
                }));
                // The autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
                // We set the observable.
                myObservable.set(1, undefined);
                // -> The autorun runs again when any read observable changed
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 1)']);
                // We set the observable again.
                myObservable.set(1, undefined);
                // -> The autorun does not run again, because the observable didn't change.
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                // Transactions batch autorun runs
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    // No auto-run ran yet, even though the value changed!
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(3, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // Only at the end of the transaction the autorun re-runs
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 3)']);
                // Note that the autorun did not see the intermediate value `2`!
            });
            test('derived + autorun', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservable1', 0);
                const observable2 = (0, observable_1.observableValue)('myObservable2', 0);
                // A derived value is an observable that is derived from other observables.
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const value1 = observable1.read(reader); // Use the reader to track dependencies.
                    const value2 = observable2.read(reader);
                    const sum = value1 + value2;
                    log.log(`myDerived.recompute: ${value1} + ${value2} = ${sum}`);
                    return sum;
                });
                // We create an autorun that reacts on changes to our derived value.
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    // Autoruns work with observable values and deriveds - in short, they work with any observable.
                    log.log(`myAutorun(myDerived: ${myDerived.read(reader)})`);
                }));
                // autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 0 + 0 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
                observable1.set(1, undefined);
                // and on changes...
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 1 + 0 = 1",
                    "myAutorun(myDerived: 1)",
                ]);
                observable2.set(1, undefined);
                // ... of any dependency.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 1 + 1 = 2",
                    "myAutorun(myDerived: 2)",
                ]);
                // Now we change multiple observables in a transaction to batch process the effects.
                (0, observable_1.transaction)((tx) => {
                    observable1.set(5, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    observable2.set(5, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // When changing multiple observables in a transaction,
                // deriveds are only recomputed on demand.
                // (Note that you cannot see the intermediate value when `obs1 == 5` and `obs2 == 1`)
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 5 + 5 = 10",
                    "myAutorun(myDerived: 10)",
                ]);
                (0, observable_1.transaction)((tx) => {
                    observable1.set(6, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    observable2.set(4, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // Now the autorun didn't run again, because its dependency changed from 10 to 10 (= no change).
                assert.deepStrictEqual(log.getAndClearEntries(), (["myDerived.recompute: 6 + 4 = 10"]));
            });
            test('read during transaction', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservable1', 0);
                const observable2 = (0, observable_1.observableValue)('myObservable2', 0);
                const myDerived = (0, observable_1.derived)((reader) => {
                    /** @description myDerived */
                    const value1 = observable1.read(reader);
                    const value2 = observable2.read(reader);
                    const sum = value1 + value2;
                    log.log(`myDerived.recompute: ${value1} + ${value2} = ${sum}`);
                    return sum;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun(myDerived: ${myDerived.read(reader)})`);
                }));
                // autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 0 + 0 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
                (0, observable_1.transaction)((tx) => {
                    observable1.set(-10, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myDerived.get(); // This forces a (sync) recomputation of the current value!
                    assert.deepStrictEqual(log.getAndClearEntries(), (["myDerived.recompute: -10 + 0 = -10"]));
                    // This means, that even in transactions you can assume that all values you can read with `get` and `read` are up-to-date.
                    // Read these values just might cause additional (potentially unneeded) recomputations.
                    observable2.set(10, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // This autorun runs again, because its dependency changed from 0 to -10 and then back to 0.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: -10 + 10 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
            });
            test('get without observers', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservableValue1', 0);
                // We set up some computeds.
                const computed1 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = observable1.read(reader);
                    const result = value1 % 3;
                    log.log(`recompute1: ${value1} % 3 = ${result}`);
                    return result;
                });
                const computed2 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed1.read(reader);
                    const result = value1 * 2;
                    log.log(`recompute2: ${value1} * 2 = ${result}`);
                    return result;
                });
                const computed3 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed1.read(reader);
                    const result = value1 * 3;
                    log.log(`recompute3: ${value1} * 3 = ${result}`);
                    return result;
                });
                const computedSum = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed2.read(reader);
                    const value2 = computed3.read(reader);
                    const result = value1 + value2;
                    log.log(`recompute4: ${value1} + ${value2} = ${result}`);
                    return result;
                });
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                observable1.set(1, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                // And now read the computed that dependens on all the others.
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                log.log(`value: ${computedSum.get()}`);
                // Because there are no observers, the derived values are not cached (!), but computed from scratch.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                const disposable = (0, observable_1.keepObserved)(computedSum); // Use keepObserved to keep the cache.
                // You can also use `computedSum.keepObserved(store)` for an inline experience.
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'value: 5',
                ]);
                // Tada, no recomputations!
                observable1.set(2, undefined);
                // The keepObserved does not force deriveds to be recomputed! They are still lazy.
                assert.deepStrictEqual(log.getAndClearEntries(), ([]));
                log.log(`value: ${computedSum.get()}`);
                // Those deriveds are recomputed on demand, i.e. when someone reads them.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                log.log(`value: ${computedSum.get()}`);
                // ... and then cached again
                assert.deepStrictEqual(log.getAndClearEntries(), (["value: 10"]));
                disposable.dispose(); // Don't forget to dispose the keepAlive to prevent memory leaks!
                log.log(`value: ${computedSum.get()}`);
                // Which disables the cache again
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                // Why don't we just always keep the cache alive?
                // This is because in order to keep the cache alive, we have to keep our subscriptions to our dependencies alive,
                // which could cause memory-leaks.
                // So instead, when the last observer of a derived is disposed, we dispose our subscriptions to our dependencies.
                // `keepObserved` just prevents this from happening.
            });
            test('autorun that receives deltas of signals', () => {
                const log = new Log();
                // A signal is an observable without a value.
                // However, it can ship change information when it is triggered.
                // Readers can process/aggregate this change information.
                const signal = (0, observable_1.observableSignal)('signal');
                const disposable = (0, observable_1.autorunHandleChanges)({
                    // The change summary is used to collect the changes
                    createEmptyChangeSummary: () => ({ msgs: [] }),
                    handleChange(context, changeSummary) {
                        if (context.didChange(signal)) {
                            // We just push the changes into an array
                            changeSummary.msgs.push(context.change.msg);
                        }
                        return true; // We want to handle the change
                    },
                }, (reader, changeSummary) => {
                    // When handling the change, make sure to read the signal!
                    signal.read(reader);
                    log.log('msgs: ' + changeSummary.msgs.join(', '));
                });
                signal.trigger(undefined, { msg: 'foobar' });
                (0, observable_1.transaction)(tx => {
                    // You can batch triggering signals.
                    // No delta information is lost!
                    signal.trigger(tx, { msg: 'hello' });
                    signal.trigger(tx, { msg: 'world' });
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'msgs: ',
                    'msgs: foobar',
                    'msgs: hello, world'
                ]);
                disposable.dispose();
            });
            // That is the end of the tutorial.
            // There are lots of utilities you can explore now, like `observableFromEvent`, `Event.fromObservableLight`,
            // autorunWithStore, observableWithStore and so on.
        });
        test('topological order', () => {
            const log = new Log();
            const myObservable1 = (0, observable_1.observableValue)('myObservable1', 0);
            const myObservable2 = (0, observable_1.observableValue)('myObservable2', 0);
            const myComputed1 = (0, observable_1.derived)(reader => {
                /** @description myComputed1 */
                const value1 = myObservable1.read(reader);
                const value2 = myObservable2.read(reader);
                const sum = value1 + value2;
                log.log(`myComputed1.recompute(myObservable1: ${value1} + myObservable2: ${value2} = ${sum})`);
                return sum;
            });
            const myComputed2 = (0, observable_1.derived)(reader => {
                /** @description myComputed2 */
                const value1 = myComputed1.read(reader);
                const value2 = myObservable1.read(reader);
                const value3 = myObservable2.read(reader);
                const sum = value1 + value2 + value3;
                log.log(`myComputed2.recompute(myComputed1: ${value1} + myObservable1: ${value2} + myObservable2: ${value3} = ${sum})`);
                return sum;
            });
            const myComputed3 = (0, observable_1.derived)(reader => {
                /** @description myComputed3 */
                const value1 = myComputed2.read(reader);
                const value2 = myObservable1.read(reader);
                const value3 = myObservable2.read(reader);
                const sum = value1 + value2 + value3;
                log.log(`myComputed3.recompute(myComputed2: ${value1} + myObservable1: ${value2} + myObservable2: ${value3} = ${sum})`);
                return sum;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                log.log(`myAutorun.run(myComputed3: ${myComputed3.read(reader)})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed1.recompute(myObservable1: 0 + myObservable2: 0 = 0)",
                "myComputed2.recompute(myComputed1: 0 + myObservable1: 0 + myObservable2: 0 = 0)",
                "myComputed3.recompute(myComputed2: 0 + myObservable1: 0 + myObservable2: 0 = 0)",
                "myAutorun.run(myComputed3: 0)",
            ]);
            myObservable1.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed1.recompute(myObservable1: 1 + myObservable2: 0 = 1)",
                "myComputed2.recompute(myComputed1: 1 + myObservable1: 1 + myObservable2: 0 = 2)",
                "myComputed3.recompute(myComputed2: 2 + myObservable1: 1 + myObservable2: 0 = 3)",
                "myAutorun.run(myComputed3: 3)",
            ]);
            (0, observable_1.transaction)((tx) => {
                myObservable1.set(2, tx);
                myComputed2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed1.recompute(myObservable1: 2 + myObservable2: 0 = 2)",
                    "myComputed2.recompute(myComputed1: 2 + myObservable1: 2 + myObservable2: 0 = 4)",
                ]);
                myObservable1.set(3, tx);
                myComputed2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed1.recompute(myObservable1: 3 + myObservable2: 0 = 3)",
                    "myComputed2.recompute(myComputed1: 3 + myObservable1: 3 + myObservable2: 0 = 6)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed3.recompute(myComputed2: 6 + myObservable1: 3 + myObservable2: 0 = 9)",
                "myAutorun.run(myComputed3: 9)",
            ]);
        });
        suite('from event', () => {
            function init() {
                const log = new Log();
                let value = 0;
                const eventEmitter = new event_1.Emitter();
                let id = 0;
                const observable = (0, observable_1.observableFromEvent)((handler) => {
                    const curId = id++;
                    log.log(`subscribed handler ${curId}`);
                    const disposable = eventEmitter.event(handler);
                    return {
                        dispose: () => {
                            log.log(`unsubscribed handler ${curId}`);
                            disposable.dispose();
                        },
                    };
                }, () => {
                    log.log(`compute value ${value}`);
                    return value;
                });
                return {
                    log,
                    setValue: (newValue) => {
                        value = newValue;
                        eventEmitter.fire();
                    },
                    observable,
                };
            }
            test('Handle undefined', () => {
                const { log, setValue, observable } = init();
                setValue(undefined);
                const autorunDisposable = (0, observable_1.autorun)(reader => {
                    /** @description MyAutorun */
                    observable.read(reader);
                    log.log(`autorun, value: ${observable.read(reader)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "subscribed handler 0",
                    "compute value undefined",
                    "autorun, value: undefined",
                ]);
                setValue(1);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "compute value 1",
                    "autorun, value: 1"
                ]);
                autorunDisposable.dispose();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "unsubscribed handler 0"
                ]);
            });
            test('basic', () => {
                const { log, setValue, observable } = init();
                const shouldReadObservable = (0, observable_1.observableValue)('shouldReadObservable', true);
                const autorunDisposable = (0, observable_1.autorun)(reader => {
                    /** @description MyAutorun */
                    if (shouldReadObservable.read(reader)) {
                        observable.read(reader);
                        log.log(`autorun, should read: true, value: ${observable.read(reader)}`);
                    }
                    else {
                        log.log(`autorun, should read: false`);
                    }
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'subscribed handler 0',
                    'compute value 0',
                    'autorun, should read: true, value: 0',
                ]);
                // Cached get
                log.log(`get value: ${observable.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), ['get value: 0']);
                setValue(1);
                // Trigger autorun, no unsub/sub
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 1',
                    'autorun, should read: true, value: 1',
                ]);
                // Unsubscribe when not read
                shouldReadObservable.set(false, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'autorun, should read: false',
                    'unsubscribed handler 0',
                ]);
                shouldReadObservable.set(true, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'subscribed handler 1',
                    'compute value 1',
                    'autorun, should read: true, value: 1',
                ]);
                autorunDisposable.dispose();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'unsubscribed handler 1',
                ]);
            });
            test('get without observers', () => {
                const { log, observable } = init();
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                log.log(`get value: ${observable.get()}`);
                // Not cached or subscribed
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 0',
                    'get value: 0',
                ]);
                log.log(`get value: ${observable.get()}`);
                // Still not cached or subscribed
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 0',
                    'get value: 0',
                ]);
            });
        });
        test('reading derived in transaction unsubscribes unnecessary observables', () => {
            const log = new Log();
            const shouldReadObservable = (0, observable_1.observableValue)('shouldReadMyObs1', true);
            const myObs1 = new LoggingObservableValue('myObs1', 0, log);
            const myComputed = (0, observable_1.derived)(reader => {
                /** @description myComputed */
                log.log('myComputed.recompute');
                if (shouldReadObservable.read(reader)) {
                    return myObs1.read(reader);
                }
                return 1;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myComputed.read(reader);
                log.log(`myAutorun: ${value}`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed.recompute",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myAutorun: 0",
            ]);
            (0, observable_1.transaction)(tx => {
                myObs1.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), (["myObs1.set (value 1)"]));
                shouldReadObservable.set(false, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), ([]));
                myComputed.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed.recompute",
                    "myObs1.lastObserverRemoved",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), (["myAutorun: 1"]));
        });
        test('avoid recomputation of deriveds that are no longer read', () => {
            const log = new Log();
            const myObsShouldRead = new LoggingObservableValue('myObsShouldRead', true, log);
            const myObs1 = new LoggingObservableValue('myObs1', 0, log);
            const myComputed1 = (0, observable_1.derived)(reader => {
                /** @description myComputed1 */
                const myObs1Val = myObs1.read(reader);
                const result = myObs1Val % 10;
                log.log(`myComputed1(myObs1: ${myObs1Val}): Computed ${result}`);
                return myObs1Val;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const shouldRead = myObsShouldRead.read(reader);
                if (shouldRead) {
                    const v = myComputed1.read(reader);
                    log.log(`myAutorun(shouldRead: true, myComputed1: ${v}): run`);
                }
                else {
                    log.log(`myAutorun(shouldRead: false): run`);
                }
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.firstObserverAdded",
                "myObsShouldRead.get",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myComputed1(myObs1: 0): Computed 0",
                "myAutorun(shouldRead: true, myComputed1: 0): run",
            ]);
            (0, observable_1.transaction)(tx => {
                myObsShouldRead.set(false, tx);
                myObs1.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObsShouldRead.set (value false)",
                    "myObs1.set (value 1)",
                ]);
            });
            // myComputed1 should not be recomputed here, even though its dependency myObs1 changed!
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.get",
                "myAutorun(shouldRead: false): run",
                "myObs1.lastObserverRemoved",
            ]);
            (0, observable_1.transaction)(tx => {
                myObsShouldRead.set(true, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObsShouldRead.set (value true)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.get",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myComputed1(myObs1: 1): Computed 1",
                "myAutorun(shouldRead: true, myComputed1: 1): run",
            ]);
        });
        suite('autorun rerun on neutral change', () => {
            test('autorun reruns on neutral observable double change', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myObservable: ${myObservable.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
            });
            test('autorun does not rerun on indirect neutral observable double change', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const val = myObservable.read(reader);
                    log.log(`myDerived.read(myObservable: ${val})`);
                    return val;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myDerived: ${myDerived.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)"
                ]);
            });
            test('autorun reruns on indirect neutral observable double change when changes propagate', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const val = myObservable.read(reader);
                    log.log(`myDerived.read(myObservable: ${val})`);
                    return val;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myDerived: ${myDerived.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myDerived.get(); // This marks the auto-run as changed
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myDerived.read(myObservable: 2)"
                    ]);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
            });
        });
        test('self-disposing autorun', () => {
            const log = new Log();
            const observable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myObservable3 = new LoggingObservableValue('myObservable3', 0, log);
            const d = (0, observable_1.autorun)(reader => {
                /** @description autorun */
                if (observable1.read(reader) >= 2) {
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable1.set (value 2)",
                        "myObservable1.get",
                    ]);
                    myObservable2.read(reader);
                    // First time this observable is read
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable2.firstObserverAdded",
                        "myObservable2.get",
                    ]);
                    d.dispose();
                    // Disposing removes all observers
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable1.lastObserverRemoved",
                        "myObservable2.lastObserverRemoved",
                    ]);
                    myObservable3.read(reader);
                    // This does not subscribe the observable, because the autorun is disposed
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable3.get",
                    ]);
                }
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable1.firstObserverAdded',
                'myObservable1.get',
            ]);
            observable1.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable1.set (value 1)',
                'myObservable1.get',
            ]);
            observable1.set(2, undefined);
            // See asserts in the autorun
            assert.deepStrictEqual(log.getAndClearEntries(), ([]));
        });
        test('changing observables in endUpdate', () => {
            const log = new Log();
            const myObservable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                const val = myObservable1.read(reader);
                log.log(`myDerived1.read(myObservable: ${val})`);
                return val;
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const val = myObservable2.read(reader);
                if (val === 1) {
                    myDerived1.read(reader);
                }
                log.log(`myDerived2.read(myObservable: ${val})`);
                return val;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const myDerived1Val = myDerived1.read(reader);
                const myDerived2Val = myDerived2.read(reader);
                log.log(`myAutorun.run(myDerived1: ${myDerived1Val}, myDerived2: ${myDerived2Val})`);
            }));
            (0, observable_1.transaction)(tx => {
                myObservable2.set(1, tx);
                // end update of this observable will trigger endUpdate of myDerived1 and
                // the autorun and the autorun will add myDerived2 as observer to myDerived1
                myObservable1.set(1, tx);
            });
        });
        test('set dependency in derived', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myComputed = (0, observable_1.derived)(reader => {
                /** @description myComputed */
                let value = myObservable.read(reader);
                const origValue = value;
                log.log(`myComputed(myObservable: ${origValue}): start computing`);
                if (value % 3 !== 0) {
                    value++;
                    myObservable.set(value, undefined);
                }
                log.log(`myComputed(myObservable: ${origValue}): finished computing`);
                return value;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myComputed.read(reader);
                log.log(`myAutorun(myComputed: ${value})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myComputed(myObservable: 0): start computing",
                "myComputed(myObservable: 0): finished computing",
                "myAutorun(myComputed: 0)"
            ]);
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.set (value 1)",
                "myObservable.get",
                "myComputed(myObservable: 1): start computing",
                "myObservable.set (value 2)",
                "myComputed(myObservable: 1): finished computing",
                "myObservable.get",
                "myComputed(myObservable: 2): start computing",
                "myObservable.set (value 3)",
                "myComputed(myObservable: 2): finished computing",
                "myObservable.get",
                "myComputed(myObservable: 3): start computing",
                "myComputed(myObservable: 3): finished computing",
                "myAutorun(myComputed: 3)",
            ]);
        });
        test('set dependency in autorun', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myObservable.read(reader);
                log.log(`myAutorun(myObservable: ${value}): start`);
                if (value !== 0 && value < 4) {
                    myObservable.set(value + 1, undefined);
                }
                log.log(`myAutorun(myObservable: ${value}): end`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myAutorun(myObservable: 0): start",
                "myAutorun(myObservable: 0): end",
            ]);
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.set (value 1)",
                "myObservable.get",
                "myAutorun(myObservable: 1): start",
                "myObservable.set (value 2)",
                "myAutorun(myObservable: 1): end",
                "myObservable.get",
                "myAutorun(myObservable: 2): start",
                "myObservable.set (value 3)",
                "myAutorun(myObservable: 2): end",
                "myObservable.get",
                "myAutorun(myObservable: 3): start",
                "myObservable.set (value 4)",
                "myAutorun(myObservable: 3): end",
                "myObservable.get",
                "myAutorun(myObservable: 4): start",
                "myAutorun(myObservable: 4): end",
            ]);
        });
        test('get in transaction between sets', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                const value = myObservable.read(reader);
                log.log(`myDerived1(myObservable: ${value}): start computing`);
                return value;
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const value = myDerived1.read(reader);
                log.log(`myDerived2(myDerived1: ${value}): start computing`);
                return value;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myDerived2.read(reader);
                log.log(`myAutorun(myDerived2: ${value})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myDerived1(myObservable: 0): start computing",
                "myDerived2(myDerived1: 0): start computing",
                "myAutorun(myDerived2: 0)",
            ]);
            (0, observable_1.transaction)(tx => {
                myObservable.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.set (value 1)",
                ]);
                myDerived2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.get",
                    "myDerived1(myObservable: 1): start computing",
                    "myDerived2(myDerived1: 1): start computing",
                ]);
                myObservable.set(2, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.set (value 2)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.get",
                "myDerived1(myObservable: 2): start computing",
                "myDerived2(myDerived1: 2): start computing",
                "myAutorun(myDerived2: 2)",
            ]);
        });
        test('bug: Dont reset states', () => {
            const log = new Log();
            const myObservable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const val = myObservable2.read(reader);
                log.log(`myDerived2.computed(myObservable2: ${val})`);
                return val % 10;
            });
            const myDerived3 = (0, observable_1.derived)(reader => {
                /** @description myDerived3 */
                const val1 = myObservable1.read(reader);
                const val2 = myDerived2.read(reader);
                log.log(`myDerived3.computed(myDerived1: ${val1}, myDerived2: ${val2})`);
                return `${val1} + ${val2}`;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const val = myDerived3.read(reader);
                log.log(`myAutorun(myDerived3: ${val})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable1.firstObserverAdded",
                "myObservable1.get",
                "myObservable2.firstObserverAdded",
                "myObservable2.get",
                "myDerived2.computed(myObservable2: 0)",
                "myDerived3.computed(myDerived1: 0, myDerived2: 0)",
                "myAutorun(myDerived3: 0 + 0)",
            ]);
            (0, observable_1.transaction)(tx => {
                myObservable1.set(1, tx); // Mark myDerived 3 as stale
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable1.set (value 1)",
                ]);
                myObservable2.set(10, tx); // This is a non-change. myDerived3 should not be marked as possibly-depedency-changed!
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable2.set (value 10)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable1.get",
                "myObservable2.get",
                "myDerived2.computed(myObservable2: 10)",
                'myDerived3.computed(myDerived1: 1, myDerived2: 0)',
                'myAutorun(myDerived3: 1 + 0)',
            ]);
        });
        test('bug: Add observable in endUpdate', () => {
            const myObservable1 = (0, observable_1.observableValue)('myObservable1', 0);
            const myObservable2 = (0, observable_1.observableValue)('myObservable2', 0);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                return myObservable1.read(reader);
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                return myObservable2.read(reader);
            });
            const myDerivedA1 = (0, observable_1.derived)(reader => /** @description myDerivedA1 */ {
                const d1 = myDerived1.read(reader);
                if (d1 === 1) {
                    // This adds an observer while myDerived is still in update mode.
                    // When myDerived exits update mode, the observer shouldn't receive
                    // more endUpdate than beginUpdate calls.
                    myDerived2.read(reader);
                }
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun1 */
                myDerivedA1.read(reader);
            }));
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun2 */
                myDerived2.read(reader);
            }));
            (0, observable_1.transaction)(tx => {
                myObservable1.set(1, tx);
                myObservable2.set(1, tx);
            });
        });
        test('bug: fromObservableLight doesnt subscribe', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myDerived = (0, observable_1.derived)(reader => /** @description myDerived */ {
                const val = myObservable.read(reader);
                log.log(`myDerived.computed(myObservable2: ${val})`);
                return val % 10;
            });
            const e = event_1.Event.fromObservableLight(myDerived);
            log.log('event created');
            e(() => {
                log.log('event fired');
            });
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'event created',
                'myObservable.firstObserverAdded',
                'myObservable.get',
                'myDerived.computed(myObservable2: 0)',
                'myObservable.set (value 1)',
                'myObservable.get',
                'myDerived.computed(myObservable2: 1)',
                'event fired',
            ]);
        });
        test('dont run autorun after dispose', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const d = (0, observable_1.autorun)(reader => {
                /** @description update */
                const v = myObservable.read(reader);
                log.log('autorun, myObservable:' + v);
            });
            (0, observable_1.transaction)(tx => {
                myObservable.set(1, tx);
                d.dispose();
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable.firstObserverAdded',
                'myObservable.get',
                'autorun, myObservable:0',
                'myObservable.set (value 1)',
                'myObservable.lastObserverRemoved',
            ]);
        });
        suite('waitForState', () => {
            test('resolve', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'initializing' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                ]);
                myObservable.set({ state: 'ready' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'resolved {\"state\":\"ready\"}',
                ]);
            });
            test('resolveImmediate', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'ready' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                myObservable.set({ state: 'error' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'resolved {\"state\":\"ready\"}',
                ]);
            });
            test('reject', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'initializing' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                ]);
                myObservable.set({ state: 'error' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'rejected {\"state\":\"error\"}'
                ]);
            });
        });
    });
    class LoggingObserver {
        constructor(debugName, log) {
            this.debugName = debugName;
            this.log = log;
            this.count = 0;
        }
        beginUpdate(observable) {
            this.count++;
            this.log.log(`${this.debugName}.beginUpdate (count ${this.count})`);
        }
        endUpdate(observable) {
            this.log.log(`${this.debugName}.endUpdate (count ${this.count})`);
            this.count--;
        }
        handleChange(observable, change) {
            this.log.log(`${this.debugName}.handleChange (count ${this.count})`);
        }
        handlePossibleChange(observable) {
            this.log.log(`${this.debugName}.handlePossibleChange`);
        }
    }
    exports.LoggingObserver = LoggingObserver;
    class LoggingObservableValue extends base_1.BaseObservable {
        constructor(debugName, initialValue, log) {
            super();
            this.debugName = debugName;
            this.log = log;
            this.value = initialValue;
        }
        onFirstObserverAdded() {
            this.log.log(`${this.debugName}.firstObserverAdded`);
        }
        onLastObserverRemoved() {
            this.log.log(`${this.debugName}.lastObserverRemoved`);
        }
        get() {
            this.log.log(`${this.debugName}.get`);
            return this.value;
        }
        set(value, tx, change) {
            if (this.value === value) {
                return;
            }
            if (!tx) {
                (0, observable_1.transaction)((tx) => {
                    this.set(value, tx, change);
                }, () => `Setting ${this.debugName}`);
                return;
            }
            this.log.log(`${this.debugName}.set (value ${value})`);
            this.value = value;
            for (const observer of this.observers) {
                tx.updateObserver(observer, this);
                observer.handleChange(this, change);
            }
        }
        toString() {
            return `${this.debugName}: ${this.value}`;
        }
    }
    exports.LoggingObservableValue = LoggingObservableValue;
    class Log {
        constructor() {
            this.entries = [];
        }
        log(message) {
            this.entries.push(message);
        }
        getAndClearEntries() {
            const entries = [...this.entries];
            this.entries.length = 0;
            return entries;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9vYnNlcnZhYmxlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLEtBQUssQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQ3pCLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRDs7V0FFRztRQUNILEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7Z0JBQ2pDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3RCLHVGQUF1RjtnQkFDdkYsZ0RBQWdEO2dCQUNoRCx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sWUFBWSxHQUFHLElBQUEsNEJBQWUsRUFBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXhELGtGQUFrRjtnQkFDbEYsb0dBQW9HO2dCQUNwRyxFQUFFO2dCQUNGLHdEQUF3RDtnQkFDeEQsMERBQTBEO2dCQUMxRCxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRTtvQkFDdkIsNkJBQTZCO29CQUU3QixnQ0FBZ0M7b0JBRWhDLCtFQUErRTtvQkFDL0Usb0ZBQW9GO29CQUNwRix5Q0FBeUM7b0JBQ3pDLEdBQUcsQ0FBQyxHQUFHLENBQUMsK0JBQStCLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUVyRSxtRkFBbUY7b0JBQ25GLHVCQUF1QjtnQkFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDSiwrQkFBK0I7Z0JBQy9CLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFD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