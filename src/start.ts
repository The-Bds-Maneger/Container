import { bdsTypes, Server } from "@the-bds-maneger/core";

let Session: Server.BdsSession;
export const getSession = () => Session;

let lockExitVar = false;
export const LockExit = () => lockExitVar = true;
export const UnlockExit = () => lockExitVar = false;

export default async function start(Platform: bdsTypes.Platform) {
  Session = await Server.Start(Platform, {storageOnlyWorlds: true});
  Session.logRegister("all", data => console.log(data));
  process.on("SIGTERM", () => Session.stop());
  Session.onExit(code => {
    if (lockExitVar) return;
    process.exit(code);
  });
}