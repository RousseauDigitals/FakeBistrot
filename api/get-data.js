// api/get-data.js — Vercel API Route
// Lecture publique de data.json depuis GitHub

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.json`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).send(err);
    }

    const json = await r.json();
    const content = Buffer.from(json.content, 'base64').toString('utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(content);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
