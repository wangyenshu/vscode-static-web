/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/base/common/types"], function (require, exports, nls, color_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createValidator = createValidator;
    exports.getInvalidTypeError = getInvalidTypeError;
    function canBeType(propTypes, ...types) {
        return types.some(t => propTypes.includes(t));
    }
    function isNullOrEmpty(value) {
        return value === '' || (0, types_1.isUndefinedOrNull)(value);
    }
    function createValidator(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isNumeric = (canBeType(type, 'number') || canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const numericValidations = getNumericValidators(prop);
        const stringValidations = getStringValidators(prop);
        const arrayValidator = getArrayValidator(prop);
        const objectValidator = getObjectValidator(prop);
        return value => {
            if (isNullable && isNullOrEmpty(value)) {
                return '';
            }
            const errors = [];
            if (arrayValidator) {
                const err = arrayValidator(value);
                if (err) {
                    errors.push(err);
                }
            }
            if (objectValidator) {
                const err = objectValidator(value);
                if (err) {
                    errors.push(err);
                }
            }
            if (prop.type === 'boolean' && value !== true && value !== false) {
                errors.push(nls.localize('validations.booleanIncorrectType', 'Incorrect type. Expected "boolean".'));
            }
            if (isNumeric) {
                if (isNullOrEmpty(value) || typeof value === 'boolean' || Array.isArray(value) || isNaN(+value)) {
                    errors.push(nls.localize('validations.expectedNumeric', "Value must be a number."));
                }
                else {
                    errors.push(...numericValidations.filter(validator => !validator.isValid(+value)).map(validator => validator.message));
                }
            }
            if (prop.type === 'string') {
                if (prop.enum && !(0, types_1.isStringArray)(prop.enum)) {
                    errors.push(nls.localize('validations.stringIncorrectEnumOptions', 'The enum options should be strings, but there is a non-string option. Please file an issue with the extension author.'));
                }
                else if (!(0, types_1.isString)(value)) {
                    errors.push(nls.localize('validations.stringIncorrectType', 'Incorrect type. Expected "string".'));
                }
                else {
                    errors.push(...stringValidations.filter(validator => !validator.isValid(value)).map(validator => validator.message));
                }
            }
            if (errors.length) {
                return prop.errorMessage ? [prop.errorMessage, ...errors].join(' ') : errors.join(' ');
            }
            return '';
        };
    }
    /**
     * Returns an error string if the value is invalid and can't be displayed in the settings UI for the given type.
     */
    function getInvalidTypeError(value, type) {
        if (typeof type === 'undefined') {
            return;
        }
        const typeArr = Array.isArray(type) ? type : [type];
        if (!typeArr.some(_type => valueValidatesAsType(value, _type))) {
            return nls.localize('invalidTypeError', "Setting has an invalid type, expected {0}. Fix in JSON.", JSON.stringify(type));
        }
        return;
    }
    function valueValidatesAsType(value, type) {
        const valueType = typeof value;
        if (type === 'boolean') {
            return valueType === 'boolean';
        }
        else if (type === 'object') {
            return value && !Array.isArray(value) && valueType === 'object';
        }
        else if (type === 'null') {
            return value === null;
        }
        else if (type === 'array') {
            return Array.isArray(value);
        }
        else if (type === 'string') {
            return valueType === 'string';
        }
        else if (type === 'number' || type === 'integer') {
            return valueType === 'number';
        }
        return true;
    }
    function toRegExp(pattern) {
        try {
            // The u flag allows support for better Unicode matching,
            // but deprecates some patterns such as [\s-9]
            // Ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class#description
            return new RegExp(pattern, 'u');
        }
        catch (e) {
            try {
                return new RegExp(pattern);
            }
            catch (e) {
                // If the pattern can't be parsed even without the 'u' flag,
                // just log the error to avoid rendering the entire Settings editor blank.
                // Ref https://github.com/microsoft/vscode/issues/195054
                console.error(nls.localize('regexParsingError', "Error parsing the following regex both with and without the u flag:"), pattern);
                return /.*/;
            }
        }
    }
    function getStringValidators(prop) {
        const uriRegex = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
        let patternRegex;
        if (typeof prop.pattern === 'string') {
            patternRegex = toRegExp(prop.pattern);
        }
        return [
            {
                enabled: prop.maxLength !== undefined,
                isValid: ((value) => value.length <= prop.maxLength),
                message: nls.localize('validations.maxLength', "Value must be {0} or fewer characters long.", prop.maxLength)
            },
            {
                enabled: prop.minLength !== undefined,
                isValid: ((value) => value.length >= prop.minLength),
                message: nls.localize('validations.minLength', "Value must be {0} or more characters long.", prop.minLength)
            },
            {
                enabled: patternRegex !== undefined,
                isValid: ((value) => patternRegex.test(value)),
                message: prop.patternErrorMessage || nls.localize('validations.regex', "Value must match regex `{0}`.", prop.pattern)
            },
            {
                enabled: prop.format === 'color-hex',
                isValid: ((value) => color_1.Color.Format.CSS.parseHex(value)),
                message: nls.localize('validations.colorFormat', "Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA.")
            },
            {
                enabled: prop.format === 'uri' || prop.format === 'uri-reference',
                isValid: ((value) => !!value.length),
                message: nls.localize('validations.uriEmpty', "URI expected.")
            },
            {
                enabled: prop.format === 'uri' || prop.format === 'uri-reference',
                isValid: ((value) => uriRegex.test(value)),
                message: nls.localize('validations.uriMissing', "URI is expected.")
            },
            {
                enabled: prop.format === 'uri',
                isValid: ((value) => {
                    const matches = value.match(uriRegex);
                    return !!(matches && matches[2]);
                }),
                message: nls.localize('validations.uriSchemeMissing', "URI with a scheme is expected.")
            },
            {
                enabled: prop.enum !== undefined,
                isValid: ((value) => {
                    return prop.enum.includes(value);
                }),
                message: nls.localize('validations.invalidStringEnumValue', "Value is not accepted. Valid values: {0}.", prop.enum ? prop.enum.map(key => `"${key}"`).join(', ') : '[]')
            }
        ].filter(validation => validation.enabled);
    }
    function getNumericValidators(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isIntegral = (canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const isNumeric = canBeType(type, 'number', 'integer') && (type.length === 1 || type.length === 2 && isNullable);
        if (!isNumeric) {
            return [];
        }
        let exclusiveMax;
        let exclusiveMin;
        if (typeof prop.exclusiveMaximum === 'boolean') {
            exclusiveMax = prop.exclusiveMaximum ? prop.maximum : undefined;
        }
        else {
            exclusiveMax = prop.exclusiveMaximum;
        }
        if (typeof prop.exclusiveMinimum === 'boolean') {
            exclusiveMin = prop.exclusiveMinimum ? prop.minimum : undefined;
        }
        else {
            exclusiveMin = prop.exclusiveMinimum;
        }
        return [
            {
                enabled: exclusiveMax !== undefined && (prop.maximum === undefined || exclusiveMax <= prop.maximum),
                isValid: ((value) => value < exclusiveMax),
                message: nls.localize('validations.exclusiveMax', "Value must be strictly less than {0}.", exclusiveMax)
            },
            {
                enabled: exclusiveMin !== undefined && (prop.minimum === undefined || exclusiveMin >= prop.minimum),
                isValid: ((value) => value > exclusiveMin),
                message: nls.localize('validations.exclusiveMin', "Value must be strictly greater than {0}.", exclusiveMin)
            },
            {
                enabled: prop.maximum !== undefined && (exclusiveMax === undefined || exclusiveMax > prop.maximum),
                isValid: ((value) => value <= prop.maximum),
                message: nls.localize('validations.max', "Value must be less than or equal to {0}.", prop.maximum)
            },
            {
                enabled: prop.minimum !== undefined && (exclusiveMin === undefined || exclusiveMin < prop.minimum),
                isValid: ((value) => value >= prop.minimum),
                message: nls.localize('validations.min', "Value must be greater than or equal to {0}.", prop.minimum)
            },
            {
                enabled: prop.multipleOf !== undefined,
                isValid: ((value) => value % prop.multipleOf === 0),
                message: nls.localize('validations.multipleOf', "Value must be a multiple of {0}.", prop.multipleOf)
            },
            {
                enabled: isIntegral,
                isValid: ((value) => value % 1 === 0),
                message: nls.localize('validations.expectedInteger', "Value must be an integer.")
            },
        ].filter(validation => validation.enabled);
    }
    function getArrayValidator(prop) {
        if (prop.type === 'array' && prop.items && !Array.isArray(prop.items)) {
            const propItems = prop.items;
            if (propItems && !Array.isArray(propItems.type)) {
                const withQuotes = (s) => `'` + s + `'`;
                return value => {
                    if (!value) {
                        return null;
                    }
                    let message = '';
                    if (!Array.isArray(value)) {
                        message += nls.localize('validations.arrayIncorrectType', 'Incorrect type. Expected an array.');
                        message += '\n';
                        return message;
                    }
                    const arrayValue = value;
                    if (prop.uniqueItems) {
                        if (new Set(arrayValue).size < arrayValue.length) {
                            message += nls.localize('validations.stringArrayUniqueItems', 'Array has duplicate items');
                            message += '\n';
                        }
                    }
                    if (prop.minItems && arrayValue.length < prop.minItems) {
                        message += nls.localize('validations.stringArrayMinItem', 'Array must have at least {0} items', prop.minItems);
                        message += '\n';
                    }
                    if (prop.maxItems && arrayValue.length > prop.maxItems) {
                        message += nls.localize('validations.stringArrayMaxItem', 'Array must have at most {0} items', prop.maxItems);
                        message += '\n';
                    }
                    if (propItems.type === 'string') {
                        if (!(0, types_1.isStringArray)(arrayValue)) {
                            message += nls.localize('validations.stringArrayIncorrectType', 'Incorrect type. Expected a string array.');
                            message += '\n';
                            return message;
                        }
                        if (typeof propItems.pattern === 'string') {
                            const patternRegex = toRegExp(propItems.pattern);
                            arrayValue.forEach(v => {
                                if (!patternRegex.test(v)) {
                                    message +=
                                        propItems.patternErrorMessage ||
                                            nls.localize('validations.stringArrayItemPattern', 'Value {0} must match regex {1}.', withQuotes(v), withQuotes(propItems.pattern));
                                }
                            });
                        }
                        const propItemsEnum = propItems.enum;
                        if (propItemsEnum) {
                            arrayValue.forEach(v => {
                                if (propItemsEnum.indexOf(v) === -1) {
                                    message += nls.localize('validations.stringArrayItemEnum', 'Value {0} is not one of {1}', withQuotes(v), '[' + propItemsEnum.map(withQuotes).join(', ') + ']');
                                    message += '\n';
                                }
                            });
                        }
                    }
                    else if (propItems.type === 'integer' || propItems.type === 'number') {
                        arrayValue.forEach(v => {
                            const errorMessage = getErrorsForSchema(propItems, v);
                            if (errorMessage) {
                                message += `${v}: ${errorMessage}\n`;
                            }
                        });
                    }
                    return message;
                };
            }
        }
        return null;
    }
    function getObjectValidator(prop) {
        if (prop.type === 'object') {
            const { properties, patternProperties, additionalProperties } = prop;
            return value => {
                if (!value) {
                    return null;
                }
                const errors = [];
                if (!(0, types_1.isObject)(value)) {
                    errors.push(nls.localize('validations.objectIncorrectType', 'Incorrect type. Expected an object.'));
                }
                else {
                    Object.keys(value).forEach((key) => {
                        const data = value[key];
                        if (properties && key in properties) {
                            const errorMessage = getErrorsForSchema(properties[key], data);
                            if (errorMessage) {
                                errors.push(`${key}: ${errorMessage}\n`);
                            }
                            return;
                        }
                        if (patternProperties) {
                            for (const pattern in patternProperties) {
                                if (RegExp(pattern).test(key)) {
                                    const errorMessage = getErrorsForSchema(patternProperties[pattern], data);
                                    if (errorMessage) {
                                        errors.push(`${key}: ${errorMessage}\n`);
                                    }
                                    return;
                                }
                            }
                        }
                        if (additionalProperties === false) {
                            errors.push(nls.localize('validations.objectPattern', 'Property {0} is not allowed.\n', key));
                        }
                        else if (typeof additionalProperties === 'object') {
                            const errorMessage = getErrorsForSchema(additionalProperties, data);
                            if (errorMessage) {
                                errors.push(`${key}: ${errorMessage}\n`);
                            }
                        }
                    });
                }
                if (errors.length) {
                    return prop.errorMessage ? [prop.errorMessage, ...errors].join(' ') : errors.join(' ');
                }
                return '';
            };
        }
        return null;
    }
    function getErrorsForSchema(propertySchema, data) {
        const validator = createValidator(propertySchema);
        const errorMessage = validator(data);
        return errorMessage;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNWYWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ByZWZlcmVuY2VzL2NvbW1vbi9wcmVmZXJlbmNlc1ZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLDBDQXdEQztJQUtELGtEQVdDO0lBaEZELFNBQVMsU0FBUyxDQUFDLFNBQWlDLEVBQUUsR0FBRyxLQUF1QjtRQUMvRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLEtBQWM7UUFDcEMsT0FBTyxLQUFLLEtBQUssRUFBRSxJQUFJLElBQUEseUJBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxJQUFrQztRQUNqRSxNQUFNLElBQUksR0FBMkIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLFVB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