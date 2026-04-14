// netlify/functions/save-data.js
// Écrit data.json dans le repo GitHub via l'API

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO  = process.env.GITHUB_REPO;
const DATA_PATH    = "data.json";
const ADMIN_SECRET = process.env.ADMIN_SECRET; // même mot de passe que l'admin

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Vérification du secret admin
  const secret = event.headers["x-admin-secret"];
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: "Non autorisé" }) };
  }

  try {
    const newData = event.body; // JSON string envoyé par l'admin

    // 1. Récupérer le SHA actuel du fichier (requis par l'API GitHub pour update)
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

    // 2. Encoder le contenu en base64
    const encoded = Buffer.from(newData, "utf8").toString("base64");

    // 3. Mettre à jour le fichier
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
          message: "update: données site restaurant",
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
