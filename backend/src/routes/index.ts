import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { PaymentTypeController } from "../controllers/PaymentTypeController";
import {
  createPaymentValidation,
  listPaymentsValidation,
  updatePaymentValidation,
} from "../validations/paymentValidations";
import { createPaymentTypeValidation } from "../validations/paymentTypeValidations";

const routes = Router();

const paymentController = new PaymentController();
const paymentTypeController = new PaymentTypeController();

routes.get("/payment-types", (req, res) =>
  paymentTypeController.list(req, res)
);
routes.post("/payment-types", createPaymentTypeValidation, (req, res) =>
  paymentTypeController.create(req, res)
);

routes.get("/payments", listPaymentsValidation, (req, res) =>
  paymentController.list(req, res)
);

routes.get("/payments/:id", (req, res) => paymentController.show(req, res));

routes.post("/payments", createPaymentValidation, (req, res) =>
  paymentController.create(req, res)
);

routes.put("/payments/:id", updatePaymentValidation, (req, res) =>
  paymentController.update(req, res)
);

routes.delete("/payments/:id", (req, res) =>
  paymentController.delete(req, res)
);

export default routes;
