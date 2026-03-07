export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

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
          { role: 'system', content: 'You are a senior product auditor. Always respond with valid JSON only. No markdown. No text before or after the JSON object.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    let data;
    try { data = await response.json(); }
    catch (e) { return res.status(500).json({ error: 'Invalid response from AI provider' }); }

    if (!response.ok) {
      const msg = (data.error && data.error.message) ? data.error.message : 'API error ' + response.status;
      return res.status(500).json({ error: msg });
    }

    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) return res.status(500).json({ error: 'No content returned from AI' });

    // Return raw text — let frontend parse it
    res.status(200).json({ result: text });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}