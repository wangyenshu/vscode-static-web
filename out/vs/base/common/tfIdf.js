/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TfIdfCalculator = void 0;
    exports.normalizeTfIdfScores = normalizeTfIdfScores;
    function countMapFrom(values) {
        const map = new Map();
        for (const value of values) {
            map.set(value, (map.get(value) ?? 0) + 1);
        }
        return map;
    }
    /**
     * Implementation of tf-idf (term frequency-inverse document frequency) for a set of
     * documents where each document contains one or more chunks of text.
     * Each document is identified by a key, and the score for each document is computed
     * by taking the max score over all the chunks in the document.
     */
    class TfIdfCalculator {
        constructor() {
            /**
             * Total number of chunks
             */
            this.chunkCount = 0;
            this.chunkOccurrences = new Map();
            this.documents = new Map();
        }
        calculateScores(query, token) {
            const embedding = this.computeEmbedding(query);
            const idfCache = new Map();
            const scores = [];
            // For each document, generate one score
            for (const [key, doc] of this.documents) {
                if (token.isCancellationRequested) {
                    return [];
                }
                for (const chunk of doc.chunks) {
                    const score = this.computeSimilarityScore(chunk, embedding, idfCache);
                    if (score > 0) {
                        scores.push({ key, score });
                    }
                }
            }
            return scores;
        }
        /**
         * Count how many times each term (word) appears in a string.
         */
        static termFrequencies(input) {
            return countMapFrom(TfIdfCalculator.splitTerms(input));
        }
        /**
         * Break a string into terms (words).
         */
        static *splitTerms(input) {
            const normalize = (word) => word.toLowerCase();
            // Only match on words that are at least 3 characters long and start with a letter
            for (const [word] of input.matchAll(/\b\p{Letter}[\p{Letter}\d]{2,}\b/gu)) {
                yield normalize(word);
                const camelParts = word.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/g);
                if (camelParts.length > 1) {
                    for (const part of camelParts) {
                        // Require at least 3 letters in the parts of a camel case word
                        if (part.length > 2 && /\p{Letter}{3,}/gu.test(part)) {
                            yield normalize(part);
                        }
                    }
                }
            }
        }
        updateDocuments(documents) {
            for (const { key } of documents) {
                this.deleteDocument(key);
            }
            for (const doc of documents) {
                const chunks = [];
                for (const text of doc.textChunks) {
                    // TODO: See if we can compute the tf lazily
                    // The challenge is that we need to also update the `chunkOccurrences`
                    // and all of those updates need to get flushed before the real TF-IDF of
                    // anything is computed.
                    const tf = TfIdfCalculator.termFrequencies(text);
                    // Update occurrences list
                    for (const term of tf.keys()) {
                        this.chunkOccurrences.set(term, (this.chunkOccurrences.get(term) ?? 0) + 1);
                    }
                    chunks.push({ text, tf });
                }
                this.chunkCount += chunks.length;
                this.documents.set(doc.key, { chunks });
            }
            return this;
        }
        deleteDocument(key) {
            const doc = this.documents.get(key);
            if (!doc) {
                return;
            }
            this.documents.delete(key);
            this.chunkCount -= doc.chunks.length;
            // Update term occurrences for the document
            for (const chunk of doc.chunks) {
                for (const term of chunk.tf.keys()) {
                    const currentOccurrences = this.chunkOccurrences.get(term);
                    if (typeof currentOccurrences === 'number') {
                        const newOccurrences = currentOccurrences - 1;
                        if (newOccurrences <= 0) {
                            this.chunkOccurrences.delete(term);
                        }
                        else {
                            this.chunkOccurrences.set(term, newOccurrences);
                        }
                    }
                }
            }
        }
        computeSimilarityScore(chunk, queryEmbedding, idfCache) {
            // Compute the dot product between the chunk's embedding and the query embedding
            // Note that the chunk embedding is computed lazily on a per-term basis.
            // This lets us skip a large number of calculations because the majority
            // of chunks do not share any terms with the query.
            let sum = 0;
            for (const [term, termTfidf] of Object.entries(queryEmbedding)) {
                const chunkTf = chunk.tf.get(term);
                if (!chunkTf) {
                    // Term does not appear in chunk so it has no contribution
                    continue;
                }
                let chunkIdf = idfCache.get(term);
                if (typeof chunkIdf !== 'number') {
                    chunkIdf = this.computeIdf(term);
                    idfCache.set(term, chunkIdf);
                }
                const chunkTfidf = chunkTf * chunkIdf;
                sum += chunkTfidf * termTfidf;
            }
            return sum;
        }
        computeEmbedding(input) {
            const tf = TfIdfCalculator.termFrequencies(input);
            return this.computeTfidf(tf);
        }
        computeIdf(term) {
            const chunkOccurrences = this.chunkOccurrences.get(term) ?? 0;
            return chunkOccurrences > 0
                ? Math.log((this.chunkCount + 1) / chunkOccurrences)
                : 0;
        }
        computeTfidf(termFrequencies) {
            const embedding = Object.create(null);
            for (const [word, occurrences] of termFrequencies) {
                const idf = this.computeIdf(word);
                if (idf > 0) {
                    embedding[word] = occurrences * idf;
                }
            }
            return embedding;
        }
    }
    exports.TfIdfCalculator = TfIdfCalculator;
    /**
     * Normalize the scores to be between 0 and 1 and sort them decending.
     * @param scores array of scores from {@link TfIdfCalculator.calculateScores}
     * @returns normalized scores
     */
    function normalizeTfIdfScores(scores) {
        // copy of scores
        const result = scores.slice(0);
        // sort descending
        result.sort((a, b) => b.score - a.score);
        // normalize
        const max = result[0]?.score ?? 0;
        if (max > 0) {
            for (const score of result) {
                score.score /= max;
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGZJZGYuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi90ZklkZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyTmhHLG9EQWlCQztJQXBPRCxTQUFTLFlBQVksQ0FBSSxNQUFtQjtRQUMzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBQ2pDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7WUFDNUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUM7SUE0QkQ7Ozs7O09BS0c7SUFDSCxNQUFhLGVBQWU7UUFBNUI7WUFtREM7O2VBRUc7WUFDSyxlQUFVLEdBQUcsQ0FBQyxDQUFDO1lBRU4scUJBQWdCLEdBQXdCLElBQUksR0FBRyxFQUFxRCxDQUFDO1lBRXJHLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFFaEMsQ0FBQztRQXdHTixDQUFDO1FBbktBLGVBQWUsQ0FBQyxLQUFhLEVBQUUsS0FBd0I7WUFDdEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQzNDLE1BQU0sTUFBTSxHQUFpQixFQUFFLENBQUM7WUFDaEMsd0NBQXdDO1lBQ3hDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3pDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENB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