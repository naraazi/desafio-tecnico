import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import { getUserRepository } from "../repositories/UserRepository";
import { AppError } from "../errors/AppError";
import {
  authCookieName,
  jwtSecret,
  jwtExpiresIn,
} from "../config/auth";
import { User, UserRole } from "../entities/User";

if (!jwtSecret) {
  console.warn(
    "JWT_SECRET nao definido. Defina no .env para garantir seguranca dos tokens."
  );
}

type SanitizedUser = Omit<User, "passwordHash">;

export class AuthService {
  private sanitizeUser(user: User): SanitizedUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private signToken(user: User): string {
    if (!jwtSecret) {
      throw new AppError("JWT_SECRET nao configurado.", 500);
    }

    const secretKey: Secret = jwtSecret;
    const options: SignOptions = { expiresIn: jwtExpiresIn as SignOptions["expiresIn"] };

    const payload = { sub: String(user.id), role: user.role, email: user.email };

    return jwt.sign(payload, secretKey, options);
  }

  async login(email: string, password: string): Promise<{
    token: string;
    user: SanitizedUser;
  }> {
    const userRepository = getUserRepository();
    const normalizedEmail = email.trim().toLowerCase();

    const user = await userRepository.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const token = this.signToken(user);

    return { token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: number): Promise<SanitizedUser> {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return this.sanitizeUser(user);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<SanitizedUser> {
    const userRepository = getUserRepository();

    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError("Ja existe um usuario com este email.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = userRepository.create({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: data.role,
    });

    await userRepository.save(user);

    return this.sanitizeUser(user);
  }
}
