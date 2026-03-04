/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaLibrariesToLookFor = exports.MavenArtifactIdRegex = exports.MavenGroupIdRegex = exports.MavenDependencyRegex = exports.MavenDependenciesRegex = exports.GradleDependencyCompactRegex = exports.GradleDependencyLooseRegex = void 0;
    exports.GradleDependencyLooseRegex = /group\s*:\s*[\'\"](.*?)[\'\"]\s*,\s*name\s*:\s*[\'\"](.*?)[\'\"]\s*,\s*version\s*:\s*[\'\"](.*?)[\'\"]/g;
    exports.GradleDependencyCompactRegex = /[\'\"]([^\'\"\s]*?)\:([^\'\"\s]*?)\:([^\'\"\s]*?)[\'\"]/g;
    exports.MavenDependenciesRegex = /<dependencies>([\s\S]*?)<\/dependencies>/g;
    exports.MavenDependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    exports.MavenGroupIdRegex = /<groupId>([\s\S]*?)<\/groupId>/;
    exports.MavenArtifactIdRegex = /<artifactId>([\s\S]*?)<\/artifactId>/;
    exports.JavaLibrariesToLookFor = [
        // azure mgmt sdk
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure' && artifactId === 'azure', 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure' && artifactId.startsWith('azure-mgmt-'), 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId.startsWith('com.microsoft.azure') && artifactId.startsWith('azure-mgmt-'), 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.resourcemanager' && artifactId.startsWith('azure-resourcemanager'), 'tag': 'azure' }, // azure track2 sdk
        // java ee
        { 'predicate': (groupId, artifactId) => groupId === 'javax' && artifactId === 'javaee-api', 'tag': 'javaee' },
        { 'predicate': (groupId, artifactId) => groupId === 'javax.xml.bind' && artifactId === 'jaxb-api', 'tag': 'javaee' },
        // jdbc
        { 'predicate': (groupId, artifactId) => groupId === 'mysql' && artifactId === 'mysql-connector-java', 'tag': 'jdbc' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.sqlserver' && artifactId === 'mssql-jdbc', 'tag': 'jdbc' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.oracle.database.jdbc' && artifactId.startsWith('ojdbc'), 'tag': 'jdbc' },
        // jpa
        { 'predicate': (groupId, artifactId) => groupId === 'org.hibernate', 'tag': 'jpa' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.eclipse.persistence' && artifactId === 'eclipselink', 'tag': 'jpa' },
        // lombok
        { 'predicate': (groupId, artifactId) => groupId === 'org.projectlombok', 'tag': 'lombok' },
        // redis
        { 'predicate': (groupId, artifactId) => groupId === 'org.springframework.data' && artifactId === 'spring-data-redis', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'redis.clients' && artifactId === 'jedis', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.redisson', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'io.lettuce' && artifactId === 'lettuce-core', 'tag': 'redis' },
        // spring boot
        { 'predicate': (groupId, artifactId) => groupId === 'org.springframework.boot', 'tag': 'springboot' },
        // sql
        { 'predicate': (groupId, artifactId) => groupId === 'org.jooq', 'tag': 'sql' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.mybatis', 'tag': 'sql' },
        // unit test
        { 'predicate': (groupId, artifactId) => groupId === 'org.junit.jupiter' && artifactId === 'junit-jupiter-api', 'tag': 'unitTest' },
        { 'predicate': (groupId, artifactId) => groupId === 'junit' && artifactId === 'junit', 'tag': 'unitTest' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.testng' && artifactId === 'testng', 'tag': 'unitTest' },
        // cosmos
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.includes('cosmos'), 'tag': 'azure-cosmos' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('cosmos'), 'tag': 'azure-cosmos' },
        // storage account
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.includes('azure-storage'), 'tag': 'azure-storage' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('storage'), 'tag': 'azure-storage' },
        // service bus
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId === 'azure-messaging-servicebus', 'tag': 'azure-servicebus' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('servicebus'), 'tag': 'azure-servicebus' },
        // event hubs
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.startsWith('azure-messaging-eventhubs'), 'tag': 'azure-eventhubs' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('eventhubs'), 'tag': 'azure-eventhubs' },
        // open ai
        { 'predicate': (groupId, artifactId) => groupId === 'com.theokanning.openai-gpt3-java', 'tag': 'openai' },
        // azure open ai
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId === 'azure-ai-openai', 'tag': 'azure-openai' },
        // Azure Functions
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure.functions' && artifactId === 'azure-functions-java-library', 'tag': 'azure-functions' },
        // quarkus
        { 'predicate': (groupId, artifactId) => groupId === 'io.quarkus', 'tag': 'quarkus' },
        // microprofile
        { 'predicate': (groupId, artifactId) => groupId.startsWith('org.eclipse.microprofile'), 'tag': 'microprofile' },
        // micronaut
        { 'predicate': (groupId, artifactId) => groupId === 'io.micronaut', 'tag': 'micronaut' },
        // GraalVM
        { 'predicate': (groupId, artifactId) => groupId.startsWith('org.graalvm'), 'tag': 'graalvm' }
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YVdvcmtzcGFjZVRhZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YWdzL2NvbW1vbi9qYXZhV29ya3NwYWNlVGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFbkYsUUFBQSwwQkFBMEIsR0FBRyx5R0FBeUcsQ0FBQztJQUN2SSxRQUFBLDRCQUE0QixHQUFHLDBEQUEwRCxDQUFDO0lBRTFGLFFBQUEsc0JBQXNCLEdBQUcsMkNBQTJDLENBQUM7SUFDckUsUUFBQSxvQkFBb0IsR0FBRyx1Q0FBdUMsQ0FBQztJQUMvRCxRQUFBLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDO0lBQ3JELFFBQUEsb0JBQW9CLEdBQUcsc0NBQXNDLENBQUM7SUFFOUQsUUFBQSxzQkFBc0IsR0FBbUY7UUFDckgsaUJBQWlCO1FBQ2pCLEVBQUUsV0FBVyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsT0FBTyxLQUFLLHFCQUFxQixJQUFJLFVBQVUsS0FBSyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtRQUNySCxFQUFFLFdBQVcsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sS0FBSyxxQkFBcUIsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7UUFDbkksRUFBRSxXQUFXLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO1FBQzNJLEVBQUUsV0FBVyxFQUFFLENBQUMs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