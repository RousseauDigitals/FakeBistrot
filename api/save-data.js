// api/save-data.js — Vercel API Route
// Sauvegarde admin protégée par ADMIN_SECRET

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, ADMIN_SECRET } = process.env;

  const secret = req.headers['x-admin-secret'];
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const newData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);

    // 1. Récupérer le SHA actuel
    const getR = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.json`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    const getJson = await getR.json();
    const sha = getJson.sha;

    // 2. Écrire le fichier mis à jour
    const encoded = Buffer.from(newData, 'utf8').toString('base64');
    const putR = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: 'update: données site restaurant',
          content: encoded,
          sha,
        }),
      }
    );

    if (!putR.ok) {
      const err = await putR.text();
      return res.status(putR.status).send(err);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
