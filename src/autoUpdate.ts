import * as bdsCore from "@the-bds-maneger/core";
import * as bdsCoreVersion from "@the-bds-maneger/server_versions";
import { CronJob } from "cron";
import StartServer, * as Start from "./start";

export default function autoUpdate(Platform: bdsCoreVersion.BdsCorePlatforms, versionInit: string) {
  console.log("Auto Update is enabled.");
  const Cron = new CronJob("0 */1 * * * *", async () => {
    const latestVersion = await bdsCoreVersion.findUrlVersion(Platform, true);
    if (latestVersion.version === versionInit) return;
    console.log("Upgrading %s from %s to %s", Platform, versionInit, latestVersion.version);
    Start.LockExit();
    (Start.getSession()).stopServer();
    await (Start.getSession()).waitExit();
    if (Platform === "bedrock") await bdsCore.Bedrock.installServer("latest");
    else if (Platform === "pocketmine") await bdsCore.PocketmineMP.installServer("latest");
    else if (Platform === "java") await bdsCore.Java.installServer("latest");
    else if (Platform === "spigot") await bdsCore.Spigot.installServer("latest");
    versionInit = latestVersion.version;
    Start.UnlockExit();
    await StartServer(Platform);
  });
  Cron.start();
}