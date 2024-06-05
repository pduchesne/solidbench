import {useSession} from "./SessionProvider";
import React from "react";

export function SolidAuth(props: {}) {
    const session = useSession();
    session.handleIncomingRedirect({restorePreviousSession: true});

    return <div>
Loading
    </div>
}