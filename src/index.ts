#!/usr/bin/env node
import BdsCore from "@the-bds-maneger/core";
import autoUpdate from "./autoUpdate";
import { listen } from "./expressApi";
import start from "./start";
import { Platform } from "@the-bds-maneger/core/dist/dts/globalType";

const PlatformServer = (process.env.PLATFORM||"bedrock") as Platform;
if (!(BdsCore.bdsTypes.PlatformArray.find(p => p === PlatformServer))) {
  console.error(`Platform ${PlatformServer} is not supported.`);
  process.exit(1);
}

const ServerVersion = (process.env.VERSION||"latest");
BdsCore.downloadServer.DownloadServer(PlatformServer, ServerVersion === "latest"?true:ServerVersion).then(async DownloadStatus => {
  if (ServerVersion === "latest") await autoUpdate(PlatformServer, DownloadStatus.Version);
  // Write Server config
  await BdsCore.serverConfig.createConfig(PlatformServer, {
    world: (process.env.WORLD_NAME || "World"),
    description: (process.env.DESCRIPTION || "My Sample Server"),
    gamemode: (process.env.GAMEMODE as "survival"|"creative"|"adventure"|"hardcore"||"survival"),
    difficulty: (process.env.DIFFICULTY as "normal"|"peaceful"|"easy"|"hard"||"normal"),
    players: parseInt(process.env.MAXPLAYERS||"5"),
    require_login: process.env.REQUIRED_LOGIN === "true",
    cheats_command: process.env.ALLOW_COMMADS === "true"
  });
  start(PlatformServer);
  return listen();
});