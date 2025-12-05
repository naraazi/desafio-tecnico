import { celebrate, Joi, Segments } from "celebrate";

export const createPaymentTypeValidation = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(3).required(),
  }),
});
