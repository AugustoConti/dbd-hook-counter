import { OWGameListener, OWGames, OWWindow } from "@overwolf/overwolf-api-ts";
import { dbdClassId, windowNames } from "../consts";
import RunningGameInfo = overwolf.games.RunningGameInfo;

// The background controller holds all of the app's background logic - hence its name. it has
// many possible use cases, for example sharing data between windows, or, in our case,
// managing which window is currently presented to the user. To that end, it holds a dictionary
// of the windows available in the app.
// Our background controller implements the Singleton design pattern, since only one
// instance of it should exist.
class BackgroundController {
  private static _instance: BackgroundController;
  private _windows = {};
  private _dbdGameListener: OWGameListener;

  private constructor() {
    // Populating the background controller's window dictionary
    this._windows[windowNames.desktop] = new OWWindow(windowNames.desktop);
    this._windows[windowNames.inGame] = new OWWindow(windowNames.inGame);

    // When a DBD game is started or is ended, toggle the app's windows
    this._dbdGameListener = new OWGameListener({
      onGameStarted: this.toggleWindows.bind(this),
      onGameEnded: this.toggleWindows.bind(this),
    });
  }

  // Implementing the Singleton design pattern
  public static instance(): BackgroundController {
    if (!BackgroundController._instance) {
      BackgroundController._instance = new BackgroundController();
    }

    return BackgroundController._instance;
  }

  // When running the app, start listening to games' status and decide which window should
  // be launched first, based on whether DBD is currently running
  public async run() {
    this._dbdGameListener.start();
    const currWindow = (await this.isDbdRunning()) ? windowNames.inGame : windowNames.desktop;
    this._windows[currWindow].restore();
  }

  private toggleWindows(info) {
    if (!info || !this.isGameDbd(info)) {
      return;
    }

    if (info.isRunning) {
      this._windows[windowNames.desktop].close();
      this._windows[windowNames.inGame].restore();
    } else {
      this._windows[windowNames.inGame].close();
      this._windows[windowNames.desktop].restore();
    }
  }

  private async isDbdRunning(): Promise<boolean> {
    const info = await OWGames.getRunningGameInfo();

    return info && info.isRunning && this.isGameDbd(info);
  }

  // Identify whether the RunningGameInfo object we have references DBD
  private isGameDbd(info: RunningGameInfo) {
    return info.classId === dbdClassId;
  }
}

BackgroundController.instance().run();
