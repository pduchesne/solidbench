import {useSession} from "./SessionProvider";
import React, {useEffect} from "react";

export function SolidAuth(props: {}) {
    const session = useSession();

    useEffect(() => {
       session.handleIncomingRedirect({restorePreviousSession: false}).then(resp => {
           // no need to navigate here ; post-login navigation is handled by the onLogin event handler
           // TODO shouldn't the whole post-login navigation be handled here, including restored sessions ?
       });
    }, []);


    return <div>Authenticating...</div>
}