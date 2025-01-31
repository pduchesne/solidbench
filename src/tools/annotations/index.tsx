import * as React from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {AppContext} from "../../appContext";
import {splitHash} from "@hilats/utils";
import AssistantIcon from '@mui/icons-material/Assistant';

//import {AnnotationStorage, MemoryAnnotationStorage, PodAnnotationStorage} from "./storage";
import Alert from "@mui/material/Alert";
import {
    DereferenceResource,
    DereferenceResources,
    InlineOrRef,
    PromiseContainer
} from "@hilats/react-utils";
import {
    Annotation,
    AnnotationCollection,
    BOOKMARKS_URL, fixAnnotation,
    getElemOrArray,
    resolveWebResourceRef,
    WebResource
} from "@hilats/annotations-core";
import {
    AnnotationDisplayRef,
    AnnotationsContext,
    AnnotationViewer,
    useAnnotationsEditor,
    useUrlAnnotationContainer
} from "@hilats/annotations-react-ui";
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { pdfjs } from 'react-pdf';
import Input from "@mui/material/Input";
import classNames from "classnames";
import { PodStorage } from "@hilats/solid-utils";
import {TextField} from "@mui/material";
import { AnnotationAssistant } from "./assistant";
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

    const aiAssistant$ = useMemo(async () => {
        try {
            const aiModule = await import("@hilats/solid-app-assistant");

            if (appContext.podUrl && aiModule?.Assistant) {
                const preferences = await new aiModule.AppStorage(new PodStorage(appContext.podUrl, {fetch})).fetchPreferences();
                return new AnnotationAssistant(preferences);
            } else
                return undefined
        } catch (e) {
          return undefined;
        }
    }, [appContext.podUrl, fetch]);

    const [tempAnnotations, setTempAnnotations] = useState<Annotation[]>([]);

    const [params] = useSearchParams();
    const externalInput = params.get('input');

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const containerUrl = externalInput || (appContext.podUrl ? appContext.podUrl+BOOKMARKS_URL : undefined);

    const [storageAnnotations$, annotationContainer] = useUrlAnnotationContainer(containerUrl, fetch);
    const [ /* editedAnnotation */ , setEditedAnnotation, editModal] = useAnnotationsEditor(annotationContainer);

    useEffect(() => {
            storageAnnotations$.then(as => [...as, ...tempAnnotations]).then(allAnnotations => {
                setTuple( ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) =>  {
                    return [allAnnotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]
                });
            })
        },
        [storageAnnotations$, tempAnnotations]
    )
    //const annotations$ = useMemo(() => storageAnnotations$.then(as => [...as, ...tempAnnotations]), [storageAnnotations$, tempAnnotations])

    const navigate = useNavigate();

    const [[annotations, selectedResource, displayRef, selectedAnnotation, secondaryResources], setTuple] = useState<[Annotation[], WebResource | undefined, AnnotationDisplayRef | undefined, Annotation | undefined, WebResource<"SpecificResource">[]]>([[], undefined, undefined, undefined, []]);

    const setDisplayedResources = useCallback((mainResource: WebResource, secondaryResources?: WebResource<"SpecificResource">[]) => {
        setTuple( ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) =>  {
            return [annotations, mainResource, undefined, undefined, secondaryResources || []]
        });
    }, []);


    const [showAssistant, setShowAssistant] = useState(false);

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

    useEffect( () => {
        if (selectedAnnotation && displayRef?.scrollTo)
            displayRef.scrollTo(selectedAnnotation);
    }, [displayRef, selectedAnnotation]);

    const selectAnnotationCb = useCallback((a: Annotation) => {
        setTuple( ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) =>  {
            const webRes = resolveWebResourceRef(getElemOrArray(a.target)[0]);
            if (webRes.type != selectedResource?.type ||
                (selectedResource?.type == 'SpecificResource' &&
                    webRes.type == 'SpecificResource' &&
                    selectedResource.source != webRes.source) ) {
                selectedResource = webRes;
                scrollableRef = undefined;
                secondaryResources = [];
            }

            return [annotations, selectedResource, scrollableRef, a, secondaryResources]
        });
    }, [displayRef]);

    const highlightAnnotationCb = useCallback((a?: Annotation) => {
        displayRef?.highlightAnnotation && displayRef.highlightAnnotation(a);
        //setHighLightedAnnotations(a ? [a] : []);
    }, [displayRef]);

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
                setTuple( ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) => {
                    let newResources = [...secondaryResources];
                    newResources.splice(existingResourceIdx, 1, res);
                    return [annotations, selectedResource, scrollableRef, selectedAnnotation, newResources];
                })
            } else {
                setTuple( ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) => {
                    return [annotations, selectedResource, scrollableRef, selectedAnnotation, [...secondaryResources, res]];
                })
            }

        }

    }, []);

    const annotationsContext = useMemo<AnnotationsContext>(() => ({
        annotations,
        onEditAnnotation: setEditedAnnotation,
        onDeleteAnnotation: (a) => annotationContainer.deleteAnnotation(a),
        onSelectAnnotation: displaySecondaryResourceCb,
        highlightedAnnotations: selectedAnnotation ? [selectedAnnotation] : []
    }), [annotations, setEditedAnnotation, annotationContainer, displaySecondaryResourceCb, selectedAnnotation])

    const setRef = useCallback(
        (ref: AnnotationDisplayRef) => setTuple(
            ([annotations, selectedResource, scrollableRef, selectedAnnotation, secondaryResources]) =>
                [annotations, selectedResource, ref || undefined, selectedAnnotation, secondaryResources]
        ),
        []);


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
                <AnnotationList annotations={annotations}
                                onSelectAnnotation={selectAnnotationCb}
                                onHighlightAnnotation={highlightAnnotationCb}
                                displayedResource={selectedResource}
                />
            </div>}
            <div className="resource-viewer">
                <div className="resource-url-input">
                    <Input value={selectedResource?.type == 'SpecificResource' ? selectedResource?.source : ''}
                           placeholder="URL of the resource to annotate"
                           onChange={(e) => setDisplayedResources(resolveWebResourceRef(e.currentTarget.value))}
                           style={{width: '100%'}}/>
                    {selectedResource?.type == 'SpecificResource' ?
                        <span className="icon-action"  title="Open in browser tab" style={{position: "absolute", right: '5px'}}><OpenInNewIcon onClick={() => {
                            window.open(selectedResource?.source, "blank")
                        }}/></span> : null
                    }

                </div>
                {selectedResource ?
                    <div>
                    <AnnotationViewer resource={selectedResource}
                                      ref={setRef}
                                      fetchOptions={appContext.fetchOptions}
                                      annotationsContext={annotationsContext}
                    />
                <PromiseContainer promise={aiAssistant$}>
                    {(aiAssistant) => aiAssistant ?
                        <div onClick={() => setShowAssistant( prevValue => !prevValue)} className="icon-action" style={{position: "absolute", right: "5px", bottom: "5px"}}><AssistantIcon /></div> :
                        null}
                </PromiseContainer>
                    </div> : null}
                {showAssistant ? <PromiseContainer promise={aiAssistant$}>
                    {(aiAssistant) => <div>
                    <TextField
                        fullWidth={true}
                        multiline
                        minRows={2}
                        maxRows={5}
                        onKeyDown={async (e) => {
                            if(e.keyCode == 13){
                                const text = displayRef?.getText && await displayRef.getText();

                                console.log("AI Assistant: Text analyzed:");
                                console.log(text);

                                if (text && aiAssistant && displayRef.selectorFromFulltextRange && selectedResource && selectedResource.type == 'SpecificResource') {
                                    const results = await aiAssistant.annotate(text, (e.target as any).value);

                                    const annotations = results.map(r => (fixAnnotation({
                                        target: {...selectedResource, selector: displayRef.selectorFromFulltextRange!(r.offset, r.offset + r.length)},
                                        body: {
                                            type: 'TextualBody',
                                            value: r.summary
                                        }
                                    })));

                                    setTempAnnotations(annotations);
                                    console.log(JSON.stringify(annotations, null, 2))
                                }
                                (e.target as any).value = "";
                            }
                        }}
                    />
                    </div>}</PromiseContainer>
                    : null}
                {secondaryResources.length ? <div className="secondary-resources">
                    {secondaryResources.map(res => <div className="secondary-resource" key={res.source}>
                        <div className="secondary-resource-url">{res.source}</div>
                        <AnnotationViewer resource={res}
                                          //ref={setScrollableRef}
                                          fetchOptions={appContext.fetchOptions}
                                          annotationsContext={{...annotationsContext}}
                        />
                    </div>)}
                </div> : null}
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

export const AnnotationList = (props: {
    annotations: Annotation[],
    onSelectAnnotation: (a: Annotation) => void,
    onHighlightAnnotation: (a?: Annotation) => void,
    displayedResource?: WebResource
}) => {
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

    const selectedUrl = props.displayedResource && props.displayedResource.type == 'SpecificResource' && props.displayedResource.source;

    return <div className="annotations-list">
        {Object.entries(annotationsByTarget).map(([target, anns]) =>
            <div key={target} className="annotations-list-target">
                <div className={classNames("annotations-list-target-name", {selected: selectedUrl == target})}
                     title={target}>{target}</div>
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