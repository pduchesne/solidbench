import * as React from "react";
import {memo, useEffect, useState} from "react";
import {getPodUrls, ResourceCache} from "@hilats/solid-utils";
import {Preferences} from "./tools/personal-dashboard/preferences";
import {useDarkThemeDetector} from "@hilats/react-utils";
import {useFixedSolidSession} from "./solid/SessionProvider";
import {createProxifier, DEFAULT_PROXIFIER} from "@hilats/utils";

// TODO make these configurable in env file
const EXTENSION_ID = 'bgpjelbiopechflolhlgnkmkpajlppip';
const PROXY_URL = "https://demo.highlatitud.es/proxy";

DEFAULT_PROXIFIER.proxifier = createProxifier(PROXY_URL);

export type AppContextType = {
    webId?: string,
    podUrl?: string,
    cache?: ResourceCache,
    preferences: Preferences,
    theme?: string,
    updateCtx: (update: Partial<AppContextType>) => void;
    proxifier?: (url: string) => string,
    extensionVersion?: string
};

function createInitAppContext(updateAppContextFn: (update: Partial<AppContextType>) => void): AppContextType {
    return {
        updateCtx: updateAppContextFn,
        preferences: {
            pods: [],
            theme: 'auto'
        },
        proxifier: DEFAULT_PROXIFIER.proxifier
    };
}

export const AppContext = React.createContext<AppContextType>(createInitAppContext(() => null));

export const AppContextProvider = memo((props: { children?: React.ReactNode }) => {
    const {session} = useFixedSolidSession();

    //const params = new URLSearchParams(query);

    //if (!session.info.isLoggedIn)
    //    session.login({oidcIssuer:"https://inrupt.net", redirectUrl:window.location.href})

    const isDarkTheme = useDarkThemeDetector();

    const [appContext, setAppContext] = useState<AppContextType>(
        createInitAppContext(function (update) {
            setAppContext((prevCtx: AppContextType) => ({...prevCtx, ...update}));
        })
    );

    useEffect(
        () => {
            const podUrl$ = session.info.webId ? getPodUrls(session.info.webId, {fetch: session.fetch}).then(podUrls => podUrls[0]) : Promise.resolve(undefined);

            podUrl$.then(podUrl => {
                appContext.updateCtx({
                    webId: session.info.webId,
                    podUrl,
                    cache: new ResourceCache()
                });
            })
        },
        // run this only once
        [session.info.webId, session.info.isLoggedIn]
    );

    useEffect(
        () => {
            // Act upon a preferences change

            const prefTheme = appContext.preferences.theme;
            const actualTheme = prefTheme == 'auto' ? (isDarkTheme ? 'dark' : undefined) : prefTheme;
            appContext.updateCtx({theme: actualTheme})
        },
        [appContext.preferences, isDarkTheme]
    );

    useEffect(
        () => {
            if (typeof chrome != 'undefined') {
                chrome.runtime.sendMessage(EXTENSION_ID, {type: 'version'}, (response: any) => {
                    if (!response) {
                        console.warn('Extension not found');
                        return;
                    }
                    appContext.updateCtx({
                        extensionVersion: response.version
                    });
                });
            }
        },
        // run this only once
        []
    );

    return <AppContext.Provider value={appContext}>{props.children}</AppContext.Provider>;
})