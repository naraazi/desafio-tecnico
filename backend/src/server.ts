import "reflect-metadata";
import { AppDataSource } from "./database/data-source";
import { app } from "./app";
import { seedPaymentTypes } from "./database/seeds";

const PORT = 3333;

AppDataSource.initialize()
  .then(async () => {
    console.log("Conectado banco...");

    await seedPaymentTypes();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao inicializar DataSource", error);
  });
