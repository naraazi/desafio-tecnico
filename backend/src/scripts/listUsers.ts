/* eslint-disable no-console */
import "reflect-metadata";
import { AppDataSource } from "../database/data-source";
import { getUserRepository } from "../repositories/UserRepository";

async function main() {
  await AppDataSource.initialize();
  const repo = getUserRepository();

  const users = await repo.find({ order: { id: "ASC" } });

  if (users.length === 0) {
    console.log("Nenhum usuario cadastrado.");
    await AppDataSource.destroy();
    return;
  }

  console.log("Usuarios cadastrados:");
  users.forEach((u) => {
    console.log(`- id=${u.id} | nome="${u.name}" | email="${u.email}" | role=${u.role}`);
  });

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
