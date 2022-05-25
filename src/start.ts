import bdscore from "@the-bds-maneger/core";
import { Platform } from "@the-bds-maneger/core/globalType";
import { BdsSession } from "@the-bds-maneger/core/globalType";

let Session: BdsSession;
let lockExitVar = false;
export const getSession = () => Session;
export const LockExit = () => lockExitVar = true;
export const UnlockExit = () => lockExitVar = false;

export default async function start(Platform: Platform) {
  Session = await bdscore.Server.Start(Platform, {storageOnlyWorlds: true});
  Session.log.on("all", console.log);
  process.on("SIGINT", () => Session.commands.stop());
  Session.onExit(code => {
    if (lockExitVar) return;
    process.exit(code);
  });
  if ((process.env.CRON_BACKUP||"").toLowerCase() === "true") {
    Session.onExit((Session.creteBackup("0 0/6 * * *", {type: "zip"})).stop);
  }
}