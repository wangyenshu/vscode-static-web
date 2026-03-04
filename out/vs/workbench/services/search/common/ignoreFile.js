/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob"], function (require, exports, glob) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IgnoreFile = void 0;
    class IgnoreFile {
        constructor(contents, location, parent) {
            this.location = location;
            this.parent = parent;
            if (location[location.length - 1] === '\\') {
                throw Error('Unexpected path format, do not use trailing backslashes');
            }
            if (location[location.length - 1] !== '/') {
                location += '/';
            }
            this.isPathIgnored = this.parseIgnoreFile(contents, this.location, this.parent);
        }
        /**
         * Updates the contents of the ignorefile. Preservering the location and parent
         * @param contents The new contents of the gitignore file
         */
        updateContents(contents) {
            this.isPathIgnored = this.parseIgnoreFile(contents, this.location, this.parent);
        }
        /**
         * Returns true if a path in a traversable directory has not been ignored.
         *
         * Note: For performance reasons this does not check if the parent directories have been ignored,
         * so it should always be used in tandem with `shouldTraverseDir` when walking a directory.
         *
         * In cases where a path must be tested in isolation, `isArbitraryPathIncluded` should be used.
         */
        isPathIncludedInTraversal(path, isDir) {
            if (path[0] !== '/' || path[path.length - 1] === '/') {
                throw Error('Unexpected path format, expectred to begin with slash and end without. got:' + path);
            }
            const ignored = this.isPathIgnored(path, isDir);
            return !ignored;
        }
        /**
         * Returns true if an arbitrary path has not been ignored.
         * This is an expensive operation and should only be used ouside of traversals.
         */
        isArbitraryPathIgnored(path, isDir) {
            if (path[0] !== '/' || path[path.length - 1] === '/') {
                throw Error('Unexpected path format, expectred to begin with slash and end without. got:' + path);
            }
            const segments = path.split('/').filter(x => x);
            let ignored = false;
            let walkingPath = '';
            for (let i = 0; i < segments.length; i++) {
                const isLast = i === segments.length - 1;
                const segment = segments[i];
                walkingPath = walkingPath + '/' + segment;
                if (!this.isPathIncludedInTraversal(walkingPath, isLast ? isDir : true)) {
                    ignored = true;
                    break;
                }
            }
            return ignored;
        }
        gitignoreLinesToExpression(lines, dirPath, trimForExclusions) {
            const includeLines = lines.map(line => this.gitignoreLineToGlob(line, dirPath));
            const includeExpression = Object.create(null);
            for (const line of includeLines) {
                includeExpression[line] = true;
            }
            return glob.parse(includeExpression, { trimForExclusions });
        }
        parseIgnoreFile(ignoreContents, dirPath, parent) {
            const contentLines = ignoreContents
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && line[0] !== '#');
            // Pull out all the lines that end with `/`, those only apply to directories
            const fileLines = contentLines.filter(line => !line.endsWith('/'));
            const fileIgnoreLines = fileLines.filter(line => !line.includes('!'));
            const isFileIgnored = this.gitignoreLinesToExpression(fileIgnoreLines, dirPath, true);
            // TODO: Slight hack... this naieve approach may reintroduce too many files in cases of weirdly complex .gitignores
            const fileIncludeLines = fileLines.filter(line => line.includes('!')).map(line => line.replace(/!/g, ''));
            const isFileIncluded = this.gitignoreLinesToExpression(fileIncludeLines, dirPath, false);
            // When checking if a dir is ignored we can use all lines
            const dirIgnoreLines = contentLines.filter(line => !line.includes('!'));
            const isDirIgnored = this.gitignoreLinesToExpression(dirIgnoreLines, dirPath, true);
            // Same hack.
            const dirIncludeLines = contentLines.filter(line => line.includes('!')).map(line => line.replace(/!/g, ''));
            const isDirIncluded = this.gitignoreLinesToExpression(dirIncludeLines, dirPath, false);
            const isPathIgnored = (path, isDir) => {
                if (!path.startsWith(dirPath)) {
                    return false;
                }
                if (isDir && isDirIgnored(path) && !isDirIncluded(path)) {
                    return true;
                }
                if (isFileIgnored(path) && !isFileIncluded(path)) {
                    return true;
                }
                if (parent) {
                    return parent.isPathIgnored(path, isDir);
                }
                return false;
            };
            return isPathIgnored;
        }
        gitignoreLineToGlob(line, dirPath) {
            const firstSep = line.indexOf('/');
            if (firstSep === -1 || firstSep === line.length - 1) {
                line = '**/' + line;
            }
            else {
                if (firstSep === 0) {
                    if (dirPath.slice(-1) === '/') {
                        line = line.slice(1);
                    }
                }
                else {
                    if (dirPath.slice(-1) !== '/') {
                        line = '/' + line;
                    }
                }
                line = dirPath + line;
            }
            return line;
        }
    }
    exports.IgnoreFile = IgnoreFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWdub3JlRmlsZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL2lnbm9yZUZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsVUFBVTtRQUl0QixZQUNDLFFBQWdCLEVBQ0MsUUFBZ0IsRUFDaEIsTUFBbUI7WUFEbkIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUNoQixXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ3BDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzVDLE1BQU0sS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUNELElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzNDLFFBQVEsSUFBSSxHQUFHLENBQUM7WUFDakIsQ0FBQztZQUNELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVEOzs7V0FHRztRQUNILGNBQWMsQ0FBQyxRQUFnQjtZQUM5QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRDs7Ozs7OztXQU9HO1FBQ0gseUJBQXlCLENBQUMsSUFBWSxFQUFFLEtBQWM7WUFDckQsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJ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