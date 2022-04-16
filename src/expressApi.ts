import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import express_rate_limit from "express-rate-limit";
import { getSession } from "./start";

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
  const session = (req["session"]||{});
  if(!session.user) {
    if(req.headers.authorization) {
      const auth_stuff = Buffer.from(req.headers.authorization.split(" ")[1], "base64")
      const [user, password] = auth_stuff.toString().split(":")
      if(user === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) {
        session.user = process.env.AUTH_USER
        return next();
      }
    }
  }
  res.setHeader("WWW-Authenticate", "Basic")
  return res.sendStatus(401);
}

// Server info
app.get("/", ({res}) => {
  const Session = getSession();
  return res.json({
    Seed: Session.seed,
    ports: Session.ports()
  });
});

// Player
app.get("/player", defaultRateLimit, ({res}) => res.json((getSession()).getPlayer()));

// Command
const Commands = [];
app.route("/command").get(defaultRateLimit, ({res}) => res.json(Commands)).post(auth, (req, res) => {
  const Command: string = req.body.command;
  if(!Command) {
    res.status(400).json({error: "No command specified."});
    return;
  }
  Commands.push({
    ip: req.ip,
    command: Command,
  });
  (getSession()).commands.execCommand(Command);
  res.sendStatus(200);
  return;
});