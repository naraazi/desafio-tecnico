import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { AppError } from "./errors/AppError";

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.trim()]
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError("Origin not allowed by CORS", 403));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

export { app };
