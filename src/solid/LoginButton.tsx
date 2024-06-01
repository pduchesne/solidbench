import React, { useContext } from "react";
import type { ILoginInputOptions } from "@inrupt/solid-client-authn-core";
import {SessionContext} from "./SessionProvider";

export interface Props {
    authOptions?: ILoginInputOptions;
    children?: React.ReactNode;
    onError?(error: Error): void;
    oidcIssuer: string;
    redirectUrl: string;
}

/**
 * Displays a button which triggers the login flow on click. Should be used inside a `SessionProvider`.
 */
export const LoginButton: React.FC<Props> = ({
                                                 oidcIssuer,
                                                 redirectUrl,
                                                 children,
                                                 authOptions,
                                                 onError,
                                             }: Props) => {
    const options = {
        redirectUrl,
        oidcIssuer,
        ...authOptions,
    };

    const { login, setSessionRequestInProgress } = useContext(SessionContext);

    async function loginHandler() {
        if (setSessionRequestInProgress === undefined) {
            return;
        }
        setSessionRequestInProgress(true);

        try {
            await login(options);
            setSessionRequestInProgress(false);
        } catch (error) {
            setSessionRequestInProgress(false);
            if (onError) onError(error as Error);
        }
    }

    function keyDownHandler(
        e: React.KeyboardEvent<HTMLDivElement | HTMLButtonElement>,
    ): Promise<void> {
        e.preventDefault();

        return e.key === "Enter" ? loginHandler() : Promise.resolve();
    }

    return children ? (
        <div
            role="button"
            tabIndex={0}
            onClick={loginHandler}
            onKeyDown={keyDownHandler}
        >
            {children}
        </div>
    ) : (
        <button type="button" onClick={loginHandler} onKeyDown={keyDownHandler}>
            Log In
        </button>
    );
};