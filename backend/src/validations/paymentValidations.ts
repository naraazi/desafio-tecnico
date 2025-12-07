import { celebrate, Joi, Segments } from "celebrate";

export const createPaymentValidation = celebrate({
  [Segments.BODY]: Joi.object({
    date: Joi.string().isoDate().required(),
    paymentTypeId: Joi.number().integer().required(),
    description: Joi.string().min(3).required(),
    amount: Joi.number().positive().required(),
  }),
});

export const updatePaymentValidation = celebrate({
  [Segments.BODY]: Joi.object({
    date: Joi.string().isoDate().optional(),
    paymentTypeId: Joi.number().integer().optional(),
    description: Joi.string().min(3).optional(),
    amount: Joi.number().positive().optional(),
  }).or("date", "paymentTypeId", "description", "amount"), // exige pelo menos um campo
});

export const paymentIdParamValidation = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
});

export const listPaymentsValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    paymentTypeId: Joi.number().integer().optional(),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
  }),
});

export const reportPaymentsValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    paymentTypeId: Joi.number().integer().optional(),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
  }),
});
