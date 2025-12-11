import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import multer, { MulterError } from "multer";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const errorObject = err as any;

  // 0) Erros do multer (upload)
  if (err instanceof MulterError || errorObject?.name === "MulterError") {
    const multerErr = err as MulterError;
    const status =
      multerErr.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      status: "error",
      message: multerErr.message || "Erro ao processar upload.",
    });
  }

  // 1) Erros de validação do Celebrate
  if (isCelebrateError(err)) {
    const details: string[] = [];

    for (const [, joiError] of err.details) {
      joiError.details.forEach((detail) => {
        details.push(detail.message);
      });
    }

    return res.status(400).json({
      status: "error",
      message: "Erro de validação",
      details,
    });
  }

  // 2) Erros de CORS rejeitado
  if (errorObject?.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      status: "error",
      message: "Origem nao permitida.",
    });
  }

  // 3) Erros conhecidos da aplicação (regra de negócio)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // 4) Erros desconhecidos (bug, problema de infra, etc.)
  console.error(err);

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor.",
  });
}
