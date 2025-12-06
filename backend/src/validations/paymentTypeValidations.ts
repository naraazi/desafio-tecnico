import { celebrate, Joi, Segments } from "celebrate";

export const createPaymentTypeValidation = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(3).required(),
  }),
});

export const updatePaymentTypeValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(3).required(),
  }),
});

export const paymentTypeIdParamValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
});
