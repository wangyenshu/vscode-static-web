/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractSignService = void 0;
    class AbstractSignService {
        constructor() {
            this.validators = new Map();
        }
        static { this._nextId = 1; }
        async createNewMessage(value) {
            try {
                const validator = await this.getValidator();
                if (validator) {
                    const id = String(AbstractSignService._nextId++);
                    this.validators.set(id, validator);
                    return {
                        id: id,
                        data: validator.createNewMessage(value)
                    };
                }
            }
            catch (e) {
                // ignore errors silently
            }
            return { id: '', data: value };
        }
        async validate(message, value) {
            if (!message.id) {
                return true;
            }
            const validator = this.validators.get(message.id);
            if (!validator) {
                return false;
            }
            this.validators.delete(message.id);
            try {
                return (validator.validate(value) === 'ok');
            }
            catch (e) {
                // ignore errors silently
                return false;
            }
            finally {
                validator.dispose?.();
            }
        }
        async sign(value) {
            try {
                return await this.signValue(value);
            }
            catch (e) {
                // ignore errors silently
            }
            return value;
        }
    }
    exports.AbstractSignService = AbstractSignService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTaWduU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3NpZ24vY29tbW9uL2Fic3RyYWN0U2lnblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQXNCLG1CQUFtQjtRQUF6QztZQUlrQixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7UUFrRGpFLENBQUM7aUJBbkRlLFlBQU8sR0FBRyxDQUFDLEFBQUosQ0FBSztRQU1wQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBYTtZQUMxQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzVDLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbkMsT0FBTzt3QkFDTixFQUFFLEVBQUUsRUFBRTt3QkFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztxQkFDdkMsQ0FBQztnQkFDSCxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1oseUJBQXlCO1lBQzFCLENBQUM7WUFDRCxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBaUIsRUFBRSxLQUFhO1lBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0osT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1oseUJBQXlCO2dCQUN6QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7b0JBQVMsQ0FBQztnQkFDVixTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUN2QixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBYTtZQUN2QixJQUFJLENBQUM7Z0JBQ0osT0FBTyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1oseUJBQXlCO1lBQzFCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7O0lBckRGLGtEQXNEQyJ9