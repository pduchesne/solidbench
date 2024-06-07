import {AuthorizationCodeWithPKCEStrategy, Scopes, SdkOptions, SpotifyApi, UserProfile} from "@spotify/web-api-ts-sdk";
import {Navigate, useSearchParams} from "react-router-dom";
import {memo, useCallback, useContext, useEffect, useMemo, useState} from "react";
import * as React from "react";
import {useSpotifyPlayer} from "./controls";
import {MusicPlayer} from "../types";
import {music} from "@hilats/data-modules";

// Store the scopes as a const, because 'Scopes.all' returns a new array on each call
export const SPOTIFY_SCOPES_ALL = Scopes.all;

export type SpotifyContextType = {
    authenticate: () => void } & ({
    userProfile: UserProfile,
    sdk: SpotifyApi,
    usePlayer: () => MusicPlayer | undefined
} | {
    usePlayer: () => MusicPlayer | undefined
    userProfile?: undefined,
    sdk?: SpotifyApi
});

export const SpotifyContext = React.createContext<SpotifyContextType>({
    authenticate: () => null,
    usePlayer: () => undefined
});

export const SpotifyContextProvider = memo((props: { clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions, children?: React.ReactNode }) => {

    const [userProfile, setUserProfile] = useState<UserProfile>();

    const auth = useMemo( () => {
        return new AuthorizationCodeWithPKCEStrategy(props.clientId, props.redirectUrl, props.scopes)
    }, [props.clientId, props.redirectUrl, props.scopes]);
    const internalSdk = useMemo( () => new SpotifyApi(auth, props.config), [auth, props.config]);

    const authFn = useCallback( async () => {
        try {
            const authResponse = await internalSdk.authenticate();
            const userProfile = authResponse.authenticated ? await internalSdk.currentUser.profile() : undefined;

            setUserProfile(userProfile);
        } catch (e: Error | unknown) {

            const error = e as Error;
            if (error && error.message && error.message.includes("No verifier found in cache")) {
                console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
            } else {
                console.error(e);
            }

            setUserProfile(undefined);
        }
    }, [internalSdk]);

    const spotifyContext: SpotifyContextType = {
        authenticate: authFn,
        userProfile,
        sdk: internalSdk,
        usePlayer: () => {
            const spotifyPlayer = useSpotifyPlayer(internalSdk);
            return {
                async play(item: music.MusicRecording): Promise<void> {
                    const spotifyId = item.identifier?.find(id => id.startsWith('spotify:'));
                    if (spotifyId && spotifyPlayer?.state.device.id) {
                        await spotifyPlayer?.play(spotifyPlayer?.state.device.id, undefined, [spotifyId.replace('track/', 'track:')]);
                    }
                },
                async pause(): Promise<void> {
                    if (spotifyPlayer?.state.device.id) {
                        await spotifyPlayer?.pause(spotifyPlayer?.state.device.id);
                    }
                }
            }
        }
    }

    useEffect( () => {
        auth.getAccessToken().then(async (token) => {
            if (token) {
                const userProfile = await internalSdk.currentUser.profile();
                setUserProfile(userProfile);
            }
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