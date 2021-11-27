import dotenv from "dotenv-safe";
import http from "http";
import express from "express";
import path from "path";

dotenv.config();

import middlewares from "./app/middleware";
import { applyMiddleware, applyRoutes } from "./utils";
import { initServices } from "./utils/init";
import logger from "./config/logger";

const router = express();

applyMiddleware(middlewares, router);
applyRoutes(router);

router.use("/static", express.static(path.join(__dirname, "..", "public")));

const { PORT = 3000 } = process.env;

const server = http.createServer(router);

initServices()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`server.listen http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`server.error ${err}`);
    console.error(err);
    process.exit(1);
  });
