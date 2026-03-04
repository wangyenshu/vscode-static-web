define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/base/common/async", "vs/editor/common/editorContextKeys", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/chat/electron-sandbox/actions/voiceChatActions", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/speech/common/speechService", "vs/nls", "vs/platform/configuration/common/configuration"], function (require, exports, contextkey_1, inlineChatActions_1, async_1, editorContextKeys_1, commands_1, keybinding_1, voiceChatActions_1, inlineChat_1, speechService_1, nls_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoldToSpeak = void 0;
    class HoldToSpeak extends inlineChatActions_1.AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.holdForSpeech',
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, inlineChat_1.CTX_INLINE_CHAT_VISIBLE),
                title: (0, nls_1.localize2)('holdForSpeech', "Hold for Speech"),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                },
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            holdForSpeech(accessor, ctrl, this);
        }
    }
    exports.HoldToSpeak = HoldToSpeak;
    function holdForSpeech(accessor, ctrl, action) {
        const configService = accessor.get(configuration_1.IConfigurationService);
        const speechService = accessor.get(speechService_1.ISpeechService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const commandService = accessor.get(commands_1.ICommandService);
        // enabled or possible?
        if (!configService.getValue("inlineChat.holdToSpeech" /* InlineChatConfigKeys.HoldToSpeech */ || !speechService.hasSpeechProvider)) {
            return;
        }
        const holdMode = keybindingService.enableKeybindingHoldMode(action.desc.id);
        if (!holdMode) {
            return;
        }
        let listening = false;
        const handle = (0, async_1.disposableTimeout)(() => {
            // start VOICE input
            commandService.executeCommand(voiceChatActions_1.StartVoiceChatAction.ID, { voice: { disableTimeout: true } });
            listening = true;
        }, voiceChatActions_1.VOICE_KEY_HOLD_THRESHOLD);
        holdMode.finally(() => {
            if (listening) {
                commandService.executeCommand(voiceChatActions_1.StopListeningAction.ID).finally(() => {
                    ctrl.acceptInput();
                });
            }
            handle.dispose();
        });
    }
    // make this accessible to the chat actions from the browser layer
    (0, inlineChatActions_1.setHoldForSpeech)(holdForSpeech);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2VsZWN0cm9uLXNhbmRib3gvaW5saW5lQ2hhdEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQXVCQSxNQUFhLFdBQVksU0FBUSw0Q0FBd0I7UUFFeEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDBCQUEwQjtnQkFDOUIsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlDQUFpQixFQUFFLG9DQUF1QixDQUFDO2dCQUM1RSxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDO2dCQUNwRCxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLHFDQUFpQixDQUFDLGNBQWM7b0JBQ3RDLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsaURBQTZCO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxvQkFBb0IsQ0FBQyxRQUEwQixFQUFFLElBQTBCLEVBQUUsTUFBbUIsRUFBRSxHQUFHLElBQVc7WUFDeEgsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNEO0lBbEJELGtDQWtCQztJQUVELFNBQVMsYUFBYSxDQUFDLFFBQTBCLEVBQUUsSUFBMEIsRUFBRSxNQUFlO1FBRTdGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztRQUMxRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztRQUNuRCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztRQUMzRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztRQUVyRCx1QkFBdUI7UUFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQVUscUVBQXFDLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztZQUM3RyxPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2YsT0FBTztRQUNSLENBQUM7UUFDRCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdEIsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxHQUFHLEVBQUU7WUFDckMsb0JBQW9CO1lBQ3BCLGNBQWMsQ0FBQyxjQUFjLENBQUMsdUNBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxFQUFzQyxDQUFDLENBQUM7WUFDaEksU0FBUyxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDLEVBQUUsMkNBQXdCLENBQUMsQ0FBQztRQUU3QixRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNyQixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLGNBQWMsQ0FBQyxjQUFjLENBQUMsc0NBQW1CLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDbEUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsa0VBQWtFO0lBQ2xFLElBQUEsb0NBQWdCLEVBQUMsYUFBYSxDQUFDLENBQUMifQ==