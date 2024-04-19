import {useMemo} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import * as React from "react";
import {ColruytDbStorage} from "./storage";

export const ColruytDbPanel = () => {

    const colruytDb = useMemo(() => {
        return new ColruytDbStorage('https://storage.inrupt.com/42036c04-d45a-4ff2-8545-c7d718029299/test/', {fetch: window.fetch.bind(window)});
    }, []);


    return <>
        <div style={{flex: 'none'}}>Colruyt DB</div>
        <PromiseContainer promise={colruytDb.einMap}>
            {(einMap) => <div>
                <pre>
                    {Object.entries(einMap).filter(entry => !entry[1].ean).map(([articleId, ean]) =>
                        <div>
                            <span>{articleId}</span>
                            <span>{ean.ean}</span>
                            <span>{ean.label}</span>
                        </div>)}
                </pre>
            </div>}
        </PromiseContainer>

    </>
}