import { Request, Response, NextFunction } from "express";
import { PaymentTypeService } from "../services/PaymentTypeService";

const paymentTypeService = new PaymentTypeService();

export class PaymentTypeController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const paymentType = await paymentTypeService.create(req.body);
      return res.status(201).json(paymentType);
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
      const paymentTypes = await paymentTypeService.list();
      return res.json(paymentTypes);
    } catch (err) {
      next(err);
    }
  }
}
