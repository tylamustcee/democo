const client_id = process.env.GITHUB_CLIENT_ID;
const client_secret = process.env.GITHUB_CLIENT_SECRET;

exports.handler = async (event) => {
  const { code, provider } = event.queryStringParameters || {};

  if (!code) {
    // Step 1: Redirect to GitHub OAuth
    const params = new URLSearchParams({
      client_id,
      scope: "repo,user",
      redirect_uri: `${process.env.URL}/api/auth`,
    });
    return {
      statusCode: 302,
      headers: {
        Location: `https://github.com/login/oauth/authorize?${params}`,
      },
    };
  }

  // Step 2: Exchange code for token
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        body: `Error: ${data.error_description}`,
      };
    }

    const token = data.access_token;
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            console.log("receiveMessage %o", e);
          }
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token, provider: "github" })}',
            e.origin
          );
        })()
      </script>
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<!DOCTYPE html><html><body>${script}</body></html>`,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Server error: ${err.message}`,
    };
  }
};
