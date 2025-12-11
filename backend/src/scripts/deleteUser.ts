/* eslint-disable no-console */
import "reflect-metadata";
import readline from "readline";
import { AppDataSource } from "../database/data-source";
import { getUserRepository } from "../repositories/UserRepository";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  await AppDataSource.initialize();
  const repo = getUserRepository();

  const email = (await ask("Email do usuário a remover: "))
    .trim()
    .toLowerCase();
  const name = (await ask("Nome (para confirmar): ")).trim();

  if (!email) {
    console.error("Email obrigatório. Abortando.");
    process.exit(1);
  }

  const user = await repo.findOne({ where: { email } });

  if (!user) {
    console.error("Usuário não encontrado.");
    process.exit(1);
  }

  if (name && user.name.trim().toLowerCase() !== name.toLowerCase()) {
    console.error(
      `Nome não confere (informado: "${name}", no registro: "${user.name}"). Abortando.`
    );
    process.exit(1);
  }

  console.log(
    `Usuário encontrado: id=${user.id}, email=${user.email}, nome=${user.name}, role=${user.role}`
  );
  const confirm = (await ask("Confirmar exclusão? (s/n): "))
    .trim()
    .toLowerCase();
  if (confirm !== "s" && confirm !== "sim") {
    console.log("Cancelado.");
    process.exit(0);
  }

  await repo.remove(user);
  console.log("Usuário removido com sucesso.");
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
