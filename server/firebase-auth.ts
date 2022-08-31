export const createActionLink = (domain: string) => ({
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: `${domain}/signin-with-email`,
  // This must be true.
  handleCodeInApp: true,
  iOS: {
    bundleId: "vn.topfan",
  },
  android: {
    packageName: "vn.topfan",
    installApp: true,
    minimumVersion: "1",
  },
  dynamicLinkDomain: process.env.NEXT_PUBLIC_DYNAMIC_LINK_DOMAIN,
});
