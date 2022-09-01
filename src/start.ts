import * as bdscore from "@the-bds-maneger/core";
import { actions } from "@the-bds-maneger/core/src/globalPlatfroms";

let Session: actions;
let lockExitVar = false;
export const getSession = () => Session;
export const LockExit = () => lockExitVar = true;
export const UnlockExit = () => lockExitVar = false;

export default async function start(Platform: string) {
  if (Platform === "bedrock") Session = await bdscore.Bedrock.startServer();
  else if (Platform === "pocketmine") Session = await bdscore.PocketmineMP.startServer();
  else if (Platform === "java") Session = await bdscore.Java.startServer();
  else if (Platform === "spigot") Session = await bdscore.Spigot.startServer();
  else {
    console.log("Invalid platform");
    process.exit(1);
  }
  Session.on("log_stdout", console.log);
  Session.on("log_stderr", console.log);
  process.on("SIGINT", () => Session.stopServer());
  Session.once("exit", ({code}) => {
    if (lockExitVar) return;
    process.exit(code);
  });
}