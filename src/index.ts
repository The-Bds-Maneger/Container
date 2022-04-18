#!/usr/bin/env node
import { promises as fsPromise } from "fs";
import path from "path";
import * as BdsCore from "@the-bds-maneger/core";
import { CronJob } from "cron";
import autoUpdate from "./autoUpdate";
import { listen } from "./expressApi";
import start from "./start";

const PlatformServer = (process.env.PLATFORM||"bedrock") as BdsCore.bdsTypes.Platform;
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
  // Cron Backup
  const CronBackup = (process.env.CRON_BACKUP||"0 0 * * *").split(/\s+/);
  const { BACKUP_GIT_REPO, BACKUP_GIT_USERNAME, BACKUP_GIT_PASSTOKEN } = process.env;
  if (CronBackup.length >= 5 && 5 <= CronBackup.length) {
    const CronBackupCron = new CronJob(CronBackup.join(" "), async () => {
      console.info("Backup started");
      await BdsCore.Backup.CreateBackup(false).then(BufferFile => fsPromise.writeFile(path.join(process.env.BACKUP_PATH, "latest_backup.zip"), BufferFile)).catch(e => console.error(e));
      if (BACKUP_GIT_REPO && BACKUP_GIT_USERNAME && BACKUP_GIT_PASSTOKEN) {
        await BdsCore.Backup.gitBackup({
          repoUrl: BACKUP_GIT_REPO,
          Auth: {
            PasswordToken: BACKUP_GIT_PASSTOKEN,
            Username: (!!BACKUP_GIT_USERNAME)?BACKUP_GIT_USERNAME:undefined
          }
        }).catch(err => console.error(err));
      }
      console.info("Backup finished");
    });
    CronBackupCron.start();
  }
  start(PlatformServer);
  return listen();
});