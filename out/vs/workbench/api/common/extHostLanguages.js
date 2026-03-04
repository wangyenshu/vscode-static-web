/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/base/common/severity", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, extHost_protocol_1, typeConvert, extHostTypes_1, severity_1, async_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguages = void 0;
    class ExtHostLanguages {
        constructor(mainContext, _documents, _commands, _uriTransformer) {
            this._documents = _documents;
            this._commands = _commands;
            this._uriTransformer = _uriTransformer;
            this._languageIds = [];
            this._handlePool = 0;
            this._ids = new Set();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
        }
        $acceptLanguageIds(ids) {
            this._languageIds = ids;
        }
        async getLanguages() {
            return this._languageIds.slice(0);
        }
        async changeLanguage(uri, languageId) {
            await this._proxy.$changeLanguage(uri, languageId);
            const data = this._documents.getDocumentData(uri);
            if (!data) {
                throw new Error(`document '${uri.toString()}' NOT found`);
            }
            return data.document;
        }
        async tokenAtPosition(document, position) {
            const versionNow = document.version;
            const pos = typeConvert.Position.from(position);
            const info = await this._proxy.$tokensAtPosition(document.uri, pos);
            const defaultRange = {
                type: extHostTypes_1.StandardTokenType.Other,
                range: document.getWordRangeAtPosition(position) ?? new extHostTypes_1.Range(position.line, position.character, position.line, position.character)
            };
            if (!info) {
                // no result
                return defaultRange;
            }
            const result = {
                range: typeConvert.Range.to(info.range),
                type: typeConvert.TokenType.to(info.type)
            };
            if (!result.range.contains(position)) {
                // bogous result
                return defaultRange;
            }
            if (versionNow !== document.version) {
                // concurrent change
                return defaultRange;
            }
            return result;
        }
        createLanguageStatusItem(extension, id, selector) {
            const handle = this._handlePool++;
            const proxy = this._proxy;
            const ids = this._ids;
            // enforce extension unique identifier
            const fullyQualifiedId = `${extension.identifier.value}/${id}`;
            if (ids.has(fullyQualifiedId)) {
                throw new Error(`LanguageStatusItem with id '${id}' ALREADY exists`);
            }
            ids.add(fullyQualifiedId);
            const data = {
                selector,
                id,
                name: extension.displayName ?? extension.name,
                severity: extHostTypes_1.LanguageStatusSeverity.Information,
                command: undefined,
                text: '',
                detail: '',
                busy: false
            };
            let soonHandle;
            const commandDisposables = new lifecycle_1.DisposableStore();
            const updateAsync = () => {
                soonHandle?.dispose();
                if (!ids.has(fullyQualifiedId)) {
                    console.warn(`LanguageStatusItem (${id}) from ${extension.identifier.value} has been disposed and CANNOT be updated anymore`);
                    return; // disposed in the meantime
                }
                soonHandle = (0, async_1.disposableTimeout)(() => {
                    commandDisposables.clear();
                    this._proxy.$setLanguageStatus(handle, {
                        id: fullyQualifiedId,
                        name: data.name ?? extension.displayName ?? extension.name,
                        source: extension.displayName ?? extension.name,
                        selector: typeConvert.DocumentSelector.from(data.selector, this._uriTransformer),
                        label: data.text,
                        detail: data.detail ?? '',
                        severity: data.severity === extHostTypes_1.LanguageStatusSeverity.Error ? severity_1.default.Error : data.severity === extHostTypes_1.LanguageStatusSeverity.Warning ? severity_1.default.Warning : severity_1.default.Info,
                        command: data.command && this._commands.toInternal(data.command, commandDisposables),
                        accessibilityInfo: data.accessibilityInformation,
                        busy: data.busy
                    });
                }, 0);
            };
            const result = {
                dispose() {
                    commandDisposables.dispose();
                    soonHandle?.dispose();
                    proxy.$removeLanguageStatus(handle);
                    ids.delete(fullyQualifiedId);
                },
                get id() {
                    return data.id;
                },
                get name() {
                    return data.name;
                },
                set name(value) {
                    data.name = value;
                    updateAsync();
                },
                get selector() {
                    return data.selector;
                },
                set selector(value) {
                    data.selector = value;
                    updateAsync();
                },
                get text() {
                    return data.text;
                },
                set text(value) {
                    data.text = value;
                    updateAsync();
                },
                set text2(value) {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'languageStatusText');
                    data.text = value;
                    updateAsync();
                },
                get text2() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'languageStatusText');
                    return data.text;
                },
                get detail() {
                    return data.detail;
                },
                set detail(value) {
                    data.detail = value;
                    updateAsync();
                },
                get severity() {
                    return data.severity;
                },
                set severity(value) {
                    data.severity = value;
                    updateAsync();
                },
                get accessibilityInformation() {
                    return data.accessibilityInformation;
                },
                set accessibilityInformation(value) {
                    data.accessibilityInformation = value;
                    updateAsync();
                },
                get command() {
                    return data.command;
                },
                set command(value) {
                    data.command = value;
                    updateAsync();
                },
                get busy() {
                    return data.busy;
                },
                set busy(value) {
                    data.busy = value;
                    updateAsync();
                }
            };
            updateAsync();
            return result;
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RMYW5ndWFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsZ0JBQWdCO1FBTTVCLFlBQ0MsV0FBeUIsRUFDUixVQUE0QixFQUM1QixTQUE0QixFQUM1QixlQUE0QztZQUY1QyxlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUM1QixjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUM1QixvQkFBZSxHQUFmLGVBQWUsQ0FBNkI7WUFOdEQsaUJBQVksR0FBYSxFQUFFLENBQUM7WUF1RDVCLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1lBQ3hCLFNBQUksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBaERoQyxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxHQUFhO1lBQy9CLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWTtZQUNqQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQWUsRUFBRSxVQUFrQjtZQUN2RCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsSUFBSSxFQUFF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