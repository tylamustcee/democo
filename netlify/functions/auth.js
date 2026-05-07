const client_id = process.env.GITHUB_CLIENT_ID;
const client_secret = process.env.GITHUB_CLIENT_SECRET;

exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};

  if (!code) {
    const params = new URLSearchParams({
      client_id,
      scope: "repo,user",
      redirect_uri: process.env.URL + "/.netlify/functions/auth",
    });
    return {
      statusCode: 302,
      headers: {
        Location: "https://github.com/login/oauth/authorize?" + params,
      },
    };
  }

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
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: "<!DOCTYPE html><html><body><script>(function(){var m='authorization:github:error:" + data.error + "';if(window.opener){window.opener.postMessage(m,'*');}window.close();})();<\/script></body></html>",
      };
    }

    const token = data.access_token;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: "<!DOCTYPE html><html><body><script>(function(){var token='" + token + "';var m='authorization:github:success:{\"token\":\"' + token + '\",\"provider\":\"github\"}';if(window.opener){window.opener.postMessage(m,'*');}window.close();})();<\/script></body></html>",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Server error: " + err.message,
    };
  }
};
