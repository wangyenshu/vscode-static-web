/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net"], function (require, exports, net) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BROWSER_RESTRICTED_PORTS = void 0;
    exports.findFreePort = findFreePort;
    exports.findFreePortFaster = findFreePortFaster;
    /**
     * Given a start point and a max number of retries, will find a port that
     * is openable. Will return 0 in case no free port can be found.
     */
    function findFreePort(startPort, giveUpAfter, timeout, stride = 1) {
        let done = false;
        return new Promise(resolve => {
            const timeoutHandle = setTimeout(() => {
                if (!done) {
                    done = true;
                    return resolve(0);
                }
            }, timeout);
            doFindFreePort(startPort, giveUpAfter, stride, (port) => {
                if (!done) {
                    done = true;
                    clearTimeout(timeoutHandle);
                    return resolve(port);
                }
            });
        });
    }
    function doFindFreePort(startPort, giveUpAfter, stride, clb) {
        if (giveUpAfter === 0) {
            return clb(0);
        }
        const client = new net.Socket();
        // If we can connect to the port it means the port is already taken so we continue searching
        client.once('connect', () => {
            dispose(client);
            return doFindFreePort(startPort + stride, giveUpAfter - 1, stride, clb);
        });
        client.once('data', () => {
            // this listener is required since node.js 8.x
        });
        client.once('error', (err) => {
            dispose(client);
            // If we receive any non ECONNREFUSED error, it means the port is used but we cannot connect
            if (err.code !== 'ECONNREFUSED') {
                return doFindFreePort(startPort + stride, giveUpAfter - 1, stride, clb);
            }
            // Otherwise it means the port is free to use!
            return clb(startPort);
        });
        client.connect(startPort, '127.0.0.1');
    }
    // Reference: https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/net/base/port_util.cc#56
    exports.BROWSER_RESTRICTED_PORTS = {
        1: true, // tcpmux
        7: true, // echo
        9: true, // discard
        11: true, // systat
        13: true, // daytime
        15: true, // netstat
        17: true, // qotd
        19: true, // chargen
        20: true, // ftp data
        21: true, // ftp access
        22: true, // ssh
        23: true, // telnet
        25: true, // smtp
        37: true, // time
        42: true, // name
        43: true, // nicname
        53: true, // domain
        69: true, // tftp
        77: true, // priv-rjs
        79: true, // finger
        87: true, // ttylink
        95: true, // supdup
        101: true, // hostriame
        102: true, // iso-tsap
        103: true, // gppitnp
        104: true, // acr-nema
        109: true, // pop2
        110: true, // pop3
        111: true, // sunrpc
        113: true, // auth
        115: true, // sftp
        117: true, // uucp-path
        119: true, // nntp
        123: true, // NTP
        135: true, // loc-srv /epmap
        137: true, // netbios
        139: true, // netbios
        143: true, // imap2
        161: true, // snmp
        179: true, // BGP
        389: true, // ldap
        427: true, // SLP (Also used by Apple Filing Protocol)
        465: true, // smtp+ssl
        512: true, // print / exec
        513: true, // login
        514: true, // shell
        515: true, // printer
        526: true, // tempo
        530: true, // courier
        531: true, // chat
        532: true, // netnews
        540: true, // uucp
        548: true, // AFP (Apple Filing Protocol)
        554: true, // rtsp
        556: true, // remotefs
        563: true, // nntp+ssl
        587: true, // smtp (rfc6409)
        601: true, // syslog-conn (rfc3195)
        636: true, // ldap+ssl
        989: true, // ftps-data
        990: true, // ftps
        993: true, // ldap+ssl
        995: true, // pop3+ssl
        1719: true, // h323gatestat
        1720: true, // h323hostcall
        1723: true, // pptp
        2049: true, // nfs
        3659: true, // apple-sasl / PasswordServer
        4045: true, // lockd
        5060: true, // sip
        5061: true, // sips
        6000: true, // X11
        6566: true, // sane-port
        6665: true, // Alternate IRC [Apple addition]
        6666: true, // Alternate IRC [Apple addition]
        6667: true, // Standard IRC [Apple addition]
        6668: true, // Alternate IRC [Apple addition]
        6669: true, // Alternate IRC [Apple addition]
        6697: true, // IRC + TLS
        10080: true // Amanda
    };
    /**
     * Uses listen instead of connect. Is faster, but if there is another listener on 0.0.0.0 then this will take 127.0.0.1 from that listener.
     */
    function findFreePortFaster(startPort, giveUpAfter, timeout, hostname = '127.0.0.1') {
        let resolved = false;
        let timeoutHandle = undefined;
        let countTried = 1;
        const server = net.createServer({ pauseOnConnect: true });
        function doResolve(port, resolve) {
            if (!resolved) {
                resolved = true;
                server.removeAllListeners();
                server.close();
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                resolve(port);
            }
        }
        return new Promise(resolve => {
            timeoutHandle = setTimeout(() => {
                doResolve(0, resolve);
            }, timeout);
            server.on('listening', () => {
                doResolve(startPort, resolve);
            });
            server.on('error', err => {
                if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES') && (countTried < giveUpAfter)) {
                    startPort++;
                    countTried++;
                    server.listen(startPort, hostname);
                }
                else {
                    doResolve(0, resolve);
                }
            });
            server.on('close', () => {
                doResolve(0, resolve);
            });
            server.listen(startPort, hostname);
        });
    }
    function dispose(socket) {
        try {
            socket.removeAllListeners('connect');
            socket.removeAllListeners('error');
            socket.end();
            socket.destroy();
            socket.unref();
        }
        catch (error) {
            console.error(error); // otherwise this error would get lost in the callback chain
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLG9DQW1CQztJQTBIRCxnREFzQ0M7SUF2TEQ7OztPQUdHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFDLFNBQWlCLEVBQUUsV0FBbUIsRUFBRSxPQUFlLEVBQUUsTUFBTSxHQUFHLENBQUM7UUFDL0YsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBRWpCLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDNUIsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ1osT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFWixjQUFjLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDdkQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ1osWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUM1QixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsU0FBaUIsRUFBRSxXQUFtQixFQUFFLE1BQWMsRUFBRSxHQUEyQjtRQUMxRyxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLEdB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