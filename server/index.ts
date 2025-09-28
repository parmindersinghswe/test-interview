import express, { type Request, Response, NextFunction } from "express";
import serverless from 'serverless-http';
const app = express();
  app.get("/api/test", async(req: any, res)=>{
    return res.json({Message: "This is the testing Api"});
  });

  export default serverless(app);