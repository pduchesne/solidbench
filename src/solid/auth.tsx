import {useSession} from "./SessionProvider";
import React, {useEffect, useState} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import {Navigate} from "react-router-dom";

export function SolidAuth(props: {}) {
    const session = useSession();

    const [authResponse, setAuthResponse] = useState<Promise<any>>();

    useEffect(() => {
        setAuthResponse(session.handleIncomingRedirect({restorePreviousSession: true}));
    }, [session]);


    return authResponse ? <PromiseContainer promise={authResponse}>
        {() => <Navigate to={'/personal/dashboard'} />}
    </PromiseContainer> : null
}