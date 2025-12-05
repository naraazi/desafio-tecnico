import "reflect-metadata";
import { AppDataSource } from "./database/data-source";
import { app } from "./app";

const PORT = 3333;

AppDataSource.initialize()
  .then(() => {
    console.log("Conectado banco...");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao inicializar DataSource", error);
  });
