/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, cancellation_1, errors_1, editorExtensions_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverProviderResult = void 0;
    exports.getHoverProviderResultsAsAsyncIterable = getHoverProviderResultsAsAsyncIterable;
    exports.getHoversPromise = getHoversPromise;
    class HoverProviderResult {
        constructor(provider, hover, ordinal) {
            this.provider = provider;
            this.hover = hover;
            this.ordinal = ordinal;
        }
    }
    exports.HoverProviderResult = HoverProviderResult;
    /**
     * Does not throw or return a rejected promise (returns undefined instead).
     */
    async function executeProvider(provider, ordinal, model, position, token) {
        const result = await Promise
            .resolve(provider.provideHover(model, position, token))
            .catch(errors_1.onUnexpectedExternalError);
        if (!result || !isValid(result)) {
            return undefined;
        }
        return new HoverProviderResult(provider, result, ordinal);
    }
    function getHoverProviderResultsAsAsyncIterable(registry, model, position, token) {
        const providers = registry.ordered(model);
        const promises = providers.map((provider, index) => executeProvider(provider, index, model, position, token));
        return async_1.AsyncIterableObject.fromPromises(promises).coalesce();
    }
    function getHoversPromise(registry, model, position, token) {
        return getHoverProviderResultsAsAsyncIterable(registry, model, position, token).map(item => item.hover).toPromise();
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeHoverProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return getHoversPromise(languageFeaturesService.hoverProvider, model, position, cancellation_1.CancellationToken.None);
    });
    function isValid(result) {
        const hasRange = (typeof result.range !== 'undefined');
        const hasHtmlContent = typeof result.contents !== 'undefined' && result.contents && result.contents.length > 0;
        return hasRange && hasHtmlContent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL2dldEhvdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlDaEcsd0ZBSUM7SUFFRCw0Q0FFQztJQTdCRCxNQUFhLG1CQUFtQjtRQUMvQixZQUNpQixRQUF1QixFQUN2QixLQUFZLEVBQ1osT0FBZTtZQUZmLGFBQVEsR0FBUixRQUFRLENBQWU7WUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDNUIsQ0FBQztLQUNMO0lBTkQsa0RBTUM7SUFFRDs7T0FFRztJQUNILEtBQUssVUFBVSxlQUFlLENBQUMsUUFBdUIsRUFBRSxPQUFlLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEtBQXdCO1FBQ3ZJLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTzthQUMxQixPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3RELEtBQUssQ0FBQyxrQ0FBeUIsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNqQyxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxJQUFJLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFNBQWdCLHNDQUFzQyxDQUFDLFFBQWdELEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEtBQXdCO1FBQ3ZLLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5RyxPQUFPLDJCQUFtQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsUUFBZ0QsRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsS0FBd0I7UUFDakosT0FBTyxzQ0FBc0MsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDckgsQ0FBQztJQUVELElBQUEsa0RBQStCLEVBQUMsdUJBQXVCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBb0IsRUFBRTtRQUN4RyxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztRQUN2RSxPQUFPLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pHLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxPQUFPLENBQUMsTUFBYTtRQUM3QixNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxPQUFPLE1BQU0sQ0FBQyxRQUFRLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQy9HLE9BQU8sUUFBUSxJQUFJLGNBQWMsQ0FBQztJQUNuQyxDQUFDIn0=