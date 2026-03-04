/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/tfIdf", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, tfIdf_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Generates all permutations of an array.
     *
     * This is useful for testing to make sure order does not effect the result.
     */
    function permutate(arr) {
        if (arr.length === 0) {
            return [[]];
        }
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const permutationsRest = permutate(rest);
            for (let j = 0; j < permutationsRest.length; j++) {
                result.push([arr[i], ...permutationsRest[j]]);
            }
        }
        return result;
    }
    function assertScoreOrdersEqual(actualScores, expectedScoreKeys) {
        actualScores.sort((a, b) => (b.score - a.score) || a.key.localeCompare(b.key));
        assert.strictEqual(actualScores.length, expectedScoreKeys.length);
        for (let i = 0; i < expectedScoreKeys.length; i++) {
            assert.strictEqual(actualScores[i].key, expectedScoreKeys[i]);
        }
    }
    suite('TF-IDF Calculator', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Should return no scores when no documents are given', () => {
            const tfidf = new tfIdf_1.TfIdfCalculator();
            const scores = tfidf.calculateScores('something', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
        test('Should return no scores for term not in document', () => {
            const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments([
                makeDocument('A', 'cat dog fish'),
            ]);
            const scores = tfidf.calculateScores('elepant', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
        test('Should return scores for document with exact match', () => {
            for (const docs of permutate([
                makeDocument('A', 'cat dog cat'),
                makeDocument('B', 'cat fish'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['A']);
            }
        });
        test('Should return document with more matches first', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat'),
                makeDocument('/B', 'cat fish'),
                makeDocument('/C', 'frog'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should return document with more matches first when term appears in all documents', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat cat'),
                makeDocument('/B', 'cat fish'),
                makeDocument('/C', 'frog cat cat'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/C', '/B']);
            }
        });
        test('Should weigh less common term higher', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat'),
                makeDocument('/B', 'fish'),
                makeDocument('/C', 'cat cat cat cat'),
                makeDocument('/D', 'cat fish')
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat the dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/C', '/D']);
            }
        });
        test('Should weigh chunks with less common terms higher', () => {
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/B', '/A']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B', '/B']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat the dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/B', '/A', '/B']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('lake fish', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A']);
            }
        });
        test('Should ignore case and punctuation', () => {
            for (const docs of permutate([
                makeDocument('/A', 'Cat doG.cat'),
                makeDocument('/B', 'cAt fiSH'),
                makeDocument('/C', 'frOg'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('. ,CaT!  ', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should match on camelCase words', () => {
            for (const docs of permutate([
                makeDocument('/A', 'catDog cat'),
                makeDocument('/B', 'fishCatFish'),
                makeDocument('/C', 'frogcat'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('catDOG', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should not match document after delete', () => {
            const docA = makeDocument('/A', 'cat dog cat');
            const docB = makeDocument('/B', 'cat fish');
            const docC = makeDocument('/C', 'frog');
            const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments([docA, docB, docC]);
            let scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/A', '/B']);
            tfidf.deleteDocument(docA.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/B']);
            tfidf.deleteDocument(docC.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/B']);
            tfidf.deleteDocument(docB.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
    });
    function makeDocument(key, content) {
        return {
            key,
            textChunks: Array.isArray(content) ? content : [content],
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGZJZGYudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vdGZJZGYudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRzs7OztPQUlHO0lBQ0gsU0FBUyxTQUFTLENBQUksR0FBUTtRQUM3QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdEIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQztRQUV6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxZQUEwQixFQUFFLGlCQUEyQjtR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