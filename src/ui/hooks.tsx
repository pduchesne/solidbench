import {useNavigate} from "react-router";
import {useEffect, useMemo} from "react";
import {To, useSearchParams} from "react-router-dom";
import type {NavigateOptions} from "react-router/dist/lib/context";
import {useSession} from "@inrupt/solid-ui-react";
import {SessionInfo} from "@inrupt/solid-ui-react/dist/src/hooks/useSession";

export function usePersistentQueryNavigate() {

    const navigate = useNavigate();
    const [query] = useSearchParams();

    return useMemo(() => (to: To, options?: NavigateOptions) => navigate(typeof to == 'string' ? {
        pathname: to,
        search: query.toString()
    } : {...to, search: query.toString()}, options), [navigate]);

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

    const fixedSession = useMemo<SessionInfo>(() => (
        {
            ...session,
            fetch: (...args) => session.session.fetch(...args)
        }
    ), [session.sessionRequestInProgress, session.session.info.webId, session.session.info.isLoggedIn, session.session.info.sessionId]);

    return fixedSession;

}