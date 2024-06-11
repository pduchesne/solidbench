import * as React from 'react';
import {useCallback, useContext} from "react";
import {AppContext} from "../appContext";
import {useSolidContainer, useSolidFile} from "../solid";
import {PromiseStateContainer} from "@hilats/react-utils";
import {ScanMetadata, scanResource} from "../tools/scanner";
import Button from "@mui/material/Button/Button";
import {Card, CardContent, CardHeader} from "@mui/material";

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
        <h3 style={{flex: "none", width: "100%", height: "fit-content"}}>Pod Overview <Button variant="contained" onClick={performScan}>Scan My Pod</Button></h3>
        <PromiseStateContainer promiseState={scanMetadata$}>
            {(scanResult) => scanResult ? (
                <>
                    <Card className="card">
                        <CardHeader title="Stats"/>
                        <CardContent>
                            <table>
                                <tr>
                                    <td>Total Size</td>
                                    <td>{scanResult.size}b</td>
                                </tr>
                                <tr>
                                    <td>Resources</td>
                                    <td>{Object.entries(scanResult.types).reduce((sum, [type, nb]) => sum + nb, 0)}</td>
                                </tr>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="card">
                        <CardHeader title="Content Types"/>
                        <CardContent>
                            <table>
                                <tbody>
                                {Object.entries(scanResult.types).map(([type, count]) => <tr>
                                    <td>{type}</td>
                                    <td>{count}</td>
                                </tr>)}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="card">
                        <CardHeader title="Known Shapes"/>
                        <CardContent>
                            <table>
                                <tbody>
                                {Object.entries(scanResult.shapes).map(([shape, count]) => <tr>
                                    <td>{shape}</td>
                                    <td>{count}</td>
                                </tr>)}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            ) : <div>
            No scan results yet
            </div>}
        </PromiseStateContainer></div>
}