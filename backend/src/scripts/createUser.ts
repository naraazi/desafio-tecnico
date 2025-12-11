/* eslint-disable no-console */
import "reflect-metadata";
import readline from "readline";
import { AppDataSource } from "../database/data-source";
import { AuthService } from "../services/AuthService";
import { UserRole } from "../entities/User";

function ask(
  question: string,
  options?: { silent?: boolean }
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (options?.silent) {
      // mascara senha sem depender de libs externas
      rl.question(question, (answer) => {
        rl.close();
        process.stdout.write("\n");
        resolve(answer);
      });

      const rlWithOutput = rl as readline.Interface & {
        output: NodeJS.WritableStream;
        _writeToOutput?: (chunk: string) => void;
      };

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

async function promptRole(): Promise<UserRole> {
  console.log("Selecione a role do usuário:");
  console.log("1) admin");
  console.log("2) operator");
  const choice = await ask("Opçao (1 ou 2): ");
  if (choice.trim() === "1") return "admin";
  if (choice.trim() === "2") return "operator";
  console.log("Opçao inválida. Tente novamente.\n");
  return promptRole();
}

async function main() {
  await AppDataSource.initialize();
  const authService = new AuthService();

  const name = await ask("Nome: ");
  const email = await ask("Email: ");
  const password = await ask("Senha: ", { silent: true });
  const confirm = await ask("Confirme a senha: ", { silent: true });

  if (password !== confirm) {
    console.error("Senhas não conferem. Abortando.");
    process.exit(1);
  }

  const role = await promptRole();

  try {
    const user = await authService.createUser({
      name: name.trim() || "Usuário",
      email,
      password,
      role,
    });
    console.log(
      `Usuário criado com sucesso (id=${user.id}, role=${user.role})`
    );
  } catch (err: any) {
    console.error("Erro ao criar usuário:", err?.message || err);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
