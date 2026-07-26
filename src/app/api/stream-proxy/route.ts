import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept': req.headers.get('accept') || '*/*',
        'Accept-Language': req.headers.get('accept-language') || 'en-US,en;q=0.9',
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.arrayBuffer();

    let resBody: any = buffer;
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");

    if (contentType.includes("text/html")) {
      let html = new TextDecoder().decode(buffer);
      
      // Inject popup blocker script at the very top of <head>
      const blockerScript = `
        <script>
          // 1. Block window.open
          window.open = function() { return null; };
          
          // 2. Block a target=_blank
          document.addEventListener("click", function(e) {
            const a = e.target.closest ? e.target.closest("a") : null;
            if (a && a.target === "_blank") {
              e.preventDefault();
              a.removeAttribute("target");
            }
          }, true);
          
          // 3. Block form target=_blank
          document.addEventListener("submit", function(e) {
            if (e.target && e.target.target === "_blank") {
              e.preventDefault();
              e.target.removeAttribute("target");
            }
          }, true);

          // 4. Sabotage DOM insertion to catch iframes immediately
          const origAppend = Node.prototype.appendChild;
          Node.prototype.appendChild = function(child) {
            const res = origAppend.call(this, child);
            if (child && child.tagName && child.tagName.toLowerCase() === 'iframe') {
               try {
                 if (child.contentWindow) child.contentWindow.open = function() { return null; };
               } catch(e) {}
            }
            return res;
          };
          
          const origInsert = Node.prototype.insertBefore;
          Node.prototype.insertBefore = function(child, ref) {
            const res = origInsert.call(this, child, ref);
            if (child && child.tagName && child.tagName.toLowerCase() === 'iframe') {
               try {
                 if (child.contentWindow) child.contentWindow.open = function() { return null; };
               } catch(e) {}
            }
            return res;
          };

          // Trick Vue Router into thinking it's on the original path
          try {
            const params = new URLSearchParams(window.location.search);
            const targetStr = params.get('url');
            if (targetStr) {
              const targetUrl = new URL(targetStr);
              window.history.replaceState(null, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
            }
          } catch(e) {
            console.error(e);
          }
        </script>
      `;
      
      html = html.replace('<head>', '<head>' + blockerScript);
      resBody = new TextEncoder().encode(html);
    }

    return new NextResponse(resBody, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Proxy Error", { status: 500 });
  }
}
