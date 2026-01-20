import { useState } from "react";
import axios from "axios";
import { Trophy, Lock } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/check-name`, {
        username: username.trim(),
        pin: pin.trim()
      });

      if (response.data.success) {
        onLogin(username.trim());
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao verificar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    // Permite apenas números e máximo 4 dígitos
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pitch-green rounded-full mb-4">
            <Trophy size={40} weight="fill" className="text-bone" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-pitch-green mb-2">
            CallClub
          </h1>
          <p className="text-text-secondary font-body">
            Liga dos Palpiteiros
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-paper">
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
            Acesso Exclusivo
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nome */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Seu nome
              </label>
              <input
                id="username"
                data-testid="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-paper rounded-lg focus:outline-none focus:ring-2 focus:ring-pitch-green focus:border-transparent font-body"
                placeholder="Digite seu nome"
                required
              />
            </div>

            {/* Campo PIN */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                <Lock size={16} className="inline mr-1" />
                PIN de acesso (4 dígitos)
              </label>
              <input
                id="pin"
                data-testid="pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                className="w-full px-4 py-3 border-2 border-paper rounded-lg focus:outline-none focus:ring-2 focus:ring-pitch-green focus:border-transparent font-body text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="• • • •"
                required
              />
              <p className="text-xs text-text-secondary mt-2">
                PIN enviado pelo administrador
              </p>
            </div>

            {error && (
              <div
                data-testid="error-message"
                className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="login-button"
              disabled={loading || !username.trim() || pin.length !== 4}
              className="w-full bg-pitch-green text-bone font-semibold py-3 px-6 rounded-lg hover:bg-pitch-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? "Verificando..." : "Entrar no CallClub"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-paper">
            <p className="text-xs text-text-secondary text-center">
              Acesso exclusivo para membros autorizados.<br />
              Não compartilhe seu PIN com outras pessoas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
