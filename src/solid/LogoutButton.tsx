import React, { useContext } from "react";
import {SessionContext} from "./SessionProvider";

export interface Props {
    onLogout?(): void;
    onError?(error: Error): void;
    children?: React.ReactElement;
}

/**
 * Renders a button which triggers logout on click. Should be used within a `SessionProvider`.
 */
export const LogoutButton: React.FC<Props> = ({
                                                  children,
                                                  onLogout,
                                                  onError,
                                              }: Props) => {
    const { logout } = useContext(SessionContext);

    async function logoutHandler() {
        try {
            await logout();
            if (onLogout) onLogout();
        } catch (error) {
            if (onError) onError(error as Error);
        }
    }

    function keyDownHandler(
        e: React.KeyboardEvent<HTMLDivElement | HTMLButtonElement>,
    ): Promise<void> {
        e.preventDefault();

        return e.key === "Enter" ? logoutHandler() : Promise.resolve();
    }

    return children ? (
        <div
            role="button"
            tabIndex={0}
            onClick={logoutHandler}
            onKeyDown={keyDownHandler}
        >
            {children}
        </div>
    ) : (
        <button type="button" onClick={logoutHandler} onKeyDown={keyDownHandler}>
            Log Out
        </button>
    );
};