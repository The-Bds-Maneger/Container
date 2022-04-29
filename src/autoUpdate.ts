import bdsCore from "@the-bds-maneger/core";
import { Platform } from "@the-bds-maneger/core/dist/dts/globalType";
import * as bdsCoreVersion from "@the-bds-maneger/server_versions";
import { CronJob } from "cron";
import StartServer, * as Start from "./start";

export default function autoUpdate(Platform: Platform, versionInit: string) {
  console.log("Auto Update is enabled.");
  const Cron = new CronJob("0 */1 * * * *", async () => {
    const latestVersion = await bdsCoreVersion.findUrlVersion(Platform, true);
    if (latestVersion.version === versionInit) return;
    console.log("Upgrading %s from %s to %s", Platform, versionInit, latestVersion.version);
    Start.LockExit();
    await (Start.getSession()).stop();
    await bdsCore.downloadServer.DownloadServer(Platform, latestVersion.version);
    versionInit = latestVersion.version;
    Start.UnlockExit();
    await StartServer(Platform);
  });
  Cron.start();
}