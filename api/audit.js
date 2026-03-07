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
          { role: 'system', content: 'You are a product audit expert. Always respond with valid JSON only, no markdown, no extra text.' },
          { role: 'user', content: prompt }
        ],
        export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  const systemPrompt = `You are a world-class senior product strategist and auditor with 15+ years of experience across SaaS, E-commerce, EdTech, FinTech, Health tech, and more.

You think deeply about the product's specific NICHE and TARGET AUDIENCE before writing a single finding. You never give generic advice.

Your audit philosophy:
- Every finding must be SPECIFIC to this product's niche and audience — not copy-paste generic advice
- Reference real industry benchmarks, competitor patterns, and audience psychology relevant to the niche
- Consider what the TARGET AUDIENCE specifically expects, fears, and values when evaluating UX and copy
- UX findings should reflect how THIS audience navigates, not a generic user
- Marketing findings should reflect what messaging converts for THIS niche
- QA findings should flag issues that would specifically frustrate THIS audience
- SEO findings should reflect keywords and intent signals for THIS niche
- Action plan must be prioritized by highest business impact for this specific product

Be brutally honest. Be specific. Be senior. Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from AI');

    res.status(200).json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from AI');

    res.status(200).json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}