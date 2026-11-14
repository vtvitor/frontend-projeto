const API = (() => {
  const BASE = "https://backend-projeto-tkvz.onrender.com/api";

  async function chamar(path, opcoes = {}) {
    try {
      const res = await fetch(BASE + path, {
        ...opcoes,
        headers: {
          "Content-Type": "application/json",
          ...(opcoes.headers || {})
        }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erro " + res.status);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (e) {
      console.warn("Backend offline:", e.message);
      return { offline: true };
    }
  }

  return {
    async register(dados) {
      return await chamar("/auth/register", {
        method: "POST",
        body: JSON.stringify(dados)
      });
    },

    async login(dados) {
      return await chamar("/auth/login", {
        method: "POST",
        body: JSON.stringify(dados)
      });
    },

    async listarCartoes(usuarioId) {
      return await chamar("/cartoes?usuarioId=" + usuarioId);
    },

    async criarCartao(dados) {
      return await chamar("/cartoes", {
        method: "POST",
        body: JSON.stringify(dados)
      });
    },

    async recarregarCartao(id, valorCentavos) {
      return await chamar("/cartoes/" + id + "/recarga", {
        method: "POST",
        body: JSON.stringify({ valorCentavos })
      });
    },

    async deletarCartao(id) {
      return await chamar("/cartoes/" + id, { method: "DELETE" });
    },

    async bloquearCartao(id, usuarioId, senha) {
      try {
        const res = await fetch(BASE + "/cartoes/" + encodeURIComponent(id) + "/bloquear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId, senha })
        });

        if (res.ok) return await res.json();

        if (res.status === 401) {
          return { sucesso: false, mensagem: "Senha incorreta. O cartão não foi bloqueado." };
        }
        if (res.status === 403) {
          return { sucesso: false, mensagem: "Este cartão não pertence à sua conta." };
        }
        if (res.status === 404) {
          return { sucesso: false, mensagem: "Cartão não encontrado no banco de dados." };
        }

        return { sucesso: false, mensagem: "Não foi possível bloquear o cartão. Tente novamente." };
      } catch (error) {
        console.warn("Falha de conexão ao bloquear cartão:", error.message);
        return { sucesso: false, mensagem: "Sem conexão com o servidor. Cartão não bloqueado." };
      }
    },

    async listarLinhas() {
      return await chamar("/linhas");
    },

    async listarPontos() {
      return await chamar("/pontos");
    }
  };
})();