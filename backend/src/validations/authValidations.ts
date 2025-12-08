import { celebrate, Joi, Segments } from "celebrate";

export const loginValidation = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
});
