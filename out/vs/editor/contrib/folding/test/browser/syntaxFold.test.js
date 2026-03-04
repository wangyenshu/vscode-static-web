define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/editor/contrib/folding/browser/syntaxRangeProvider", "vs/editor/test/common/testTextModel", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, syntaxRangeProvider_1, testTextModel_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestFoldingRangeProvider {
        constructor(model, ranges) {
            this.model = model;
            this.ranges = ranges;
        }
        provideFoldingRanges(model, context, token) {
            if (model === this.model) {
                return this.ranges;
            }
            return null;
        }
    }
    suite('Syntax folding', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function r(start, end) {
            return { start, end };
        }
        test('Limit by nesting level', async () => {
            const lines = [
                /* 1*/ '{',
                /* 2*/ '  A',
                /* 3*/ '  {',
                /* 4*/ '    {',
                /* 5*/ '      B',
                /* 6*/ '    }',
                /* 7*/ '    {',
                /* 8*/ '      A',
                /* 9*/ '      {',
                /* 10*/ '         A',
                /* 11*/ '      }',
                /* 12*/ '      {',
                /* 13*/ '        {',
                /* 14*/ '          {',
                /* 15*/ '             A',
                /* 16*/ '          }',
                /* 17*/ '        }',
                /* 18*/ '      }',
                /* 19*/ '    }',
                /* 20*/ '  }',
                /* 21*/ '}',
                /* 22*/ '{',
                /* 23*/ '  A',
                /* 24*/ '}',
            ];
            const r1 = r(1, 20); //0
            const r2 = r(3, 19); //1
            const r3 = r(4, 5); //2
            const r4 = r(7, 18); //2
            const r5 = r(9, 10); //3
            const r6 = r(12, 17); //4
            const r7 = r(13, 16); //5
            const r8 = r(14, 15); //6
            const r9 = r(22, 23); //0
            const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const ranges = [r1, r2, r3, r4, r5, r6, r7, r8, r9];
            const providers = [new TestFoldingRangeProvider(model, ranges)];
            async function assertLimit(maxEntries, expectedRanges, message) {
                let reported = false;
                const foldingRangesLimit = { limit: maxEntries, update: (computed, limited) => reported = limited };
                const syntaxRangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(model, providers, () => { }, foldingRangesLimit, undefined);
                try {
                    const indentRanges = await syntaxRangeProvider.compute(cancellation_1.CancellationToken.None);
                    const actual = [];
                    if (indentRanges) {
                        for (let i = 0; i < indentRanges.length; i++) {
                            actual.push({ start: indentRanges.getStartLineNumber(i), end: indentRanges.getEndLineNumber(i) });
                        }
                        assert.equal(reported, 9 <= maxEntries ? false : maxEntries, 'limited');
                    }
                    assert.deepStrictEqual(actual, expectedRanges, message);
                }
                finally {
                    syntaxRangeProvider.dispose();
                }
            }
            await assertLimit(1000, [r1, r2, r3, r4, r5, r6, r7, r8, r9], '1000');
            await assertLimit(9, [r1, r2, r3, r4, r5, r6, r7, r8, r9], '9');
            await assertLimit(8, [r1, r2, r3, r4, r5, r6, r7, r9], '8');
            await assertLimit(7, [r1, r2, r3, r4, r5, r6, r9], '7');
            await assertLimit(6, [r1, r2, r3, r4, r5, r9], '6');
            await assertLimit(5, [r1, r2, r3, r4, r9], '5');
            await assertLimit(4, [r1, r2, r3, r9], '4');
            await assertLimit(3, [r1, r2, r9], '3');
            await assertLimit(2, [r1, r9], '2');
            await assertLimit(1, [r1], '1');
            await assertLimit(0, [], '0');
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4Rm9sZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy90ZXN0L2Jyb3dzZXIvc3ludGF4Rm9sZC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWtCQSxNQUFNLHdCQUF3QjtRQUM3QixZQUFvQixLQUFpQixFQUFVLE1BQXFCO1lBQWhELFVBQUssR0FBTCxLQUFLLENBQVk7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFlO1FBQ3BFLENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxLQUFpQixFQUFFLE9BQXVCLEVBQUUsS0FBd0I7WUFDeEYsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMxQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDcEIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxDQUFDLENBQUMsS0FBYSxFQUFFLEdBQVc7WUFDcEMsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pDLE1BQU0sS0FBSyxHQUFHO2dCQUNiLE1BQU0sQ0FBQyxHQUFHO2dCQUNWLE1BQU0sQ0FBQyxLQUFLO2dCQUNaLE1BQU0sQ0FBQyxLQUFLO2dCQUNaLE1BQU0sQ0FBQyxPQUFPO2dCQUNkLE1BQU0sQ0FBQyxTQUFTO2dCQUNoQixNQUFNLENBQUMsT0FBTztnQkFDZCxNQUFNLENBQUMsT0FBTztnQkFDZCxNQUFNLENBQUMsU0FBUztnQkFDaEIsTUFBTSxDQUFDLFNBQVM7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QyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEQsTUFBTSxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDeEMsTUFBTSxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFOUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==