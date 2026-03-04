/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/platform", "vs/code/electron-sandbox/issue/issueReporterPage", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/ipc/common/mainProcessService", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/issue/common/issue", "vs/platform/native/common/native", "vs/platform/native/common/nativeHostService", "./issueReporterService", "vs/base/browser/window", "vs/base/browser/ui/codicons/codiconStyles", "vs/css!./media/issueReporter"], function (require, exports, dom_1, platform_1, issueReporterPage_1, descriptors_1, extensions_1, instantiationService_1, serviceCollection_1, mainProcessService_1, mainProcessService_2, services_1, issue_1, native_1, nativeHostService_1, issueReporterService_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startup = startup;
    function startup(configuration) {
        const platformClass = platform_1.isWindows ? 'windows' : platform_1.isLinux ? 'linux' : 'mac';
        window_1.mainWindow.document.body.classList.add(platformClass); // used by our fonts
        (0, dom_1.safeInnerHtml)(window_1.mainWindow.document.body, (0, issueReporterPage_1.default)());
        const instantiationService = initServices(configuration.windowId);
        const issueReporter = instantiationService.createInstance(issueReporterService_1.IssueReporter, configuration);
        issueReporter.render();
        window_1.mainWindow.document.body.style.display = 'block';
        issueReporter.setInitialFocus();
    }
    function initServices(windowId) {
        const services = new serviceCollection_1.ServiceCollection();
        const contributedServices = (0, extensions_1.getSingletonServiceDescriptors)();
        for (const [id, descriptor] of contributedServices) {
            services.set(id, descriptor);
        }
        services.set(mainProcessService_1.IMainProcessService, new descriptors_1.SyncDescriptor(mainProcessService_2.ElectronIPCMainProcessService, [windowId]));
        services.set(native_1.INativeHostService, new descriptors_1.SyncDescriptor(nativeHostService_1.NativeHostService, [windowId]));
        return new instantiationService_1.InstantiationService(services, true);
    }
    (0, services_1.registerMainProcessRemoteService)(issue_1.IIssueMainService, 'issue');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVSZXBvcnRlck1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL2VsZWN0cm9uLXNhbmRib3gvaXNzdWUvaXNzdWVSZXBvcnRlck1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLDBCQVlDO0lBWkQsU0FBZ0IsT0FBTyxDQUFDLGFBQStDO1FBQ3RFLE1BQU0sYUFBYSxHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDeEUsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7UUFFM0UsSUFBQSxtQkFBYSxFQUFDLG1CQUFVLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFBLDJCQUFRLEdBQUUsQ0FBQyxDQUFDO1FBRXBELE1BQU0sb0JBQW9CLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRSxNQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0NBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RixhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ2pELGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUMsUUFBZ0I7UUFDckMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1FBRXpDLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSwyQ0FBOEIsR0FBRSxDQUFDO1FBQzdELEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3BELFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixFQUFFLElBQUksNEJBQWMsQ0FBQyxrREFBNkIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFrQixFQUFFLElBQUksNEJBQWMsQ0FBQyxxQ0FBaUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwRixPQUFPLElBQUksMkNBQW9CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxJQUFBLDJDQUFnQyxFQUFDLHlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDIn0=