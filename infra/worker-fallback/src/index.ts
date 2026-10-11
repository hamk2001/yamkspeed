export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Timing-Allow-Origin': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Downlink: stream requested bytes
    if (url.pathname === '/__down') {
      const requestedBytes = parseInt(url.searchParams.get('bytes') || '1048576', 10);
      const chunkSize = 65536; // 64KB chunk
      let remaining = Math.max(0, Math.min(requestedBytes, 100 * 1024 * 1024)); // cap 100MB

      const stream = new ReadableStream({
        pull(controller) {
          if (remaining <= 0) {
            controller.close();
            return;
          }
          const toSend = Math.min(remaining, chunkSize);
          controller.enqueue(new Uint8Array(toSend));
          remaining -= toSend;
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Length': requestedBytes.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Uplink: consume incoming bytes
    if (url.pathname === '/__up' && request.method === 'POST') {
      if (request.body) {
        const reader = request.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
      return new Response('OK', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
        },
      });
    }

    // Metadata: return client details
    if (url.pathname === '/meta') {
      const cf = (request as any).cf || {};
      const payload = {
        ip: request.headers.get('CF-Connecting-IP') || '127.0.0.1',
        country: cf.country || 'UNKNOWN',
        city: cf.city || 'UNKNOWN',
        colo: cf.colo || 'UNKNOWN',
        asn: cf.asn || 0,
        asOrganization: cf.asOrganization || 'UNKNOWN',
      };
      return new Response(JSON.stringify(payload), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
