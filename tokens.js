export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address');

  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=0x38`,
      {
        headers: {
          'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjhiZjg0ODdlLTkzNDktNDE3NS1iYjE1LTVkNzZmNGI3MGVjYSIsIm9yZ0lkIjoiNTA0NTUwIiwidXNlcklkIjoiNTE5MTU4IiwidHlwZUlkIjoiNWRlYmVkODAtY2MwNC00MDlhLWI0YTItMmQ1MjcxNGYyZmQzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzMwNTUyODUsImV4cCI6NDkyODgxNTI4NX0.kk8JBj_dpSwgKilbJv7AtJh-OhRdEYLtcbZobMkoNno',
          'Accept': 'application/json'
        }
      }
    );

    const data = await res.json();
    const tokens = Array.isArray(data) ? data : (data.result || []);

    const result = tokens
      .filter(t => t.balance && t.balance !== '0')
      .map(t => {
        const decimals = parseInt(t.decimals) || 18;
        const balance = parseFloat(t.balance) / Math.pow(10, decimals);
        const priceUsd = parseFloat(t.usd_price) || 0;
        const valueUsd = balance * priceUsd;
        return {
          address: t.token_address,
          symbol: t.symbol || '???',
          name: t.name || '???',
          decimals,
          balance,
          priceUsd,
          valueUsd,
          logo: t.logo || t.thumbnail || null,
          status: valueUsd > 1 ? 'live' : valueUsd > 0.01 ? 'low' : 'dead'
        };
      });

    return new Response(JSON.stringify({ success: true, tokens: result }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
