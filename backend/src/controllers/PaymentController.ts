import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/PaymentService";
import { AppError } from "../errors/AppError";

const paymentService = new PaymentService();

export class PaymentController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const payment = await paymentService.create(req.body);
      return res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const payments = await paymentService.list(req.query);
      return res.json(payments);
    } catch (err) {
      next(err);
    }
  }

  async report(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const report = await paymentService.report(req.query);
      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  async show(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      const payment = await paymentService.findById(id);
      if (!payment) {
        throw new AppError("Pagamento nao encontrado.", 404);
      }
      return res.json(payment);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      const payment = await paymentService.update(id, req.body);
      return res.json(payment);
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      await paymentService.delete(id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
