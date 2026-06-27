import { spawn } from 'child_process';

export class KeystrokeService {
  /**
   * Simulates a Copy command (Ctrl+C / Cmd+C) based on the operating system.
   */
  static simulateCopy(): Promise<boolean> {
    return this.executeShortcut('copy');
  }

  /**
   * Simulates a Paste command (Ctrl+V / Cmd+V) based on the operating system.
   */
  static simulatePaste(): Promise<boolean> {
    return this.executeShortcut('paste');
  }

  private static executeShortcut(action: 'copy' | 'paste'): Promise<boolean> {
    return new Promise((resolve) => {
      const platform = process.platform;
      let cmd = '';
      let args: string[] = [];

      if (platform === 'win32') {
        const key = action === 'copy' ? '^c' : '^v';
        // Simulates SendKeys in a hidden PowerShell context
        cmd = 'powershell';
        args = [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${key}')`
        ];
      } else if (platform === 'darwin') {
        const key = action === 'copy' ? 'c' : 'v';
        // AppleScript keystroke
        cmd = 'osascript';
        args = ['-e', `tell application "System Events" to keystroke "${key}" using command down`];
      } else if (platform === 'linux') {
        const key = action === 'copy' ? 'ctrl+c' : 'ctrl+v';
        // Requires xdotool
        cmd = 'xdotool';
        args = ['key', key];
      } else {
        return resolve(false);
      }

      const proc = spawn(cmd, args);
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  }
}
