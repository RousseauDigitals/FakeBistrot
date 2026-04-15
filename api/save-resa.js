// api/save-resa.js — Vercel API Route
// Ajout d'une réservation par les visiteurs (sans secret)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const safeResa = {
      id: Date.now(),
      prenom:   String(body.prenom   || '').slice(0, 60),
      nom:      String(body.nom      || '').slice(0, 60),
      tel:      String(body.tel      || '').slice(0, 20),
      email:    String(body.email    || '').slice(0, 100),
      date:     String(body.date     || '').slice(0, 12),
      heure:    String(body.heure    || '').slice(0, 8),
      couverts: parseInt(body.couverts) || 2,
    };

    if (!safeResa.prenom || !safeResa.date || !safeResa.heure) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    // 1. Lire le fichier actuel
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
    const currentData = JSON.parse(Buffer.from(getJson.content, 'base64').toString('utf8'));

    // 2. Ajouter la réservation
    currentData.reservations = currentData.reservations || [];
    currentData.reservations.push(safeResa);

    // 3. Sauvegarder
    const encoded = Buffer.from(JSON.stringify(currentData, null, 2), 'utf8').toString('base64');
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
          message: `réservation: ${safeResa.prenom} ${safeResa.nom} — ${safeResa.date}`,
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
