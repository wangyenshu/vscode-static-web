define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IAuthenticationExtensionsService = exports.IAuthenticationService = exports.INTERNAL_AUTH_PROVIDER_PREFIX = void 0;
    /**
     * Use this if you don't want the onDidChangeSessions event to fire in the extension host
     */
    exports.INTERNAL_AUTH_PROVIDER_PREFIX = '__';
    exports.IAuthenticationService = (0, instantiation_1.createDecorator)('IAuthenticationService');
    // TODO: Move this into MainThreadAuthentication
    exports.IAuthenticationExtensionsService = (0, instantiation_1.createDecorator)('IAuthenticationExtensionsService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXV0aGVudGljYXRpb24vY29tbW9uL2F1dGhlbnRpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFPQTs7T0FFRztJQUNVLFFBQUEsNkJBQTZCLEdBQUcsSUFBSSxDQUFDO0lBNkNyQyxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsd0JBQXdCLENBQUMsQ0FBQztJQWdHeEcsZ0RBQWdEO0lBQ25DLFFBQUEsZ0NBQWdDLEdBQUcsSUFBQSwrQkFBZSxFQUFtQyxrQ0FBa0MsQ0FBQyxDQUFDIn0=