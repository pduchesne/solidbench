import * as React from "react";
import {useSession} from "@inrupt/solid-ui-react";
import {useEffect, useState} from "react";
import {getPodUrls, ResourceCache} from "@hilats/solid-utils";
import {Preferences} from "./tools/personal-dashboard/preferences";
import {useDarkThemeDetector} from "@hilats/react-utils";

export type AppContextType = {
    webId?: string,
    podUrl?: string,
    cache?: ResourceCache,
    preferences: Preferences,
    theme?: string,
    updateCtx: (update: Partial<AppContextType>) => void;
};

function createInitAppContext(updateAppContextFn: (update: Partial<AppContextType>) => void): AppContextType {
    return {
        updateCtx: updateAppContextFn,
        preferences: {
            pods: [],
            theme: 'auto'
        }
    };
}

export const AppContext = React.createContext<AppContextType>(createInitAppContext(() => null));

export function AppContextProvider(props: { children: (ctx: AppContextType) => React.ReactNode }) {
    const {session} = useSession();

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
        [session.info.webId]
    );

    useEffect(
        () => {
            // Act upon a preferences change

            const prefTheme = appContext.preferences.theme;
            const actualTheme = prefTheme == 'auto' ? (isDarkTheme ? 'dark' : undefined) : prefTheme;
            appContext.updateCtx({theme: actualTheme})
        },
        // run this only once
        [appContext.preferences, isDarkTheme]
    );

    return <AppContext.Provider value={appContext}>{props.children(appContext)}</AppContext.Provider>;
}