import * as React from "react";
import {useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useContext, useEffect, useMemo, useState} from "react";
import {AppContext} from "../../appContext";
import {AnnotationStorage, MemoryAnnotationStorage, PodAnnotationStorage} from "./storage";
import Alert from "@mui/material/Alert";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {Annotation, DM_ANNOTATIONS, getElemOrArray, resolveWebResourceRef, WebResource} from "@hilats/annotations-core";
import { AnnotationViewer } from "@hilats/annotations-react-ui";
import {MODULE_REGISTRY} from "@hilats/data-modules";


import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();


MODULE_REGISTRY.registerModule(DM_ANNOTATIONS);

export const AnnotationsDashboard = () => {

    //const {search} = useLocation();

    return <>
        {/* Until there's a need for multiple tabs, just display the main panel always
        <Routes>
            <Route path="/:panelId/*" element={<AnnotationsDisplay/>}/>
            <Route path="*" element={<Navigate to={"overview" + decodeURIComponent(search)} replace={true}/>}/>
        </Routes>
        */}
        <AnnotationsDisplay />
    </>
}

export const AnnotationsDisplay = () => {

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const podStorage = useMemo(
        () => appContext.podUrl ? new PodAnnotationStorage(appContext.podUrl, {fetch}) : undefined,
        [appContext.podUrl, fetch]);

    const [params] = useSearchParams();
    const externalInputs = params.getAll('input');

    const memoryStorage = useMemo(
        () => externalInputs?.length ? new MemoryAnnotationStorage({uris: externalInputs}) : undefined,
        // must concat array to have a constant value across renderings
        [externalInputs.join(',')]);

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const annotationStorage: AnnotationStorage | undefined = memoryStorage || podStorage;

    //const navigate = usePersistentQueryNavigate();

    const annotations$ = usePromiseFn(async () => annotationStorage?.fetchAnnotations(), [annotationStorage])



    const [selectedResource, setSelectedResource] = useState<WebResource>();

    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation>();

    useEffect(() => {
        selectedAnnotation && setSelectedResource(resolveWebResourceRef(getElemOrArray(selectedAnnotation.target)[0]))
    }, [selectedAnnotation]);

    return <div className="annotations vFlow">
        {annotationStorage instanceof MemoryAnnotationStorage ?
            <Alert variant='outlined' severity="info">Viewing information
                from {annotationStorage.uris.join(', ')}</Alert> : null}
        <div className="hFlow">
            <div className="annotations-list">
                <PromiseStateContainer promiseState={annotations$}>
                    {annotations => <>
                        {(annotations || []).map(a => <div onClick={() => setSelectedAnnotation(a)}>
                            {a.title}
                        </div>)}
                    </>}
                </PromiseStateContainer>
            </div>
            <div className="resource-viewer">
                {selectedResource ?
                    <PromiseStateContainer promiseState={annotations$}>
                        {(annotations) =>

                            <AnnotationViewer resource={selectedResource}
                                              annotations={annotations}
                                              highlightedAnnotations={selectedAnnotation ? [selectedAnnotation] : []}
                            />}
                    </PromiseStateContainer> : null}
            </div>
        </div>
    </div>
}


export default AnnotationsDashboard;