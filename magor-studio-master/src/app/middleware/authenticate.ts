import { Request, Response, NextFunction } from "express";
import axios from "axios";
import _ from "lodash";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  if (_.isUndefined(token) || _.isEmpty(token)) {
    res.status(401).json({ error: "invalid/missing token" });
    return next(false);
  }
  console.log(`Request authorization for:`, token.substr(0, 10));
  try {
    const { data } = await axios.get(`${process.env.MAGOR_BACKEND_URL}/authenticate`, {
      headers: { authorization: token },
    });
    console.log(data);
    // @ts-ignore
    req.user = data;
    return next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "failed to validate token" });
    return next(false);
  }
};
