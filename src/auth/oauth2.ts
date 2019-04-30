import * as express from "express";
import { Response, NextFunction } from "express";
import { asyncHandler, UserAuthInfo, UnauthorizedError, UserAuthInfoRequest } from "./authn";
import { Signature } from "./crypto";
import { Provider } from "../papiea";
import { Provider_DB } from "../databases/provider_db_interface";
const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string"),
    url = require("url");

// !!!!!!!!!!!! TODO(adolgarev): below is provider specific function !!!!!!!!!!!!
// See https://github.com/nutanix/papiea-js/pull/94
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

    const access_token = token.token.access_token;
    const id_token = parseJwt(token.token.id_token).content;
    const xi_roles = parseJwt(id_token.xi_role).header[0].roles;

    userInfo.owner = id_token.sub;
    userInfo.tenant = id_token.default_tenant;
    userInfo.headers = {
        authorization: `Bearer ${access_token}`,
        "tenant-email": id_token.email,
        "tenant-id": id_token.default_tenant,
        "tenant-fname": id_token.given_name,
        "tenant-lname": id_token.last_name,
        "tenant-role": JSON.stringify(xi_roles)
    };

    return userInfo;
}

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

export function createOAuth2Router(redirect_uri: string, signature: Signature, providerDb: Provider_DB) {
    const router = express.Router();

    router.use('/provider/:prefix/:version/auth/login', asyncHandler(async (req, res) => {
        const provider: Provider = await providerDb.get_provider(req.params.prefix, req.params.version);
        const oauth2 = simpleOauthModule.create(provider.oauth2);
        const state = {
            provider_prefix: provider.prefix,
            provider_version: provider.version,
            redirect_uri: req.query.redirect_uri
        };
        const options = {
            redirect_uri: redirect_uri,
            state: queryString.stringify(state),
            scope: "openid",
            prompt: "login"
        };
        const authorizationUri = oauth2.authorizationCode.authorizeURL(options);
        res.redirect(authorizationUri);
    }));

    router.use(url.parse(redirect_uri).path, asyncHandler(async (req, res, next) => {
        const code = req.query.code;
        const state = queryString.parse(req.query.state);
        const provider: Provider = await providerDb.get_provider(state.provider_prefix, state.provider_version);
        const oauth2 = simpleOauthModule.create(provider.oauth2);
        try {
            const result = await oauth2.authorizationCode.getToken({
                code,
                redirect_uri
            });
            const token = oauth2.accessToken.create(result);
            const userInfo = getUserInfoFromToken(token);
            userInfo.provider_prefix = state.provider_prefix;
            userInfo.provider_version = state.provider_version;
            const newSignedToken = await signature.sign(userInfo);
            if (state.redirect_uri) {
                const client_url = new url.URL(state.redirect_uri);
                client_url.searchParams.append("token", newSignedToken);
                return res.redirect(client_url.toString());
            } else {
                return res.status(200).json({ token: newSignedToken });
            }
        } catch (error) {
            console.error('Access Token Error', error.message);
            return res.status(500).json('Authentication failed');
        }
    }));

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        let userInfo: UserAuthInfo;
        try {
            userInfo = await signature.verify(token);
        } catch (e) {
            throw new UnauthorizedError();
        }
        if (userInfo.provider_prefix !== req.params.prefix) {
            throw new UnauthorizedError();
        }
        req.user = userInfo;
        next();
    }

    router.use('/services/:prefix', asyncHandler(injectUserInfo));
    router.use('/provider/:prefix', asyncHandler(injectUserInfo));

    router.use('/provider/:prefix/:version/auth/user_info', asyncHandler(async (req, res) => {
        res.json(req.user);
    }));

    return router;
}