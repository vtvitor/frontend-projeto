const API = (() => {
  const BASE = "http://localhost:8080/api";

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

    async listarLinhas() {
      return await chamar("/linhas");
    },

    async listarPontos() {
      return await chamar("/pontos");
    }
  };
})();
