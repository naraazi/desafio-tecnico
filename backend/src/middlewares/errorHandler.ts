import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
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

  // 2) Erros conhecidos da aplicação (regra de negócio)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // 3) Erros desconhecidos (bug, problema de infra, etc.)
  console.error(err);

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor.",
  });
}
