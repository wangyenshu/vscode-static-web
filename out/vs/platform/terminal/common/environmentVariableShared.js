/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serializeEnvironmentVariableCollection = serializeEnvironmentVariableCollection;
    exports.serializeEnvironmentDescriptionMap = serializeEnvironmentDescriptionMap;
    exports.deserializeEnvironmentVariableCollection = deserializeEnvironmentVariableCollection;
    exports.deserializeEnvironmentDescriptionMap = deserializeEnvironmentDescriptionMap;
    exports.serializeEnvironmentVariableCollections = serializeEnvironmentVariableCollections;
    exports.deserializeEnvironmentVariableCollections = deserializeEnvironmentVariableCollections;
    // This file is shared between the renderer and extension host
    function serializeEnvironmentVariableCollection(collection) {
        return [...collection.entries()];
    }
    function serializeEnvironmentDescriptionMap(descriptionMap) {
        return descriptionMap ? [...descriptionMap.entries()] : [];
    }
    function deserializeEnvironmentVariableCollection(serializedCollection) {
        return new Map(serializedCollection);
    }
    function deserializeEnvironmentDescriptionMap(serializableEnvironmentDescription) {
        return new Map(serializableEnvironmentDescription ?? []);
    }
    function serializeEnvironmentVariableCollections(collections) {
        return Array.from(collections.entries()).map(e => {
            return [e[0], serializeEnvironmentVariableCollection(e[1].map), serializeEnvironmentDescriptionMap(e[1].descriptionMap)];
        });
    }
    function deserializeEnvironmentVariableCollections(serializedCollection) {
        return new Map(serializedCollection.map(e => {
            return [e[0], { map: deserializeEnvironmentVariableCollection(e[1]), descriptionMap: deserializeEnvironmentDescriptionMap(e[2]) }];
        }));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9lbnZpcm9ubWVudFZhcmlhYmxlU2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLHdGQUVDO0lBRUQsZ0ZBRUM7SUFFRCw0RkFJQztJQUVELG9GQUlDO0lBRUQsMEZBSUM7SUFFRCw4RkFNQztJQWxDRCw4REFBOEQ7SUFFOUQsU0FBZ0Isc0NBQXNDLENBQUMsVUFBNEQ7UUFDbEgsT0FBTyxDQUFDLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELFNBQWdCLGtDQUFrQyxDQUFDLGNBQTBGO1FBQzVJLE9BQU8sY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUM1RCxDQUFDO0lBRUQsU0FBZ0Isd0NBQXdDLENBQ3ZELG9CQUFnRTtRQUVoRSxPQUFPLElBQUksR0FBRyxDQUFzQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxTQUFnQixvQ0FBb0MsQ0FDbkQsa0NBQXNGO1FBRXRGLE9BQU8sSUFBSSxHQUFHLENBQW9ELGtDQUFrQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzdHLENBQUM7SUFFRCxTQUFnQix1Q0FBdUMsQ0FBQyxXQUFnRTtRQUN2SCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2hELE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQzFILENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQWdCLHlDQUF5QyxDQUN4RCxvQkFBaUU7UUFFakUsT0FBTyxJQUFJLEdBQUcsQ0FBeUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ25GLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsd0NBQXdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyJ9