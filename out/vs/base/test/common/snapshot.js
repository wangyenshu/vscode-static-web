/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, lazy_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapshotContext = void 0;
    exports.assertSnapshot = assertSnapshot;
    // setup on import so assertSnapshot has the current context without explicit passing
    let context;
    const sanitizeName = (name) => name.replace(/[^a-z0-9_-]/gi, '_');
    const normalizeCrlf = (str) => str.replace(/\r\n/g, '\n');
    /**
     * This is exported only for tests against the snapshotting itself! Use
     * {@link assertSnapshot} as a consumer!
     */
    class SnapshotContext {
        constructor(test) {
            this.test = test;
            this.nextIndex = 0;
            this.usedNames = new Set();
            if (!test) {
                throw new Error('assertSnapshot can only be used in a test');
            }
            if (!test.file) {
                throw new Error('currentTest.file is not set, please open an issue with the test you\'re trying to run');
            }
            const src = network_1.FileAccess.asFileUri('');
            const parts = test.file.split(/[/\\]/g);
            this.namePrefix = sanitizeName(test.fullTitle()) + '.';
            this.snapshotsDir = uri_1.URI.joinPath(src, ...[...parts.slice(0, -1), '__snapshots__']);
        }
        async assert(value, options) {
            const originalStack = new Error().stack; // save to make the stack nicer on failure
            const nameOrIndex = (options?.name ? sanitizeName(options.name) : this.nextIndex++);
            const fileName = this.namePrefix + nameOrIndex + '.' + (options?.extension || 'snap');
            this.usedNames.add(fileName);
            const fpath = uri_1.URI.joinPath(this.snapshotsDir, fileName).fsPath;
            const actual = formatValue(value);
            let expected;
            try {
                expected = await __readFileInTests(fpath);
            }
            catch {
                console.info(`Creating new snapshot in: ${fpath}`);
                await __mkdirPInTests(this.snapshotsDir.fsPath);
                await __writeFileInTests(fpath, actual);
                return;
            }
            if (normalizeCrlf(expected) !== normalizeCrlf(actual)) {
                await __writeFileInTests(fpath + '.actual', actual);
                const err = new Error(`Snapshot #${nameOrIndex} does not match expected output`);
                err.expected = expected;
                err.actual = actual;
                err.snapshotPath = fpath;
                err.stack = err.stack
                    .split('\n')
                    // remove all frames from the async stack and keep the original caller's frame
                    .slice(0, 1)
                    .concat(originalStack.split('\n').slice(3))
                    .join('\n');
                throw err;
            }
        }
        async removeOldSnapshots() {
            const contents = await __readDirInTests(this.snapshotsDir.fsPath);
            const toDelete = contents.filter(f => f.startsWith(this.namePrefix) && !this.usedNames.has(f));
            if (toDelete.length) {
                console.info(`Deleting ${toDelete.length} old snapshots for ${this.test?.fullTitle()}`);
            }
            await Promise.all(toDelete.map(f => __unlinkInTests(uri_1.URI.joinPath(this.snapshotsDir, f).fsPath)));
        }
    }
    exports.SnapshotContext = SnapshotContext;
    const debugDescriptionSymbol = Symbol.for('debug.description');
    function formatValue(value, level = 0, seen = []) {
        switch (typeof value) {
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return String(value);
            case 'string':
                return level === 0 ? value : JSON.stringify(value);
            case 'function':
                return `[Function ${value.name}]`;
            case 'object': {
                if (value === null) {
                    return 'null';
                }
                if (value instanceof RegExp) {
                    return String(value);
                }
                if (seen.includes(value)) {
                    return '[Circular]';
                }
                if (debugDescriptionSymbol in value && typeof value[debugDescriptionSymbol] === 'function') {
                    return value[debugDescriptionSymbol]();
                }
                const oi = '  '.repeat(level);
                const ci = '  '.repeat(level + 1);
                if (Array.isArray(value)) {
                    const children = value.map(v => formatValue(v, level + 1, [...seen, value]));
                    const multiline = children.some(c => c.includes('\n')) || children.join(', ').length > 80;
                    return multiline ? `[\n${ci}${children.join(`,\n${ci}`)}\n${oi}]` : `[ ${children.join(', ')} ]`;
                }
                let entries;
                let prefix = '';
                if (value instanceof Map) {
                    prefix = 'Map ';
                    entries = [...value.entries()];
                }
                else if (value instanceof Set) {
                    prefix = 'Set ';
                    entries = [...value.entries()];
                }
                else {
                    entries = Object.entries(value);
                }
                const lines = entries.map(([k, v]) => `${k}: ${formatValue(v, level + 1, [...seen, value])}`);
                return prefix + (lines.length > 1
                    ? `{\n${ci}${lines.join(`,\n${ci}`)}\n${oi}}`
                    : `{ ${lines.join(',\n')} }`);
            }
            default:
                throw new Error(`Unknown type ${value}`);
        }
    }
    setup(function () {
        const currentTest = this.currentTest;
        context = new lazy_1.Lazy(() => new SnapshotContext(currentTest));
    });
    teardown(async function () {
        if (this.currentTest?.state === 'passed') {
            await context?.rawValue?.removeOldSnapshots();
        }
        context = undefined;
    });
    /**
     * Implements a snapshot testing utility. ⚠️ This is async! ⚠️
     *
     * The first time a snapshot test is run, it'll record the value it's called
     * with as the expected value. Subsequent runs will fail if the value differs,
     * but the snapshot can be regenerated by hand or using the Selfhost Test
     * Provider Extension which'll offer to update it.
     *
     * The snapshot will be associated with the currently running test and stored
     * in a `__snapshots__` directory next to the test file, which is expected to
     * be the first `.test.js` file in the callstack.
     */
    function assertSnapshot(value, options) {
        if (!context) {
            throw new Error('assertSnapshot can only be used in a test');
        }
        return context.value.assert(value, options);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25hcHNob3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3NuYXBzaG90LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStLaEcsd0NBTUM7SUF6S0QscUZBQXFGO0lBQ3JGLElBQUksT0FBMEMsQ0FBQztJQUMvQyxNQUFNLFlBQVksR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDMUUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBU2xFOzs7T0FHRztJQUNILE1BQWEsZUFBZTtRQU0zQixZQUE2QixJQUE0QjtZQUE1QixTQUFJLEdBQUosSUFBSSxDQUF3QjtZQUxqRCxjQUFTLEdBQUcsQ0FBQyxDQUFDO1lBR0wsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7WUFHdEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1RkFBdUYsQ0FBQyxDQUFDO1lBQzFHLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4QyxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxJ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