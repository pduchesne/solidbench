import {AuthorizationCodeWithPKCEStrategy, Scopes, SdkOptions, SpotifyApi} from "@spotify/web-api-ts-sdk";
import {Navigate, useSearchParams} from "react-router-dom";
import {memo, useCallback, useContext, useEffect, useMemo, useState} from "react";
import * as React from "react";

// Store the scopes as a const, because 'Scopes.all' returns a new array on each call
export const SPOTIFY_SCOPES_ALL = Scopes.all;

export type SpotifyContextType = {
    authenticate: () => void } & ({
    authenticated: true,
    sdk: SpotifyApi
} | {
    authenticated: false,
    sdk?: SpotifyApi
});

export const SpotifyContext = React.createContext<SpotifyContextType>({
    authenticated: false,
    authenticate: () => null
});

export const SpotifyContextProvider = memo((props: { clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions, children?: React.ReactNode }) => {

    const [authenticated, setAuthenticated] = useState(false);

    const auth = useMemo( () => {
        return new AuthorizationCodeWithPKCEStrategy(props.clientId, props.redirectUrl, props.scopes)
    }, [props.clientId, props.redirectUrl, props.scopes]);
    const internalSdk = useMemo( () => new SpotifyApi(auth, props.config), [auth, props.config]);

    const authFn = useCallback( async () => {
        try {
            const authResponse = await internalSdk.authenticate();

            setAuthenticated(authResponse.authenticated);
        } catch (e: Error | unknown) {

            const error = e as Error;
            if (error && error.message && error.message.includes("No verifier found in cache")) {
                console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
            } else {
                console.error(e);
            }

            setAuthenticated(false);
        }
    }, [internalSdk]);

    const spotifyContext: SpotifyContextType = {
        authenticate: authFn,
        authenticated,
        sdk: internalSdk
    }

    useEffect( () => {
        auth.getAccessToken().then(token => {
            setAuthenticated(!!token);
        });
    }, [auth]);

    return <SpotifyContext.Provider value={spotifyContext}>{props.children}</SpotifyContext.Provider>;
})


export function useSpotifyContext() {

    const ctx = useContext(SpotifyContext);

    return ctx;
}


export function SpotifyAuthenticator(props: {}) {
    const spotifyCtx = useSpotifyContext();

    const [searchParams] = useSearchParams();

    const code = searchParams.get("code");
    if (code) {
        spotifyCtx.authenticate();
    }

    return <Navigate to="/personal-dashboard/music" />
}