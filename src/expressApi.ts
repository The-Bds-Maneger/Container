import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import express_rate_limit from "express-rate-limit";
import { getSession } from "./start";
import * as bdscore from "@the-bds-maneger/core";
import path from "path";
import fs from "fs";

// Create Express API
const app = express();
export const listen = () => app.listen(3000, () => console.log("API Listening."));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(({res, next}) => {
  res.json = (body) => {
    res.set("Content-Type", "application/json");
    res.send(JSON.stringify(body, (key, value) => {
      if (typeof value === "bigint") value = value.toString();
      return value;
    }, 2));
    return res;
  }
  return next();
});

const defaultRateLimit = express_rate_limit({
  message: "Too many requests, please try again later.",
  windowMs: 15 * 60 * 1000,
  max: 250,
});
const auth = (req: Request, res: Response, next: NextFunction)=>{
  if(req.headers.authorization) {
    const auth_stuff = Buffer.from(req.headers.authorization.split(" ")[1], "base64")
    const [user, password] = auth_stuff.toString().split(":")
    if(user === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) return next();
    else {
      res.setHeader("WWW-Authenticate", "Basic realm=\"Auth Failed\"");
      return;
    }
  }
  res.setHeader("WWW-Authenticate", "Basic")
  return res.sendStatus(401);
}

// Server info
app.get("/", ({res}) => {
  const Session = getSession();
  return res.json({
    Seed: Session.seed||null,
    ports: Session.ports
  });
});

// Get Log
app.get("/log", auth, ({res}) => {
  res.setHeader("Content-Type", "text/plain");
  const logs = fs.readdirSync(process.env.LOG_PATH).slice(5).map(file => ({
    file,
    content: fs.readFileSync(path.join(process.env.LOG_PATH, file)).toString("base64")
  }));
  res.json(logs);
  return;
});

// Backup
app.get("/backup", auth, ({res}) => {
  const fileName = (`${new Date().toString().replace(/[-\(\)\:\s+]/gi, "_")}.zip`).replace(/__/gi, "_");
  res.setHeader("Content-disposition", "attachment; filename="+fileName);
  res.setHeader("FileName", fileName);
  res.setHeader("Content-type", "application/zip");
  return bdscore[(process.env.PLATFORM) as bdscore.globalType.Platform].backup.CreateBackup().then(buf => res.send(buf));
});

// Player
app.get("/player", defaultRateLimit, ({res}) => res.json((getSession()).Player));

// Command
const Commands = [];
app.route("/command").get(auth, ({res}) => res.sendFile(path.join(__dirname, "../expressApiPages/command.html"))).post(auth, (req, res) => {
  const Command: string = req.body.command;
  const returnPage = req.body.return === "true";
  if(!Command) {
    res.status(400).json({error: "No command specified."});
    return;
  }
  Commands.push({
    ip: req.ip,
    command: Command,
  });
  (getSession()).commands.execCommand(Command);
  if (returnPage) res.redirect("/command");
  else res.sendStatus(200);
  return;
});