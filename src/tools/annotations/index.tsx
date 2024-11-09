import * as React from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {AppContext} from "../../appContext";
import {splitHash} from "@hilats/utils";

//import {AnnotationStorage, MemoryAnnotationStorage, PodAnnotationStorage} from "./storage";
import Alert from "@mui/material/Alert";
import {
    DereferenceResource,
    DereferenceResources,
    InlineOrRef,
    PromiseContainer,
    useRefCallback
} from "@hilats/react-utils";
import {
    Annotation,
    AnnotationCollection,
    BOOKMARKS_URL,
    getElemOrArray,
    resolveWebResourceRef,
    WebResource
} from "@hilats/annotations-core";
import {
    AnnotationsContext,
    AnnotationViewer, HighlightableRef,
    ScrollableRef,
    useAnnotationsEditor,
    useUrlAnnotationContainer
} from "@hilats/annotations-react-ui";
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';

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

    const containerUrl = externalInput || (appContext.podUrl ? appContext.podUrl+BOOKMARKS_URL : undefined);

    const [annotations$, annotationContainer] = useUrlAnnotationContainer(containerUrl, fetch);
    const [ /* editedAnnotation */ , setEditedAnnotation, editModal] = useAnnotationsEditor(annotationContainer);

    const navigate = useNavigate();

    //const scrollableRef = useRef<ScrollableRef & HighlightableRef>(null);

    const [selectedResource, setSelectedResource] = useState<WebResource>();
    const [secondaryResources, setSecondaryResources] = useState<WebResource<"SpecificResource">[]>([]);

    const setDisplayedResources = useCallback((mainResource: WebResource, secondaryResources?: WebResource<"SpecificResource">[]) => {
        setSelectedResource(mainResource);
        setSecondaryResources(secondaryResources || []);
    }, []);

    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation>();

    const [ /*highlightedAnnotations */, /* setHighLightedAnnotations */ ] = useState<Annotation[]>([]);

    useEffect(() => {
        if (selectedAnnotation) {
            const webRes = resolveWebResourceRef(getElemOrArray(selectedAnnotation.target)[0]);
            if (webRes.type != selectedResource?.type ||
                   (selectedResource?.type == 'SpecificResource' &&
                    webRes.type == 'SpecificResource' &&
                    selectedResource.source != webRes.source) )
                setDisplayedResources(webRes);
        }

    }, [selectedAnnotation]);

    const [scrollableRef, setScrollableRef] = useRefCallback<ScrollableRef & HighlightableRef>();

    useEffect( () => {
        if (selectedAnnotation && scrollableRef?.scrollTo)
            scrollableRef.scrollTo(selectedAnnotation);
    }, [scrollableRef, selectedAnnotation]);

    const selectAnnotationCb = useCallback((a: Annotation) => {
        setSelectedAnnotation(a);
        scrollableRef?.scrollTo && scrollableRef.scrollTo(a);
    }, [scrollableRef]);

    const highlightAnnotationCb = useCallback((a?: Annotation) => {
        scrollableRef?.highlightAnnotation && scrollableRef.highlightAnnotation(a);
        //setHighLightedAnnotations(a ? [a] : []);
    }, [scrollableRef]);

    const displaySecondaryResourceCb = useCallback((res: WebResource) => {
        if (res.type == 'SpecificResource') {

            // TODO here we simply look for a secondary resource with same URL and override it
            //      instead, we should maintain a map of URL and their viewers, and a
            //      list of all annotations per URL
            //      then secondary resources could be overlaid with all annotations at once

            const existingResourceIdx = secondaryResources.findIndex(
                r => splitHash(r.source).path == splitHash(res.source).path);

            if (existingResourceIdx >= 0) {
                // better to use toSpliced, but support is not ubiquitous yet
                let newResources = [...secondaryResources];
                newResources.splice(existingResourceIdx, 1, res);
                setSecondaryResources(newResources);
            } else {
                setSecondaryResources([...secondaryResources, res]);
            }

        }

    }, [secondaryResources]);

    const annotationsContext = useMemo<AnnotationsContext>(() => ({
        annotations: [],
        onEditAnnotation: setEditedAnnotation,
        onDeleteAnnotation: (a) => annotationContainer.deleteAnnotation(a),
        onSelectAnnotation: displaySecondaryResourceCb,
        highlightedAnnotations: selectedAnnotation ? [selectedAnnotation] : []
    }), [setEditedAnnotation, annotationContainer, displaySecondaryResourceCb, selectedAnnotation])

    return <div className="annotations vFlow">
        {editModal}
        {externalInput ?
            <Alert variant='outlined' severity="info" style={{flex: "none"}}>Viewing information
                from {externalInput}</Alert> : null}
        <div className="hFlow">
            {!containerUrl ? <div className="paddedPanel" style={{flex: "none"}}>
                Please log in to your pod to view annotations in your pod.
            </div> :
            <div className="annotations-list">
                <h4>Annotations
                    <span title="Open raw file"
                          className="actionableItem"
                          style={{float: 'right', position: 'relative', width: '30px'}}
                          onClick={() => navigate('../podbrowser/$EXT/'+containerUrl, {relative: 'path'})}>
                        <CodeIcon style={{position: 'absolute' }}  />
                        <EditIcon style={{position: 'absolute', scale: '0.7', right: '2px', top: '-4px'}} />
                    </span>
                </h4>
                <PromiseContainer promise={annotations$}>
                    { (annotations) =>
                        <AnnotationList annotations={annotations}
                                        onSelectAnnotation={selectAnnotationCb}
                                        onHighlightAnnotation={highlightAnnotationCb}/>
                    }
                </PromiseContainer>
            </div>}
            <div className="resource-viewer">
                <div className="resource-url-input">
                    <Input value={selectedResource?.type == 'SpecificResource' ? selectedResource?.source : ''}
                           placeholder="URL of the resource to annotate"
                           onChange={(e) => setDisplayedResources(resolveWebResourceRef(e.currentTarget.value))}
                           style={{width: '100%'}}/>
                </div>
                {selectedResource ?
                    <PromiseContainer promise={annotations$} loadingMessage="Loading Annotations">
                        {(annotations) =>
                            <AnnotationViewer resource={selectedResource}
                                              ref={setScrollableRef}
                                              fetchOptions={appContext.fetchOptions}
                                              annotationsContext={{...annotationsContext, annotations}}
                            />}
                    </PromiseContainer> : null}
                <div className="secondary-resources">
                    {secondaryResources.map(res => <div className="secondary-resource" key={res.source}>
                        <AnnotationViewer resource={res}
                                          //ref={setScrollableRef}
                                          fetchOptions={appContext.fetchOptions}
                                          annotationsContext={{...annotationsContext}}
                        />
                    </div>)}
                </div>
            </div>
        </div>
    </div>
}

