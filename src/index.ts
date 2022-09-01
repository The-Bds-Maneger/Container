#!/usr/bin/env node
import * as BdsCore from "@the-bds-maneger/core";
import autoUpdate from "./autoUpdate";
import { listen } from "./expressApi";
import start from "./start";
import { BdsCorePlatforms } from '@the-bds-maneger/server_versions';
const PlatformServer = (process.env.PLATFORM||"bedrock") as BdsCorePlatforms;
process.env.PLATFORM = PlatformServer;

const ServerVersion = (process.env.VERSION||"latest");
BdsCore[PlatformServer].DownloadServer(ServerVersion === "latest"?true:ServerVersion).then(async DownloadStatus => {
  if (ServerVersion === "latest") await autoUpdate(PlatformServer, DownloadStatus.version);
  start(PlatformServer);
  return listen();
});