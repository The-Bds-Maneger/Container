import bdscore from "@the-bds-maneger/core";
import { Platform } from "@the-bds-maneger/core/dist/dts/globalType";
import { BdsSession } from "@the-bds-maneger/core/dist/dts/server";

let Session: BdsSession;
export const getSession = () => Session;

let lockExitVar = false;
export const LockExit = () => lockExitVar = true;
export const UnlockExit = () => lockExitVar = false;

export default async function start(Platform: Platform) {
  Session = await bdscore.Server.Start(Platform, {storageOnlyWorlds: true});
  Session.log.on("all", data => console.log(data));
  process.on("SIGINT", () => Session.commands.stop());
  Session.onExit(code => {
    if (lockExitVar) return;
    process.exit(code);
  });
  // Cron Backup
  const CronBackup = (process.env.CRON_BACKUP||"0 0 * * *").split(/\s+/);
  const { BACKUP_GIT_REPO = "", BACKUP_GIT_USERNAME = "", BACKUP_GIT_PASSTOKEN = "" } = process.env;
  if (CronBackup.length >= 5 && 5 <= CronBackup.length) {
    const zipBackup = Session.creteBackup(CronBackup.join(" "), {type: "zip"});
    process.on("SIGINT", () => zipBackup.stop());
    if (!!BACKUP_GIT_REPO && !!BACKUP_GIT_USERNAME && !!BACKUP_GIT_PASSTOKEN) {
      const gitBackup = Session.creteBackup(CronBackup.join(" "), {type: "git", config: {
        repoUrl: BACKUP_GIT_REPO,
        Auth: {
          Username: BACKUP_GIT_USERNAME,
          PasswordToken: BACKUP_GIT_PASSTOKEN
        }
      }});
      process.on("SIGINT", () => gitBackup.stop());
    }
  }
}