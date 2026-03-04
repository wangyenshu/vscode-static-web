/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/watcher"], function (require, exports, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeStats = computeStats;
    function computeStats(requests, recursiveWatcher, nonRecursiveWatcher) {
        const lines = [];
        const allRecursiveRequests = sortByPathPrefix(requests.filter(request => request.recursive));
        const nonSuspendedRecursiveRequests = allRecursiveRequests.filter(request => recursiveWatcher.isSuspended(request) === false);
        const suspendedPollingRecursiveRequests = allRecursiveRequests.filter(request => recursiveWatcher.isSuspended(request) === 'polling');
        const suspendedNonPollingRecursiveRequests = allRecursiveRequests.filter(request => recursiveWatcher.isSuspended(request) === true);
        const recursiveRequestsStatus = computeRequestStatus(allRecursiveRequests, recursiveWatcher);
        const recursiveWatcherStatus = computeRecursiveWatchStatus(recursiveWatcher);
        const allNonRecursiveRequests = sortByPathPrefix(requests.filter(request => !request.recursive));
        const nonSuspendedNonRecursiveRequests = allNonRecursiveRequests.filter(request => nonRecursiveWatcher.isSuspended(request) === false);
        const suspendedPollingNonRecursiveRequests = allNonRecursiveRequests.filter(request => nonRecursiveWatcher.isSuspended(request) === 'polling');
        const suspendedNonPollingNonRecursiveRequests = allNonRecursiveRequests.filter(request => nonRecursiveWatcher.isSuspended(request) === true);
        const nonRecursiveRequestsStatus = computeRequestStatus(allNonRecursiveRequests, nonRecursiveWatcher);
        const nonRecursiveWatcherStatus = computeNonRecursiveWatchStatus(nonRecursiveWatcher);
        lines.push('[Summary]');
        lines.push(`- Recursive Requests:     total: ${allRecursiveRequests.length}, suspended: ${recursiveRequestsStatus.suspended}, polling: ${recursiveRequestsStatus.polling}`);
        lines.push(`- Non-Recursive Requests: total: ${allNonRecursiveRequests.length}, suspended: ${nonRecursiveRequestsStatus.suspended}, polling: ${nonRecursiveRequestsStatus.polling}`);
        lines.push(`- Recursive Watchers:     total: ${recursiveWatcher.watchers.size}, active: ${recursiveWatcherStatus.active}, failed: ${recursiveWatcherStatus.failed}, stopped: ${recursiveWatcherStatus.stopped}`);
        lines.push(`- Non-Recursive Watchers: total: ${nonRecursiveWatcher.watchers.size}, active: ${nonRecursiveWatcherStatus.active}, failed: ${nonRecursiveWatcherStatus.failed}, reusing: ${nonRecursiveWatcherStatus.reusing}`);
        lines.push(`- I/O Handles Impact:     total: ${recursiveRequestsStatus.polling + nonRecursiveRequestsStatus.polling + recursiveWatcherStatus.active + nonRecursiveWatcherStatus.active}`);
        lines.push(`\n[Recursive Requests (${allRecursiveRequests.length}, suspended: ${recursiveRequestsStatus.suspended}, polling: ${recursiveRequestsStatus.polling})]:`);
        const recursiveRequestLines = [];
        for (const request of [nonSuspendedRecursiveRequests, suspendedPollingRecursiveRequests, suspendedNonPollingRecursiveRequests].flat()) {
            fillRequestStats(recursiveRequestLines, request, recursiveWatcher);
        }
        lines.push(...alignTextColumns(recursiveRequestLines));
        const recursiveWatcheLines = [];
        fillRecursiveWatcherStats(recursiveWatcheLines, recursiveWatcher);
        lines.push(...alignTextColumns(recursiveWatcheLines));
        lines.push(`\n[Non-Recursive Requests (${allNonRecursiveRequests.length}, suspended: ${nonRecursiveRequestsStatus.suspended}, polling: ${nonRecursiveRequestsStatus.polling})]:`);
        const nonRecursiveRequestLines = [];
        for (const request of [nonSuspendedNonRecursiveRequests, suspendedPollingNonRecursiveRequests, suspendedNonPollingNonRecursiveRequests].flat()) {
            fillRequestStats(nonRecursiveRequestLines, request, nonRecursiveWatcher);
        }
        lines.push(...alignTextColumns(nonRecursiveRequestLines));
        const nonRecursiveWatcheLines = [];
        fillNonRecursiveWatcherStats(nonRecursiveWatcheLines, nonRecursiveWatcher);
        lines.push(...alignTextColumns(nonRecursiveWatcheLines));
        return `\n\n[File Watcher] request stats:\n\n${lines.join('\n')}\n\n`;
    }
    function alignTextColumns(lines) {
        let maxLength = 0;
        for (const line of lines) {
            maxLength = Math.max(maxLength, line.split('\t')[0].length);
        }
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('\t');
            if (parts.length === 2) {
                const padding = ' '.repeat(maxLength - parts[0].length);
                lines[i] = `${parts[0]}${padding}\t${parts[1]}`;
            }
        }
        return lines;
    }
    function computeRequestStatus(requests, watcher) {
        let polling = 0;
        let suspended = 0;
        for (const request of requests) {
            const isSuspended = watcher.isSuspended(request);
            if (isSuspended === false) {
                continue;
            }
            suspended++;
            if (isSuspended === 'polling') {
                polling++;
            }
        }
        return { suspended, polling };
    }
    function computeRecursiveWatchStatus(recursiveWatcher) {
        let active = 0;
        let failed = 0;
        let stopped = 0;
        for (const watcher of recursiveWatcher.watchers.values()) {
            if (!watcher.failed && !watcher.stopped) {
                active++;
            }
            if (watcher.failed) {
                failed++;
            }
            if (watcher.stopped) {
                stopped++;
            }
        }
        return { active, failed, stopped };
    }
    function computeNonRecursiveWatchStatus(nonRecursiveWatcher) {
        let active = 0;
        let failed = 0;
        let reusing = 0;
        for (const watcher of nonRecursiveWatcher.watchers) {
            if (!watcher.instance.failed && !watcher.instance.isReusingRecursiveWatcher) {
                active++;
            }
            if (watcher.instance.failed) {
                failed++;
            }
            if (watcher.instance.isReusingRecursiveWatcher) {
                reusing++;
            }
        }
        return { active, failed, reusing };
    }
    function sortByPathPrefix(requests) {
        requests.sort((r1, r2) => {
            const p1 = isUniversalWatchRequest(r1) ? r1.path : r1.request.path;
            const p2 = isUniversalWatchRequest(r2) ? r2.path : r2.request.path;
            const minLength = Math.min(p1.length, p2.length);
            for (let i = 0; i < minLength; i++) {
                if (p1[i] !== p2[i]) {
                    return (p1[i] < p2[i]) ? -1 : 1;
                }
            }
            return p1.length - p2.length;
        });
        return requests;
    }
    function isUniversalWatchRequest(obj) {
        const candidate = obj;
        return typeof candidate?.path === 'string';
    }
    function fillRequestStats(lines, request, watcher) {
        const decorations = [];
        const suspended = watcher.isSuspended(request);
        if (suspended !== false) {
            if (suspended === 'polling') {
                decorations.push('[SUSPENDED <polling>]');
            }
            else {
                decorations.push('[SUSPENDED <non-polling>]');
            }
        }
        lines.push(` ${request.path}\t${decorations.length > 0 ? decorations.join(' ') + ' ' : ''}(${requestDetailsToString(request)})`);
    }
    function requestDetailsToString(request) {
        return `excludes: ${request.excludes.length > 0 ? request.excludes : '<none>'}, includes: ${request.includes && request.includes.length > 0 ? JSON.stringify(request.includes) : '<all>'}, filter: ${(0, watcher_1.requestFilterToString)(request.filter)}, correlationId: ${typeof request.correlationId === 'number' ? request.correlationId : '<none>'}`;
    }
    function fillRecursiveWatcherStats(lines, recursiveWatcher) {
        const watchers = sortByPathPrefix(Array.from(recursiveWatcher.watchers.values()));
        const { active, failed, stopped } = computeRecursiveWatchStatus(recursiveWatcher);
        lines.push(`\n[Recursive Watchers (${watchers.length}, active: ${active}, failed: ${failed}, stopped: ${stopped})]:`);
        for (const watcher of watchers) {
            const decorations = [];
            if (watcher.failed) {
                decorations.push('[FAILED]');
            }
            if (watcher.stopped) {
                decorations.push('[STOPPED]');
            }
            if (watcher.subscriptionsCount > 0) {
                decorations.push(`[SUBSCRIBED:${watcher.subscriptionsCount}]`);
            }
            if (watcher.restarts > 0) {
                decorations.push(`[RESTARTED:${watcher.restarts}]`);
            }
            lines.push(` ${watcher.request.path}\t${decorations.length > 0 ? decorations.join(' ') + ' ' : ''}(${requestDetailsToString(watcher.request)})`);
        }
    }
    function fillNonRecursiveWatcherStats(lines, nonRecursiveWatcher) {
        const allWatchers = sortByPathPrefix(Array.from(nonRecursiveWatcher.watchers.values()));
        const activeWatchers = allWatchers.filter(watcher => !watcher.instance.failed && !watcher.instance.isReusingRecursiveWatcher);
        const failedWatchers = allWatchers.filter(watcher => watcher.instance.failed);
        const reusingWatchers = allWatchers.filter(watcher => watcher.instance.isReusingRecursiveWatcher);
        const { active, failed, reusing } = computeNonRecursiveWatchStatus(nonRecursiveWatcher);
        lines.push(`\n[Non-Recursive Watchers (${allWatchers.length}, active: ${active}, failed: ${failed}, reusing: ${reusing})]:`);
        for (const watcher of [activeWatchers, failedWatchers, reusingWatchers].flat()) {
            const decorations = [];
            if (watcher.instance.failed) {
                decorations.push('[FAILED]');
            }
            if (watcher.instance.isReusingRecursiveWatcher) {
                decorations.push('[REUSING]');
            }
            lines.push(` ${watcher.request.path}\t${decorations.length > 0 ? decorations.join(' ') + ' ' : ''}(${requestDetailsToString(watcher.request)})`);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlclN0YXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL3dhdGNoZXJTdGF0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxvQ0FxREM7SUFyREQsU0FBZ0IsWUFBWSxDQUMzQixRQUFrQyxFQUNsQyxnQkFBK0IsRUFDL0IsbUJBQWtDO1FBRWxDLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztRQUUzQixNQUFNLG9CQUFvQixHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RixNQUFNLDZCQUE2QixHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUM5SCxNQUFNLGlDQUFpQyxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQztRQUN0SSxNQUFNLG9DQUFvQyxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztRQUVwSSxNQUFNLHVCQUF1QixHQUFHLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDN0YsTUFBTSxzQkFBc0IsR0FBRywyQkFBMkIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sdUJB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