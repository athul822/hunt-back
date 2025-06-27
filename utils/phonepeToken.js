import axios from "axios";

let accessTokenCache = {
  token: null,
  expiresAt: 0, // epoch time in seconds
};

const fetchPhonePeToken = async () => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.PHONEPE_CLIENT_ID);
  params.append("client_version", "1");
  params.append("client_secret", process.env.PHONEPE_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");

  const { data } = await axios.post(
    "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  accessTokenCache.token = data.access_token;
  accessTokenCache.expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

  return accessTokenCache.token;
};

export const getPhonePeToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  if (!accessTokenCache.token || now >= accessTokenCache.expiresAt) {
    return await fetchPhonePeToken();
  }
  return accessTokenCache.token;
};
