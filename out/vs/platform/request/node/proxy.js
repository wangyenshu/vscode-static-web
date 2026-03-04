/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "url", "vs/base/common/types"], function (require, exports, url_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getProxyAgent = getProxyAgent;
    function getSystemProxyURI(requestURL, env) {
        if (requestURL.protocol === 'http:') {
            return env.HTTP_PROXY || env.http_proxy || null;
        }
        else if (requestURL.protocol === 'https:') {
            return env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || null;
        }
        return null;
    }
    async function getProxyAgent(rawRequestURL, env, options = {}) {
        const requestURL = (0, url_1.parse)(rawRequestURL);
        const proxyURL = options.proxyUrl || getSystemProxyURI(requestURL, env);
        if (!proxyURL) {
            return null;
        }
        const proxyEndpoint = (0, url_1.parse)(proxyURL);
        if (!/^https?:$/.test(proxyEndpoint.protocol || '')) {
            return null;
        }
        const opts = {
            host: proxyEndpoint.hostname || '',
            port: (proxyEndpoint.port ? +proxyEndpoint.port : 0) || (proxyEndpoint.protocol === 'https' ? 443 : 80),
            auth: proxyEndpoint.auth,
            rejectUnauthorized: (0, types_1.isBoolean)(options.strictSSL) ? options.strictSSL : true,
        };
        return requestURL.protocol === 'http:'
            ? new (await new Promise((resolve_1, reject_1) => { require(['http-proxy-agent'], resolve_1, reject_1); })).HttpProxyAgent(proxyURL, opts)
            : new (await new Promise((resolve_2, reject_2) => { require(['https-proxy-agent'], resolve_2, reject_2); })).HttpsProxyAgent(proxyURL, opts);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZXF1ZXN0L25vZGUvcHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLHNDQXdCQztJQXZDRCxTQUFTLGlCQUFpQixDQUFDLFVBQWUsRUFBRSxHQUF1QjtRQUNsRSxJQUFJLFVBQVUsQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDckMsT0FBTyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO1FBQ2pELENBQUM7YUFBTSxJQUFJLFVBQVUsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDN0MsT0FBTyxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztRQUN2RixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBT00sS0FBSyxVQUFVLGFBQWEsQ0FBQyxhQUFxQixFQUFFLEdBQXVCLEVBQUUsVUFBb0IsRUFBRTtRQUN6RyxNQUFNLFVBQVUsR0FBRyxJQUFBLFdBQVEsRUFBQyxhQUFhLENBQUMsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxJQUFJLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUV4RSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxJQUFBLFdBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDckQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUc7WUFDWixJQUFJLEVBQUUsYUFBYSxDQUFDLFFBQVEsSUFBSSxFQUFFO1lBQ2xDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDdkcsSUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJO1lBQ3hCLGtCQUFrQixFQUFFLElBQUEsaUJBQVMsRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUk7U0FDM0UsQ0FBQztRQUVGLE9BQU8sVUFBVSxDQUFDLFFBQVEsS0FBSyxPQUFPO1lBQ3JDLENBQUMsQ0FBQyxJQUFJLENBQUMsc0RBQWEsa0JBQWtCLDJCQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztZQUN2RSxDQUFDLENBQUMsSUFBSSxDQUFDLHNEQUFhLG1CQUFtQiwyQkFBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1RSxDQUFDIn0=