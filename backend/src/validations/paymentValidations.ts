import { celebrate, Joi, Segments } from "celebrate";

export const createPaymentValidation = celebrate({
  [Segments.BODY]: Joi.object({
    date: Joi.string().isoDate().required(),
    paymentTypeId: Joi.number().integer().required(),
    description: Joi.string().min(3).required(),
    amount: Joi.number().positive().required(),
    transactionType: Joi.string()
      .valid("payment", "transfer")
      .default("payment"),
  }),
});

export const updatePaymentValidation = celebrate({
  [Segments.BODY]: Joi.object({
    date: Joi.string().isoDate().optional(),
    paymentTypeId: Joi.number().integer().optional(),
    description: Joi.string().min(3).optional(),
    amount: Joi.number().positive().optional(),
    transactionType: Joi.string().valid("payment", "transfer").optional(),
  }).or("date", "paymentTypeId", "description", "amount", "transactionType"), // exige pelo menos um campo
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
    transactionType: Joi.string().valid("payment", "transfer").optional(),
    search: Joi.alternatives()
      .try(
        Joi.string().trim().max(80),
        Joi.array().items(Joi.string().trim().max(80))
      )
      .optional(),
    page: Joi.number().integer().positive().default(1),
    pageSize: Joi.number().integer().positive().max(100).default(10),
    sortBy: Joi.string()
      .valid("date", "amount", "description", "paymentType", "transactionType", "createdAt")
      .default("date"),
    sortOrder: Joi.string().valid("asc", "desc", "ASC", "DESC").default("DESC"),
  }),
});

export const reportPaymentsValidation = celebrate({
  [Segments.QUERY]: Joi.object({
    paymentTypeId: Joi.number().integer().optional(),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    transactionType: Joi.string().valid("payment", "transfer").optional(),
    search: Joi.alternatives()
      .try(
        Joi.string().trim().max(80),
        Joi.array().items(Joi.string().trim().max(80))
      )
      .optional(),
  }),
});
