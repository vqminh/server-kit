import { Express } from "express";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { User, userDot, USERS } from "../shared/user";
import { ConfigV3, getMe, getMeV4, sendZaloMessage } from "./zalo";
import { logError } from "../server/env";
import { checkAdmin, checkUser } from "../server/express-utils";
import * as functions from "firebase-functions";
import { sendGetRequest } from "../server/request-utils";

/**
 * @param app
 * @param config
 */
export function useZalo(app: Express, config?: ConfigV3) {
  /** https://developers.zalo.me/docs/api/social-api/tai-lieu/thong-tin-nguoi-dung-post-28 **/
  app.get("/zalo/login/:version?", async (req, res) => {
    const code = req.query.code as string;
    const { version } = req.params;
    if (!code) {
      throw new Error("Could not get code from: " + req.url);
    }

    try {
      const json = version ? await getMeV4(code) : await getMe(code, config!);
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

  app.post("/zalo/opt_out", async (req, res) => {
      const claims = await checkUser(req);
      await getFirestore()
        .collection(USERS)
        .doc(claims.uid)
        .update({
          zalo_uid: FieldValue.delete()
        });
      res.json({});
    }
  );

  // https://developers.zalo.me/docs/api/social-api/tham-khao/user-access-token-post-4316
  // https://developers.zalo.me/docs/api/official-account-api/api/gui-tin-nhan-post-2343
  app.get("/zalo/opt_in", async (req, res) => {
    const access_token = functions.config().zalo.access_token;
    const uid = req.query.state as string;
    const zalo_uid = req.query.uid;
    const response = await sendGetRequest(
      "openapi.zalo.me", `/v2.0/oa/getprofile?access_token=${access_token}&data={"user_id":"${zalo_uid}"}`
    );
    const data = response.data;
    if (!!data) {
      await getFirestore()
        .collection(USERS)
        .doc(uid)
        .update({
          zalo_uid: String(data.user_id)
        } as Partial<User>);
    }
    logError(new Error(JSON.stringify(response)));
    res.redirect("https://shop.luki.vn/profile");
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

  app.post("/zalo/send", async (req, res) => {
      await checkAdmin(req);
      const user_id = req.body.psid;
      const message = req.body.value;
      await sendZaloMessage(user_id, message);
      res.json({});
    }
  );

  app.post("/admin/zalo/send", async (req, res) => {
    const user_id = req.body.psid;
    const message = req.body.value;
    await sendZaloMessage(user_id, message);
    res.json({});
  });
}
