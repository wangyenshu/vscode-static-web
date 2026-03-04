/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/assert", "vs/base/common/path", "vs/base/common/types", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/base/common/parsers", "vs/base/common/arrays", "vs/base/common/network", "vs/platform/markers/common/markers", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/event", "vs/platform/files/common/files"], function (require, exports, nls_1, Objects, Strings, Assert, path_1, Types, UUID, Platform, severity_1, uri_1, parsers_1, arrays_1, network_1, markers_1, extensionsRegistry_1, event_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProblemMatcherRegistry = exports.ProblemMatcherParser = exports.ProblemPatternRegistry = exports.Schemas = exports.ExtensionRegistryReporter = exports.ProblemPatternParser = exports.Config = exports.ApplyToKind = exports.ProblemLocationKind = exports.FileLocationKind = void 0;
    exports.isNamedProblemMatcher = isNamedProblemMatcher;
    exports.getResource = getResource;
    exports.createLineMatcher = createLineMatcher;
    var FileLocationKind;
    (function (FileLocationKind) {
        FileLocationKind[FileLocationKind["Default"] = 0] = "Default";
        FileLocationKind[FileLocationKind["Relative"] = 1] = "Relative";
        FileLocationKind[FileLocationKind["Absolute"] = 2] = "Absolute";
        FileLocationKind[FileLocationKind["AutoDetect"] = 3] = "AutoDetect";
        FileLocationKind[FileLocationKind["Search"] = 4] = "Search";
    })(FileLocationKind || (exports.FileLocationKind = FileLocationKind = {}));
    (function (FileLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'absolute') {
                return FileLocationKind.Absolute;
            }
            else if (value === 'relative') {
                return FileLocationKind.Relative;
            }
            else if (value === 'autodetect') {
                return FileLocationKind.AutoDetect;
            }
            else if (value === 'search') {
                return FileLocationKind.Search;
            }
            else {
                return undefined;
            }
        }
        FileLocationKind.fromString = fromString;
    })(FileLocationKind || (exports.FileLocationKind = FileLocationKind = {}));
    var ProblemLocationKind;
    (function (ProblemLocationKind) {
        ProblemLocationKind[ProblemLocationKind["File"] = 0] = "File";
        ProblemLocationKind[ProblemLocationKind["Location"] = 1] = "Location";
    })(ProblemLocationKind || (exports.ProblemLocationKind = ProblemLocationKind = {}));
    (function (ProblemLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'file') {
                return ProblemLocationKind.File;
            }
            else if (value === 'location') {
                return ProblemLocationKind.Location;
            }
            else {
                return undefined;
            }
        }
        ProblemLocationKind.fromString = fromString;
    })(ProblemLocationKind || (exports.ProblemLocationKind = ProblemLocationKind = {}));
    var ApplyToKind;
    (function (ApplyToKind) {
        ApplyToKind[ApplyToKind["allDocuments"] = 0] = "allDocuments";
        ApplyToKind[ApplyToKind["openDocuments"] = 1] = "openDocuments";
        ApplyToKind[ApplyToKind["closedDocuments"] = 2] = "closedDocuments";
    })(ApplyToKind || (exports.ApplyToKind = ApplyToKind = {}));
    (function (ApplyToKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'alldocuments') {
                return ApplyToKind.allDocuments;
            }
            else if (value === 'opendocuments') {
                return ApplyToKind.openDocuments;
            }
            else if (value === 'closeddocuments') {
                return ApplyToKind.closedDocuments;
            }
            else {
                return undefined;
            }
        }
        ApplyToKind.fromString = fromString;
    })(ApplyToKind || (exports.ApplyToKind = ApplyToKind = {}));
    function isNamedProblemMatcher(value) {
        return value && Types.isString(value.name) ? true : false;
    }
    async function getResource(filename, matcher, fileService) {
        const kind = matcher.fileLocation;
        let fullPath;
        if (kind === FileLocationKind.Absolute) {
            fullPath = filename;
        }
        else if ((kind === FileLocationKind.Relative) && matcher.filePrefix && Types.isString(matcher.filePrefix)) {
            fullPath = (0, path_1.join)(matcher.filePrefix, filename);
        }
        else if (kind === FileLocationKind.AutoDetect) {
            const matcherClone = Objects.deepClone(matcher);
            matcherClone.fileLocation = FileLocationKind.Relative;
            if (fileService) {
                const relative = await getResource(filename, matcherClone);
                let stat = undefined;
                try {
                    stat = await fileService.stat(relative);
                }
                catch (ex) {
                    // Do nothing, we just need to catch file resolution errors.
                }
                if (stat) {
                    return relative;
                }
            }
            matcherClone.fileLocation = FileLocationKind.Absolute;
            return getResource(filename, matcherClone);
        }
        else if (kind === FileLocationKind.Search && fileService) {
            const fsProvider = fileService.getProvider(network_1.Schemas.file);
            if (fsProvider) {
                const uri = await searchForFileLocation(filename, fsProvider, matcher.filePrefix);
                fullPath = uri?.path;
            }
            if (!fullPath) {
                const absoluteMatcher = Objects.deepClone(matcher);
                absoluteMatcher.fileLocation = FileLocationKind.Absolute;
                return getResource(filename, absoluteMatcher);
            }
        }
        if (fullPath === undefined) {
            throw new Error('FileLocationKind is not actionable. Does the matcher have a filePrefix? This should never happen.');
        }
        fullPath = (0, path_1.normalize)(fullPath);
        fullPath = fullPath.replace(/\\/g, '/');
        if (fullPath[0] !== '/') {
            fullPath = '/' + fullPath;
        }
        if (matcher.uriProvider !== undefined) {
            return matcher.uriProvider(fullPath);
        }
        else {
            return uri_1.URI.file(fullPath);
        }
    }
    async function searchForFileLocation(filename, fsProvider, args) {
        const exclusions = new Set((0, arrays_1.asArray)(args.exclude || []).map(x => uri_1.URI.file(x).path));
        async function search(dir) {
            if (exclusions.has(dir.path)) {
                return undefined;
            }
            const entries = await fsProvider.readdir(dir);
            const subdirs = [];
            for (const [name, fileType] of entries) {
                if (fileType === files_1.FileType.Directory) {
                    subdirs.push(uri_1.URI.joinPath(dir, name));
                    continue;
                }
                if (fileType === files_1.FileType.File) {
                    /**
                     * Note that sometimes the given `filename` could be a relative
                     * path (not just the "name.ext" part). For example, the
                     * `filename` can be "/subdir/name.ext". So, just comparing
                     * `name` as `filename` is not sufficient. The workaround here
                     * is to form the URI with `dir` and `name` and check if it ends
                     * with the given `filename`.
                     */
                    const fullUri = uri_1.URI.joinPath(dir, name);
                    if (fullUri.path.endsWith(filename)) {
                        return fullUri;
                    }
                }
            }
            for (const subdir of subdirs) {
                const result = await search(subdir);
                if (result) {
                    return result;
                }
            }
            return undefined;
        }
        for (const dir of (0, arrays_1.asArray)(args.include || [])) {
            const hit = await search(uri_1.URI.file(dir));
            if (hit) {
                return hit;
            }
        }
        return undefined;
    }
    function createLineMatcher(matcher, fileService) {
        const pattern = matcher.pattern;
        if (Array.isArray(pattern)) {
            return new MultiLineMatcher(matcher, fileService);
        }
        else {
            return new SingleLineMatcher(matcher, fileService);
        }
    }
    const endOfLine = Platform.OS === 1 /* Platform.OperatingSystem.Windows */ ? '\r\n' : '\n';
    class AbstractLineMatcher {
        constructor(matcher, fileService) {
            this.matcher = matcher;
            this.fileService = fileService;
        }
        handle(lines, start = 0) {
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
        fillProblemData(data, pattern, matches) {
            if (data) {
                this.fillProperty(data, 'file', pattern, matches, true);
                this.appendProperty(data, 'message', pattern, matches, true);
                this.fillProperty(data, 'code', pattern, matches, true);
                this.fillProperty(data, 'severity', pattern, matches, true);
                this.fillProperty(data, 'location', pattern, matches, true);
                this.fillProperty(data, 'line', pattern, matches);
                this.fillProperty(data, 'character', pattern, matches);
                this.fillProperty(data, 'endLine', pattern, matches);
                this.fillProperty(data, 'endCharacter', pattern, matches);
                return true;
            }
            else {
                return false;
            }
        }
        appendProperty(data, property, pattern, matches, trim = false) {
            const patternProperty = pattern[property];
            if (Types.isUndefined(data[property])) {
                this.fillProperty(data, property, pattern, matches, trim);
            }
            else if (!Types.isUndefined(patternProperty) && patternProperty < matches.length) {
                let value = matches[patternProperty];
                if (trim) {
                    value = Strings.trim(value);
                }
                data[property] += endOfLine + value;
            }
        }
        fillProperty(data, property, pattern, matches, trim = false) {
            const patternAtProperty = pattern[property];
            if (Types.isUndefined(data[property]) && !Types.isUndefined(patternAtProperty) && patternAtProperty < matches.length) {
                let value = matches[patternAtProperty];
                if (value !== undefined) {
                    if (trim) {
                        value = Strings.trim(value);
                    }
                    data[property] = value;
                }
            }
        }
        getMarkerMatch(data) {
            try {
                const location = this.getLocation(data);
                if (data.file && location && data.message) {
                    const marker = {
                        severity: this.getSeverity(data),
                        startLineNumber: location.startLineNumber,
                        startColumn: location.startCharacter,
                        endLineNumber: location.endLineNumber,
                        endColumn: location.endCharacter,
                        message: data.message
                    };
                    if (data.code !== undefined) {
                        marker.code = data.code;
                    }
                    if (this.matcher.source !== undefined) {
                        marker.source = this.matcher.source;
                    }
                    return {
                        description: this.matcher,
                        resource: this.getResource(data.file),
                        marker: marker
                    };
                }
            }
            catch (err) {
                console.error(`Failed to convert problem data into match: ${JSON.stringify(data)}`);
            }
            return undefined;
        }
        getResource(filename) {
            return getResource(filename, this.matcher, this.fileService);
        }
        getLocation(data) {
            if (data.kind === ProblemLocationKind.File) {
                return this.createLocation(0, 0, 0, 0);
            }
            if (data.location) {
                return this.parseLocationInfo(data.location);
            }
            if (!data.line) {
                return null;
            }
            const startLine = parseInt(data.line);
            const startColumn = data.character ? parseInt(data.character) : undefined;
            const endLine = data.endLine ? parseInt(data.endLine) : undefined;
            const endColumn = data.endCharacter ? parseInt(data.endCharacter) : undefined;
            return this.createLocation(startLine, startColumn, endLine, endColumn);
        }
        parseLocationInfo(value) {
            if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
                return null;
            }
            const parts = value.split(',');
            const startLine = parseInt(parts[0]);
            const startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined;
            if (parts.length > 3) {
                return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]));
            }
            else {
                return this.createLocation(startLine, startColumn, undefined, undefined);
            }
        }
        createLocation(startLine, startColumn, endLine, endColumn) {
            if (startColumn !== undefined && endColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: endLine || startLine, endCharacter: endColumn };
            }
            if (startColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: startLine, endCharacter: startColumn };
            }
            return { startLineNumber: startLine, startCharacter: 1, endLineNumber: startLine, endCharacter: 2 ** 31 - 1 }; // See https://github.com/microsoft/vscode/issues/80288#issuecomment-650636442 for discussion
        }
        getSeverity(data) {
            let result = null;
            if (data.severity) {
                const value = data.severity;
                if (value) {
                    result = severity_1.default.fromValue(value);
                    if (result === severity_1.default.Ignore) {
                        if (value === 'E') {
                            result = severity_1.default.Error;
                        }
                        else if (value === 'W') {
                            result = severity_1.default.Warning;
                        }
                        else if (value === 'I') {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'hint')) {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'note')) {
                            result = severity_1.default.Info;
                        }
                    }
                }
            }
            if (result === null || result === severity_1.default.Ignore) {
                result = this.matcher.severity || severity_1.default.Error;
            }
            return markers_1.MarkerSeverity.fromSeverity(result);
        }
    }
    class SingleLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.pattern = matcher.pattern;
        }
        get matchLength() {
            return 1;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === 1);
            const data = Object.create(null);
            if (this.pattern.kind !== undefined) {
                data.kind = this.pattern.kind;
            }
            const matches = this.pattern.regexp.exec(lines[start]);
            if (matches) {
                this.fillProblemData(data, this.pattern, matches);
                const match = this.getMarkerMatch(data);
                if (match) {
                    return { match: match, continue: false };
                }
            }
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
    }
    class MultiLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.patterns = matcher.pattern;
        }
        get matchLength() {
            return this.patterns.length;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === this.patterns.length);
            this.data = Object.create(null);
            let data = this.data;
            data.kind = this.patterns[0].kind;
            for (let i = 0; i < this.patterns.length; i++) {
                const pattern = this.patterns[i];
                const matches = pattern.regexp.exec(lines[i + start]);
                if (!matches) {
                    return { match: null, continue: false };
                }
                else {
                    // Only the last pattern can loop
                    if (pattern.loop && i === this.patterns.length - 1) {
                        data = Objects.deepClone(data);
                    }
                    this.fillProblemData(data, pattern, matches);
                }
            }
            const loop = !!this.patterns[this.patterns.length - 1].loop;
            if (!loop) {
                this.data = undefined;
            }
            const markerMatch = data ? this.getMarkerMatch(data) : null;
            return { match: markerMatch ? markerMatch : null, continue: loop };
        }
        next(line) {
            const pattern = this.patterns[this.patterns.length - 1];
            Assert.ok(pattern.loop === true && this.data !== null);
            const matches = pattern.regexp.exec(line);
            if (!matches) {
                this.data = undefined;
                return null;
            }
            const data = Objects.deepClone(this.data);
            let problemMatch;
            if (this.fillProblemData(data, pattern, matches)) {
                problemMatch = this.getMarkerMatch(data);
            }
            return problemMatch ? problemMatch : null;
        }
    }
    var Config;
    (function (Config) {
        let CheckedProblemPattern;
        (function (CheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.regexp);
            }
            CheckedProblemPattern.is = is;
        })(CheckedProblemPattern = Config.CheckedProblemPattern || (Config.CheckedProblemPattern = {}));
        let NamedProblemPattern;
        (function (NamedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.name);
            }
            NamedProblemPattern.is = is;
        })(NamedProblemPattern = Config.NamedProblemPattern || (Config.NamedProblemPattern = {}));
        let NamedCheckedProblemPattern;
        (function (NamedCheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && NamedProblemPattern.is(candidate) && Types.isString(candidate.regexp);
            }
            NamedCheckedProblemPattern.is = is;
        })(NamedCheckedProblemPattern = Config.NamedCheckedProblemPattern || (Config.NamedCheckedProblemPattern = {}));
        let MultiLineProblemPattern;
        (function (MultiLineProblemPattern) {
            function is(value) {
                return value && Array.isArray(value);
            }
            MultiLineProblemPattern.is = is;
        })(MultiLineProblemPattern = Config.MultiLineProblemPattern || (Config.MultiLineProblemPattern = {}));
        let MultiLineCheckedProblemPattern;
        (function (MultiLineCheckedProblemPattern) {
            function is(value) {
                if (!MultiLineProblemPattern.is(value)) {
                    return false;
                }
                for (const element of value) {
                    if (!Config.CheckedProblemPattern.is(element)) {
                        return false;
                    }
                }
                return true;
            }
            MultiLineCheckedProblemPattern.is = is;
        })(MultiLineCheckedProblemPattern = Config.MultiLineCheckedProblemPattern || (Config.MultiLineCheckedProblemPattern = {}));
        let NamedMultiLineCheckedProblemPattern;
        (function (NamedMultiLineCheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.name) && Array.isArray(candidate.patterns) && MultiLineCheckedProblemPattern.is(candidate.patterns);
            }
            NamedMultiLineCheckedProblemPattern.is = is;
        })(NamedMultiLineCheckedProblemPattern = Config.NamedMultiLineCheckedProblemPattern || (Config.NamedMultiLineCheckedProblemPattern = {}));
        function isNamedProblemMatcher(value) {
            return Types.isString(value.name);
        }
        Config.isNamedProblemMatcher = isNamedProblemMatcher;
    })(Config || (exports.Config = Config = {}));
    class ProblemPatternParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(value) {
            if (Config.NamedMultiLineCheckedProblemPattern.is(value)) {
                return this.createNamedMultiLineProblemPattern(value);
            }
            else if (Config.MultiLineCheckedProblemPattern.is(value)) {
                return this.createMultiLineProblemPattern(value);
            }
            else if (Config.NamedCheckedProblemPattern.is(value)) {
                const result = this.createSingleProblemPattern(value);
                result.name = value.name;
                return result;
            }
            else if (Config.CheckedProblemPattern.is(value)) {
                return this.createSingleProblemPattern(value);
            }
            else {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingRegExp', 'The problem pattern is missing a regular expression.'));
                return null;
            }
        }
        createSingleProblemPattern(value) {
            const result = this.doCreateSingleProblemPattern(value, true);
            if (result === undefined) {
                return null;
            }
            else if (result.kind === undefined) {
                result.kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern([result]) ? result : null;
        }
        createNamedMultiLineProblemPattern(value) {
            const validPatterns = this.createMultiLineProblemPattern(value.patterns);
            if (!validPatterns) {
                return null;
            }
            const result = {
                name: value.name,
                label: value.label ? value.label : value.name,
                patterns: validPatterns
            };
            return result;
        }
        createMultiLineProblemPattern(values) {
            const result = [];
            for (let i = 0; i < values.length; i++) {
                const pattern = this.doCreateSingleProblemPattern(values[i], false);
                if (pattern === undefined) {
                    return null;
                }
                if (i < values.length - 1) {
                    if (!Types.isUndefined(pattern.loop) && pattern.loop) {
                        pattern.loop = false;
                        this.error((0, nls_1.localize)('ProblemPatternParser.loopProperty.notLast', 'The loop property is only supported on the last line matcher.'));
                    }
                }
                result.push(pattern);
            }
            if (result[0].kind === undefined) {
                result[0].kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern(result) ? result : null;
        }
        doCreateSingleProblemPattern(value, setDefaults) {
            const regexp = this.createRegularExpression(value.regexp);
            if (regexp === undefined) {
                return undefined;
            }
            let result = { regexp };
            if (value.kind) {
                result.kind = ProblemLocationKind.fromString(value.kind);
            }
            function copyProperty(result, source, resultKey, sourceKey) {
                const value = source[sourceKey];
                if (typeof value === 'number') {
                    result[resultKey] = value;
                }
            }
            copyProperty(result, value, 'file', 'file');
            copyProperty(result, value, 'location', 'location');
            copyProperty(result, value, 'line', 'line');
            copyProperty(result, value, 'character', 'column');
            copyProperty(result, value, 'endLine', 'endLine');
            copyProperty(result, value, 'endCharacter', 'endColumn');
            copyProperty(result, value, 'severity', 'severity');
            copyProperty(result, value, 'code', 'code');
            copyProperty(result, value, 'message', 'message');
            if (value.loop === true || value.loop === false) {
                result.loop = value.loop;
            }
            if (setDefaults) {
                if (result.location || result.kind === ProblemLocationKind.File) {
                    const defaultValue = {
                        file: 1,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
                else {
                    const defaultValue = {
                        file: 1,
                        line: 2,
                        character: 3,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
            }
            return result;
        }
        validateProblemPattern(values) {
            let file = false, message = false, location = false, line = false;
            const locationKind = (values[0].kind === undefined) ? ProblemLocationKind.Location : values[0].kind;
            values.forEach((pattern, i) => {
                if (i !== 0 && pattern.kind) {
                    this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.kindProperty.notFirst', 'The problem pattern is invalid. The kind property must be provided only in the first element'));
                }
                file = file || !Types.isUndefined(pattern.file);
                message = message || !Types.isUndefined(pattern.message);
                location = location || !Types.isUndefined(pattern.location);
                line = line || !Types.isUndefined(pattern.line);
            });
            if (!(file && message)) {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingProperty', 'The problem pattern is invalid. It must have at least have a file and a message.'));
                return false;
            }
            if (locationKind === ProblemLocationKind.Location && !(location || line)) {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingLocation', 'The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
                return false;
            }
            return true;
        }
        createRegularExpression(value) {
            let result;
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error((0, nls_1.localize)('ProblemPatternParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemPatternParser = ProblemPatternParser;
    class ExtensionRegistryReporter {
        constructor(_collector, _validationStatus = new parsers_1.ValidationStatus()) {
            this._collector = _collector;
            this._validationStatus = _validationStatus;
        }
        info(message) {
            this._validationStatus.state = 1 /* ValidationState.Info */;
            this._collector.info(message);
        }
        warn(message) {
            this._validationStatus.state = 2 /* ValidationState.Warning */;
            this._collector.warn(message);
        }
        error(message) {
            this._validationStatus.state = 3 /* ValidationState.Error */;
            this._collector.error(message);
        }
        fatal(message) {
            this._validationStatus.state = 4 /* ValidationState.Fatal */;
            this._collector.error(message);
        }
        get status() {
            return this._validationStatus;
        }
    }
    exports.ExtensionRegistryReporter = ExtensionRegistryReporter;
    var Schemas;
    (function (Schemas) {
        Schemas.ProblemPattern = {
            default: {
                regexp: '^([^\\\\s].*)\\\\((\\\\d+,\\\\d+)\\\\):\\\\s*(.*)$',
                file: 1,
                location: 2,
                message: 3
            },
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemPatternSchema.regexp', 'The regular expression to find an error, warning or info in the output.')
                },
                kind: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemPatternSchema.kind', 'whether the pattern matches a location (file and line) or only a file.')
                },
                file: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.file', 'The match group index of the filename. If omitted 1 is used.')
                },
                location: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.location', 'The match group index of the problem\'s location. Valid location patterns are: (line), (line,column) and (startLine,startColumn,endLine,endColumn). If omitted (line,column) is assumed.')
                },
                line: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.line', 'The match group index of the problem\'s line. Defaults to 2')
                },
                column: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.column', 'The match group index of the problem\'s line character. Defaults to 3')
                },
                endLine: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.endLine', 'The match group index of the problem\'s end line. Defaults to undefined')
                },
                endColumn: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.endColumn', 'The match group index of the problem\'s end line character. Defaults to undefined')
                },
                severity: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.severity', 'The match group index of the problem\'s severity. Defaults to undefined')
                },
                code: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.code', 'The match group index of the problem\'s code. Defaults to undefined')
                },
                message: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.message', 'The match group index of the message. If omitted it defaults to 4 if location is specified. Otherwise it defaults to 5.')
                },
                loop: {
                    type: 'boolean',
                    description: (0, nls_1.localize)('ProblemPatternSchema.loop', 'In a multi line matcher loop indicated whether this pattern is executed in a loop as long as it matches. Can only specified on a last pattern in a multi line pattern.')
                }
            }
        };
        Schemas.NamedProblemPattern = Objects.deepClone(Schemas.ProblemPattern);
        Schemas.NamedProblemPattern.properties = Objects.deepClone(Schemas.NamedProblemPattern.properties) || {};
        Schemas.NamedProblemPattern.properties['name'] = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemPatternSchema.name', 'The name of the problem pattern.')
        };
        Schemas.MultiLineProblemPattern = {
            type: 'array',
            items: Schemas.ProblemPattern
        };
        Schemas.NamedMultiLineProblemPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string',
                    description: (0, nls_1.localize)('NamedMultiLineProblemPatternSchema.name', 'The name of the problem multi line problem pattern.')
                },
                patterns: {
                    type: 'array',
                    description: (0, nls_1.localize)('NamedMultiLineProblemPatternSchema.patterns', 'The actual patterns.'),
                    items: Schemas.ProblemPattern
                }
            }
        };
    })(Schemas || (exports.Schemas = Schemas = {}));
    const problemPatternExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemPatterns',
        jsonSchema: {
            description: (0, nls_1.localize)('ProblemPatternExtPoint', 'Contributes problem patterns'),
            type: 'array',
            items: {
                anyOf: [
                    Schemas.NamedProblemPattern,
                    Schemas.NamedMultiLineProblemPattern
                ]
            }
        }
    });
    class ProblemPatternRegistryImpl {
        constructor() {
            this.patterns = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemPatternExtPoint.setHandler((extensions, delta) => {
                    // We get all statically know extension during startup in one batch
                    try {
                        delta.removed.forEach(extension => {
                            const problemPatterns = extension.value;
                            for (const pattern of problemPatterns) {
                                if (this.patterns[pattern.name]) {
                                    delete this.patterns[pattern.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            const problemPatterns = extension.value;
                            const parser = new ProblemPatternParser(new ExtensionRegistryReporter(extension.collector));
                            for (const pattern of problemPatterns) {
                                if (Config.NamedMultiLineCheckedProblemPattern.is(pattern)) {
                                    const result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* ValidationState.Error */) {
                                        this.add(result.name, result.patterns);
                                    }
                                    else {
                                        extension.collector.error((0, nls_1.localize)('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                else if (Config.NamedProblemPattern.is(pattern)) {
                                    const result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* ValidationState.Error */) {
                                        this.add(pattern.name, result);
                                    }
                                    else {
                                        extension.collector.error((0, nls_1.localize)('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                parser.reset();
                            }
                        });
                    }
                    catch (error) {
                        // Do nothing
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            return this.readyPromise;
        }
        add(key, value) {
            this.patterns[key] = value;
        }
        get(key) {
            return this.patterns[key];
        }
        fillDefaults() {
            this.add('msCompile', {
                regexp: /^(?:\s*\d+>)?(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\)\s*:\s+((?:fatal +)?error|warning|info)\s+(\w+\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('gulp-tsc', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(\d+)\s+(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                code: 3,
                message: 4
            });
            this.add('cpp', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(C\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('csc', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(CS\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('vb', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(BC\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('lessCompile', {
                regexp: /^\s*(.*) in file (.*) line no. (\d+)$/,
                kind: ProblemLocationKind.Location,
                message: 1,
                file: 2,
                line: 3
            });
            this.add('jshint', {
                regexp: /^(.*):\s+line\s+(\d+),\s+col\s+(\d+),\s(.+?)(?:\s+\((\w)(\d+)\))?$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                line: 2,
                character: 3,
                message: 4,
                severity: 5,
                code: 6
            });
            this.add('jshint-stylish', [
                {
                    regexp: /^(.+)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+line\s+(\d+)\s+col\s+(\d+)\s+(.+?)(?:\s+\((\w)(\d+)\))?$/,
                    line: 1,
                    character: 2,
                    message: 3,
                    severity: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('eslint-compact', {
                regexp: /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/,
                file: 1,
                kind: ProblemLocationKind.Location,
                line: 2,
                character: 3,
                severity: 4,
                message: 5,
                code: 6
            });
            this.add('eslint-stylish', [
                {
                    regexp: /^((?:[a-zA-Z]:)*[./\\]+.*?)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+(\d+):(\d+)\s+(error|warning|info)\s+(.+?)(?:\s\s+(.*))?$/,
                    line: 1,
                    character: 2,
                    severity: 3,
                    message: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('go', {
                regexp: /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+))?: (.*)$/,
                kind: ProblemLocationKind.Location,
                file: 2,
                line: 4,
                character: 6,
                message: 7
            });
        }
    }
    exports.ProblemPatternRegistry = new ProblemPatternRegistryImpl();
    class ProblemMatcherParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(json) {
            const result = this.createProblemMatcher(json);
            if (!this.checkProblemMatcherValid(json, result)) {
                return undefined;
            }
            this.addWatchingMatcher(json, result);
            return result;
        }
        checkProblemMatcherValid(externalProblemMatcher, problemMatcher) {
            if (!problemMatcher) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noProblemMatcher', 'Error: the description can\'t be converted into a problem matcher:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.pattern) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noProblemPattern', 'Error: the description doesn\'t define a valid problem pattern:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.owner) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noOwner', 'Error: the description doesn\'t define an owner:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (Types.isUndefined(problemMatcher.fileLocation)) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noFileLocation', 'Error: the description doesn\'t define a file location:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            return true;
        }
        createProblemMatcher(description) {
            let result = null;
            const owner = Types.isString(description.owner) ? description.owner : UUID.generateUuid();
            const source = Types.isString(description.source) ? description.source : undefined;
            let applyTo = Types.isString(description.applyTo) ? ApplyToKind.fromString(description.applyTo) : ApplyToKind.allDocuments;
            if (!applyTo) {
                applyTo = ApplyToKind.allDocuments;
            }
            let fileLocation = undefined;
            let filePrefix = undefined;
            let kind;
            if (Types.isUndefined(description.fileLocation)) {
                fileLocation = FileLocationKind.Relative;
                filePrefix = '${workspaceFolder}';
            }
            else if (Types.isString(description.fileLocation)) {
                kind = FileLocationKind.fromString(description.fileLocation);
                if (kind) {
                    fileLocation = kind;
                    if ((kind === FileLocationKind.Relative) || (kind === FileLocationKind.AutoDetect)) {
                        filePrefix = '${workspaceFolder}';
                    }
                    else if (kind === FileLocationKind.Search) {
                        filePrefix = { include: ['${workspaceFolder}'] };
                    }
                }
            }
            else if (Types.isStringArray(description.fileLocation)) {
                const values = description.fileLocation;
                if (values.length > 0) {
                    kind = FileLocationKind.fromString(values[0]);
                    if (values.length === 1 && kind === FileLocationKind.Absolute) {
                        fileLocation = kind;
                    }
                    else if (values.length === 2 && (kind === FileLocationKind.Relative || kind === FileLocationKind.AutoDetect) && values[1]) {
                        fileLocation = kind;
                        filePrefix = values[1];
                    }
                }
            }
            else if (Array.isArray(description.fileLocation)) {
                const kind = FileLocationKind.fromString(description.fileLocation[0]);
                if (kind === FileLocationKind.Search) {
                    fileLocation = FileLocationKind.Search;
                    filePrefix = description.fileLocation[1] ?? { include: ['${workspaceFolder}'] };
                }
            }
            const pattern = description.pattern ? this.createProblemPattern(description.pattern) : undefined;
            let severity = description.severity ? severity_1.default.fromValue(description.severity) : undefined;
            if (severity === severity_1.default.Ignore) {
                this.info((0, nls_1.localize)('ProblemMatcherParser.unknownSeverity', 'Info: unknown severity {0}. Valid values are error, warning and info.\n', description.severity));
                severity = severity_1.default.Error;
            }
            if (Types.isString(description.base)) {
                const variableName = description.base;
                if (variableName.length > 1 && variableName[0] === '$') {
                    const base = exports.ProblemMatcherRegistry.get(variableName.substring(1));
                    if (base) {
                        result = Objects.deepClone(base);
                        if (description.owner !== undefined && owner !== undefined) {
                            result.owner = owner;
                        }
                        if (description.source !== undefined && source !== undefined) {
                            result.source = source;
                        }
                        if (description.fileLocation !== undefined && fileLocation !== undefined) {
                            result.fileLocation = fileLocation;
                            result.filePrefix = filePrefix;
                        }
                        if (description.pattern !== undefined && pattern !== undefined && pattern !== null) {
                            result.pattern = pattern;
                        }
                        if (description.severity !== undefined && severity !== undefined) {
                            result.severity = severity;
                        }
                        if (description.applyTo !== undefined && applyTo !== undefined) {
                            result.applyTo = applyTo;
                        }
                    }
                }
            }
            else if (fileLocation && pattern) {
                result = {
                    owner: owner,
                    applyTo: applyTo,
                    fileLocation: fileLocation,
                    pattern: pattern,
                };
                if (source) {
                    result.source = source;
                }
                if (filePrefix) {
                    result.filePrefix = filePrefix;
                }
                if (severity) {
                    result.severity = severity;
                }
            }
            if (Config.isNamedProblemMatcher(description)) {
                result.name = description.name;
                result.label = Types.isString(description.label) ? description.label : description.name;
            }
            return result;
        }
        createProblemPattern(value) {
            if (Types.isString(value)) {
                const variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    const result = exports.ProblemPatternRegistry.get(variableName.substring(1));
                    if (!result) {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noDefinedPatter', 'Error: the pattern with the identifier {0} doesn\'t exist.', variableName));
                    }
                    return result;
                }
                else {
                    if (variableName.length === 0) {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noIdentifier', 'Error: the pattern property refers to an empty identifier.'));
                    }
                    else {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noValidIdentifier', 'Error: the pattern property {0} is not a valid pattern variable name.', variableName));
                    }
                }
            }
            else if (value) {
                const problemPatternParser = new ProblemPatternParser(this.problemReporter);
                if (Array.isArray(value)) {
                    return problemPatternParser.parse(value);
                }
                else {
                    return problemPatternParser.parse(value);
                }
            }
            return null;
        }
        addWatchingMatcher(external, internal) {
            const oldBegins = this.createRegularExpression(external.watchedTaskBeginsRegExp);
            const oldEnds = this.createRegularExpression(external.watchedTaskEndsRegExp);
            if (oldBegins && oldEnds) {
                internal.watching = {
                    activeOnStart: false,
                    beginsPattern: { regexp: oldBegins },
                    endsPattern: { regexp: oldEnds }
                };
                return;
            }
            const backgroundMonitor = external.background || external.watching;
            if (Types.isUndefinedOrNull(backgroundMonitor)) {
                return;
            }
            const begins = this.createWatchingPattern(backgroundMonitor.beginsPattern);
            const ends = this.createWatchingPattern(backgroundMonitor.endsPattern);
            if (begins && ends) {
                internal.watching = {
                    activeOnStart: Types.isBoolean(backgroundMonitor.activeOnStart) ? backgroundMonitor.activeOnStart : false,
                    beginsPattern: begins,
                    endsPattern: ends
                };
                return;
            }
            if (begins || ends) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.problemPattern.watchingMatcher', 'A problem matcher must define both a begin pattern and an end pattern for watching.'));
            }
        }
        createWatchingPattern(external) {
            if (Types.isUndefinedOrNull(external)) {
                return null;
            }
            let regexp;
            let file;
            if (Types.isString(external)) {
                regexp = this.createRegularExpression(external);
            }
            else {
                regexp = this.createRegularExpression(external.regexp);
                if (Types.isNumber(external.file)) {
                    file = external.file;
                }
            }
            if (!regexp) {
                return null;
            }
            return file ? { regexp, file } : { regexp, file: 1 };
        }
        createRegularExpression(value) {
            let result = null;
            if (!value) {
                return result;
            }
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemMatcherParser = ProblemMatcherParser;
    (function (Schemas) {
        Schemas.WatchingPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: (0, nls_1.localize)('WatchingPatternSchema.regexp', 'The regular expression to detect the begin or end of a background task.')
                },
                file: {
                    type: 'integer',
                    description: (0, nls_1.localize)('WatchingPatternSchema.file', 'The match group index of the filename. Can be omitted.')
                },
            }
        };
        Schemas.PatternType = {
            anyOf: [
                {
                    type: 'string',
                    description: (0, nls_1.localize)('PatternTypeSchema.name', 'The name of a contributed or predefined pattern')
                },
                Schemas.ProblemPattern,
                Schemas.MultiLineProblemPattern
            ],
            description: (0, nls_1.localize)('PatternTypeSchema.description', 'A problem pattern or the name of a contributed or predefined problem pattern. Can be omitted if base is specified.')
        };
        Schemas.ProblemMatcher = {
            type: 'object',
            additionalProperties: false,
            properties: {
                base: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.base', 'The name of a base problem matcher to use.')
                },
                owner: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.owner', 'The owner of the problem inside Code. Can be omitted if base is specified. Defaults to \'external\' if omitted and base is not specified.')
                },
                source: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.source', 'A human-readable string describing the source of this diagnostic, e.g. \'typescript\' or \'super lint\'.')
                },
                severity: {
                    type: 'string',
                    enum: ['error', 'warning', 'info'],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.severity', 'The default severity for captures problems. Is used if the pattern doesn\'t define a match group for severity.')
                },
                applyTo: {
                    type: 'string',
                    enum: ['allDocuments', 'openDocuments', 'closedDocuments'],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.applyTo', 'Controls if a problem reported on a text document is applied only to open, closed or all documents.')
                },
                pattern: Schemas.PatternType,
                fileLocation: {
                    oneOf: [
                        {
                            type: 'string',
                            enum: ['absolute', 'relative', 'autoDetect', 'search']
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                {
                                    type: 'string',
                                    enum: ['absolute', 'relative', 'autoDetect', 'search']
                                },
                            ],
                            minItems: 1,
                            maxItems: 1,
                            additionalItems: false
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                { type: 'string', enum: ['relative', 'autoDetect'] },
                                { type: 'string' },
                            ],
                            minItems: 2,
                            maxItems: 2,
                            additionalItems: false,
                            examples: [
                                ['relative', '${workspaceFolder}'],
                                ['autoDetect', '${workspaceFolder}'],
                            ]
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                { type: 'string', enum: ['search'] },
                                {
                                    type: 'object',
                                    properties: {
                                        'include': {
                                            oneOf: [
                                                { type: 'string' },
                                                { type: 'array', items: { type: 'string' } }
                                            ]
                                        },
                                        'exclude': {
                                            oneOf: [
                                                { type: 'string' },
                                                { type: 'array', items: { type: 'string' } }
                                            ]
                                        },
                                    },
                                    required: ['include']
                                }
                            ],
                            minItems: 2,
                            maxItems: 2,
                            additionalItems: false,
                            examples: [
                                ['search', { 'include': ['${workspaceFolder}'] }],
                                ['search', { 'include': ['${workspaceFolder}'], 'exclude': [] }]
                            ],
                        }
                    ],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.fileLocation', 'Defines how file names reported in a problem pattern should be interpreted. A relative fileLocation may be an array, where the second element of the array is the path of the relative file location. The search fileLocation mode, performs a deep (and, possibly, heavy) file system search within the directories specified by the include/exclude properties of the second element (or the current workspace directory if not specified).')
                },
                background: {
                    type: 'object',
                    additionalProperties: false,
                    description: (0, nls_1.localize)('ProblemMatcherSchema.background', 'Patterns to track the begin and end of a matcher active on a background task.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.activeOnStart', 'If set to true the background monitor is in active mode when the task starts. This is equals of issuing a line that matches the beginsPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.beginsPattern', 'If matched in the output the start of a background task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.endsPattern', 'If matched in the output the end of a background task is signaled.')
                        }
                    }
                },
                watching: {
                    type: 'object',
                    additionalProperties: false,
                    deprecationMessage: (0, nls_1.localize)('ProblemMatcherSchema.watching.deprecated', 'The watching property is deprecated. Use background instead.'),
                    description: (0, nls_1.localize)('ProblemMatcherSchema.watching', 'Patterns to track the begin and end of a watching matcher.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.activeOnStart', 'If set to true the watcher is in active mode when the task starts. This is equals of issuing a line that matches the beginPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.beginsPattern', 'If matched in the output the start of a watching task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.endsPattern', 'If matched in the output the end of a watching task is signaled.')
                        }
                    }
                }
            }
        };
        Schemas.LegacyProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.LegacyProblemMatcher.properties = Objects.deepClone(Schemas.LegacyProblemMatcher.properties) || {};
        Schemas.LegacyProblemMatcher.properties['watchedTaskBeginsRegExp'] = {
            type: 'string',
            deprecationMessage: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedBegin.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedBegin', 'A regular expression signaling that a watched tasks begins executing triggered through file watching.')
        };
        Schemas.LegacyProblemMatcher.properties['watchedTaskEndsRegExp'] = {
            type: 'string',
            deprecationMessage: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedEnd.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedEnd', 'A regular expression signaling that a watched tasks ends executing.')
        };
        Schemas.NamedProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.NamedProblemMatcher.properties = Objects.deepClone(Schemas.NamedProblemMatcher.properties) || {};
        Schemas.NamedProblemMatcher.properties.name = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemMatcherSchema.name', 'The name of the problem matcher used to refer to it.')
        };
        Schemas.NamedProblemMatcher.properties.label = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemMatcherSchema.label', 'A human readable label of the problem matcher.')
        };
    })(Schemas || (exports.Schemas = Schemas = {}));
    const problemMatchersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemMatchers',
        deps: [problemPatternExtPoint],
        jsonSchema: {
            description: (0, nls_1.localize)('ProblemMatcherExtPoint', 'Contributes problem matchers'),
            type: 'array',
            items: Schemas.NamedProblemMatcher
        }
    });
    class ProblemMatcherRegistryImpl {
        constructor() {
            this._onMatchersChanged = new event_1.Emitter();
            this.onMatcherChanged = this._onMatchersChanged.event;
            this.matchers = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemMatchersExtPoint.setHandler((extensions, delta) => {
                    try {
                        delta.removed.forEach(extension => {
                            const problemMatchers = extension.value;
                            for (const matcher of problemMatchers) {
                                if (this.matchers[matcher.name]) {
                                    delete this.matchers[matcher.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            const problemMatchers = extension.value;
                            const parser = new ProblemMatcherParser(new ExtensionRegistryReporter(extension.collector));
                            for (const matcher of problemMatchers) {
                                const result = parser.parse(matcher);
                                if (result && isNamedProblemMatcher(result)) {
                                    this.add(result);
                                }
                            }
                        });
                        if ((delta.removed.length > 0) || (delta.added.length > 0)) {
                            this._onMatchersChanged.fire();
                        }
                    }
                    catch (error) {
                    }
                    const matcher = this.get('tsc-watch');
                    if (matcher) {
                        matcher.tscWatch = true;
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            exports.ProblemPatternRegistry.onReady();
            return this.readyPromise;
        }
        add(matcher) {
            this.matchers[matcher.name] = matcher;
        }
        get(name) {
            return this.matchers[name];
        }
        keys() {
            return Object.keys(this.matchers);
        }
        fillDefaults() {
            this.add({
                name: 'msCompile',
                label: (0, nls_1.localize)('msCompile', 'Microsoft compiler problems'),
                owner: 'msCompile',
                source: 'cpp',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('msCompile')
            });
            this.add({
                name: 'lessCompile',
                label: (0, nls_1.localize)('lessCompile', 'Less problems'),
                deprecated: true,
                owner: 'lessCompile',
                source: 'less',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('lessCompile'),
                severity: severity_1.default.Error
            });
            this.add({
                name: 'gulp-tsc',
                label: (0, nls_1.localize)('gulp-tsc', 'Gulp TSC Problems'),
                owner: 'typescript',
                source: 'ts',
                applyTo: ApplyToKind.closedDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('gulp-tsc')
            });
            this.add({
                name: 'jshint',
                label: (0, nls_1.localize)('jshint', 'JSHint problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint')
            });
            this.add({
                name: 'jshint-stylish',
                label: (0, nls_1.localize)('jshint-stylish', 'JSHint stylish problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint-stylish')
            });
            this.add({
                name: 'eslint-compact',
                label: (0, nls_1.localize)('eslint-compact', 'ESLint compact problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('eslint-compact')
            });
            this.add({
                name: 'eslint-stylish',
                label: (0, nls_1.localize)('eslint-stylish', 'ESLint stylish problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('eslint-stylish')
            });
            this.add({
                name: 'go',
                label: (0, nls_1.localize)('go', 'Go problems'),
                owner: 'go',
                source: 'go',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('go')
            });
        }
    }
    exports.ProblemMatcherRegistry = new ProblemMatcherRegistryImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvYmxlbU1hdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9jb21tb24vcHJvYmxlbU1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkpoRyxzREFFQztJQWtDRCxrQ0FtREM7SUEwREQsOENBT0M7SUEzUkQsSUFBWSxnQkFNWDtJQU5ELFdBQVksZ0JBQWdCO1FBQzNCLDZEQUFPLENBQUE7UUFDUCwrREFBUSxDQUFBO1FBQ1IsK0RBQVEsQ0FBQTtRQUNSLG1FQUFVLENBQUE7UUFDViwyREFBTSxDQUFBO0lBQ1AsQ0FBQyxFQU5XLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBTTNCO0lBRUQsV0FBYyxnQkFBZ0I7UUFDN0IsU0FBZ0IsVUFBVSxDQUFDLEtBQWE7WUFDdkMsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM1QixJQUFJLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxJQUFJLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxJQUFJLEtBQUssS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBYmUsMkJBQVUsYUFhekIsQ0FB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