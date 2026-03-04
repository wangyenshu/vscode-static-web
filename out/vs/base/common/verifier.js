/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectVerifier = exports.EnumVerifier = exports.SetVerifier = exports.NumberVerifier = exports.BooleanVerifier = void 0;
    exports.verifyObject = verifyObject;
    class Verifier {
        constructor(defaultValue) {
            this.defaultValue = defaultValue;
        }
        verify(value) {
            if (!this.isType(value)) {
                return this.defaultValue;
            }
            return value;
        }
    }
    class BooleanVerifier extends Verifier {
        isType(value) {
            return typeof value === 'boolean';
        }
    }
    exports.BooleanVerifier = BooleanVerifier;
    class NumberVerifier extends Verifier {
        isType(value) {
            return typeof value === 'number';
        }
    }
    exports.NumberVerifier = NumberVerifier;
    class SetVerifier extends Verifier {
        isType(value) {
            return value instanceof Set;
        }
    }
    exports.SetVerifier = SetVerifier;
    class EnumVerifier extends Verifier {
        constructor(defaultValue, allowedValues) {
            super(defaultValue);
            this.allowedValues = allowedValues;
        }
        isType(value) {
            return this.allowedValues.includes(value);
        }
    }
    exports.EnumVerifier = EnumVerifier;
    class ObjectVerifier extends Verifier {
        constructor(defaultValue, verifier) {
            super(defaultValue);
            this.verifier = verifier;
        }
        verify(value) {
            if (!this.isType(value)) {
                return this.defaultValue;
            }
            return verifyObject(this.verifier, value);
        }
        isType(value) {
            return (0, types_1.isObject)(value);
        }
    }
    exports.ObjectVerifier = ObjectVerifier;
    function verifyObject(verifiers, value) {
        const result = Object.create(null);
        for (const key in verifiers) {
            if (Object.hasOwnProperty.call(verifiers, key)) {
                const verifier = verifiers[key];
                result[key] = verifier.verify(value[key]);
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZpZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi92ZXJpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3RWhHLG9DQVdDO0lBM0VELE1BQWUsUUFBUTtRQUV0QixZQUErQixZQUFlO1lBQWYsaUJBQVksR0FBWixZQUFZLENBQUc7UUFBSSxDQUFDO1FBRW5ELE1BQU0sQ0FBQyxLQUFjO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUMxQixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0tBR0Q7SUFFRCxNQUFhLGVBQWdCLFNBQVEsUUFBaUI7UUFDM0MsTUFBTSxDQUFDLEtBQWM7WUFDOUIsT0FBTyxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUM7UUFDbkMsQ0FBQztLQUNEO0lBSkQsMENBSUM7SUFFRCxNQUFhLGNBQWUsU0FBUSxRQUFnQjtRQUN6QyxNQUFNLENBQUMsS0FBYztZQUM5QixPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQztRQUNsQyxDQUFDO0tBQ0Q7SUFKRCx3Q0FJQztJQUVELE1BQWEsV0FBZSxTQUFRLFFBQWdCO1FBQ3pDLE1BQU0sQ0FBQyxLQUFjO1lBQzlCLE9BQU8sS0FBSyxZQUFZLEdBQUcsQ0FBQztRQUM3QixDQUFDO0tBQ0Q7SUFKRCxrQ0FJQztJQUVELE1BQWEsWUFBZ0IsU0FBUSxRQUFXO1FBRy9DLFlBQVksWUFBZSxFQUFFLGFBQStCO1lBQzNELEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNwQyxDQUFDO1FBRVMsTUFBTSxDQUFDLEtBQWM7WUFDOUIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFVLENBQUMsQ0FBQztRQUNoRCxDQUFDO0tBQ0Q7SUFYRCxvQ0FXQztJQUVELE1BQWEsY0FBaUMsU0FBUSxRQUFXO1FBRWhFLFlBQVksWUFBZSxFQUFtQixRQUE2QztZQUMxRixLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFEeUIsYUFBUSxHQUFSLFFBQVEsQ0FBcUM7UUFFM0YsQ0FBQztRQUVRLE1BQU0sQ0FBQyxLQUFjO1lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUMxQixDQUFDO1lBQ0QsT0FBTyxZQUFZLENBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRVMsTUFBTSxDQUFDLEtBQWM7WUFDOUIsT0FBTyxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBaEJELHdDQWdCQztJQUVELFNBQWdCLFlBQVksQ0FBbUIsU0FBOEMsRUFBRSxLQUFhO1FBQzNHLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkMsS0FBSyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM3QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFFLEtBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDIn0=