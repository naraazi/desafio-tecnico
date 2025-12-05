import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";

const service = new PaymentService();

export class PaymentController {
  async create(req: Request, res: Response) {
    try {
      const payment = await service.create(req.body);
      return res.status(201).json(payment);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async list(req: Request, res: Response) {
    const { paymentTypeId, startDate, endDate } = req.query;

    const payments = await service.list({
      paymentTypeId: paymentTypeId ? Number(paymentTypeId) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    return res.json(payments);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const payment = await service.findById(Number(id));

    if (!payment) {
      return res.status(404).json({ message: "Pagamento não encontrado." });
    }

    return res.json(payment);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const payment = await service.update(Number(id), req.body);
      return res.json(payment);
    } catch (err: any) {
      return res.status(404).json({ message: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await service.delete(Number(id));
      return res.status(204).send();
    } catch (err: any) {
      return res.status(404).json({ message: err.message });
    }
  }
}
