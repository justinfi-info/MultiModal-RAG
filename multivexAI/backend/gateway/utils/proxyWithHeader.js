import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        // Stream the request body through untouched instead of buffering it.
        // The default body parsing caps requests at 100kb, which breaks file
        // uploads (multer downstream accepts up to 20mb).
        parseReqBody: false,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.user) {
                proxyReqOpts.headers = proxyReqOpts.headers || {};
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userID;
            }
            return proxyReqOpts;
        }
    });
};
