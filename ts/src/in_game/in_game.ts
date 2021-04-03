import { OWGamesEvents, OWHotkeys } from "@overwolf/overwolf-api-ts";
import { AppWindow } from "../AppWindow";
import { hotkeys, windowNames } from "../consts";
import WindowState = overwolf.windows.WindowStateEx;

const HOOKS_REF = ["00", "I 0", "I   I", "-   -"];

// The window displayed in-game while a DBD game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _dbdGameEventsListener: OWGamesEvents;
  private _hooks: number[];

  private constructor() {
    super(windowNames.inGame);

    this.setToggleHotkeyBehavior();

    this._hooks = [0, 0, 0, 0];

    overwolf.settings.hotkeys.onPressed.addListener((info) => {
      const isHook = info.name.startsWith("hook_");
      const isUnhook = info.name.startsWith("unhook_");
      if (!(isHook || isUnhook)) return;

      const pos = parseInt(info.name.slice(-1)) - 1;

      this._hooks[pos] = Math.max(Math.min(this._hooks[pos] + (isHook ? 1 : -1), 3), 0);

      const hookElem = document.getElementById(`hook_${pos + 1}`);
      hookElem.innerHTML = HOOKS_REF[this._hooks[pos]];
    });
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public run() {
    this._dbdGameEventsListener.start();
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (
      hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent
    ): Promise<void> => {
      console.log(`pressed hotkey for ${hotkeyResult.name}`);
      const inGameState = await this.getWindowState();

      if (
        inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED
      ) {
        this.currWindow.minimize();
      } else if (
        inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED
      ) {
        this.currWindow.restore();
      }
    };

    OWHotkeys.onHotkeyDown(hotkeys.toggle, toggleInGameWindow);
  }
}

InGame.instance().run();
