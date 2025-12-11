import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionTopbar } from "../SessionTopbar";

const user = {
  id: 1,
  name: "Maria Silva",
  email: "maria@example.com",
  role: "admin" as const,
};

describe("SessionTopbar", () => {
  it("mostra dados da sessão e papel do usuário", () => {
    render(<SessionTopbar user={user} onLogout={vi.fn()} loggingOut={false} />);

    expect(screen.getByText("Sessão ativa")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeEnabled();
  });

  it("chama onLogout e desabilita botão durante saída", async () => {
    const onLogout = vi.fn();
    render(
      <SessionTopbar user={user} onLogout={onLogout} loggingOut={false} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onLogout).toHaveBeenCalledTimes(1);

    render(<SessionTopbar user={user} onLogout={onLogout} loggingOut />);
    expect(screen.getByRole("button", { name: "Saindo..." })).toBeDisabled();
  });
});
