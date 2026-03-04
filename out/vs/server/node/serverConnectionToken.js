/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "cookie", "fs", "vs/base/common/path", "vs/base/common/uuid", "vs/base/common/network", "vs/base/node/pfs"], function (require, exports, cookie, fs, path, uuid_1, network_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerConnectionTokenParseError = exports.MandatoryServerConnectionToken = exports.NoneServerConnectionToken = exports.ServerConnectionTokenType = void 0;
    exports.parseServerConnectionToken = parseServerConnectionToken;
    exports.determineServerConnectionToken = determineServerConnectionToken;
    exports.requestHasValidConnectionToken = requestHasValidConnectionToken;
    const connectionTokenRegex = /^[0-9A-Za-z_-]+$/;
    var ServerConnectionTokenType;
    (function (ServerConnectionTokenType) {
        ServerConnectionTokenType[ServerConnectionTokenType["None"] = 0] = "None";
        ServerConnectionTokenType[ServerConnectionTokenType["Optional"] = 1] = "Optional";
        ServerConnectionTokenType[ServerConnectionTokenType["Mandatory"] = 2] = "Mandatory";
    })(ServerConnectionTokenType || (exports.ServerConnectionTokenType = ServerConnectionTokenType = {}));
    class NoneServerConnectionToken {
        constructor() {
            this.type = 0 /* ServerConnectionTokenType.None */;
        }
        validate(connectionToken) {
            return true;
        }
    }
    exports.NoneServerConnectionToken = NoneServerConnectionToken;
    class MandatoryServerConnectionToken {
        constructor(value) {
            this.value = value;
            this.type = 2 /* ServerConnectionTokenType.Mandatory */;
        }
        validate(connectionToken) {
            return (connectionToken === this.value);
        }
    }
    exports.MandatoryServerConnectionToken = MandatoryServerConnectionToken;
    class ServerConnectionTokenParseError {
        constructor(message) {
            this.message = message;
        }
    }
    exports.ServerConnectionTokenParseError = ServerConnectionTokenParseError;
    async function parseServerConnectionToken(args, defaultValue) {
        const withoutConnectionToken = args['without-connection-token'];
        const connectionToken = args['connection-token'];
        const connectionTokenFile = args['connection-token-file'];
        if (withoutConnectionToken) {
            if (typeof connectionToken !== 'undefined' || typeof connectionTokenFile !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' or '--connection-token-file' at the same time as '--without-connection-token'.`);
            }
            return new NoneServerConnectionToken();
        }
        if (typeof connectionTokenFile !== 'undefined') {
            if (typeof connectionToken !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' at the same time as '--connection-token-file'.`);
            }
            let rawConnectionToken;
            try {
                rawConnectionToken = fs.readFileSync(connectionTokenFile).toString().replace(/\r?\n$/, '');
            }
            catch (e) {
                return new ServerConnectionTokenParseError(`Unable to read the connection token file at '${connectionTokenFile}'.`);
            }
            if (!connectionTokenRegex.test(rawConnectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token defined in '${connectionTokenFile} does not adhere to the characters 0-9, a-z, A-Z, _, or -.`);
            }
            return new MandatoryServerConnectionToken(rawConnectionToken);
        }
        if (typeof connectionToken !== 'undefined') {
            if (!connectionTokenRegex.test(connectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token '${connectionToken} does not adhere to the characters 0-9, a-z, A-Z or -.`);
            }
            return new MandatoryServerConnectionToken(connectionToken);
        }
        return new MandatoryServerConnectionToken(await defaultValue());
    }
    async function determineServerConnectionToken(args) {
        const readOrGenerateConnectionToken = async () => {
            if (!args['user-data-dir']) {
                // No place to store it!
                return (0, uuid_1.generateUuid)();
            }
            const storageLocation = path.join(args['user-data-dir'], 'token');
            // First try to find a connection token
            try {
                const fileContents = await pfs_1.Promises.readFile(storageLocation);
                const connectionToken = fileContents.toString().replace(/\r?\n$/, '');
                if (connectionTokenRegex.test(connectionToken)) {
                    return connectionToken;
                }
            }
            catch (err) { }
            // No connection token found, generate one
            const connectionToken = (0, uuid_1.generateUuid)();
            try {
                // Try to store it
                await pfs_1.Promises.writeFile(storageLocation, connectionToken, { mode: 0o600 });
            }
            catch (err) { }
            return connectionToken;
        };
        return parseServerConnectionToken(args, readOrGenerateConnectionToken);
    }
    function requestHasValidConnectionToken(connectionToken, req, parsedUrl) {
        // First check if there is a valid query parameter
        if (connectionToken.validate(parsedUrl.query[network_1.connectionTokenQueryName])) {
            return true;
        }
        // Otherwise, check if there is a valid cookie
        const cookies = cookie.parse(req.headers.cookie || '');
        return connectionToken.validate(cookies[network_1.connectionTokenCookieName]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyQ29ubmVjdGlvblRva2VuLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvc2VydmVyQ29ubmVjdGlvblRva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStDaEcsZ0VBd0NDO0lBRUQsd0VBNEJDO0lBRUQsd0VBU0M7SUFwSEQsTUFBTSxvQkFBb0IsR0FBRyxrQkFBa0IsQ0FBQztJQUVoRCxJQUFrQix5QkFJakI7SUFKRCxXQUFrQix5QkFBeUI7UUFDMUMseUVBQUksQ0FBQTtRQUNKLGlGQUFRLENBQUE7UUFDUixtRkFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUppQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQUkxQztJQUVELE1BQWEseUJBQXlCO1FBQXRDO1lBQ2lCLFNBQUksMENBQWtDO1FBS3ZELENBQUM7UUFITyxRQUFRLENBQUMsZUFBb0I7WUFDbkMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0Q7SUFORCw4REFNQztJQUVELE1BQWEsOEJBQThCO1FBRzFDLFlBQTRCLEtBQWE7WUFBYixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBRnpCLFNBQUksK0NBQXVDO1FBRzNELENBQUM7UUFFTSxRQUFRLENBQUMsZUFBb0I7WUFDbkMsT0FBTyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsQ0FBQztLQUNEO0lBVEQsd0VBU0M7SUFJRCxNQUFhLCtCQUErQjtRQUMzQyxZQUNpQixPQUFlO1lBQWYsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUM1QixDQUFDO0tBQ0w7SUFKRCwwRUFJQztJQUVNLEtBQUssVUFBVSwwQkFBMEIsQ0FBQyxJQUFzQixFQUFFLFlBQW1DO1FBQzNHLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFD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