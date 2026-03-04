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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/uri", "vs/base/common/process", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, nls, platform_1, contributions_1, platform_2, telemetry_1, storage_1, productService_1, notification_1, opener_1, assignmentService_1, uri_1, process_1, async_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WAIT_TIME_TO_SHOW_SURVEY = 1000 * 60 * 60; // 1 hour
    const MIN_WAIT_TIME_TO_SHOW_SURVEY = 1000 * 60 * 2; // 2 minutes
    const MAX_INSTALL_AGE = 1000 * 60 * 60 * 24; // 24 hours
    const REMIND_LATER_DELAY = 1000 * 60 * 60 * 4; // 4 hours
    const SKIP_SURVEY_KEY = 'ces/skipSurvey';
    const REMIND_LATER_DATE_KEY = 'ces/remindLaterDate';
    let CESContribution = class CESContribution extends lifecycle_1.Disposable {
        constructor(storageService, notificationService, telemetryService, openerService, productService, tasExperimentService) {
            super();
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this.productService = productService;
            this.promptDelayer = this._register(new async_1.ThrottledDelayer(0));
            this.tasExperimentService = tasExperimentService;
            if (!productService.cesSurveyUrl) {
                return;
            }
            const skipSurvey = storageService.get(SKIP_SURVEY_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (skipSurvey) {
                return;
            }
            this.schedulePrompt();
        }
        async promptUser() {
            const isCandidate = await this.tasExperimentService?.getTreatment('CESSurvey');
            if (!isCandidate) {
                this.skipSurvey();
                return;
            }
            const sendTelemetry = (userReaction) => {
                /* __GDPR__
                "cesSurvey:popup" : {
                    "owner": "digitarald",
                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
                */
                this.telemetryService.publicLog('cesSurvey:popup', { userReaction });
            };
            const message = await this.tasExperimentService?.getTreatment('CESSurveyMessage') ?? nls.localize('cesSurveyQuestion', 'Got a moment to help the VS Code team? Please tell us about your experience with VS Code so far.');
            const button = await this.tasExperimentService?.getTreatment('CESSurveyButton') ?? nls.localize('giveFeedback', "Give Feedback");
            const notification = this.notificationService.prompt(notification_1.Severity.Info, message, [{
                    label: button,
                    run: () => {
                        sendTelemetry('accept');
                        let surveyUrl = `${this.productService.cesSurveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(this.productService.version)}&m=${encodeURIComponent(this.telemetryService.machineId)}`;
                        const usedParams = this.productService.surveys
                            ?.filter(surveyData => surveyData.surveyId && surveyData.languageId)
                            // Counts provided by contrib/surveys/browser/languageSurveys
                            .filter(surveyData => this.storageService.getNumber(`${surveyData.surveyId}.editedCount`, -1 /* StorageScope.APPLICATION */, 0) > 0)
                            .map(surveyData => `${encodeURIComponent(surveyData.languageId)}Lang=1`)
                            .join('&');
                        if (usedParams) {
                            surveyUrl += `&${usedParams}`;
                        }
                        this.openerService.open(uri_1.URI.parse(surveyUrl));
                        this.skipSurvey();
                    }
                }, {
                    label: nls.localize('remindLater', "Remind Me Later"),
                    run: () => {
                        sendTelemetry('remindLater');
                        this.storageService.store(REMIND_LATER_DATE_KEY, new Date().toUTCString(), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        this.schedulePrompt();
                    }
                }], {
                sticky: true,
                onCancel: () => {
                    sendTelemetry('cancelled');
                    this.skipSurvey();
                }
            });
            await event_1.Event.toPromise(notification.onDidClose);
        }
        async schedulePrompt() {
            let waitTimeToShowSurvey = 0;
            const remindLaterDate = this.storageService.get(REMIND_LATER_DATE_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (remindLaterDate) {
                const timeToRemind = new Date(remindLaterDate).getTime() + REMIND_LATER_DELAY - Date.now();
                if (timeToRemind > 0) {
                    waitTimeToShowSurvey = timeToRemind;
                }
            }
            else {
                const timeFromInstall = Date.now() - new Date(this.telemetryService.firstSessionDate).getTime();
                const isNewInstall = !isNaN(timeFromInstall) && timeFromInstall < MAX_INSTALL_AGE;
                // Installation is older than MAX_INSTALL_AGE
                if (!isNewInstall) {
                    this.skipSurvey();
                    return;
                }
                if (timeFromInstall < WAIT_TIME_TO_SHOW_SURVEY) {
                    waitTimeToShowSurvey = WAIT_TIME_TO_SHOW_SURVEY - timeFromInstall;
                }
            }
            /* __GDPR__
            "cesSurvey:schedule" : {
                "owner": "digitarald"
            }
            */
            this.telemetryService.publicLog('cesSurvey:schedule');
            this.promptDelayer.trigger(async () => {
                await this.promptUser();
            }, Math.max(waitTimeToShowSurvey, MIN_WAIT_TIME_TO_SHOW_SURVEY));
        }
        skipSurvey() {
            this.storageService.store(SKIP_SURVEY_KEY, this.productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
    };
    CESContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, opener_1.IOpenerService),
        __param(4, productService_1.IProductService),
        __param(5, assignmentService_1.IWorkbenchAssignmentService)
    ], CESContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(CESContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3N1cnZleXMvYnJvd3Nlci9jZXMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLHdCQUF3QixHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsU0FBUztJQUMxRCxNQUFNLDRCQUE0QixHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWTtJQUNoRSxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxXQUFXO0lBQ3hELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVTtJQUN6RCxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQztJQUN6QyxNQUFNLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO0lBRXBELElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7UUFLdkMsWUFDa0IsY0FBZ0QsRUFDM0MsbUJBQTBELEVBQzdELGdCQUFvRCxFQUN2RCxhQUE4QyxFQUM3QyxjQUFnRCxFQUNwQyxvQkFBaUQ7WUFFOUUsS0FBSyxFQUFFLENBQUM7WUFQMEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDNUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN0QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBUjFELGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNB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