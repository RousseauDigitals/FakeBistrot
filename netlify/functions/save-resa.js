// netlify/functions/save-resa.js
// Permet aux visiteurs du site d'ajouter une réservation sans token admin

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO  = process.env.GITHUB_REPO;
const DATA_PATH    = "data.json";

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const newResa = JSON.parse(event.body);

    // Champs autorisés uniquement (sécurité)
    const safeResa = {
      id: Date.now(),
      prenom: String(newResa.prenom || "").slice(0, 60),
      nom:    String(newResa.nom    || "").slice(0, 60),
      tel:    String(newResa.tel    || "").slice(0, 20),
      email:  String(newResa.email  || "").slice(0, 100),
      date:   String(newResa.date   || "").slice(0, 12),
      heure:  String(newResa.heure  || "").slice(0, 8),
      couverts: parseInt(newResa.couverts) || 2,
    };

    if (!safeResa.prenom || !safeResa.date || !safeResa.heure) {
      return { statusCode: 400, body: JSON.stringify({ error: "Champs manquants" }) };
    }

    // 1. Lire le fichier actuel
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const getJson = await getRes.json();
    const sha = getJson.sha;
    const currentData = JSON.parse(Buffer.from(getJson.content, "base64").toString("utf8"));

    // 2. Ajouter la réservation
    currentData.reservations = currentData.reservations || [];
    currentData.reservations.push(safeResa);

    // 3. Sauvegarder
    const encoded = Buffer.from(JSON.stringify(currentData, null, 2), "utf8").toString("base64");

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message: `réservation: ${safeResa.prenom} ${safeResa.nom} — ${safeResa.date}`,
          content: encoded,
          sha: sha,
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: putRes.status, body: err };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
