/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/hash", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/uri", "vs/base/common/network", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/tags/common/workspaceTags", "vs/workbench/contrib/tags/electron-sandbox/workspaceTags", "vs/base/common/strings", "vs/workbench/contrib/tags/common/javaWorkspaceTags"], function (require, exports, hash_1, files_1, workspace_1, environmentService_1, textfiles_1, uri_1, network_1, extensions_1, workspaceTags_1, workspaceTags_2, strings_1, javaWorkspaceTags_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTagsService = void 0;
    const MetaModulesToLookFor = [
        // Azure packages
        '@azure',
        '@azure/ai',
        '@azure/core',
        '@azure/cosmos',
        '@azure/event',
        '@azure/identity',
        '@azure/keyvault',
        '@azure/search',
        '@azure/storage'
    ];
    const ModulesToLookFor = [
        // Packages that suggest a node server
        'express',
        'sails',
        'koa',
        'hapi',
        'socket.io',
        'restify',
        'next',
        'nuxt',
        '@nestjs/core',
        'strapi',
        'gatsby',
        // JS frameworks
        'react',
        'react-native',
        'react-native-macos',
        'react-native-windows',
        'rnpm-plugin-windows',
        '@angular/core',
        '@ionic',
        'vue',
        'tns-core-modules',
        '@nativescript/core',
        'electron',
        // Other interesting packages
        'aws-sdk',
        'aws-amplify',
        'azure',
        'azure-storage',
        'chroma',
        'faiss',
        'firebase',
        '@google-cloud/common',
        'heroku-cli',
        'langchain',
        'milvus',
        'openai',
        'pinecone',
        'qdrant',
        // Office and Sharepoint packages
        '@microsoft/teams-js',
        '@microsoft/office-js',
        '@microsoft/office-js-helpers',
        '@types/office-js',
        '@types/office-runtime',
        'office-ui-fabric-react',
        '@uifabric/icons',
        '@uifabric/merge-styles',
        '@uifabric/styling',
        '@uifabric/experiments',
        '@uifabric/utilities',
        '@microsoft/rush',
        'lerna',
        'just-task',
        'beachball',
        // Playwright packages
        'playwright',
        'playwright-cli',
        '@playwright/test',
        'playwright-core',
        'playwright-chromium',
        'playwright-firefox',
        'playwright-webkit',
        // Other interesting browser testing packages
        'cypress',
        'nightwatch',
        'protractor',
        'puppeteer',
        'selenium-webdriver',
        'webdriverio',
        'gherkin',
        // AzureSDK packages
        '@azure/app-configuration',
        '@azure/cosmos-sign',
        '@azure/cosmos-language-service',
        '@azure/synapse-spark',
        '@azure/synapse-monitoring',
        '@azure/synapse-managed-private-endpoints',
        '@azure/synapse-artifacts',
        '@azure/synapse-access-control',
        '@azure/ai-metrics-advisor',
        '@azure/service-bus',
        '@azure/keyvault-secrets',
        '@azure/keyvault-keys',
        '@azure/keyvault-certificates',
        '@azure/keyvault-admin',
        '@azure/digital-twins-core',
        '@azure/cognitiveservices-anomalydetector',
        '@azure/ai-anomaly-detector',
        '@azure/core-xml',
        '@azure/core-tracing',
        '@azure/core-paging',
        '@azure/core-https',
        '@azure/core-client',
        '@azure/core-asynciterator-polyfill',
        '@azure/core-arm',
        '@azure/amqp-common',
        '@azure/core-lro',
        '@azure/logger',
        '@azure/core-http',
        '@azure/core-auth',
        '@azure/core-amqp',
        '@azure/abort-controller',
        '@azure/eventgrid',
        '@azure/storage-file-datalake',
        '@azure/search-documents',
        '@azure/storage-file',
        '@azure/storage-datalake',
        '@azure/storage-queue',
        '@azure/storage-file-share',
        '@azure/storage-blob-changefeed',
        '@azure/storage-blob',
        '@azure/cognitiveservices-formrecognizer',
        '@azure/ai-form-recognizer',
        '@azure/cognitiveservices-textanalytics',
        '@azure/ai-text-analytics',
        '@azure/event-processor-host',
        '@azure/schema-registry-avro',
        '@azure/schema-registry',
        '@azure/eventhubs-checkpointstore-blob',
        '@azure/event-hubs',
        '@azure/communication-signaling',
        '@azure/communication-calling',
        '@azure/communication-sms',
        '@azure/communication-common',
        '@azure/communication-chat',
        '@azure/communication-administration',
        '@azure/attestation',
        '@azure/data-tables',
        '@azure/arm-appservice',
        '@azure-rest/arm-appservice',
        '@azure/arm-appcontainers',
        '@azure/arm-rediscache',
        '@azure/arm-redisenterprisecache',
        '@azure/arm-apimanagement',
        '@azure/arm-logic',
        '@azure/app-configuration',
        '@azure/arm-appconfiguration',
        '@azure/arm-dashboard',
        '@azure/arm-signalr',
        '@azure/arm-securitydevops',
        '@azure/arm-labservices',
        '@azure/web-pubsub',
        '@azure/web-pubsub-client',
        '@azure/web-pubsub-client-protobuf',
        '@azure/web-pubsub-express',
        '@azure/openai',
        '@azure/arm-hybridkubernetes',
        '@azure/arm-kubernetesconfiguration'
    ];
    const PyMetaModulesToLookFor = [
        'azure-ai',
        'azure-cognitiveservices',
        'azure-core',
        'azure-cosmos',
        'azure-event',
        'azure-identity',
        'azure-keyvault',
        'azure-mgmt',
        'azure-ml',
        'azure-search',
        'azure-storage'
    ];
    const PyModulesToLookFor = [
        'azure',
        'azure-ai-language-conversations',
        'azure-ai-language-questionanswering',
        'azure-ai-ml',
        'azure-ai-translation-document',
        'azure-appconfiguration',
        'azure-appconfiguration-provider',
        'azure-loganalytics',
        'azure-synapse-nspkg',
        'azure-synapse-spark',
        'azure-synapse-artifacts',
        'azure-synapse-accesscontrol',
        'azure-synapse',
        'azure-cognitiveservices-vision-nspkg',
        'azure-cognitiveservices-search-nspkg',
        'azure-cognitiveservices-nspkg',
        'azure-cognitiveservices-language-nspkg',
        'azure-cognitiveservices-knowledge-nspkg',
        'azure-containerregistry',
        'azure-communication-identity',
        'azure-communication-phonenumbers',
        'azure-communication-email',
        'azure-communication-rooms',
        'azure-communication-callautomation',
        'azure-confidentialledger',
        'azure-containerregistry',
        'azure-developer-loadtesting',
        'azure-iot-deviceupdate',
        'azure-messaging-webpubsubservice',
        'azure-monitor',
        'azure-monitor-query',
        'azure-monitor-ingestion',
        'azure-mgmt-appcontainers',
        'azure-mgmt-apimanagement',
        'azure-mgmt-web',
        'azure-mgmt-redis',
        'azure-mgmt-redisenterprise',
        'azure-mgmt-logic',
        'azure-appconfiguration',
        'azure-appconfiguration-provider',
        'azure-mgmt-appconfiguration',
        'azure-mgmt-dashboard',
        'azure-mgmt-signalr',
        'azure-messaging-webpubsubservice',
        'azure-mgmt-webpubsub',
        'azure-mgmt-securitydevops',
        'azure-mgmt-labservices',
        'azure-ai-metricsadvisor',
        'azure-servicebus',
        'azureml-sdk',
        'azure-keyvault-nspkg',
        'azure-keyvault-secrets',
        'azure-keyvault-keys',
        'azure-keyvault-certificates',
        'azure-keyvault-administration',
        'azure-digitaltwins-nspkg',
        'azure-digitaltwins-core',
        'azure-cognitiveservices-anomalydetector',
        'azure-ai-anomalydetector',
        'azure-applicationinsights',
        'azure-core-tracing-opentelemetry',
        'azure-core-tracing-opencensus',
        'azure-nspkg',
        'azure-common',
        'azure-eventgrid',
        'azure-storage-file-datalake',
        'azure-search-nspkg',
        'azure-search-documents',
        'azure-storage-nspkg',
        'azure-storage-file',
        'azure-storage-common',
        'azure-storage-queue',
        'azure-storage-file-share',
        'azure-storage-blob-changefeed',
        'azure-storage-blob',
        'azure-cognitiveservices-formrecognizer',
        'azure-ai-formrecognizer',
        'azure-ai-nspkg',
        'azure-cognitiveservices-language-textanalytics',
        'azure-ai-textanalytics',
        'azure-schemaregistry-avroencoder',
        'azure-schemaregistry-avroserializer',
        'azure-schemaregistry',
        'azure-eventhub-checkpointstoreblob-aio',
        'azure-eventhub-checkpointstoreblob',
        'azure-eventhub',
        'azure-servicefabric',
        'azure-communication-nspkg',
        'azure-communication-sms',
        'azure-communication-chat',
        'azure-communication-administration',
        'azure-security-attestation',
        'azure-data-nspkg',
        'azure-data-tables',
        'azure-devtools',
        'azure-elasticluster',
        'azure-functions',
        'azure-graphrbac',
        'azure-iothub-device-client',
        'azure-shell',
        'azure-translator',
        'azure-mgmt-hybridkubernetes',
        'azure-mgmt-kubernetesconfiguration',
        'adal',
        'pydocumentdb',
        'botbuilder-core',
        'botbuilder-schema',
        'botframework-connector',
        'playwright',
        'transformers',
        'langchain',
        'llama-index',
        'guidance',
        'openai',
        'semantic-kernel',
        'sentence-transformers'
    ];
    const GoModulesToLookFor = [
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azblob',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azfile',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azqueue',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azdatalake',
        'github.com/Azure/azure-sdk-for-go/sdk/tracing/azotel',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azadmin',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azcertificates',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azkeys',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azsecrets',
        'github.com/Azure/azure-sdk-for-go/sdk/monitor/azquery',
        'github.com/Azure/azure-sdk-for-go/sdk/monitor/azingest',
        'github.com/Azure/azure-sdk-for-go/sdk/messaging/azeventhubs',
        'github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus',
        'github.com/Azure/azure-sdk-for-go/sdk/data/azappconfig',
        'github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos',
        'github.com/Azure/azure-sdk-for-go/sdk/data/aztables',
        'github.com/Azure/azure-sdk-for-go/sdk/containers/azcontainerregistry',
        'github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai',
        'github.com/Azure/azure-sdk-for-go/sdk/azidentity',
        'github.com/Azure/azure-sdk-for-go/sdk/azcore',
        'github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/'
    ];
    let WorkspaceTagsService = class WorkspaceTagsService {
        constructor(fileService, contextService, environmentService, textFileService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.textFileService = textFileService;
        }
        async getTags() {
            if (!this._tags) {
                this._tags = await this.resolveWorkspaceTags();
            }
            return this._tags;
        }
        async getTelemetryWorkspaceId(workspace, state) {
            function createHash(uri) {
                return (0, hash_1.sha1Hex)(uri.scheme === network_1.Schemas.file ? uri.fsPath : uri.toString());
            }
            let workspaceId;
            switch (state) {
                case 1 /* WorkbenchState.EMPTY */:
                    workspaceId = undefined;
                    break;
                case 2 /* WorkbenchState.FOLDER */:
                    workspaceId = await createHash(workspace.folders[0].uri);
                    break;
                case 3 /* WorkbenchState.WORKSPACE */:
                    if (workspace.configuration) {
                        workspaceId = await createHash(workspace.configuration);
                    }
            }
            return workspaceId;
        }
        getHashedRemotesFromUri(workspaceUri, stripEndingDotGit = false) {
            const path = workspaceUri.path;
            const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
            return this.fileService.exists(uri).then(exists => {
                if (!exists) {
                    return [];
                }
                return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => (0, workspaceTags_2.getHashedRemotesFromConfig)(content.value, stripEndingDotGit), err => [] // ignore missing or binary file
                );
            });
        }
        /* __GDPR__FRAGMENT__
            "WorkspaceTags" : {
                "workbench.filesToOpenOrCreate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToDiff" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToMerge" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "workspace.roots" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.empty" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.grunt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gulp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.tsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.config.xml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.vsc.extension" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.asp<NUMBER>" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.sln" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.unity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.express" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.sails" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.koa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.hapi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.socket.io" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.restify" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.next" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.nuxt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@nestjs/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.strapi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.gatsby" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.rnpm-plugin-windows" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@angular/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.vue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-amplify-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/search" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@google-cloud/common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.firebase" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.heroku-cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/teams-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/office-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/office-js-helpers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@types/office-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@types/office-runtime" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.office-ui-fabric-react" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/icons" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/merge-styles" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/styling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/experiments" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/utilities" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/rush" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.lerna" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.just-task" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.beachball" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.electron" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@playwright/test" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-chromium" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-firefox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-webkit" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.cypress" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.chroma" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.faiss" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.langchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.milvus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.pinecone" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.qdrant" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.nightwatch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.protractor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.puppeteer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.selenium-webdriver" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.webdriverio" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.gherkin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/app-configuration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos-sign" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos-language-service" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-spark" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-monitoring" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-managed-private-endpoints" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-artifacts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-access-control" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-metrics-advisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/service-bus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-secrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-keys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-certificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-admin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/digital-twins-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-anomaly-detector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-xml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-tracing" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-paging" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-https" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-asynciterator-polyfill" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-arm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/amqp-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-lro" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/logger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-http" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-auth" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-amqp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/abort-controller" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/search-documents" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-queue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file-share" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-blob-changefeed" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-form-recognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-text-analytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event-processor-host" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/schema-registry-avro" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/schema-registry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/eventhubs-checkpointstore-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event-hubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-signaling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-calling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-sms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-chat" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/attestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/data-tables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure-rest/arm-appservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-appservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-appcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-rediscache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-redisenterprisecache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-apimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-logic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/app-configuration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-dashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-signalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-securitydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-labservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-client-protobuf" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-express" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-hybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-kubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react-native-macos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react-native-windows" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.bower" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.yeoman.code.ext" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.high" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.low" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.android" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.ios" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.android.cpp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.reactNative" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.ionic" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.nativeScript" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.java.pom" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.java.gradle" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.java.android" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.javaee" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.jdbc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.jpa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.lombok" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.mockito" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.springboot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.sql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.unittest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-eventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.quarkus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.microprofile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.micronaut" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.graalvm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.javaee" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.jdbc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.jpa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.lombok" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.mockito" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.springboot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.sql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.unittest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-eventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.quarkus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.microprofile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.micronaut" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.graalvm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.requirements" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.requirements.star" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.Pipfile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.conda" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.setup": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pyproject": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.manage": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.setupcfg": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.app": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.any-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pulumi-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-language-conversations" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-language-questionanswering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-ml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-translation-document" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-devtools" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-elasticluster" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-event" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-graphrbac" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-iothub-device-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-loganalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-appcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-redisenterprise" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-apimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-logic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration-provider" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-dashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-signalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-messaging-webpubsubservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-webpubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-securitydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-labservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-web" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicefabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-shell" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-translator" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-hybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-kubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.adal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pydocumentdb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-schema" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botframework-connector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.playwright" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-spark" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-artifacts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-accesscontrol" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-vision-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-search-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-language-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-knowledge-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-containerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-metricsadvisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azureml-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-secrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-keys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-certificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-digitaltwins-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-digitaltwins-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-applicationinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core-tracing-opentelemetry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core-tracing-opencensus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search-documents" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-queue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file-share" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-blob-changefeed" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-language-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry-avroserializer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub-checkpointstoreblob-aio" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub-checkpointstoreblob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-sms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-chat" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-security-attestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration-provider" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-phonenumbers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-email" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-rooms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-callautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-confidentialledger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-iot-deviceupdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-developer-loadtesting" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor-query" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor-ingestion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry-avroencoder" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-messaging-webpubsubservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-data-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-data-tables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.transformers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.langchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.llama-index" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.guidance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.semantic-kernel" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.sentence-transformers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azblob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azfile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azqueue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azdatalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/tracing/azotel" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azadmin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azcertificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azkeys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azsecrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/monitor/azquery" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/monitor/azingest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/messaging/azeventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/azappconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/aztables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/containers/azcontainerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/azidentity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/azcore" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotfirmwaredefense/armiotfirmwaredefense" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/aad/armaad" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/addons/armaddons" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/advisor/armadvisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/agrifood/armagrifood" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/alertsmanagement/armalertsmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/analysisservices/armanalysisservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/apimanagement/armapimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcomplianceautomation/armappcomplianceautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appconfiguration/armappconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appplatform/armappplatform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appservice/armappservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/applicationinsights/armapplicationinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azurearcdata/armazurearcdata" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/attestation/armattestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/authorization/armauthorization" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/automanage/armautomanage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/automation/armautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azuredata/armazuredata" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azurestackhci/armazurestackhci" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/avs/armavs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservicesbackup" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/baremetalinfrastructure/armbaremetalinfrastructure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/batch/armbatch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/billing/armbilling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/billingbenefits/armbillingbenefits" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/blockchain/armblockchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/blueprint/armblueprint" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/botservice/armbotservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/changeanalysis/armchangeanalysis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armchanges" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/chaos/armchaos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/search/armsearch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cognitiveservices/armcognitiveservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/commerce/armcommerce" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/communication/armcommunication" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/confidentialledger/armconfidentialledger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/confluent/armconfluent" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/connectedvmware/armconnectedvmware" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/consumption/armconsumption" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcontainers/armappcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerregistry/armcontainerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservice/armcontainerservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservicefleet/armcontainerservicefleet" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cdn/armcdn" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cosmos/armcosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cosmosforpostgresql/armcosmosforpostgresql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/costmanagement/armcostmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customproviders/armcustomproviders" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customerinsights/armcustomerinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customerlockbox/armcustomerlockbox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databox/armdatabox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databoxedge/armdataboxedge" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datacatalog/armdatacatalog" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datafactory/armdatafactory" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datalake-analytics/armdatalakeanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datalake-store/armdatalakestore" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datamigration/armdatamigration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dataprotection/armdataprotection" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datashare/armdatashare" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databricks/armdatabricks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datadog/armdatadog" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/delegatednetwork/armdelegatednetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deploymentmanager/armdeploymentmanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armdeploymentscripts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/desktopvirtualization/armdesktopvirtualization" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devcenter/armdevcenter" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devhub/armdevhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deviceprovisioningservices/armdeviceprovisioningservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deviceupdate/armdeviceupdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devops/armdevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devtestlabs/armdevtestlabs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/digitaltwins/armdigitaltwins" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dns/armdns" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dnsresolver/armdnsresolver" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/domainservices/armdomainservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dynatrace/armdynatrace" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/edgeorder/armedgeorder" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/edgeorderpartner/armedgeorderpartner" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/education/armeducation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elastic/armelastic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elasticsan/armelasticsan" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elasticsans/armelasticsans" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/engagementfabric/armengagementfabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/eventgrid/armeventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/eventhub/armeventhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/extendedlocation/armextendedlocation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armfeatures" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/fluidrelay/armfluidrelay" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/frontdoor/armfrontdoor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/graphservices/armgraphservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/guestconfiguration/armguestconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hanaonazure/armhanaonazure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hardwaresecuritymodules/armhardwaresecuritymodules" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hdinsight/armhdinsight" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/healthbot/armhealthbot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/healthcareapis/armhealthcareapis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridcompute/armhybridcompute" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridconnectivity/armhybridconnectivity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridcontainerservice/armhybridcontainerservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybriddatamanager/armhybriddatamanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridkubernetes/armhybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridnetwork/armhybridnetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotcentral/armiotcentral" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iothub/armiothub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotsecurity/armiotsecurity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/keyvault/armkeyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/kubernetesconfiguration/armkubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/kusto/armkusto" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/labservices/armlabservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armlinks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/loadtesting/armloadtesting" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armlocks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/operationalinsights/armoperationalinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/logic/armlogic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/logz/armlogz" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/m365securityandcompliance/armm365securityandcompliance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/machinelearning/armmachinelearning" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/machinelearningservices/armmachinelearningservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/maintenance/armmaintenance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armmanagedapplications" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/solutions/armmanagedapplications" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dashboard/armdashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managednetwork/armmanagednetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managednetworkfabric/armmanagednetworkfabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/msi/armmsi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managedservices/armmanagedservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managementgroups/armmanagementgroups" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managementpartner/armmanagementpartner" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/maps/armmaps" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mariadb/armmariadb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/marketplace/armmarketplace" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/marketplaceordering/armmarketplaceordering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mediaservices/armmediaservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/migrate/armmigrate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mixedreality/armmixedreality" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mobilenetwork/armmobilenetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/monitor/armmonitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mysql/armmysql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mysql/armmysqlflexibleservers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/netapp/armnetapp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/network/armnetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/networkcloud/armnetworkcloud" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/networkfunction/armnetworkfunction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/newrelic/armnewrelicobservability" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/nginx/armnginx" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/notificationhubs/armnotificationhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/oep/armoep" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/operationsmanagement/armoperationsmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/orbital/armorbital" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/paloaltonetworksngfw/armpanngfw" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/peering/armpeering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armpolicy" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/policyinsights/armpolicyinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/portal/armportal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresql/armpostgresql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresql/armpostgresqlflexibleservers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresqlhsc/armpostgresqlhsc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbiprivatelinks/armpowerbiprivatelinks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbidedicated/armpowerbidedicated" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbiembedded/armpowerbiembedded" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerplatform/armpowerplatform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/privatedns/armprivatedns" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/providerhub/armproviderhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/purview/armpurview" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quantum/armquantum" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/liftrqumulo/armqumulo" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redhatopenshift/armredhatopenshift" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redis/armredis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redisenterprise/armredisenterprise" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/relay/armrelay" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/reservations/armreservations" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourceconnector/armresourceconnector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcegraph/armresourcegraph" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcehealth/armresourcehealth" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcemover/armresourcemover" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armresources" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/saas/armsaas" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/scheduler/armscheduler" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/scvmm/armscvmm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/security/armsecurity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securitydevops/armsecuritydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securityinsight/armsecurityinsight" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securityinsights/armsecurityinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/selfhelp/armselfhelp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/serialconsole/armserialconsole" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicebus/armservicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicefabric/armservicefabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicefabricmesh/armservicefabricmesh" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicelinker/armservicelinker" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicenetworking/armservicenetworking" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/signalr/armsignalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservicessiterecovery" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sphere/armsphere" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sql/armsql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sqlvirtualmachine/armsqlvirtualmachine" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storage/armstorage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagecache/armstoragecache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storageimportexport/armstorageimportexport" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagemover/armstoragemover" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagepool/armstoragepool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagesync/armstoragesync" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storsimple1200series/armstorsimple1200series" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storsimple8000series/armstorsimple8000series" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/streamanalytics/armstreamanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/subscription/armsubscription" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/synapse/armsynapse" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armtemplatespecs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/testbase/armtestbase" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/timeseriesinsights/armtimeseriesinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/trafficmanager/armtrafficmanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/web/armweb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/webpubsub/armwebpubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/windowsesu/armwindowsesu" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/windowsiot/armwindowsiot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/workloadmonitor/armworkloadmonitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/workloads/armworkloads" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        async resolveWorkspaceTags() {
            const tags = Object.create(null);
            const state = this.contextService.getWorkbenchState();
            const workspace = this.contextService.getWorkspace();
            tags['workspace.id'] = await this.getTelemetryWorkspaceId(workspace, state);
            const { filesToOpenOrCreate, filesToDiff, filesToMerge } = this.environmentService;
            tags['workbench.filesToOpenOrCreate'] = filesToOpenOrCreate && filesToOpenOrCreate.length || 0;
            tags['workbench.filesToDiff'] = filesToDiff && filesToDiff.length || 0;
            tags['workbench.filesToMerge'] = filesToMerge && filesToMerge.length || 0;
            const isEmpty = state === 1 /* WorkbenchState.EMPTY */;
            tags['workspace.roots'] = isEmpty ? 0 : workspace.folders.length;
            tags['workspace.empty'] = isEmpty;
            const folders = !isEmpty ? workspace.folders.map(folder => folder.uri) : undefined;
            if (!folders || !folders.length) {
                return Promise.resolve(tags);
            }
            const aiGeneratedWorkspaces = uri_1.URI.joinPath(this.environmentService.workspaceStorageHome, 'aiGeneratedWorkspaces.json');
            await this.fileService.exists(aiGeneratedWorkspaces).then(async (result) => {
                if (result) {
                    try {
                        const content = await this.fileService.readFile(aiGeneratedWorkspaces);
                        const workspaces = JSON.parse(content.value.toString());
                        if (workspaces.indexOf(workspace.folders[0].uri.toString()) > -1) {
                            tags['aiGenerated'] = true;
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file contents
                    }
                }
            });
            return this.fileService.resolveAll(folders.map(resource => ({ resource }))).then((files) => {
                const names = [].concat(...files.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const nameSet = names.reduce((s, n) => s.add(n.toLowerCase()), new Set());
                tags['workspace.grunt'] = nameSet.has('gruntfile.js');
                tags['workspace.gulp'] = nameSet.has('gulpfile.js');
                tags['workspace.jake'] = nameSet.has('jakefile.js');
                tags['workspace.tsconfig'] = nameSet.has('tsconfig.json');
                tags['workspace.jsconfig'] = nameSet.has('jsconfig.json');
                tags['workspace.config.xml'] = nameSet.has('config.xml');
                tags['workspace.vsc.extension'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.ASP5'] = nameSet.has('project.json') && this.searchArray(names, /^.+\.cs$/i);
                tags['workspace.sln'] = this.searchArray(names, /^.+\.sln$|^.+\.csproj$/i);
                tags['workspace.unity'] = nameSet.has('assets') && nameSet.has('library') && nameSet.has('projectsettings');
                tags['workspace.npm'] = nameSet.has('package.json') || nameSet.has('node_modules');
                tags['workspace.bower'] = nameSet.has('bower.json') || nameSet.has('bower_components');
                tags['workspace.java.pom'] = nameSet.has('pom.xml');
                tags['workspace.java.gradle'] = nameSet.has('build.gradle') || nameSet.has('settings.gradle') || nameSet.has('build.gradle.kts') || nameSet.has('settings.gradle.kts') || nameSet.has('gradlew') || nameSet.has('gradlew.bat');
                tags['workspace.yeoman.code.ext'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.py.requirements'] = nameSet.has('requirements.txt');
                tags['workspace.py.requirements.star'] = this.searchArray(names, /^(.*)requirements(.*)\.txt$/i);
                tags['workspace.py.Pipfile'] = nameSet.has('pipfile');
                tags['workspace.py.conda'] = this.searchArray(names, /^environment(\.yml$|\.yaml$)/i);
                tags['workspace.py.setup'] = nameSet.has('setup.py');
                tags['workspace.py.manage'] = nameSet.has('manage.py');
                tags['workspace.py.setupcfg'] = nameSet.has('setup.cfg');
                tags['workspace.py.app'] = nameSet.has('app.py');
                tags['workspace.py.pyproject'] = nameSet.has('pyproject.toml');
                tags['workspace.go.mod'] = nameSet.has('go.mod');
                const mainActivity = nameSet.has('mainactivity.cs') || nameSet.has('mainactivity.fs');
                const appDelegate = nameSet.has('appdelegate.cs') || nameSet.has('appdelegate.fs');
                const androidManifest = nameSet.has('androidmanifest.xml');
                const platforms = nameSet.has('platforms');
                const plugins = nameSet.has('plugins');
                const www = nameSet.has('www');
                const properties = nameSet.has('properties');
                const resources = nameSet.has('resources');
                const jni = nameSet.has('jni');
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (platforms && plugins && www) {
                        tags['workspace.cordova.high'] = true;
                    }
                    else {
                        tags['workspace.cordova.low'] = true;
                    }
                }
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (nameSet.has('ionic.config.json')) {
                        tags['workspace.ionic'] = true;
                    }
                }
                if (mainActivity && properties && resources) {
                    tags['workspace.xamarin.android'] = true;
                }
                if (appDelegate && resources) {
                    tags['workspace.xamarin.ios'] = true;
                }
                if (androidManifest && jni) {
                    tags['workspace.android.cpp'] = true;
                }
                function getFilePromises(filename, fileService, textFileService, contentHandler) {
                    return !nameSet.has(filename) ? [] : folders.map(workspaceUri => {
                        const uri = workspaceUri.with({ path: `${workspaceUri.path !== '/' ? workspaceUri.path : ''}/${filename}` });
                        return fileService.exists(uri).then(exists => {
                            if (!exists) {
                                return undefined;
                            }
                            return textFileService.read(uri, { acceptTextOnly: true }).then(contentHandler);
                        }, err => {
                            // Ignore missing file
                        });
                    });
                }
                function addPythonTags(packageName) {
                    if (PyModulesToLookFor.indexOf(packageName) > -1) {
                        tags['workspace.py.' + packageName] = true;
                    }
                    for (const metaModule of PyMetaModulesToLookFor) {
                        if (packageName.startsWith(metaModule)) {
                            tags['workspace.py.' + metaModule] = true;
                        }
                    }
                    if (!tags['workspace.py.any-azure']) {
                        tags['workspace.py.any-azure'] = /azure/i.test(packageName);
                    }
                }
                const requirementsTxtPromises = getFilePromises('requirements.txt', this.fileService, this.textFileService, content => {
                    const dependencies = (0, strings_1.splitLines)(content.value);
                    for (const dependency of dependencies) {
                        // Dependencies in requirements.txt can have 3 formats: `foo==3.1, foo>=3.1, foo`
                        const format1 = dependency.split('==');
                        const format2 = dependency.split('>=');
                        const packageName = (format1.length === 2 ? format1[0] : format2[0]).trim();
                        addPythonTags(packageName);
                    }
                });
                const pipfilePromises = getFilePromises('pipfile', this.fileService, this.textFileService, content => {
                    let dependencies = (0, strings_1.splitLines)(content.value);
                    // We're only interested in the '[packages]' section of the Pipfile
                    dependencies = dependencies.slice(dependencies.indexOf('[packages]') + 1);
                    for (const dependency of dependencies) {
                        if (dependency.trim().indexOf('[') > -1) {
                            break;
                        }
                        // All dependencies in Pipfiles follow the format: `<package> = <version, or git repo, or something else>`
                        if (dependency.indexOf('=') === -1) {
                            continue;
                        }
                        const packageName = dependency.split('=')[0].trim();
                        addPythonTags(packageName);
                    }
                });
                const packageJsonPromises = getFilePromises('package.json', this.fileService, this.textFileService, content => {
                    try {
                        const packageJsonContents = JSON.parse(content.value);
                        const dependencies = Object.keys(packageJsonContents['dependencies'] || {}).concat(Object.keys(packageJsonContents['devDependencies'] || {}));
                        for (const dependency of dependencies) {
                            if (dependency.startsWith('react-native')) {
                                tags['workspace.reactNative'] = true;
                            }
                            else if ('tns-core-modules' === dependency || '@nativescript/core' === dependency) {
                                tags['workspace.nativescript'] = true;
                            }
                            else if (ModulesToLookFor.indexOf(dependency) > -1) {
                                tags['workspace.npm.' + dependency] = true;
                            }
                            else {
                                for (const metaModule of MetaModulesToLookFor) {
                                    if (dependency.startsWith(metaModule)) {
                                        tags['workspace.npm.' + metaModule] = true;
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file or parsing file contents
                    }
                });
                const goModPromises = getFilePromises('go.mod', this.fileService, this.textFileService, content => {
                    try {
                        const lines = (0, strings_1.splitLines)(content.value);
                        let firstRequireBlockFound = false;
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('require (')) {
                                if (!firstRequireBlockFound) {
                                    firstRequireBlockFound = true;
                                    continue;
                                }
                                else {
                                    break;
                                }
                            }
                            if (line.startsWith(')')) {
                                break;
                            }
                            if (firstRequireBlockFound && line !== '') {
                                const packageName = line.split(' ')[0].trim();
                                for (const module of GoModulesToLookFor) {
                                    if (packageName.startsWith(module)) {
                                        tags['workspace.go.mod.' + packageName] = true;
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file or parsing file contents
                    }
                });
                const pomPromises = getFilePromises('pom.xml', this.fileService, this.textFileService, content => {
                    try {
                        let dependenciesContent;
                        while (dependenciesContent = javaWorkspaceTags_1.MavenDependenciesRegex.exec(content.value)) {
                            let dependencyContent;
                            while (dependencyContent = javaWorkspaceTags_1.MavenDependencyRegex.exec(dependenciesContent[1])) {
                                const groupIdContent = javaWorkspaceTags_1.MavenGroupIdRegex.exec(dependencyContent[1]);
                                const artifactIdContent = javaWorkspaceTags_1.MavenArtifactIdRegex.exec(dependencyContent[1]);
                                if (groupIdContent && artifactIdContent) {
                                    this.tagJavaDependency(groupIdContent[1], artifactIdContent[1], 'workspace.pom.', tags);
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving maven dependencies
                    }
                });
                const gradlePromises = getFilePromises('build.gradle', this.fileService, this.textFileService, content => {
                    try {
                        this.processGradleDependencies(content.value, javaWorkspaceTags_1.GradleDependencyLooseRegex, tags);
                        this.processGradleDependencies(content.value, javaWorkspaceTags_1.GradleDependencyCompactRegex, tags);
                    }
                    catch (e) {
                        // Ignore errors when resolving gradle dependencies
                    }
                });
                const androidPromises = folders.map(workspaceUri => {
                    const manifest = uri_1.URI.joinPath(workspaceUri, '/app/src/main/AndroidManifest.xml');
                    return this.fileService.exists(manifest).then(result => {
                        if (result) {
                            tags['workspace.java.android'] = true;
                        }
                    }, err => {
                        // Ignore errors when resolving android
                    });
                });
                return Promise.all([...packageJsonPromises, ...requirementsTxtPromises, ...pipfilePromises, ...pomPromises, ...gradlePromises, ...androidPromises, ...goModPromises]).then(() => tags);
            });
        }
        processGradleDependencies(content, regex, tags) {
            let dependencyContent;
            while (dependencyContent = regex.exec(content)) {
                const groupId = dependencyContent[1];
                const artifactId = dependencyContent[2];
                if (groupId && artifactId) {
                    this.tagJavaDependency(groupId, artifactId, 'workspace.gradle.', tags);
                }
            }
        }
        tagJavaDependency(groupId, artifactId, prefix, tags) {
            for (const javaLibrary of javaWorkspaceTags_1.JavaLibrariesToLookFor) {
                if (javaLibrary.predicate(groupId, artifactId)) {
                    tags[prefix + javaLibrary.tag] = true;
                    return;
                }
            }
        }
        searchArray(arr, regEx) {
            return arr.some(v => v.search(regEx) > -1) || undefined;
        }
    };
    exports.WorkspaceTagsService = WorkspaceTagsService;
    exports.WorkspaceTagsService = WorkspaceTagsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, textfiles_1.ITextFileService)
    ], WorkspaceTagsService);
    (0, extensions_1.registerSingleton)(workspaceTags_1.IWorkspaceTagsService, WorkspaceTagsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVGFnc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YWdzL2VsZWN0cm9uLXNhbmRib3gvd29ya3NwYWNlVGFnc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sb0JBQW9CLEdBQUc7UUFDNUIsaUJBQWlCO1FBQ2pCLFFBQVE7UUFDUixXQUFXO1FBQ1gsYUFBYTtRQUNiLGVBQWU7UUFDZixjQUFjO1FBQ2QsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixlQUFlO1FBQ2YsZ0JBQWdCO0tBQ2hCLENBQUM7SUFFRixNQUFNLGdCQUFnQixHQUFHO1FBQ3hCLHNDQUFzQztRQUN0QyxTQUFTO1FBQ1QsT0FBTztRQUNQLEtBQUs7UUFDTCxNQUFNO1FBQ04sV0FBVztRQUNYLFNBQVM7UUFDVCxNQUFNO1FBQ04sTUFBTTtRQUNOLGNBQWM7UUFDZCxRQUFRO1FBQ1IsUUFBUTtRQUNSLGdCQUFnQjtRQUNoQixPQUFPO1FBQ1AsY0FBYztRQUNkLG9CQUFvQjtRQUNwQixzQkFBc0I7UUFDdEIscUJBQXFCO1FBQ3JCLGVBQWU7UUFDZixRQUFRO1FBQ1IsS0FBSztRQUNMLGtCQUFrQjtRQUNsQixvQkFBb0I7UUFDcEIsVUFBVTtRQUNWLDZCQUE2QjtRQUM3QixTQUFTO1FBQ1QsYUFBYTtRQUNiLE9BQU87UUFDUCxlQUFlO1FBQ2YsUUFBUTtRQUNSLE9BQU87UUFDUCxVQUFVO1FBQ1Ysc0JBQXNCO1FBQ3RCLFlBQVk7UUFDWixXQUFXO1FBQ1gsUUFBUTtRQUNSLFFBQVE7UUFDUixVQUFVO1FBQ1YsUUFBUTtRQUNSLGlDQUFpQztRQUNqQyxxQkFBcUI7UUFDckIsc0JBQXNCO1FBQ3RCLDhCQUE4QjtRQUM5QixrQkFB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