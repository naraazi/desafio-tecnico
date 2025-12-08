import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";
import { PaymentTypeController } from "../controllers/PaymentTypeController";
import { AuthController } from "../controllers/AuthController";
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
import { loginValidation } from "../validations/authValidations";
import { upload } from "../middlewares/upload";
import { requireAuth, requireRole } from "../middlewares/auth";

const routes = Router();

const paymentController = new PaymentController();
const paymentTypeController = new PaymentTypeController();
const authController = new AuthController();

// Autenticacao
routes.post("/auth/login", loginValidation, (req, res, next) =>
  authController.login(req, res, next)
);

routes.post("/auth/logout", requireAuth, (req, res, next) =>
  authController.logout(req, res, next)
);

routes.get("/auth/me", requireAuth, (req, res, next) =>
  authController.me(req, res, next)
);

// Todas as rotas abaixo exigem autenticacao
routes.use(requireAuth);

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

routes.post(
  "/payments",
  requireRole("admin"),
  createPaymentValidation,
  (req, res, next) => paymentController.create(req, res, next)
);

routes.put(
  "/payments/:id",
  requireRole("admin"),
  paymentIdParamValidation,
  updatePaymentValidation,
  (req, res, next) => paymentController.update(req, res, next)
);

routes.delete(
  "/payments/:id",
  requireRole("admin"),
  paymentIdParamValidation,
  (req, res, next) => paymentController.delete(req, res, next)
);

routes.post(
  "/payments/:id/receipt",
  requireRole("admin"),
  paymentIdParamValidation,
  upload.single("file"),
  (req, res, next) => paymentController.uploadReceipt(req, res, next)
);

routes.delete(
  "/payments/:id/receipt",
  requireRole("admin"),
  paymentIdParamValidation,
  (req, res, next) => paymentController.deleteReceipt(req, res, next)
);

// Tipos de pagamento
routes.get("/payment-types", (req, res, next) =>
  paymentTypeController.list(req, res, next)
);

routes.post(
  "/payment-types",
  requireRole("admin"),
  createPaymentTypeValidation,
  (req, res, next) => paymentTypeController.create(req, res, next)
);

routes.put(
  "/payment-types/:id",
  requireRole("admin"),
  updatePaymentTypeValidation,
  (req, res, next) => paymentTypeController.update(req, res, next)
);

routes.delete(
  "/payment-types/:id",
  requireRole("admin"),
  paymentTypeIdParamValidation,
  (req, res, next) => paymentTypeController.delete(req, res, next)
);

export default routes;
