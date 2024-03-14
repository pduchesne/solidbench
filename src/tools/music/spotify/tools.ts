import {AuthorizationCodeWithPKCEStrategy, SdkOptions, SpotifyApi} from "@spotify/web-api-ts-sdk";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";

export class SpotifyContext {
    sdk: SpotifyApi | null;
    authenticated: boolean;
    authFn: () => void;

    constructor(sdk: SpotifyApi | null, authenticated: boolean, authFn: () => void) {
        this.sdk = sdk;
        this.authenticated = authenticated;
        this.authFn = authFn;
    }

    getRecentTracks() {
        return this.sdk?.player.getRecentlyPlayedTracks();
    }

    async authenticate() {
        this.authFn();
    }
}

export function useSpotifyContext(clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions) {

    const auth = useMemo( () => {
        return new AuthorizationCodeWithPKCEStrategy(clientId, redirectUrl, scopes)
    }, [clientId, redirectUrl, scopes]);
    const internalSdk = useMemo( () => new SpotifyApi(auth, config), [auth, config]);
    const [searchParams] = useSearchParams();

    const authFn = useCallback( async () => {
        try {
            const authResponse = await internalSdk.authenticate();

            setCtx(new SpotifyContext(internalSdk, authResponse.authenticated, authFn));
        } catch (e: Error | unknown) {

            const error = e as Error;
            if (error && error.message && error.message.includes("No verifier found in cache")) {
                console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
            } else {
                console.error(e);
            }

            setCtx(new SpotifyContext(internalSdk, false, authFn));
        }
    }, [internalSdk]);

    const [ctx, setCtx] = useState(new SpotifyContext(internalSdk, false, authFn));

    useEffect( () => {
        const code = searchParams.get("code");
        if (code) {
            authFn();
        } else {
            auth.getAccessToken().then(token => {
                setCtx(new SpotifyContext(internalSdk, !!token, authFn));
            });
        }

    }, [auth, authFn]);

    return ctx;
}