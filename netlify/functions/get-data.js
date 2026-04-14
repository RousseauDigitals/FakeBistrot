// netlify/functions/get-data.js
// Lit data.json depuis le repo GitHub

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER; // ex: "monpseudo"
const GITHUB_REPO  = process.env.GITHUB_REPO;  // ex: "bistrot-fictif"
const DATA_PATH    = "data.json";

exports.handler = async () => {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: err };
    }

    const json = await res.json();
    // Le contenu est encodé en base64 par GitHub
    const content = Buffer.from(json.content, "base64").toString("utf8");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: content,
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
