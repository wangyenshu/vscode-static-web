define(["require", "exports", "vs/amdX", "vs/base/common/filters", "vs/base/common/network"], function (require, exports, amdX_1, filters, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const patterns = ['cci', 'ida', 'pos', 'CCI', 'enbled', 'callback', 'gGame', 'cons', 'zyx', 'aBc'];
    const _enablePerf = false;
    function perfSuite(name, callback) {
        if (_enablePerf) {
            suite(name, callback);
        }
    }
    perfSuite('Performance - fuzzyMatch', async function () {
        const uri = network_1.FileAccess.asBrowserUri('vs/base/test/common/filters.perf.data').toString(true);
        const { data } = await (0, amdX_1.importAMDNodeModule)(uri, '');
        // suiteSetup(() => console.profile());
        // suiteTeardown(() => console.profileEnd());
        console.log(`Matching ${data.length} items against ${patterns.length} patterns (${data.length * patterns.length} operations) `);
        function perfTest(name, match) {
            test(name, () => {
                const t1 = Date.now();
                let count = 0;
                for (let i = 0; i < 2; i++) {
                    for (const pattern of patterns) {
                        const patternLow = pattern.toLowerCase();
                        for (const item of data) {
                            count += 1;
                            match(pattern, patternLow, 0, item, item.toLowerCase(), 0);
                        }
                    }
                }
                const d = Date.now() - t1;
                console.log(name, `${d}ms, ${Math.round(count / d) * 15}/15ms, ${Math.round(count / d)}/1ms`);
            });
        }
        perfTest('fuzzyScore', filters.fuzzyScore);
        perfTest('fuzzyScoreGraceful', filters.fuzzyScoreGraceful);
        perfTest('fuzzyScoreGracefulAggressive', filters.fuzzyScoreGracefulAggressive);
    });
    perfSuite('Performance - IFilter', async function () {
        const uri = network_1.FileAccess.asBrowserUri('vs/base/test/common/filters.perf.data').toString(true);
        const { data } = await (0, amdX_1.importAMDNodeModule)(uri, '');
        function perfTest(name, match) {
            test(name, () => {
                const t1 = Date.now();
                let count = 0;
                for (let i = 0; i < 2; i++) {
                    for (const pattern of patterns) {
                        for (const item of data) {
                            count += 1;
                            match(pattern, item);
                        }
                    }
                }
                const d = Date.now() - t1;
                console.log(name, `${d}ms, ${Math.round(count / d) * 15}/15ms, ${Math.round(count / d)}/1ms`);
            });
        }
        perfTest('matchesFuzzy', filters.matchesFuzzy);
        perfTest('matchesFuzzy2', filters.matchesFuzzy2);
        perfTest('matchesPrefix', filters.matchesPrefix);
        perfTest('matchesContiguousSubString', filters.matchesContiguousSubString);
        perfTest('matchesCamelCase', filters.matchesCamelCase);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5wZXJmLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2ZpbHRlcnMucGVyZi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVFBLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbkcsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBRTFCLFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxRQUFxQztRQUNyRSxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkIsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLENBQUMsMEJBQTBCLEVBQUUsS0FBSztRQUUxQyxNQUFNLEdBQUcsR0FBRyxvQkFBVSxDQUFDLFlBQVksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFBLDBCQUFtQixFQUF5RCxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFNUcsdUNBQXVDO1FBQ3ZDLDZDQUE2QztRQUU3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxDQUFDLE1BQU0sa0JBQWtCLFFBQVEsQ0FBQyxNQUFNLGNBQWMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxlQUFlLENBQUMsQ0FBQztRQUVoSSxTQUFTLFFBQVEsQ0FBQyxJQUFZLEVBQUUsS0FBMEI7WUFDekQsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVB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