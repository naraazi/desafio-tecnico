import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { PaymentTypeController } from "../controllers/PaymentTypeController";
import {
  createPaymentValidation,
  listPaymentsValidation,
  updatePaymentValidation,
  paymentIdParamValidation,
} from "../validations/paymentValidations";
import { createPaymentTypeValidation } from "../validations/paymentTypeValidations";

const routes = Router();

const paymentController = new PaymentController();
const paymentTypeController = new PaymentTypeController();

// Pagamentos
routes.get("/payments", listPaymentsValidation, (req, res, next) =>
  paymentController.list(req, res, next)
);

routes.get("/payments/:id", paymentIdParamValidation, (req, res, next) =>
  paymentController.show(req, res, next)
);

routes.post("/payments", createPaymentValidation, (req, res, next) =>
  paymentController.create(req, res, next)
);

routes.put(
  "/payments/:id",
  paymentIdParamValidation,
  updatePaymentValidation,
  (req, res, next) => paymentController.update(req, res, next)
);

routes.delete("/payments/:id", paymentIdParamValidation, (req, res, next) =>
  paymentController.delete(req, res, next)
);

// Tipos de pagamento
routes.get("/payment-types", (req, res, next) =>
  paymentTypeController.list(req, res, next)
);

routes.post("/payment-types", createPaymentTypeValidation, (req, res, next) =>
  paymentTypeController.create(req, res, next)
);

export default routes;
