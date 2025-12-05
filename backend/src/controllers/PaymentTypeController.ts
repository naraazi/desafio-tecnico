import { Request, Response } from "express";
import { PaymentTypeService } from "../services/PaymentTypeService";

const service = new PaymentTypeService();

export class PaymentTypeController {
  async create(req: Request, res: Response) {
    const { name } = req.body;

    try {
      const type = await service.create(name);
      return res.status(201).json(type);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async list(req: Request, res: Response) {
    const types = await service.list();
    return res.json(types);
  }
}
