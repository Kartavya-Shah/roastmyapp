export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productName, url, niche, audience, goals, auditTypes } = req.body;
  if (!productName || !auditTypes) return res.status(400).json({ error: 'Missing required fields' });

  // Build sections description safely on the server - no user data inside JSON strings
  const auditDescriptions = {
    'UX Review': { key: 'ux', icon: '🎨' },
    'Marketing Copy': { key: 'marketing', icon: '📢' },
    'QA Report': { key: 'qa', icon: '🐛' },
    'SEO Basics': { key: 'seo', icon: '🔍' }
  };

  const selectedAudits = auditTypes.filter(t => auditDescriptions[t]);
  const sectionsList = selectedAudits.map(t => `"${t}"`).join(', ');

  const prompt = `You are a senior product auditor. Audit the following product.

Product Name: ${productName}
URL: ${url}
Niche: ${niche}
Target Audience: ${audience}
Challenge: ${goals || 'Not specified'}
Audit Sections Required: ${sectionsList}

Rules:
- Only include sections for the audit types listed above
- Every finding must reference the specific niche (${niche}) and audience (${audience})
- Be brutally honest and specific — no generic advice
- Scores are out of 10

You must return ONLY a JSON object. No markdown. No explanation. Start with { end with }.

The JSON must have exactly this shape:
{
  "scores": { ${selectedAudits.map(t => `"${auditDescriptions[t].key}": 7`).join(', ')} },
  "sections": [
    ${selectedAudits.map(t => `{
      "icon": "${auditDescriptions[t].icon}",
      "title": "${t}",
      "score": 7,
      "summary": "write your 2 sentence summary here",
      "findings": [
        { "type": "issue", "title": "write title", "detail": "write detail" },
        { "type": "warning", "title": "write title", "detail": "write detail" },
        { "type": "good", "title": "write title", "detail": "write detail" }
      ]
    }`).join(',\n    ')}
  ],
  "actions": [
    { "title": "action 1 title", "detail": "action 1 detail" },
    { "title": "action 2 title", "detail": "action 2 detail" },
    { "title": "action 3 title", "detail": "action 3 detail" },
    { "title": "action 4 title", "detail": "action 4 detail" },
    { "title": "action 5 title", "detail": "action 5 detail" }
  ]
}`;

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

    // Clean and extract JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'AI did not return JSON. Got: ' + text.substring(0, 300) });
    }
    text = text.substring(start, end + 1);

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json({ result: parsed });
    } catch(e) {
      return res.status(500).json({ error: 'JSON parse failed: ' + e.message });
    }

  } catch (err) {
    res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}