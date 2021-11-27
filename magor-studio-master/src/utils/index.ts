import { Router } from "express";

import mediaRouter from "../app/routes/media/routes";
import transcriptRouter from "../app/routes/transcript/routes";
import uploadRouter from "../app/routes/upload/routes";
import asrRouter from "../app/routes/asr/routes";
import icrRouter from "../app/routes/ic/routes";

// Type definition for middleware wrapper functions
type Wrapper = (router: Router) => void;

export const applyMiddleware = (
  middlewareWrappers: Wrapper[],
  router: Router
) => {
  for (const wrapper of middlewareWrappers) {
    wrapper(router);
  }
};

export const applyRoutes = (router: Router) => {
  router.use("/media", mediaRouter);
  router.use("/transcript", transcriptRouter);
  router.use("/upload", uploadRouter);
  router.use("/asr", asrRouter);
  router.use("/icr", icrRouter);
};
