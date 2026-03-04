define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.register = register;
    exports.getCodiconFontCharacters = getCodiconFontCharacters;
    const _codiconFontCharacters = Object.create(null);
    function register(id, fontCharacter) {
        if ((0, types_1.isString)(fontCharacter)) {
            const val = _codiconFontCharacters[fontCharacter];
            if (val === undefined) {
                throw new Error(`${id} references an unknown codicon: ${fontCharacter}`);
            }
            fontCharacter = val;
        }
        _codiconFontCharacters[id] = fontCharacter;
        return { id };
    }
    /**
     * Only to be used by the iconRegistry.
     */
    function getCodiconFontCharacters() {
        return _codiconFontCharacters;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kaWNvbnNVdGlsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vY29kaWNvbnNVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVVBLDRCQVVDO0lBS0QsNERBRUM7SUFuQkQsTUFBTSxzQkFBc0IsR0FBNkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUU3RSxTQUFnQixRQUFRLENBQUMsRUFBVSxFQUFFLGFBQThCO1FBQ2xFLElBQUksSUFBQSxnQkFBUSxFQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDN0IsTUFBTSxHQUFHLEdBQUcsc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEQsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLG1DQUFtQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFDRCxhQUFhLEdBQUcsR0FBRyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUM7UUFDM0MsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0Isd0JBQXdCO1FBQ3ZDLE9BQU8sc0JBQXNCLENBQUM7SUFDL0IsQ0FBQyJ9