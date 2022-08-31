import { Application } from "express";
import { checkAdmin, checkId, logError, sendGetRequest, sendPostRequest } from "../util/request";
import * as functions from "firebase-functions";
import { User, userDot, USERS } from "./user";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";


function sendZaloMessage(user_id: any, message: any) {
  const access_token = functions.config().zalo.access_token;
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
        text: message
      }
    },
    "zalo/send"
  );
}

function getMeV4(access_token: string) {
  return sendGetRequest("graph.zalo.me",
    `/v2.0/me?fields=id,birthday,name,gender,picture`, "zalo.me", { access_token }
  );
}

interface ConfigV3 {
  appId: string,
  appSecret: string
}

async function getMe(code: string, config: ConfigV3) {
  const { appId, appSecret } = config;
  const { access_token } = await sendGetRequest(
    "oauth.zaloapp.com",
    `/v3/access_token?app_id=${appId}&app_secret=${appSecret}&code=${code}`
  );
  return sendGetRequest("graph.zalo.me",
    `/v2.0/me?access_token=${access_token}&fields=id,birthday,name,gender,picture`
  );
}

export default class ZaloAPI {
  constructor(app: Application, config: ConfigV3) {
    /** https://developers.zalo.me/docs/api/social-api/tai-lieu/thong-tin-nguoi-dung-post-28 **/
    app.get("/zalo/login/:version?", async (req, res) => {
      const code = req.query.code as string;
      const { version } = req.params;
      if (!code) {
        throw new Error("Could not get code from: " + req.url);
      }

      try {
        const json = version ? await getMeV4(code) : await getMe(code, config);
        if (!json?.id) {
          logError("access_token", code, JSON.stringify(json));
          throw new Error("Invalid access token");
        }
        const { id, name, picture, birthday, gender } = json;
        const userRef = getFirestore().collection(USERS);
        const snap = await userRef
          .where(userDot("zalo_uid"), "==", id)
          .limit(1)
          .get();
        let uid: string;
        if (snap.docs.length) {
          uid = snap.docs[0].id;
        } else {
          const data = {
            displayName: name,
            photoURL: picture.data.url
          };
          const user = await getAuth().createUser(data);
          uid = user.uid;
          await userRef.doc(uid).set({
            ...data,
            zalo_uid: id,
            gender,
            birthday
          });
        }
        const token = await getAuth().createCustomToken(uid);
        res.json({ token });
      } catch (e: any) {
        logError(req.path, e);
        res.json({ error: e.message });
      }
    });

    app.post("/zalo/opt_out", (req, res) =>
      checkId(req).then((claims) => {
        return getFirestore()
          .collection(USERS)
          .doc(claims.uid)
          .update({
            zalo_uid: FieldValue.delete()
          })
          .then(() => res.json({}))
          .catch((e) => {
            logError(req.path, e);
            res.json({ error: e.message });
          });
      })
    );
    app.post("/zalo/send", (req, res) =>
      checkAdmin(req).then(() => {
        const user_id = req.body.psid;
        const message = req.body.value;
        return sendZaloMessage(user_id, message)
          .then(() => res.json({}))
          .catch((e) => {
            logError(req.path, e);
            res.json({ error: e.message });
          });
      })
    );
    // https://developers.zalo.me/docs/api/social-api/tham-khao/user-access-token-post-4316
    // https://developers.zalo.me/docs/api/official-account-api/api/gui-tin-nhan-post-2343
    app.get("/zalo/opt_in", (req, res) => {
      const access_token = functions.config().zalo.access_token;
      const uid = req.query.state as string;
      const zalo_uid = req.query.uid;
      return sendGetRequest(
        "openapi.zalo.me", `/v2.0/oa/getprofile?access_token=${access_token}&data={"user_id":"${zalo_uid}"}`
      )
        .then(
          (response): Promise<any> => {
            const data = response.data;
            if (!!data) {
              return getFirestore()
                .collection(USERS)
                .doc(uid)
                .update({
                  zalo_uid: String(data.user_id)
                } as Partial<User>);
            }
            logError(new Error(JSON.stringify(response)));
            return Promise.resolve();
          }
        )
        .then(() => res.redirect("https://shop.luki.vn/profile"))
        .catch(logError);
    });
    // https://developers.zalo.me/app/1008607009592483660/webhook
    // https://developers.zalo.me/docs/api/official-account-api/webhook/su-kien-nguoi-dung-gui-tin-nhan-post-3720
    app.post("/zalo/webhook", (req, res) => {
      if (req.body.event_name === "user_send_text") {
        let reply: string = "";
        if (req.body.message.text === "test") {
          reply = "success";
        }
        if (!!reply) {
          sendZaloMessage(req.body.user_id_by_app, reply)
            .then(() => res.json({}))
            .catch((e) => {
              logError(req.path, e);
              res.json({ error: e.message });
            });
          return;
        }
      }
      res.json({});
    });
  }
}
