import * as bdscore from "@the-bds-maneger/core";
import { BdsSession } from "@the-bds-maneger/core/globalType";

let Session: BdsSession;
let lockExitVar = false;
export const getSession = () => Session;
export const LockExit = () => lockExitVar = true;
export const UnlockExit = () => lockExitVar = false;

export default async function start(Platform: bdscore.globalType.Platform) {
  Session = await bdscore[Platform].server.startServer();
  Session.server.on("log", console.log);
  process.on("SIGINT", () => Session.commands.stop());
  if ((process.env.CRON_BACKUP||"").toLowerCase() === "true") Session.server.once("closed", () => (Session.creteBackup("0 0/6 * * *", {type: "zip"})).stop);
  Session.server.once("closed", code => {
    if (lockExitVar) return;
    process.exit(code);
  });
}