import * as React from "react";
import {memo, useEffect, useState} from "react";
import {getPodUrls, ResourceCache} from "@hilats/solid-utils";
import {Preferences} from "./tools/personal-dashboard/preferences";
import {useDarkThemeDetector} from "@hilats/react-utils";
import {useFixedSolidSession} from "./solid/SessionProvider";
import {createProxifier, FetchOptions} from "@hilats/utils";

// TODO make these configurable in env file
const EXTENSION_ID = undefined; //'bgpjelbiopechflolhlgnkmkpajlppip';
const PROXY_URL = "https://demo.highlatitud.es/proxy";
//const PROXY_URL = "https://localhost:8000/proxy";

//DEFAULT_PROXIFIER.proxifier = createProxifier(PROXY_URL);

export type AppContextType = {
    webId?: string,
    podUrl?: string,
    cache?: ResourceCache,
    preferences: Preferences,
    theme?: string,
    updateCtx: (update: Partial<AppContextType>) => void;
    fetchOptions?: FetchOptions,
    extensionVersion?: string
    extensionId?: string
};

function createInitAppContext(updateAppContextFn: (update: Partial<AppContextType>) => void): AppContextType {
    return {
        updateCtx: updateAppContextFn,
        preferences: {
            pods: [],
            theme: 'auto',
            proxyUrl: PROXY_URL
        },
        extensionId: EXTENSION_ID
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
            appContext.updateCtx({
                theme: actualTheme,
                fetchOptions: {
                    ...appContext.fetchOptions,
                    proxifier: createProxifier(appContext.preferences.proxyUrl)
                }
            })
        },
        [appContext.preferences, isDarkTheme]
    );



    useEffect( () => {
        window.addEventListener("message", (event) => {
            // We only accept messages from ourselves
            if (event.source !== window) {
                return;
            }

            if (event.data.type == 'SOLIDBENCH_EXTENSION_ID') {
                console.log("Received Extension id : " + event.data.id)
                appContext.updateCtx({
                    extensionId: event.data.id
                });
            }
        }, false);
    }, [])

    useEffect(
        () => {
                if (typeof chrome != 'undefined' && chrome.runtime && appContext.extensionId) {
                    chrome.runtime.sendMessage(appContext.extensionId, {type: 'version'}, (response: any) => {
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
        [appContext.extensionId]
    );

    return <AppContext.Provider value={appContext}>{props.children}</AppContext.Provider>;
})