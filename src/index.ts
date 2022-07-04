#!/usr/bin/env node
import * as BdsCore from "@the-bds-maneger/core";
import autoUpdate from "./autoUpdate";
import { listen } from "./expressApi";
import start from "./start";
const PlatformServer = (process.env.PLATFORM||"bedrock") as BdsCore.globalType.Platform;
if (!(BdsCore.globalType.PlatformArray.includes(PlatformServer))) {
  console.error(`Platform ${PlatformServer} is not supported.`);
  process.exit(1);
}
process.env.PLATFORM = PlatformServer;

const ServerVersion = (process.env.VERSION||"latest");
BdsCore[PlatformServer].DownloadServer(ServerVersion === "latest"?true:ServerVersion).then(async DownloadStatus => {
  if (ServerVersion === "latest") await autoUpdate(PlatformServer, DownloadStatus.version);

  if (PlatformServer === "bedrock") await BdsCore.bedrock.config.CreateServerConfig({
    worldName: (process.env.WORLD_NAME || "World"),
    serverName: (process.env.DESCRIPTION || "My minecraft Server"),
    gamemode: (process.env.GAMEMODE as "survival"|"creative"|"adventure")||"survival",
    maxPlayers: parseInt(process.env.MAXPLAYERS||"5"),
    difficulty: (process.env.DIFFICULTY as "normal"|"peaceful"|"easy"|"hard"||"normal"),
    requiredXboxLive: process.env.REQUIRED_LOGIN === "true",
    allowCheats: process.env.ALLOW_COMMADS === "true"
  }); else if (PlatformServer === "pocketmine") await BdsCore.pocketmine.config.CreateServerConfig({
    worldName: (process.env.WORLD_NAME || "World"),
    motd: (process.env.DESCRIPTION || "My minecraft Server"),
    gamemode: (process.env.GAMEMODE as "survival"|"creative")||"survival",
    difficulty: (process.env.DIFFICULTY as "normal"|"peaceful"|"easy"|"hard"||"normal"),
    forceGamemode: true,
    maxPlayers: parseInt(process.env.MAXPLAYERS||"5"),
    language: "eng",
    port: {
      v4: 19132,
      v6: 19133
    },
    pvp: true,
    whiteList: false,
    worldSeed: null,
    worldType: "default",
    xboxAuth: process.env.REQUIRED_LOGIN === "true"
  }); else console.log("Platform (%s) not support create config", PlatformServer);
  start(PlatformServer);
  return listen();
});