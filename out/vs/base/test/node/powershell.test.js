define(["require", "exports", "assert", "fs", "vs/base/common/platform", "vs/base/node/powershell", "vs/base/test/common/utils"], function (require, exports, assert, fs, platform, powershell_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function checkPath(exePath) {
        // Check to see if the path exists
        let pathCheckResult = false;
        try {
            const stat = fs.statSync(exePath);
            pathCheckResult = stat.isFile();
        }
        catch {
            // fs.exists throws on Windows with SymbolicLinks so we
            // also use lstat to try and see if the file exists.
            try {
                pathCheckResult = fs.statSync(fs.readlinkSync(exePath)).isFile();
            }
            catch {
            }
        }
        assert.strictEqual(pathCheckResult, true);
    }
    if (platform.isWindows) {
        suite('PowerShell finder', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            test('Can find first available PowerShell', async () => {
                const pwshExe = await (0, powershell_1.getFirstAvailablePowerShellInstallation)();
                const exePath = pwshExe?.exePath;
                assert.notStrictEqual(exePath, null);
                assert.notStrictEqual(pwshExe?.displayName, null);
                checkPath(exePath);
            });
            test('Can enumerate PowerShells', async () => {
                const pwshs = new Array();
                for await (const p of (0, powershell_1.enumeratePowerShellInstallations)()) {
                    pwshs.push(p);
                }
                const powershellLog = 'Found these PowerShells:\n' + pwshs.map(p => `${p.displayName}: ${p.exePath}`).join('\n');
                assert.strictEqual(pwshs.length >= 1, true, powershellLog);
                for (const pwsh of pwshs) {
                    checkPath(pwsh.exePath);
                }
                // The last one should always be Windows PowerShell.
                assert.strictEqual(pwshs[pwshs.length - 1].displayName, 'Windows PowerShell', powershellLog);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG93ZXJzaGVsbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvcG93ZXJzaGVsbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVVBLFNBQVMsU0FBUyxDQUFDLE9BQWU7UUFDakMsa0NBQWtDO1FBQ2xDLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QixJQUFJLENBQUM7WUFDSixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakMsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNSLHVEQUF1RDtZQUN2RCxvREFBb0Q7WUFDcEQsSUFBSSxDQUFDO2dCQUNKLGVBQWUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsRSxDQUFDO1lBQUMsTUFBTSxDQUFDO1lBRVQsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDeEIsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUMvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN0RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsb0RBQXVDLEdBQUUsQ0FBQztnQkFDaEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxFQUFFLE9BQU8sQ0FBQztnQkFDakMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbEQsU0FBUyxDQUFDLE9BQVEsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM1QyxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBeUIsQ0FBQztnQkFDakQsSUFBSSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBQSw2Q0FBZ0MsR0FBRSxFQUFFLENBQUM7b0JBQzFELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQztnQkFFRCxNQUFNLGFBQWEsR0FBRyw0QkFBNEIsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRTNELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQzFCLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsb0RBQW9EO2dCQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUM5RixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9