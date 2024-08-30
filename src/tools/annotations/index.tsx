import * as React from "react";
import {useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {AppContext} from "../../appContext";
//import {AnnotationStorage, MemoryAnnotationStorage, PodAnnotationStorage} from "./storage";
import Alert from "@mui/material/Alert";
import {PromiseContainer} from "@hilats/react-utils";
import {Annotation, BOOKMARKS_URL, getElemOrArray, resolveWebResourceRef, WebResource} from "@hilats/annotations-core";
import {
    AnnotationViewer,
    ScrollableRef,
    useAnnotationsEditor,
    useUrlAnnotationContainer
} from "@hilats/annotations-react-ui";


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

    const [params] = useSearchParams();
    const externalInput = params.get('input');

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const [annotations$, annotationContainer] = useUrlAnnotationContainer(externalInput || (appContext.podUrl ? appContext.podUrl+BOOKMARKS_URL : undefined), fetch);
    const [ /* editedAnnotation */ , setEditedAnnotation, editModal] = useAnnotationsEditor(annotationContainer);

    //const navigate = usePersistentQueryNavigate();

    const scrollableRef = useRef<ScrollableRef>(null);

    const [selectedResource, setSelectedResource] = useState<WebResource>();

    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation>();

    useEffect(() => {
        if (selectedAnnotation) {
            const webRes = resolveWebResourceRef(getElemOrArray(selectedAnnotation.target)[0]);
            if (webRes.type != selectedResource?.type ||
                   (selectedResource?.type == 'SpecificResource' &&
                    webRes.type == 'SpecificResource' &&
                    selectedResource.source != webRes.source) )
                setSelectedResource(webRes);
        }

    }, [selectedAnnotation]);

    const selectAnnotationCb = useCallback((a: Annotation) => {
        setSelectedAnnotation(a);
        scrollableRef.current?.scrollTo && scrollableRef.current.scrollTo(a);
    }, [scrollableRef.current]);

    return <div className="annotations vFlow">
        {editModal}
        {externalInput ?
            <Alert variant='outlined' severity="info" style={{flex: "none"}}>Viewing information
                from {externalInput}</Alert> :
            !appContext.podUrl ? <div className="paddedPanel">
                Please log in to your pod to view annotations in your pod.
            </div> : null}
        <div className="hFlow">
            <div className="annotations-list">
                <PromiseContainer promise={annotations$}>
                    { (annotations) => <AnnotationList annotations={annotations} onSelectAnnotation={selectAnnotationCb} />}
                </PromiseContainer>
            </div>
            <div className="resource-viewer">
                {selectedResource?.type == 'SpecificResource' ?
                    <div className="resource-url-input">
                        <Input value={selectedResource.source}
                                onChange={(e) => setSelectedResource(resolveWebResourceRef(e.currentTarget.value))}
                                style={{width: '100%'}}/>
                    </div>
                    : null}
                {selectedResource ?
                    <PromiseContainer promise={annotations$}>
                        {(annotations) =>

                            <AnnotationViewer resource={selectedResource}
                                              annotations={annotations}
                                              onEditAnnotation={setEditedAnnotation}
                                              onDeleteAnnotation={(a) => annotationContainer.deleteAnnotation(a)}
                                              highlightedAnnotations={selectedAnnotation ? [selectedAnnotation] : []}
                                              ref={scrollableRef}
                                              fetchOptions={appContext.fetchOptions}
                            />}
                    </PromiseContainer> : null}
            </div>
        </div>
    </div>
}

export const AnnotationList = (props: {annotations: Annotation[], onSelectAnnotation: (a: Annotation) => void}) => {
    const {annotations, onSelectAnnotation} = props;

    const annotationsByTarget = useMemo( () => {

        const map: Record<string, Annotation[]> = {};
        annotations.forEach(a => {
            const targetResource = resolveWebResourceRef(getElemOrArray(a.target)[0]);
            if (targetResource?.type == 'SpecificResource') {
                if (!map[targetResource.source]) map[targetResource.source] = [];
                map[targetResource.source].push(a);
            }

        })


        return map;
    }, [annotations]);

    return <div className="annotations-list">
        {Object.entries(annotationsByTarget).map(([target, anns]) =>
            <div>
                {target}
                <div className="annotations-list-target">
                    {anns.map(a => (
                        <div key={a.id} onClick={() => onSelectAnnotation(a)}>
                            {a.title}
                        </div>
                    ))}
                </div>
            </div>
        )
        }
    </div>
}


export default AnnotationsDashboard;