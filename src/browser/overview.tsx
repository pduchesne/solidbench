import * as React from 'react';
import {useCallback, useContext} from "react";
import {AppContext} from "../appContext";
import {useSolidContainer, useSolidFile} from "../solid";
import {PromiseContainer, PromiseStateContainer} from "@hilats/react-utils";
import {scanResource} from "../tools/scanner";
import {Button} from "@mui/material";

export function PodOverview(props: { folderUrl: string, fetch?: typeof fetch }) {
    const appContext = useContext(AppContext);

    const containerAccessor$ = useSolidContainer(
        props.folderUrl,
        props.fetch,
        appContext.cache
    );

    const scanResults$ = useSolidFile(new URL('.scan.json', props.folderUrl).toString(), props.fetch);

    const performScan = useCallback(async () => {
        const scanResult = await scanResource(props.folderUrl, {fetch: props.fetch});
        if (containerAccessor$.result) {
            const updatedFile = containerAccessor$.result.saveFile('.scan.json', JSON.stringify(scanResult, undefined, 4));
            scanResults$.file$.setPromise(updatedFile);
        }
    }, [props.folderUrl, containerAccessor$.result])

    return <div>
        <div><Button onClick={performScan}>Scan</Button></div>
        <PromiseStateContainer promiseState={scanResults$.file$}>
            {(file) => (

                <PromiseContainer promise={file.text()}>
                    {(str) => <pre>
                        ${str}
                    </pre>}
                </PromiseContainer>
            )}
        </PromiseStateContainer></div>
}