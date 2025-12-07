import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { PaymentTypeController } from "../controllers/PaymentTypeController";
import {
  createPaymentValidation,
  listPaymentsValidation,
  updatePaymentValidation,
  paymentIdParamValidation,
} from "../validations/paymentValidations";
import {
  createPaymentTypeValidation,
  updatePaymentTypeValidation,
  paymentTypeIdParamValidation,
} from "../validations/paymentTypeValidations";
import { upload } from "../middlewares/upload";

const routes = Router();

const paymentController = new PaymentController();
const paymentTypeController = new PaymentTypeController();

// Pagamentos
routes.get("/payments", listPaymentsValidation, (req, res, next) =>
  paymentController.list(req, res, next)
);

routes.get(
  "/payments/report",
  listPaymentsValidation,
  (req, res, next) => paymentController.report(req, res, next)
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

routes.post(
  "/payments/:id/receipt",
  paymentIdParamValidation,
  upload.single("file"),
  (req, res, next) => paymentController.uploadReceipt(req, res, next)
);

routes.delete(
  "/payments/:id/receipt",
  paymentIdParamValidation,
  (req, res, next) => paymentController.deleteReceipt(req, res, next)
);

// Tipos de pagamento
routes.get("/payment-types", (req, res, next) =>
  paymentTypeController.list(req, res, next)
);

routes.post("/payment-types", createPaymentTypeValidation, (req, res, next) =>
  paymentTypeController.create(req, res, next)
);

routes.put(
  "/payment-types/:id",
  updatePaymentTypeValidation,
  (req, res, next) => paymentTypeController.update(req, res, next)
);

routes.delete(
  "/payment-types/:id",
  paymentTypeIdParamValidation,
  (req, res, next) => paymentTypeController.delete(req, res, next)
);

export default routes;
