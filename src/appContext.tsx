import * as React from "react";
import {useSession} from "@inrupt/solid-ui-react";
import {useEffect, useState} from "react";
import {getPodUrls, ResourceCache} from "@hilats/solid-utils";

export type AppContextType = {
    webId?: string,
    podUrl?: string,
    cache?: ResourceCache,
    updateCtx: (update: Partial<AppContextType>) => void;
};

function createInitAppContext(updateAppContextFn: (update: Partial<AppContextType>) => void): AppContextType {
    return {
        updateCtx: updateAppContextFn
    };
}

export const AppContext = React.createContext<AppContextType>(createInitAppContext(() => null));

export function AppContextProvider(props: { children: (ctx: AppContextType) => React.ReactNode }) {
    const {session} = useSession();

    //const params = new URLSearchParams(query);

    //if (!session.info.isLoggedIn)
    //    session.login({oidcIssuer:"https://inrupt.net", redirectUrl:window.location.href})

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

    return <AppContext.Provider value={appContext}>{props.children(appContext)}</AppContext.Provider>;
}