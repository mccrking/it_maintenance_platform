"use client"
import { useState } from "react";

export default function SecuritySettingsPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [twoFA, setTwoFA] = useState(false);

  function handlePasswordChange() {
    if (!password || password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    setMessage("Mot de passe modifié avec succès !");
    setPassword("");
    setConfirm("");
    setTimeout(() => setMessage(""), 2000);
  }

  function handleToggle2FA() {
    setTwoFA(!twoFA);
    setMessage(twoFA ? "Authentification à deux facteurs désactivée." : "Authentification à deux facteurs activée.");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sécurité du compte</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>
        <div className="flex flex-col gap-2 mb-2">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-2 rounded"
            placeholder="Nouveau mot de passe"
            aria-label="Nouveau mot de passe"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="border p-2 rounded"
            placeholder="Confirmer le mot de passe"
            aria-label="Confirmer le mot de passe"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handlePasswordChange}
            aria-label="Changer le mot de passe"
          >Changer</button>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Authentification à deux facteurs</h2>
        <button
          className={twoFA ? "bg-red-600 text-white px-4 py-2 rounded" : "bg-green-600 text-white px-4 py-2 rounded"}
          onClick={handleToggle2FA}
          aria-label={twoFA ? "Désactiver 2FA" : "Activer 2FA"}
        >{twoFA ? "Désactiver" : "Activer"}</button>
      </section>
      {message && <div className="mt-2 text-blue-700">{message}</div>}
    </main>
  );
}
