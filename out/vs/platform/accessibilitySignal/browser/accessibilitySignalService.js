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
define(["require", "exports", "vs/base/common/cache", "vs/base/common/equals", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry"], function (require, exports, cache_1, equals_1, lifecycle_1, network_1, observable_1, utils_1, nls_1, accessibility_1, configuration_1, instantiation_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilitySignal = exports.AccessibilityAlertSettingId = exports.SoundSource = exports.Sound = exports.AccessibilitySignalService = exports.AcknowledgeDocCommentsToken = exports.IAccessibilitySignalService = void 0;
    exports.observableConfigValue = observableConfigValue;
    exports.IAccessibilitySignalService = (0, instantiation_1.createDecorator)('accessibilitySignalService');
    /** Make sure you understand the doc comments of the method you want to call when using this token! */
    exports.AcknowledgeDocCommentsToken = Symbol('AcknowledgeDocCommentsToken');
    let AccessibilitySignalService = class AccessibilitySignalService extends lifecycle_1.Disposable {
        constructor(configurationService, accessibilityService, telemetryService) {
            super();
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.telemetryService = telemetryService;
            this.sounds = new Map();
            this.screenReaderAttached = (0, observable_1.observableFromEvent)(this.accessibilityService.onDidChangeScreenReaderOptimized, () => /** @description accessibilityService.onDidChangeScreenReaderOptimized */ this.accessibilityService.isScreenReaderOptimized());
            this.sentTelemetry = new Set();
            this.playingSounds = new Set();
            this._signalConfigValue = new cache_1.CachedFunction((signal) => observableConfigValue(signal.settingsKey, this.configurationService));
            this._signalEnabledState = new cache_1.CachedFunction({ getCacheKey: equals_1.getStructuralKey }, (arg) => {
                return (0, observable_1.derived)(reader => {
                    /** @description sound enabled */
                    const setting = this._signalConfigValue.get(arg.signal).read(reader);
                    if (arg.modality === 'sound' || arg.modality === undefined) {
                        if (checkEnabledState(setting.sound, () => this.screenReaderAttached.read(reader), arg.userGesture)) {
                            return true;
                        }
                    }
                    if (arg.modality === 'announcement' || arg.modality === undefined) {
                        if (checkEnabledState(setting.announcement, () => this.screenReaderAttached.read(reader), arg.userGesture)) {
                            return true;
                        }
                    }
                    return false;
                }).recomputeInitiallyAndOnChange(this._store);
            });
        }
        getEnabledState(signal, userGesture, modality) {
            return new utils_1.ValueWithChangeEventFromObservable(this._signalEnabledState.get({ signal, userGesture, modality }));
        }
        async playSignal(signal, options = {}) {
            const shouldPlayAnnouncement = options.modality === 'announcement' || options.modality === undefined;
            const announcementMessage = signal.announcementMessage;
            if (shouldPlayAnnouncement && this.isAnnouncementEnabled(signal, options.userGesture) && announcementMessage) {
                this.accessibilityService.status(announcementMessage);
            }
            const shouldPlaySound = options.modality === 'sound' || options.modality === undefined;
            if (shouldPlaySound && this.isSoundEnabled(signal, options.userGesture)) {
                this.sendSignalTelemetry(signal, options.source);
                await this.playSound(signal.sound.getSound(), options.allowManyInParallel);
            }
        }
        async playSignals(signals) {
            for (const signal of signals) {
                this.sendSignalTelemetry('signal' in signal ? signal.signal : signal, 'source' in signal ? signal.source : undefined);
            }
            const signalArray = signals.map(s => 'signal' in s ? s.signal : s);
            const announcements = signalArray.filter(signal => this.isAnnouncementEnabled(signal)).map(s => s.announcementMessage);
            if (announcements.length) {
                this.accessibilityService.status(announcements.join(', '));
            }
            // Some sounds are reused. Don't play the same sound twice.
            const sounds = new Set(signalArray.filter(signal => this.isSoundEnabled(signal)).map(signal => signal.sound.getSound()));
            await Promise.all(Array.from(sounds).map(sound => this.playSound(sound, true)));
        }
        sendSignalTelemetry(signal, source) {
            const isScreenReaderOptimized = this.accessibilityService.isScreenReaderOptimized();
            const key = signal.name + (source ? `::${source}` : '') + (isScreenReaderOptimized ? '{screenReaderOptimized}' : '');
            // Only send once per user session
            if (this.sentTelemetry.has(key) || this.getVolumeInPercent() === 0) {
                return;
            }
            this.sentTelemetry.add(key);
            this.telemetryService.publicLog2('signal.played', {
                signal: signal.name,
                source: source ?? '',
                isScreenReaderOptimized,
            });
        }
        getVolumeInPercent() {
            const volume = this.configurationService.getValue('accessibilitySignals.volume');
            if (typeof volume !== 'number') {
                return 50;
            }
            return Math.max(Math.min(volume, 100), 0);
        }
        async playSound(sound, allowManyInParallel = false) {
            if (!allowManyInParallel && this.playingSounds.has(sound)) {
                return;
            }
            this.playingSounds.add(sound);
            const url = network_1.FileAccess.asBrowserUri(`vs/platform/accessibilitySignal/browser/media/${sound.fileName}`).toString(true);
            try {
                const sound = this.sounds.get(url);
                if (sound) {
                    sound.volume = this.getVolumeInPercent() / 100;
                    sound.currentTime = 0;
                    await sound.play();
                }
                else {
                    const playedSound = await playAudio(url, this.getVolumeInPercent() / 100);
                    this.sounds.set(url, playedSound);
                }
            }
            catch (e) {
                if (!e.message.includes('play() can only be initiated by a user gesture')) {
                    // tracking this issue in #178642, no need to spam the console
                    console.error('Error while playing sound', e);
                }
            }
            finally {
                this.playingSounds.delete(sound);
            }
        }
        playSignalLoop(signal, milliseconds) {
            let playing = true;
            const playSound = () => {
                if (playing) {
                    this.playSignal(signal, { allowManyInParallel: true }).finally(() => {
                        setTimeout(() => {
                            if (playing) {
                                playSound();
                            }
                        }, milliseconds);
                    });
                }
            };
            playSound();
            return (0, lifecycle_1.toDisposable)(() => playing = false);
        }
        isAnnouncementEnabled(signal, userGesture) {
            if (!signal.announcementMessage) {
                return false;
            }
            return this._signalEnabledState.get({ signal, userGesture: !!userGesture, modality: 'announcement' }).get();
        }
        isSoundEnabled(signal, userGesture) {
            return this._signalEnabledState.get({ signal, userGesture: !!userGesture, modality: 'sound' }).get();
        }
        onSoundEnabledChanged(signal) {
            return this.getEnabledState(signal, false).onDidChange;
        }
    };
    exports.AccessibilitySignalService = AccessibilitySignalService;
    exports.AccessibilitySignalService = AccessibilitySignalService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, telemetry_1.ITelemetryService)
    ], AccessibilitySignalService);
    function checkEnabledState(state, getScreenReaderAttached, isTriggeredByUserGesture) {
        return state === 'on' || state === 'always' || (state === 'auto' && getScreenReaderAttached()) || state === 'userGesture' && isTriggeredByUserGesture;
    }
    /**
     * Play the given audio url.
     * @volume value between 0 and 1
     */
    function playAudio(url, volume) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.volume = volume;
            audio.addEventListener('ended', () => {
                resolve(audio);
            });
            audio.addEventListener('error', (e) => {
                // When the error event fires, ended might not be called
                reject(e.error);
            });
            audio.play().catch(e => {
                // When play fails, the error event is not fired.
                reject(e);
            });
        });
    }
    /**
     * Corresponds to the audio files in ./media.
    */
    class Sound {
        static register(options) {
            const sound = new Sound(options.fileName);
            return sound;
        }
        static { this.error = Sound.register({ fileName: 'error.mp3' }); }
        static { this.warning = Sound.register({ fileName: 'warning.mp3' }); }
        static { this.foldedArea = Sound.register({ fileName: 'foldedAreas.mp3' }); }
        static { this.break = Sound.register({ fileName: 'break.mp3' }); }
        static { this.quickFixes = Sound.register({ fileName: 'quickFixes.mp3' }); }
        static { this.taskCompleted = Sound.register({ fileName: 'taskCompleted.mp3' }); }
        static { this.taskFailed = Sound.register({ fileName: 'taskFailed.mp3' }); }
        static { this.terminalBell = Sound.register({ fileName: 'terminalBell.mp3' }); }
        static { this.diffLineInserted = Sound.register({ fileName: 'diffLineInserted.mp3' }); }
        static { this.diffLineDeleted = Sound.register({ fileName: 'diffLineDeleted.mp3' }); }
        static { this.diffLineModified = Sound.register({ fileName: 'diffLineModified.mp3' }); }
        static { this.chatRequestSent = Sound.register({ fileName: 'chatRequestSent.mp3' }); }
        static { this.chatResponseReceived1 = Sound.register({ fileName: 'chatResponseReceived1.mp3' }); }
        static { this.chatResponseReceived2 = Sound.register({ fileName: 'chatResponseReceived2.mp3' }); }
        static { this.chatResponseReceived3 = Sound.register({ fileName: 'chatResponseReceived3.mp3' }); }
        static { this.chatResponseReceived4 = Sound.register({ fileName: 'chatResponseReceived4.mp3' }); }
        static { this.clear = Sound.register({ fileName: 'clear.mp3' }); }
        static { this.save = Sound.register({ fileName: 'save.mp3' }); }
        static { this.format = Sound.register({ fileName: 'format.mp3' }); }
        static { this.voiceRecordingStarted = Sound.register({ fileName: 'voiceRecordingStarted.mp3' }); }
        static { this.voiceRecordingStopped = Sound.register({ fileName: 'voiceRecordingStopped.mp3' }); }
        static { this.progress = Sound.register({ fileName: 'progress.mp3' }); }
        constructor(fileName) {
            this.fileName = fileName;
        }
    }
    exports.Sound = Sound;
    class SoundSource {
        constructor(randomOneOf) {
            this.randomOneOf = randomOneOf;
        }
        getSound(deterministic = false) {
            if (deterministic || this.randomOneOf.length === 1) {
                return this.randomOneOf[0];
            }
            else {
                const index = Math.floor(Math.random() * this.randomOneOf.length);
                return this.randomOneOf[index];
            }
        }
    }
    exports.SoundSource = SoundSource;
    var AccessibilityAlertSettingId;
    (function (AccessibilityAlertSettingId) {
        AccessibilityAlertSettingId["Save"] = "accessibility.alert.save";
        AccessibilityAlertSettingId["Format"] = "accessibility.alert.format";
        AccessibilityAlertSettingId["Clear"] = "accessibility.alert.clear";
        AccessibilityAlertSettingId["Breakpoint"] = "accessibility.alert.breakpoint";
        AccessibilityAlertSettingId["Error"] = "accessibility.alert.error";
        AccessibilityAlertSettingId["Warning"] = "accessibility.alert.warning";
        AccessibilityAlertSettingId["FoldedArea"] = "accessibility.alert.foldedArea";
        AccessibilityAlertSettingId["TerminalQuickFix"] = "accessibility.alert.terminalQuickFix";
        AccessibilityAlertSettingId["TerminalBell"] = "accessibility.alert.terminalBell";
        AccessibilityAlertSettingId["TerminalCommandFailed"] = "accessibility.alert.terminalCommandFailed";
        AccessibilityAlertSettingId["TaskCompleted"] = "accessibility.alert.taskCompleted";
        AccessibilityAlertSettingId["TaskFailed"] = "accessibility.alert.taskFailed";
        AccessibilityAlertSettingId["ChatRequestSent"] = "accessibility.alert.chatRequestSent";
        AccessibilityAlertSettingId["NotebookCellCompleted"] = "accessibility.alert.notebookCellCompleted";
        AccessibilityAlertSettingId["NotebookCellFailed"] = "accessibility.alert.notebookCellFailed";
        AccessibilityAlertSettingId["OnDebugBreak"] = "accessibility.alert.onDebugBreak";
        AccessibilityAlertSettingId["NoInlayHints"] = "accessibility.alert.noInlayHints";
        AccessibilityAlertSettingId["LineHasBreakpoint"] = "accessibility.alert.lineHasBreakpoint";
        AccessibilityAlertSettingId["Progress"] = "accessibility.alert.chatResponseProgress";
    })(AccessibilityAlertSettingId || (exports.AccessibilityAlertSettingId = AccessibilityAlertSettingId = {}));
    class AccessibilitySignal {
        constructor(sound, name, legacySoundSettingsKey, settingsKey, legacyAnnouncementSettingsKey, announcementMessage) {
            this.sound = sound;
            this.name = name;
            this.legacySoundSettingsKey = legacySoundSettingsKey;
            this.settingsKey = settingsKey;
            this.legacyAnnouncementSettingsKey = legacyAnnouncementSettingsKey;
            this.announcementMessage = announcementMessage;
        }
        static { this._signals = new Set(); }
        static register(options) {
            const soundSource = new SoundSource('randomOneOf' in options.sound ? options.sound.randomOneOf : [options.sound]);
            const signal = new AccessibilitySignal(soundSource, options.name, options.legacySoundSettingsKey, options.settingsKey, options.legacyAnnouncementSettingsKey, options.announcementMessage);
            AccessibilitySignal._signals.add(signal);
            return signal;
        }
        static get allAccessibilitySignals() {
            return [...this._signals];
        }
        static { this.errorAtPosition = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.positionHasError.name', 'Error at Position'),
            sound: Sound.error,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.positionHasError', 'Error'),
            settingsKey: 'accessibility.signals.positionHasError',
        }); }
        static { this.warningAtPosition = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.positionHasWarning.name', 'Warning at Position'),
            sound: Sound.warning,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.positionHasWarning', 'Warning'),
            settingsKey: 'accessibility.signals.positionHasWarning',
        }); }
        static { this.errorOnLine = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasError.name', 'Error on Line'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.lineHasError',
            legacyAnnouncementSettingsKey: "accessibility.alert.error" /* AccessibilityAlertSettingId.Error */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasError', 'Error on Line'),
            settingsKey: 'accessibility.signals.lineHasError',
        }); }
        static { this.warningOnLine = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasWarning.name', 'Warning on Line'),
            sound: Sound.warning,
            legacySoundSettingsKey: 'audioCues.lineHasWarning',
            legacyAnnouncementSettingsKey: "accessibility.alert.warning" /* AccessibilityAlertSettingId.Warning */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasWarning', 'Warning on Line'),
            settingsKey: 'accessibility.signals.lineHasWarning',
        }); }
        static { this.foldedArea = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasFoldedArea.name', 'Folded Area on Line'),
            sound: Sound.foldedArea,
            legacySoundSettingsKey: 'audioCues.lineHasFoldedArea',
            legacyAnnouncementSettingsKey: "accessibility.alert.foldedArea" /* AccessibilityAlertSettingId.FoldedArea */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea', 'Folded'),
            settingsKey: 'accessibility.signals.lineHasFoldedArea',
        }); }
        static { this.break = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasBreakpoint.name', 'Breakpoint on Line'),
            sound: Sound.break,
            legacySoundSettingsKey: 'audioCues.lineHasBreakpoint',
            legacyAnnouncementSettingsKey: "accessibility.alert.breakpoint" /* AccessibilityAlertSettingId.Breakpoint */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint', 'Breakpoint'),
            settingsKey: 'accessibility.signals.lineHasBreakpoint',
        }); }
        static { this.inlineSuggestion = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasInlineSuggestion.name', 'Inline Suggestion on Line'),
            sound: Sound.quickFixes,
            legacySoundSettingsKey: 'audioCues.lineHasInlineSuggestion',
            settingsKey: 'accessibility.signals.lineHasInlineSuggestion',
        }); }
        static { this.terminalQuickFix = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalQuickFix.name', 'Terminal Quick Fix'),
            sound: Sound.quickFixes,
            legacySoundSettingsKey: 'audioCues.terminalQuickFix',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalQuickFix" /* AccessibilityAlertSettingId.TerminalQuickFix */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalQuickFix', 'Quick Fix'),
            settingsKey: 'accessibility.signals.terminalQuickFix',
        }); }
        static { this.onDebugBreak = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.onDebugBreak.name', 'Debugger Stopped on Breakpoint'),
            sound: Sound.break,
            legacySoundSettingsKey: 'audioCues.onDebugBreak',
            legacyAnnouncementSettingsKey: "accessibility.alert.onDebugBreak" /* AccessibilityAlertSettingId.OnDebugBreak */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.onDebugBreak', 'Breakpoint'),
            settingsKey: 'accessibility.signals.onDebugBreak',
        }); }
        static { this.noInlayHints = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.noInlayHints', 'No Inlay Hints on Line'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.noInlayHints',
            legacyAnnouncementSettingsKey: "accessibility.alert.noInlayHints" /* AccessibilityAlertSettingId.NoInlayHints */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.noInlayHints', 'No Inlay Hints'),
            settingsKey: 'accessibility.signals.noInlayHints',
        }); }
        static { this.taskCompleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.taskCompleted', 'Task Completed'),
            sound: Sound.taskCompleted,
            legacySoundSettingsKey: 'audioCues.taskCompleted',
            legacyAnnouncementSettingsKey: "accessibility.alert.taskCompleted" /* AccessibilityAlertSettingId.TaskCompleted */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.taskCompleted', 'Task Completed'),
            settingsKey: 'accessibility.signals.taskCompleted',
        }); }
        static { this.taskFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.taskFailed', 'Task Failed'),
            sound: Sound.taskFailed,
            legacySoundSettingsKey: 'audioCues.taskFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.taskFailed" /* AccessibilityAlertSettingId.TaskFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.taskFailed', 'Task Failed'),
            settingsKey: 'accessibility.signals.taskFailed',
        }); }
        static { this.terminalCommandFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalCommandFailed', 'Terminal Command Failed'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.terminalCommandFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalCommandFailed" /* AccessibilityAlertSettingId.TerminalCommandFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalCommandFailed', 'Command Failed'),
            settingsKey: 'accessibility.signals.terminalCommandFailed',
        }); }
        static { this.terminalBell = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalBell', 'Terminal Bell'),
            sound: Sound.terminalBell,
            legacySoundSettingsKey: 'audioCues.terminalBell',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalBell" /* AccessibilityAlertSettingId.TerminalBell */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalBell', 'Terminal Bell'),
            settingsKey: 'accessibility.signals.terminalBell',
        }); }
        static { this.notebookCellCompleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.notebookCellCompleted', 'Notebook Cell Completed'),
            sound: Sound.taskCompleted,
            legacySoundSettingsKey: 'audioCues.notebookCellCompleted',
            legacyAnnouncementSettingsKey: "accessibility.alert.notebookCellCompleted" /* AccessibilityAlertSettingId.NotebookCellCompleted */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.notebookCellCompleted', 'Notebook Cell Completed'),
            settingsKey: 'accessibility.signals.notebookCellCompleted',
        }); }
        static { this.notebookCellFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.notebookCellFailed', 'Notebook Cell Failed'),
            sound: Sound.taskFailed,
            legacySoundSettingsKey: 'audioCues.notebookCellFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.notebookCellFailed" /* AccessibilityAlertSettingId.NotebookCellFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.notebookCellFailed', 'Notebook Cell Failed'),
            settingsKey: 'accessibility.signals.notebookCellFailed',
        }); }
        static { this.diffLineInserted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineInserted', 'Diff Line Inserted'),
            sound: Sound.diffLineInserted,
            legacySoundSettingsKey: 'audioCues.diffLineInserted',
            settingsKey: 'accessibility.signals.diffLineInserted',
        }); }
        static { this.diffLineDeleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineDeleted', 'Diff Line Deleted'),
            sound: Sound.diffLineDeleted,
            legacySoundSettingsKey: 'audioCues.diffLineDeleted',
            settingsKey: 'accessibility.signals.diffLineDeleted',
        }); }
        static { this.diffLineModified = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineModified', 'Diff Line Modified'),
            sound: Sound.diffLineModified,
            legacySoundSettingsKey: 'audioCues.diffLineModified',
            settingsKey: 'accessibility.signals.diffLineModified',
        }); }
        static { this.chatRequestSent = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.chatRequestSent', 'Chat Request Sent'),
            sound: Sound.chatRequestSent,
            legacySoundSettingsKey: 'audioCues.chatRequestSent',
            legacyAnnouncementSettingsKey: "accessibility.alert.chatRequestSent" /* AccessibilityAlertSettingId.ChatRequestSent */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.chatRequestSent', 'Chat Request Sent'),
            settingsKey: 'accessibility.signals.chatRequestSent',
        }); }
        static { this.chatResponseReceived = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.chatResponseReceived', 'Chat Response Received'),
            legacySoundSettingsKey: 'audioCues.chatResponseReceived',
            sound: {
                randomOneOf: [
                    Sound.chatResponseReceived1,
                    Sound.chatResponseReceived2,
                    Sound.chatResponseReceived3,
                    Sound.chatResponseReceived4
                ]
            },
            settingsKey: 'accessibility.signals.chatResponseReceived'
        }); }
        static { this.progress = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.progress', 'Progress'),
            sound: Sound.progress,
            legacySoundSettingsKey: 'audioCues.chatResponsePending',
            legacyAnnouncementSettingsKey: "accessibility.alert.chatResponseProgress" /* AccessibilityAlertSettingId.Progress */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.progress', 'Progress'),
            settingsKey: 'accessibility.signals.progress'
        }); }
        static { this.clear = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.clear', 'Clear'),
            sound: Sound.clear,
            legacySoundSettingsKey: 'audioCues.clear',
            legacyAnnouncementSettingsKey: "accessibility.alert.clear" /* AccessibilityAlertSettingId.Clear */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.clear', 'Clear'),
            settingsKey: 'accessibility.signals.clear'
        }); }
        static { this.save = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.save', 'Save'),
            sound: Sound.save,
            legacySoundSettingsKey: 'audioCues.save',
            legacyAnnouncementSettingsKey: "accessibility.alert.save" /* AccessibilityAlertSettingId.Save */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.save', 'Save'),
            settingsKey: 'accessibility.signals.save'
        }); }
        static { this.format = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.format', 'Format'),
            sound: Sound.format,
            legacySoundSettingsKey: 'audioCues.format',
            legacyAnnouncementSettingsKey: "accessibility.alert.format" /* AccessibilityAlertSettingId.Format */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.format', 'Format'),
            settingsKey: 'accessibility.signals.format'
        }); }
        static { this.voiceRecordingStarted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.voiceRecordingStarted', 'Voice Recording Started'),
            sound: Sound.voiceRecordingStarted,
            legacySoundSettingsKey: 'audioCues.voiceRecordingStarted',
            settingsKey: 'accessibility.signals.voiceRecordingStarted'
        }); }
        static { this.voiceRecordingStopped = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.voiceRecordingStopped', 'Voice Recording Stopped'),
            sound: Sound.voiceRecordingStopped,
            legacySoundSettingsKey: 'audioCues.voiceRecordingStopped',
            settingsKey: 'accessibility.signals.voiceRecordingStopped'
        }); }
    }
    exports.AccessibilitySignal = AccessibilitySignal;
    function observableConfigValue(key, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY2Nlc3NpYmlsaXR5U2lnbmFsL2Jyb3dzZXIvYWNjZXNzaWJpbGl0eVNpZ25hbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbW1CaEcsc0RBU0M7SUE3bEJZLFFBQUEsMkJBQTJCLEdBQUcsSUFBQSwrQkFBZSxFQUE4Qiw0QkFBNEIsQ0FBQyxDQUFDO0lBd0J0SCxzR0FBc0c7SUFDekYsUUFBQSwyQkFBMkIsR0FBRyxNQUFNLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQXNCMUUsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxzQkFBVTtRQVN6RCxZQUN3QixvQkFBNEQsRUFDNUQsb0JBQTRELEVBQ2hFLGdCQUFvRDtZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUpnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVZ2RCxXQUFNLEdBQWtDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDbEQseUJBQW9CLEdBQUcsSUFBQSxnQ0FBbUIsRUFDMUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGdDQUFnQyxFQUMxRCxHQUFHLEVBQUUsQ0FBQyx5RUFBeUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLEVBQUUsQ0FDbkksQ0FBQztZQUNlLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQWtGbEMsa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBUyxDQUFDO1lBOENqQyx1QkFBa0IsR0FBRyxJQUFJLHNCQUFjLENBQUMsQ0FB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