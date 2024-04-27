import * as React from 'react';
import {useCallback, useContext} from "react";
import {AppContext} from "../appContext";
import {useSolidContainer, useSolidFile} from "../solid";
import {PromiseStateContainer} from "@hilats/react-utils";
import {ScanMetadata, scanResource} from "../tools/scanner";
import {Button} from "@mui/material";
import {_404undefined} from "@hilats/utils";

const SHAPES = {
    "retail:Receipt": `
start = @<Receipt>

<Receipt> {
  <http://example.org/receiptId> . ;
}
`,
    "oa:Annotation": `
start = @<Annotation>

<Annotation> {
  a [<http://www.w3.org/ns/oa#Annotation>] ;
}
`
}

export function PodOverview(props: { folderUrl: string, fetch?: typeof fetch }) {
    const appContext = useContext(AppContext);

    const containerAccessor = useSolidContainer(
        props.folderUrl,
        props.fetch,
        appContext.cache
    );

    const scanResults$ = useSolidFile(new URL('.scan.json', props.folderUrl).toString(), props.fetch);
    const scanMetadata$ = scanResults$.file$.useThen(async f => {
        if (!f) return undefined;

        const metadata = f && JSON.parse(await f.text()) as ScanMetadata<'container'>;

        // just in case the scan file content is corrupted
        if (metadata.type != 'container')
            return undefined;

        return metadata;
    });

    const performScan = useCallback(async () => {
        const scanResult = scanResource(props.folderUrl, {fetch: props.fetch, shapes: SHAPES}) as Promise<ScanMetadata<'container'>>;
        scanMetadata$.setPromise(scanResult);
        /* const updatedFile = */ scanResult.then(res => containerAccessor.saveFile('.scan.json', JSON.stringify(res, undefined, 4)));
    }, [props.folderUrl, containerAccessor])

    return <div className="scan-results">
        <div><Button onClick={performScan}>Scan</Button></div>
        <PromiseStateContainer promiseState={scanMetadata$}>
            {(scanResult) => scanResult ? (
                <>
                    <div>
                        Total size : {scanResult.size}
                    </div>
                    <div>
                        Types :
                        <table>
                            <tbody>
                            {Object.entries(scanResult.types).map(([type, count]) => <tr>
                                <td>{type}</td>
                                <td>{count}</td>
                            </tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        Shapes :
                        <table>
                            <tbody>
                            {Object.entries(scanResult.shapes).map(([shape, count]) => <tr>
                                <td>{shape}</td>
                                <td>{count}</td>
                            </tr>)}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : <div>
                No scan results yet
            </div>}
        </PromiseStateContainer></div>
}