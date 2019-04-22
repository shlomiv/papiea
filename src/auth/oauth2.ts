import * as express from "express";
import { asyncHandler, UserAuthInfo } from "./authn";
import { Signature } from "./crypto";
import { Provider_API } from "../provider/provider_api_interface";
const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string");

// !!!!!!!!!!!! TODO(adolgarev): below is provider specific code !!!!!!!!!!!!
// See https://github.com/nutanix/papiea-js/pull/94
const redirect_uri = "http://localhost:3000/provider/auth/callback";
const oauth2_config = {
    client: {
        id: "XXX",
        secret: "YYY"
    },
    auth: {
        tokenHost: "http://127.0.0.1:9002",
        tokenPath: "/oauth2/token",
        authorizePath: "/oauth2/authorize",
        revokePath: "/oauth2/revoke"
    },
    options: {
        authorizationMethod: "body",
        bodyFormat: "form"
    }
};
const oauth2_authuri_extra_options = {
    scope: "openid",
    prompt: "login"
};
const oauth2 = simpleOauthModule.create(oauth2_config);


function getUserInfoFromToken(token: any): UserAuthInfo {
    const userInfo: UserAuthInfo = {};

    function atob(str: string) {
        return Buffer.from(str, 'base64').toString('binary');
    }

    function parseJwt(token: string): any {
        // partly from https://stackoverflow.com/a/38552302
        if (token) {
            const token_parts = token.split('.');
            const header_base64Url = token_parts[0];
            let header = {};
            if (header_base64Url) {
                const header_base64 = header_base64Url.replace(/-/g, '+').replace(/_/g, '/');
                header = JSON.parse(atob(header_base64));
            }
            const content_base64Url = token_parts[1];
            let content = {};
            if (content_base64Url) {
                const content_base64 = content_base64Url.replace(/-/g, '+').replace(/_/g, '/');
                content = JSON.parse(atob(content_base64));
            }
            return { header, content };
        }
        return { header: {}, content: {} };
    }

    // function get_highest_nunet_role(roles: string[]) {
    //     const highest_role = _.find(roles, ur => _.find(["nunet-admin", "nunet-user"], r => ur.name == r))
    //     if (highest_role)
    //         return highest_role.name
    //     return null
    // }

    const access_token = token.token.access_token;
    const id_token = parseJwt(token.token.id_token).content;
    const xi_roles = parseJwt(id_token.xi_role).header[0].roles;

    // const user_role = get_highest_nunet_role(xi_roles)
    // if (!user_role) {
    //     console.info(`User ${id_token.email} has no nunet roles ${JSON.stringify(xi_roles)}, denying access`)
    //     return res.status(403).send(`Authentication failed. User ${id_token.email} does not have a nunet role`);
    // }
    // const user_info: any = _.pick(id_token, ['sub', 'email', 'default_tenant', 'last_name', 'given_name', 'federated_idp'])
    // user_info.roles = xi_roles
    // if (!user_info.default_tenant) {
    //     console.log('user_info:', user_info)
    //     return res.status(403).send('Authentication failed. User does not have a tenant id');
    // }
    // // Add headers for auth and user details
    // const headers: any = {};
    // headers.authorization = `Bearer ${access_token}`;
    // headers['tenant-email'] = user_info.email;
    // headers['tenant-id'] = user_info.default_tenant;
    // headers['tenant-fname'] = user_info.given_name;
    // headers['tenant-lname'] = user_info.last_name;
    // headers['tenant-role'] = user_info.roles;

    userInfo.owner = id_token.sub;
    userInfo.tenant = id_token.default_tenant;
    return userInfo;
}
// !!!!!!!!!!!! TODO(adolgarev): above is provider specific code !!!!!!!!!!!!

function getToken(req: any): string | null {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    } else if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
}

export function createOAuth2Router(signature: Signature, providerApi: Provider_API) {
    const router = express.Router();

    router.use('/provider/:prefix/:version/auth/login', asyncHandler(async (req, res) => {
        const state = {
            prefix: req.params.prefix,
            redirect_uri: req.header("Referer")
        };
        const options = {
            redirect_uri: redirect_uri,
            state: queryString.stringify(state)
        };
        Object.assign(options, oauth2_authuri_extra_options);
        const authorizationUri = oauth2.authorizationCode.authorizeURL(options);
        res.redirect(authorizationUri);
    }));

    router.use('/provider/auth/callback', asyncHandler(async (req, res, next) => {
        const code = req.query.code;
        const state = queryString.parse(req.query.state);
        try {
            const result = await oauth2.authorizationCode.getToken({
                code,
                redirect_uri
            });
            const token = oauth2.accessToken.create(result);
            const userInfo = getUserInfoFromToken(token);
            userInfo.prefix = state.prefix;
            const newSignedToken = await signature.sign(userInfo);
            return res.status(200).json({ token: newSignedToken });
        } catch (error) {
            console.error('Access Token Error', error.message);
            return res.status(500).json('Authentication failed');
        }
    }));

    router.use('/entity', asyncHandler(async (req, res, next) => {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        req.user = await signature.verify(token);
        next();
    }));

    return router;
}