export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productName, url, niche, audience, goals, auditTypes } = req.body;
  if (!productName || !auditTypes || !auditTypes.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const icons = {
    'UX Review': '🎨',
    'Marketing Copy': '📢',
    'QA Report': '🐛',
    'SEO Basics': '🔍'
  };

  const keys = {
    'UX Review': 'ux',
    'Marketing Copy': 'marketing',
    'QA Report': 'qa',
    'SEO Basics': 'seo'
  };

  // Build JSON template with only static values — NO user input inside JSON strings
  const scoresShape = auditTypes.map(t => `"${keys[t]}": 0`).join(', ');
  const sectionsShape = auditTypes.map(t => JSON.stringify({
    icon: icons[t],
    title: t,
    score: 0,
    summary: "REPLACE_WITH_SUMMARY",
    findings: [
      { type: "issue", title: "REPLACE", detail: "REPLACE" },
      { type: "warning", title: "REPLACE", detail: "REPLACE" },
      { type: "good", title: "REPLACE", detail: "REPLACE" }
    ]
  })).join(', ');

  const actionsShape = JSON.stringify([
    { title: "REPLACE", detail: "REPLACE" },
    { title: "REPLACE", detail: "REPLACE" },
    { title: "REPLACE", detail: "REPLACE" },
    { title: "REPLACE", detail: "REPLACE" },
    { title: "REPLACE", detail: "REPLACE" }
  ]);

  const prompt = `You are a senior product auditor. Audit the product below and fill in the JSON template with real content.

PRODUCT INFO:
Name: ${productName}
URL: ${url}
Niche: ${niche}
Audience: ${audience}
Challenge: ${goals || 'Not specified'}
Audit Types: ${auditTypes.join(', ')}

RULES:
- Every finding must be specific to the ${niche} niche and ${audience} audience
- Replace all REPLACE placeholders with real audit content
- Scores are integers 1-10 based on ${niche} industry standards
- Only output the JSON object — no markdown, no explanation

JSON TEMPLATE TO FILL:
{"scores": {${scoresShape}}, "sections": [${sectionsShape}], "actions": ${actionsShape}}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://roastmyapp.vercel.app',
        'X-Title': 'RoastMyApp'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: 'You are a senior product auditor. Always respond with valid JSON only. No markdown. No text before or after the JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    let data;
    try { data = await response.json(); }
    catch (e) { return res.status(500).json({ error: 'AI provider returned invalid response' }); }

    if (!response.ok) {
      const msg = (data.error && data.error.message) ? data.error.message : 'API error ' + response.status;
      return res.status(500).json({ error: msg });
    }

    let text = data.choices?.[0]?.message?.content;
    if (!text) return res.status(500).json({ error: 'No content returned from AI' });

    // Strip markdown fences if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Extract JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'AI did not return JSON. Response: ' + text.substring(0, 200) });
    }
    text = text.substring(start, end + 1);

    // Parse and validate
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: 'AI returned malformed JSON: ' + e.message });
    }

    // Validate required fields exist
    if (!parsed.scores || !parsed.sections || !parsed.actions) {
      return res.status(500).json({ error: 'AI response missing required fields' });
    }

    return res.status(200).json({ result: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}