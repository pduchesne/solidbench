import {useMemo} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import * as React from "react";
import {ColruytDbStorage} from "./storage";

export const ColruytDbPanel = () => {

    const colruytDb = useMemo(() => {
        return new ColruytDbStorage('https://pduchesne.solidcommunity.net/test/', {fetch: window.fetch.bind(window)});
    }, [
    ]);


    return <>
        <div style={{flex: 'none'}}>Colruyt DB</div>
        <PromiseContainer promise={colruytDb.einMap}>
            {(einMap) => <div>
                <pre>
                    {JSON.stringify(einMap, null, 2)}
                </pre>
            </div>}
        </PromiseContainer>

    </>
}