export const AnnotationContainerList = (props: {collections: InlineOrRef<AnnotationCollection>[], onSelectAnnotation: (a: Annotation) => void, onHighlightAnnotation: (a?: Annotation) => void , fetch?: typeof fetch}) => {
    return <div className="annotations-containers-list">
        {props.collections.map(ref =>
            <DereferenceResource resRef={ref} fetch={props.fetch}>
                {coll => <div>
                    {coll.label || coll.id}
                    <DereferenceResource resRef={coll.first} fetch={props.fetch}>
                        {page =>
                            <DereferenceResources resRefs={page.items} fetch={props.fetch}>
                                {annotations => <AnnotationList annotations={annotations} onSelectAnnotation={props.onSelectAnnotation} onHighlightAnnotation={props.onHighlightAnnotation}/> }
                            </DereferenceResources>
                            }
                    </DereferenceResource>
                </div>
                }
            </DereferenceResource>
        )}
    </div>
}

export const AnnotationList = (props: { annotations: Annotation[], onSelectAnnotation: (a: Annotation) => void, onHighlightAnnotation: (a?: Annotation) => void }) => {
    const {annotations, onSelectAnnotation} = props;

    const annotationsByTarget = useMemo(() => {

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
            <div key={target} className="annotations-list-target">
                <div className="annotations-list-target-name" title={target}>{target}</div>
                <div className="target-annotations-list">
                    {anns.map(a => (
                        <div className="target-annotation"
                             title={a.title}
                             key={a.id}
                             onClick={() => onSelectAnnotation(a)}
                             onMouseEnter={() => props.onHighlightAnnotation(a)}
                             onMouseLeave={() => props.onHighlightAnnotation(undefined)}>
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