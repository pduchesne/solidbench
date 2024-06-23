import {useSession} from "./SessionProvider";
import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";

export function SolidAuth(props: {}) {
    const session = useSession();

    const navigate = useNavigate();

    useEffect(() => {
       session.handleIncomingRedirect({restorePreviousSession: false}).then(resp => {
           // TODO keep track of the original URL and redirect ?
           navigate('/personal/dashboard');
       });
    }, []);


    return <div>Authenticating...</div>
}