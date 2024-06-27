import {ReactElement, SetStateAction, Dispatch, ReactNode, useCallback, useContext, useMemo} from "react";
import React, {createContext, useState, useEffect} from "react";

import type {Session} from "@inrupt/solid-client-authn-browser";
import {
    fetch,
    login,
    logout,
    handleIncomingRedirect,
    getDefaultSession,
    EVENTS,
    IHandleIncomingRedirectOptions
} from "@inrupt/solid-client-authn-browser";

import {
    SolidDataset,
    ProfileAll,
    WithServerResourceInfo,
    getProfileAll,
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
    restorePreviousSession?: boolean | ((url: string) => boolean);
    /** @since 2.3.0 */
    onSessionRestore?: (url: string) => void;
    onSessionLogin?: () => void;
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
                                    onSessionLogin
                                }: ISessionProvider): ReactElement {
    // session restore will be attempted depending on the evaluation of restorePreviousSession
    // if no 'restorePreviousSession' is provided, it is attempted if a onSessionRestore callback is provided
    const restoreSession =
        restorePreviousSession || typeof onSessionRestore !== "undefined";

    const [session, setSession] = useState<Session>(getDefaultSession);

    // keep the profile in a state
    const [profile, setProfile] =
        useState<ProfileAll<SolidDataset & WithServerResourceInfo>>();

    // register the onSessionRestore listener on the session
    useEffect(() => {
        const restoreListener = onSessionRestore !== undefined ?
            session.events.on(EVENTS.SESSION_RESTORED, onSessionRestore) :
            undefined

        const loginListener = onSessionLogin !== undefined ?
            session.events.on(EVENTS.LOGIN, onSessionLogin) :
            undefined

        return () => {
            //@ts-ignore
            restoreListener && session.events.off(EVENTS.SESSION_RESTORED, onSessionRestore);
            //@ts-ignore
            loginListener && session.events.off(EVENTS.LOGIN, onSessionLogin);
        }
    }, [onSessionLogin, onSessionRestore, session.events]);

    const defaultInProgress =
        typeof defaultSessionRequestInProgress === "undefined"
            // If loggedin is true, we're not making a session request.
            ? !session.info.isLoggedIn
            : defaultSessionRequestInProgress;

    // keep track of the session in progress state
    const [sessionRequestInProgress, setSessionRequestInProgress] =
        useState(defaultInProgress);

    // main function that handles incoming auth redirects
    const contextHandleIncomingRedirect = useCallback(async (options: IHandleIncomingRedirectOptions) =>
        {

        setSessionRequestInProgress(true);

        let sessionInfo: ISessionInfo | undefined = undefined;
        try {
            // url default to the current url
            const {url = window.location.href} = options;

            // shall we try to restore a session ?
            // first check if an explicit options.restorePreviousSession has been passed
            const restorePreviousSession =
                options.restorePreviousSession !== undefined ? options.restorePreviousSession :
                typeof restoreSession == 'function' ? restoreSession(url) :
                restoreSession;
            console.log(`SOLIDAUTH : Handling Incoming Redirect [restore=${restorePreviousSession}] : ${url}`);

            // do the auth check
            sessionInfo = await handleIncomingRedirect({
                url,
                restorePreviousSession,
                ...options
            });


            if (sessionInfo?.webId !== undefined) {
                // user is logged in

                if (!skipLoadingProfile) {
                    // load the profile proactively
                    const profiles = await getProfileAll(sessionInfo?.webId, {
                        fetch: session.fetch,
                    });

                    setProfile(profiles);
                }
            }

        } catch (error) {
            if (onError) {
                onError(error as Error);
            } else {
                throw error;
            }
        } finally {
            setSessionRequestInProgress(false);
        }

        // TODO why is this needed ?
        getDefaultSession().events.on("logout", () => {
            setSession(getDefaultSession());
        });

        return sessionInfo;
    },
        [restoreSession, onError, skipLoadingProfile]
    );

    useEffect(() => {
        const restorePreviousSession =
            restoreSession == undefined ? false : (typeof restoreSession == 'function' ? restoreSession(window.location.href) : restoreSession);
        if (restorePreviousSession) {
            contextHandleIncomingRedirect({restorePreviousSession});
        }
    }, [
        //session,
        //sessionId,
        //window.location.href,
        contextHandleIncomingRedirect,
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
    const session = useContext(SessionContext);
    return {...session};
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

    useEffect(() => {
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