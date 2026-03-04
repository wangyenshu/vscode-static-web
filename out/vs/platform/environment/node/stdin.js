/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/async", "vs/base/common/extpath", "vs/base/node/pfs", "vs/base/node/terminalEncoding"], function (require, exports, os_1, async_1, extpath_1, pfs_1, terminalEncoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasStdinWithoutTty = hasStdinWithoutTty;
    exports.stdinDataListener = stdinDataListener;
    exports.getStdinFilePath = getStdinFilePath;
    exports.readFromStdin = readFromStdin;
    function hasStdinWithoutTty() {
        try {
            return !process.stdin.isTTY; // Via https://twitter.com/MylesBorins/status/782009479382626304
        }
        catch (error) {
            // Windows workaround for https://github.com/nodejs/node/issues/11656
        }
        return false;
    }
    function stdinDataListener(durationinMs) {
        return new Promise(resolve => {
            const dataListener = () => resolve(true);
            // wait for 1s maximum...
            setTimeout(() => {
                process.stdin.removeListener('data', dataListener);
                resolve(false);
            }, durationinMs);
            // ...but finish early if we detect data
            process.stdin.once('data', dataListener);
        });
    }
    function getStdinFilePath() {
        return (0, extpath_1.randomPath)((0, os_1.tmpdir)(), 'code-stdin', 3);
    }
    async function readFromStdin(targetPath, verbose, onEnd) {
        let [encoding, iconv] = await Promise.all([
            (0, terminalEncoding_1.resolveTerminalEncoding)(verbose),
            new Promise((resolve_1, reject_1) => { require(['@vscode/iconv-lite-umd'], resolve_1, reject_1); }), // lazy load encoding module for usage
            pfs_1.Promises.appendFile(targetPath, '') // make sure file exists right away (https://github.com/microsoft/vscode/issues/155341)
        ]);
        if (!iconv.encodingExists(encoding)) {
            console.log(`Unsupported terminal encoding: ${encoding}, falling back to UTF-8.`);
            encoding = 'utf8';
        }
        // Use a `Queue` to be able to use `appendFile`
        // which helps file watchers to be aware of the
        // changes because each append closes the underlying
        // file descriptor.
        // (https://github.com/microsoft/vscode/issues/148952)
        const appendFileQueue = new async_1.Queue();
        const decoder = iconv.getDecoder(encoding);
        process.stdin.on('data', chunk => {
            const chunkStr = decoder.write(chunk);
            appendFileQueue.queue(() => pfs_1.Promises.appendFile(targetPath, chunkStr));
        });
        process.stdin.on('end', () => {
            const end = decoder.end();
            appendFileQueue.queue(async () => {
                try {
                    if (typeof end === 'string') {
                        await pfs_1.Promises.appendFile(targetPath, end);
                    }
                }
                finally {
                    onEnd?.();
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RkaW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbnZpcm9ubWVudC9ub2RlL3N0ZGluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLGdEQU9DO0lBRUQsOENBY0M7SUFFRCw0Q0FFQztJQUVELHNDQXlDQztJQXRFRCxTQUFnQixrQkFBa0I7UUFDakMsSUFBSSxDQUFDO1lBQ0osT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsZ0VBQWdFO1FBQzlGLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLHFFQUFxRTtRQUN0RSxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQUMsWUFBb0I7UUFDckQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUM1QixNQUFNLFlBQVksR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFekMseUJBQXlCO1lBQ3pCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUVuRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEIsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRWpCLHdDQUF3QztZQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZ0IsZ0JBQWdCO1FBQy9CLE9BQU8sSUFBQSxvQkFBVSxFQUFDLElBQUEsV0FBTSxHQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFTSxLQUFLLFVBQVUsYUFBYSxDQUFDLFVBQWtCLEVBQUUsT0FBZ0IsRUFBRSxLQUFnQjtRQUV6RixJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUN6QyxJQUFBLDBDQUF1QixFQUFDLE9BQU8sQ0FBQzs0REFDekIsd0JBQXdCLDZCQUFHLHNDQUFzQztZQUN4RSxjQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyx1RkFBdUY7U0FDM0gsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxRQUFRLDBCQUEwQixDQUFDLENBQUM7WUFDbEYsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUNuQixDQUFDO1FBRUQsK0NBQStDO1FBQy9DLCtDQUErQztRQUMvQyxvREFBb0Q7UUFDcEQsbUJBQW1CO1FBQ25CLHNEQUFzRDtRQUV0RCxNQUFNLGVBQWUsR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFDO1FBRXBDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFM0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUM1QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFMUIsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDaEMsSUFBSSxDQUFDO29CQUNKLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQzdCLE1BQU0sY0FBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzVDLENBQUM7Z0JBQ0YsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=