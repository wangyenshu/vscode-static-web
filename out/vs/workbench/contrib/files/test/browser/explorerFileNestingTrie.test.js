define(["require", "exports", "vs/workbench/contrib/files/common/explorerFileNestingTrie", "assert", "vs/base/test/common/utils"], function (require, exports, explorerFileNestingTrie_1, assert, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fakeFilenameAttributes = { dirname: 'mydir', basename: '', extname: '' };
    suite('SufTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('exactMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), []);
        });
        test('starMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['MyKey']);
        });
        test('starSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', '${capture}.json');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['.json']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['a.json']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['a.b.c.d.json']);
        });
        test('multiMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'Key1');
            t.add('*.json', 'Key2');
            t.add('*d.npmrc', 'Key3');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1', 'Key3']);
        });
        test('multiSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'Key1.${capture}.js');
            t.add('*.json', 'Key2.${capture}.js');
            t.add('*d.npmrc', 'Key3.${capture}.js');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1..js']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2..js']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2.a.js']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1.a.js']);
            assert.deepStrictEqual(t.get('a.b.cd.npmrc', fakeFilenameAttributes), ['Key1.a.b.cd.js', 'Key3.a.b.c.js']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1.a.b.c.d.js', 'Key3.a.b.c..js']);
        });
    });
    suite('PreTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('exactMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), []);
        });
        test('starMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['MyKey']);
        });
        test('starSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', '${capture}.json');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['.json']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['a.json']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['a.b.c.d.json']);
        });
        test('multiMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'Key1');
            t.add('*.json', 'Key2');
            t.add('*d.npmrc', 'Key3');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1', 'Key3']);
        });
        test('multiSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'Key1.${capture}.js');
            t.add('*.json', 'Key2.${capture}.js');
            t.add('*d.npmrc', 'Key3.${capture}.js');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1..js']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2..js']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2.a.js']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1.a.js']);
            assert.deepStrictEqual(t.get('a.b.cd.npmrc', fakeFilenameAttributes), ['Key1.a.b.cd.js', 'Key3.a.b.c.js']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1.a.b.c.d.js', 'Key3.a.b.c..js']);
        });
        test('emptyMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('package*json', 'package');
            assert.deepStrictEqual(t.get('package.json', fakeFilenameAttributes), ['package']);
            assert.deepStrictEqual(t.get('packagejson', fakeFilenameAttributes), ['package']);
            assert.deepStrictEqual(t.get('package-lock.json', fakeFilenameAttributes), ['package']);
        });
    });
    suite('StarTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const assertMapEquals = (actual, expected) => {
            const actualStr = [...actual.entries()].map(e => `${e[0]} => [${[...e[1].keys()].join()}]`);
            const expectedStr = Object.entries(expected).map(e => `${e[0]}: [${[e[1]].join()}]`);
            const bigMsg = actualStr + '===' + expectedStr;
            assert.strictEqual(actual.size, Object.keys(expected).length, bigMsg);
            for (const parent of actual.keys()) {
                const act = actual.get(parent);
                const exp = expected[parent];
                const str = [...act.keys()].join() + '===' + exp.join();
                const msg = bigMsg + '\n' + str;
                assert(act.size === exp.length, msg);
                for (const child of exp) {
                    assert(act.has(child), msg);
                }
            }
        };
        test('does added extension nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${capture}.*']],
            ]);
            const nesting = t.nest([
                'file',
                'file.json',
                'boop.test',
                'boop.test1',
                'boop.test.1',
                'beep',
                'beep.test1',
                'beep.boop.test1',
                'beep.boop.test2',
                'beep.boop.a',
            ], 'mydir');
            assertMapEquals(nesting, {
                'file': ['file.json'],
                'boop.test': ['boop.test.1'],
                'boop.test1': [],
                'beep': ['beep.test1', 'beep.boop.test1', 'beep.boop.test2', 'beep.boop.a']
            });
        });
        test('does ext specific nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.ts', ['${capture}.js']],
                ['*.js', ['${capture}.map']],
            ]);
            const nesting = t.nest([
                'a.ts',
                'a.js',
                'a.jss',
                'ab.js',
                'b.js',
                'b.map',
                'c.ts',
                'c.js',
                'c.map',
                'd.ts',
                'd.map',
            ], 'mydir');
            assertMapEquals(nesting, {
                'a.ts': ['a.js'],
                'ab.js': [],
                'a.jss': [],
                'b.js': ['b.map'],
                'c.ts': ['c.js', 'c.map'],
                'd.ts': [],
                'd.map': [],
            });
        });
        test('handles loops', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.a', ['${capture}.b', '${capture}.c']],
                ['*.b', ['${capture}.a']],
                ['*.c', ['${capture}.d']],
                ['*.aa', ['${capture}.bb']],
                ['*.bb', ['${capture}.cc', '${capture}.dd']],
                ['*.cc', ['${capture}.aa']],
                ['*.dd', ['${capture}.ee']],
            ]);
            const nesting = t.nest([
                '.a', '.b', '.c', '.d',
                'a.a', 'a.b', 'a.d',
                'a.aa', 'a.bb', 'a.cc',
                'b.aa', 'b.bb',
                'c.bb', 'c.cc',
                'd.aa', 'd.cc',
                'e.aa', 'e.bb', 'e.dd', 'e.ee',
                'f.aa', 'f.bb', 'f.cc', 'f.dd', 'f.ee',
            ], 'mydir');
            assertMapEquals(nesting, {
                '.a': [], '.b': [], '.c': [], '.d': [],
                'a.a': [], 'a.b': [], 'a.d': [],
                'a.aa': [], 'a.bb': [], 'a.cc': [],
                'b.aa': ['b.bb'],
                'c.bb': ['c.cc'],
                'd.cc': ['d.aa'],
                'e.aa': ['e.bb', 'e.dd', 'e.ee'],
                'f.aa': [], 'f.bb': [], 'f.cc': [], 'f.dd': [], 'f.ee': []
            });
        });
        test('does general bidirectional suffix matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${capture}.js']],
                ['*.js', ['${capture}-vscdoc.js']],
            ]);
            const nesting = t.nest([
                'a-vsdoc.js',
                'a.js',
                'b.js',
                'b-vscdoc.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'a-vsdoc.js': ['a.js'],
                'b.js': ['b-vscdoc.js'],
            });
        });
        test('does general bidirectional prefix matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['vsdoc-*.js', ['${capture}.js']],
                ['*.js', ['vscdoc-${capture}.js']],
            ]);
            const nesting = t.nest([
                'vsdoc-a.js',
                'a.js',
                'b.js',
                'vscdoc-b.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'vsdoc-a.js': ['a.js'],
                'b.js': ['vscdoc-b.js'],
            });
        });
        test('does general bidirectional general matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['foo-*-bar.js', ['${capture}.js']],
                ['*.js', ['bib-${capture}-bap.js']],
            ]);
            const nesting = t.nest([
                'foo-a-bar.js',
                'a.js',
                'b.js',
                'bib-b-bap.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'foo-a-bar.js': ['a.js'],
                'b.js': ['bib-b-bap.js'],
            });
        });
        test('does extension specific path segment matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.js', ['${capture}.*.js']],
            ]);
            const nesting = t.nest([
                'foo.js',
                'foo.test.js',
                'fooTest.js',
                'bar.js.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'foo.js': ['foo.test.js'],
                'fooTest.js': [],
                'bar.js.js': [],
            });
        });
        test('does exact match nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['package.json', ['.npmrc', 'npm-shrinkwrap.json', 'yarn.lock', '.yarnclean', '.yarnignore', '.yarn-integrity', '.yarnrc']],
                ['bower.json', ['.bowerrc']],
            ]);
            const nesting = t.nest([
                'package.json',
                '.npmrc', 'npm-shrinkwrap.json', 'yarn.lock',
                '.bowerrc',
            ], 'mydir');
            assertMapEquals(nesting, {
                'package.json': [
                    '.npmrc', 'npm-shrinkwrap.json', 'yarn.lock'
                ],
                '.bowerrc': [],
            });
        });
        test('eslint test', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['.eslintrc*', ['.eslint*']],
            ]);
            const nesting1 = t.nest([
                '.eslintrc.json',
                '.eslintignore',
            ], 'mydir');
            assertMapEquals(nesting1, {
                '.eslintrc.json': ['.eslintignore'],
            });
            const nesting2 = t.nest([
                '.eslintrc',
                '.eslintignore',
            ], 'mydir');
            assertMapEquals(nesting2, {
                '.eslintrc': ['.eslintignore'],
            });
        });
        test('basename expansion', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${basename}.doc']],
            ]);
            const nesting1 = t.nest([
                'boop-vsdoc.js',
                'boop-vsdoc.doc',
                'boop.doc',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'boop-vsdoc.js': ['boop-vsdoc.doc'],
                'boop.doc': [],
            });
        });
        test('extname expansion', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${extname}.doc']],
            ]);
            const nesting1 = t.nest([
                'boop-vsdoc.js',
                'js.doc',
                'boop.doc',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'boop-vsdoc.js': ['js.doc'],
                'boop.doc': [],
            });
        });
        test('added segment matcher', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${basename}.*.${extname}']],
            ]);
            const nesting1 = t.nest([
                'some.file',
                'some.html.file',
                'some.html.nested.file',
                'other.file',
                'some.thing',
                'some.thing.else',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'some.file': ['some.html.file', 'some.html.nested.file'],
                'other.file': [],
                'some.thing': [],
                'some.thing.else': [],
            });
        });
        test('added segment matcher (old format)', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['$(basename).*.$(extname)']],
            ]);
            const nesting1 = t.nest([
                'some.file',
                'some.html.file',
                'some.html.nested.file',
                'other.file',
                'some.thing',
                'some.thing.else',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'some.file': ['some.html.file', 'some.html.nested.file'],
                'other.file': [],
                'some.thing': [],
                'some.thing.else': [],
            });
        });
        test('dirname matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['index.ts', ['${dirname}.ts']],
            ]);
            const nesting1 = t.nest([
                'otherFile.ts',
                'MyComponent.ts',
                'index.ts',
            ], 'MyComponent');
            assertMapEquals(nesting1, {
                'index.ts': ['MyComponent.ts'],
                'otherFile.ts': [],
            });
        });
        test.skip('is fast', () => {
            const bigNester = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${capture}.*']],
                ['*.js', ['${capture}.*.js', '${capture}.map']],
                ['*.jsx', ['${capture}.js']],
                ['*.ts', ['${capture}.js', '${capture}.*.ts']],
                ['*.tsx', ['${capture}.js']],
                ['*.css', ['${capture}.*.css', '${capture}.map']],
                ['*.html', ['${capture}.*.html']],
                ['*.htm', ['${capture}.*.htm']],
                ['*.less', ['${capture}.*.less', '${capture}.css']],
                ['*.scss', ['${capture}.*.scss', '${capture}.css']],
                ['*.sass', ['${capture}.css']],
                ['*.styl', ['${capture}.css']],
                ['*.coffee', ['${capture}.*.coffee', '${capture}.js']],
                ['*.iced', ['${capture}.*.iced', '${capture}.js']],
                ['*.config', ['${capture}.*.config']],
                ['*.cs', ['${capture}.*.cs', '${capture}.cs.d.ts']],
                ['*.vb', ['${capture}.*.vb']],
                ['*.json', ['${capture}.*.json']],
                ['*.md', ['${capture}.html']],
                ['*.mdown', ['${capture}.html']],
                ['*.markdown', ['${capture}.html']],
                ['*.mdwn', ['${capture}.html']],
                ['*.svg', ['${capture}.svgz']],
                ['*.a', ['${capture}.b']],
                ['*.b', ['${capture}.a']],
                ['*.resx', ['${capture}.designer.cs']],
                ['package.json', ['.npmrc', 'npm-shrinkwrap.json', 'yarn.lock', '.yarnclean', '.yarnignore', '.yarn-integrity', '.yarnrc']],
                ['bower.json', ['.bowerrc']],
                ['*-vsdoc.js', ['${capture}.js']],
                ['*.tt', ['${capture}.*']]
            ]);
            const bigFiles = Array.from({ length: 50000 / 6 }).map((_, i) => [
                'file' + i + '.js',
                'file' + i + '.map',
                'file' + i + '.css',
                'file' + i + '.ts',
                'file' + i + '.d.ts',
                'file' + i + '.jsx',
            ]).flat();
            const start = performance.now();
            // const _bigResult =
            bigNester.nest(bigFiles, 'mydir');
            const end = performance.now();
            assert(end - start < 1000, 'too slow...' + (end - start));
            // console.log(bigResult)
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlTmVzdGluZ1RyaWUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL3Rlc3QvYnJvd3Nlci9leHBsb3JlckZpbGVOZXN0aW5nVHJpZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVFBLE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBRS9FLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3JCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixNQUFNLENBQUMsR0FBRyxJQUFJLGlDQUFPLEVBQUUsQ0FBQztZQUN4QixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUN4QixNQUFNLENBQUMsR0FBRyxJQUFJLGlDQUFPLEVBQUUsQ0FBQztZ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