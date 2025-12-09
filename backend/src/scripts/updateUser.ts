/* eslint-disable no-console */
import "reflect-metadata";
import readline from "readline";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../database/data-source";
import { getUserRepository } from "../repositories/UserRepository";

function ask(question: string, options?: { silent?: boolean }): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (options?.silent) {
      const rlWithOutput = rl as readline.Interface & {
        output: NodeJS.WritableStream;
        _writeToOutput?: (chunk: string) => void;
      };

      rlWithOutput.question(question, (answer) => {
        rlWithOutput.close();
        process.stdout.write("\n");
        resolve(answer);
      });

      rlWithOutput._writeToOutput = function _writeToOutput() {
        rlWithOutput.output.write("*");
      };
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  await AppDataSource.initialize();
  const repo = getUserRepository();

  const targetEmail = (await ask("Email do usuario a atualizar: ")).trim().toLowerCase();
  if (!targetEmail) {
    console.error("Email obrigatorio. Abortando.");
    process.exit(1);
  }

  const user = await repo.findOne({ where: { email: targetEmail } });
  if (!user) {
    console.error("Usuario nao encontrado.");
    process.exit(1);
  }

  const currentPassword = await ask("Senha atual (para confirmar): ", { silent: true });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    console.error("Senha atual incorreta. Abortando.");
    process.exit(1);
  }

  const newName = (await ask(`Novo nome (enter para manter "${user.name}"): `)).trim();
  const newEmailInput = (
    await ask(`Novo email (enter para manter "${user.email}"): `)
  ).trim().toLowerCase();

  const changePassword = (await ask("Deseja alterar a senha? (s/n): ")).trim().toLowerCase();
  let newPasswordHash = user.passwordHash;

  if (changePassword === "s" || changePassword === "sim") {
    const newPass = await ask("Nova senha: ", { silent: true });
    const confirm = await ask("Confirme a nova senha: ", { silent: true });
    if (newPass !== confirm) {
      console.error("Senhas nao conferem. Abortando.");
      process.exit(1);
    }
    newPasswordHash = await bcrypt.hash(newPass, 10);
  }

  const finalName = newName || user.name;
  const finalEmail = newEmailInput || user.email;

  if (finalEmail !== user.email) {
    const duplicate = await repo.findOne({ where: { email: finalEmail } });
    if (duplicate && duplicate.id !== user.id) {
      console.error("Ja existe usuario com esse email. Abortando.");
      process.exit(1);
    }
  }

  user.name = finalName;
  user.email = finalEmail;
  user.passwordHash = newPasswordHash;

  await repo.save(user);
  console.log(`Usuario atualizado: id=${user.id}, nome="${user.name}", email="${user.email}"`);

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
