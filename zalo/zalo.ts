import {sendGetRequest, sendPostRequest} from "../server/request-utils";
import { logError } from "../server/env";

export function sendZaloMessage(user_id: any, message: any) {
  const access_token = process.env.NEXT_PUBLIC_ZALO_APP_ID;
  if (!access_token) {
    logError(message, new Error("Missing zalo.access_token"));
  }
  return sendPostRequest(
    "openapi.zalo.me",
    `/v2.0/oa/message?access_token=${access_token}`,
    { "Content-Type": "application/json" },
    {
      recipient: { user_id },
      message: {
        text: message,
      },
    },
    "zalo/send"
  );
}

export function getMeV4(access_token: string) {
    return sendGetRequest("graph.zalo.me",
        `/v2.0/me?fields=id,birthday,name,gender,picture`, "zalo.me", { access_token }
    );
}

export interface ConfigV3 {
    appId: string,
    appSecret: string
}

export async function getMe(code: string, config: ConfigV3) {
    const { appId, appSecret } = config;
    const { access_token } = await sendGetRequest(
        "oauth.zaloapp.com",
        `/v3/access_token?app_id=${appId}&app_secret=${appSecret}&code=${code}`
    );
    return sendGetRequest("graph.zalo.me",
        `/v2.0/me?access_token=${access_token}&fields=id,birthday,name,gender,picture`
    );
}
