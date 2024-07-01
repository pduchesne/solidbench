import * as React from "react";
import {useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {AppContext} from "../../appContext";
import {AnnotationStorage, MemoryAnnotationStorage, PodAnnotationStorage} from "./storage";
import Alert from "@mui/material/Alert";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {Annotation, getElemOrArray, resolveWebResourceRef, WebResource} from "@hilats/annotations-core";
import {AnnotationViewer, ScrollableRef} from "@hilats/annotations-react-ui";


import { pdfjs } from 'react-pdf';
import Input from "@mui/material/Input";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

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
        () => externalInputs?.length ? new MemoryAnnotationStorage({uris: externalInputs, fetch}) : undefined,
        // must concat array to have a constant value across renderings
        [externalInputs.join(',')]);

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const annotationStorage: AnnotationStorage | undefined = memoryStorage || podStorage;

    //const navigate = usePersistentQueryNavigate();

    const annotations$ = usePromiseFn(async () => annotationStorage?.fetchAnnotations(), [annotationStorage])

    const scrollableRef = useRef<ScrollableRef>(null);

    const [selectedResource, setSelectedResource] = useState<WebResource>();

    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation>();

    useEffect(() => {
        selectedAnnotation && setSelectedResource(resolveWebResourceRef(getElemOrArray(selectedAnnotation.target)[0]))
    }, [selectedAnnotation]);

    const selectAnnotationCb = useCallback((a: Annotation) => {
        setSelectedAnnotation(a);
        scrollableRef.current?.scrollTo && scrollableRef.current.scrollTo(a);
    }, [scrollableRef.current]);

    return <div className="annotations vFlow">
        {annotationStorage instanceof MemoryAnnotationStorage ?
            <Alert variant='outlined' severity="info" style={{flex: "none"}}>Viewing information
                from {annotationStorage.uris.join(', ')}</Alert> : null}
        <div className="hFlow">
            <div className="annotations-list">
                <PromiseStateContainer promiseState={annotations$}>
                    {annotations => <>
                        {(annotations || []).map(a => <div key={a.id} onClick={() => selectAnnotationCb(a)}>
                            {a.title}
                        </div>)}
                    </>}
                </PromiseStateContainer>
            </div>
            <div className="resource-viewer">
                {selectedResource?.type == 'SpecificResource' ?
                    <div className="resource-url-input">
                        <Input defaultValue={selectedResource.source}
                                onChange={(e) => setSelectedResource(resolveWebResourceRef(e.currentTarget.value))}
                                style={{width: '100%'}}/>
                    </div>
                    : null}
                {selectedResource ?
                    <PromiseStateContainer promiseState={annotations$}>
                        {(annotations) =>

                            <AnnotationViewer resource={selectedResource}
                                              annotations={annotations}
                                              highlightedAnnotations={selectedAnnotation ? [selectedAnnotation] : []}
                                              ref={scrollableRef}
                                              proxifier={appContext.proxifier}
                            />}
                    </PromiseStateContainer> : null}
            </div>
        </div>
    </div>
}


export default AnnotationsDashboard;