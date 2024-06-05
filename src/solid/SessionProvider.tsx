import {ReactElement, SetStateAction, Dispatch, ReactNode, useCallback, useContext, useMemo} from "react";
import React, { createContext, useState, useEffect } from "react";

import type { Session } from "@inrupt/solid-client-authn-browser";
import {
    fetch,
    login,
    logout,
    handleIncomingRedirect,
    getDefaultSession,
    EVENTS,
    IHandleIncomingRedirectOptions
} from "@inrupt/solid-client-authn-browser";

import type {
    SolidDataset,
    ProfileAll,
    WithServerResourceInfo,
} from "@inrupt/solid-client";
import {ISessionInfo} from "@inrupt/solid-client-authn-core";

export interface ISessionContext {
    login: typeof login;
    logout: typeof logout;
    handleIncomingRedirect: typeof handleIncomingRedirect,
    session: Session;
    sessionRequestInProgress: boolean;
    setSessionRequestInProgress?: Dispatch<SetStateAction<boolean>>;
    fetch: typeof window.fetch;
    profile: ProfileAll<SolidDataset & WithServerResourceInfo> | undefined;
}

export const SessionContext = createContext<ISessionContext>({
    login,
    logout,
    fetch,
    handleIncomingRedirect,
    session: getDefaultSession(),
    sessionRequestInProgress: true,
    profile: undefined,
});

export interface ISessionProvider {
    children: ReactNode;
    sessionId?: string;
    sessionRequestInProgress?: boolean;
    onError?: (error: Error) => void;
    /** @since 2.3.0 */
    restorePreviousSession?: boolean | ((url: string)=> boolean);
    /** @since 2.3.0 */
    onSessionRestore?: (url: string) => void;
    /**
     * @since 2.8.2
     * @experimental
     * */
    skipLoadingProfile?: boolean;
}

/**
 * Used to provide session data to child components through context, as used by various provided components and the useSession hook.
 */
export function SessionProvider({
                                    sessionId,
                                    children,
                                    onError,
                                    sessionRequestInProgress: defaultSessionRequestInProgress,
                                    restorePreviousSession,
                                    skipLoadingProfile,
                                    onSessionRestore,
                                }: ISessionProvider): ReactElement {
    const restoreSession =
        restorePreviousSession || typeof onSessionRestore !== "undefined";
    const [session, setSession] = useState<Session>(getDefaultSession);
    const [profile, setProfile] =
        useState<ProfileAll<SolidDataset & WithServerResourceInfo>>();

    useEffect(() => {
        if (onSessionRestore !== undefined) {
            session.events.on(EVENTS.SESSION_RESTORED, onSessionRestore);
        }
    }, [onSessionRestore, session.events]);

    const defaultInProgress =
        typeof defaultSessionRequestInProgress === "undefined"
            ? !session.info.isLoggedIn
            : defaultSessionRequestInProgress;

    // If loggedin is true, we're not making a session request.
    const [sessionRequestInProgress, setSessionRequestInProgress] =
        useState(defaultInProgress);

    const contextHandleIncomingRedirect = useCallback(async (options: IHandleIncomingRedirectOptions) => {
        setSessionRequestInProgress(true);

        let sessionInfo: ISessionInfo | undefined = undefined;
        try {
            const {url = window.location.href} = options;
            const restorePreviousSession = typeof restoreSession == 'function' ? restoreSession(url) : restoreSession;
            console.log(`SOLIDAUTH : Handling Incoming Redirect [restore=${restorePreviousSession}] : ${url}`);
            sessionInfo = await handleIncomingRedirect({
                url,
                restorePreviousSession,
                ...options
            });

            /*
            if (skipLoadingProfile === true) {
                    return;
                }

                // If handleIncomingRedirect logged the session in, we know what the current
                // user's WebID is.
                if (sessionInfo?.webId !== undefined) {
                    const profiles = await getProfileAll(sessionInfo?.webId, {
                        fetch: session.fetch,
                    });

                    setProfile(profiles);
                }
             */
        } catch (error) {
            if (onError) {
                onError(error as Error);
            } else {
                throw error;
            }
        } finally {
            setSessionRequestInProgress(false);
        }

        getDefaultSession().events.on("logout", () => {
            // TODO force a refresh
            setSession(getDefaultSession());
        });

        return sessionInfo;
    }, [restoreSession, onError, skipLoadingProfile]);

    useEffect(() => {
        const url = window.location.href
        const restorePreviousSession = typeof restoreSession == 'function' ? restoreSession(url) : restoreSession;

        if (restorePreviousSession) {
            contextHandleIncomingRedirect({ url, restorePreviousSession});
        }
    }, [
        session,
        sessionId,
        window.location.href,
        restoreSession
    ]);


    const contextLogin = async (options: Parameters<typeof login>[0]) => {
        setSessionRequestInProgress(true);

        try {
            await login(options);
        } catch (error) {
            if (onError) {
                onError(error as Error);
            } else {
                throw error;
            }
        } finally {
            setSessionRequestInProgress(false);
        }
    };

    const contextLogout = async () => {
        try {
            await logout();
            setProfile(undefined);
        } catch (error) {
            if (onError) {
                onError(error as Error);
            } else {
                throw error;
            }
        }
    };

    return (
        <SessionContext.Provider
            value={{
                session,
                login: contextLogin,
                logout: contextLogout,
                handleIncomingRedirect: contextHandleIncomingRedirect,
                sessionRequestInProgress,
                setSessionRequestInProgress,
                fetch,
                profile,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}


export function useFixedSolidSession() {

    const session = useSession();


    /*
const [fixedSession, setFixedSession] = useState(session);

useEffect( () => {
    setFixedSession({
        ...session,
        fetch: (...args) => session.session.fetch(...args)
    });
}, [session.sessionRequestInProgress, session.session.info.webId, session.session.info.isLoggedIn, session.session.info.sessionId]);
*/

    useEffect( () => {
        if (!session.session.info.isLoggedIn) {
            session.session.info.webId = undefined;
        }
    }, [session.session.info.isLoggedIn]);

    const fixedSession = useMemo<ReturnType<typeof useSession>>(() => (
        {
            ...session,
            fetch: (...args) => session.session.fetch(...args)
        }
    ), [session.sessionRequestInProgress, session.session.info.webId, session.session.info.isLoggedIn, session.session.info.sessionId]);

    return fixedSession;

}