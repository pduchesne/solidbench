import React, {Suspense, lazy, useCallback, useMemo, useState} from "react";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";

import {createPortal} from "react-dom";

const RevealRenderer = lazy(() => import('./RevealRenderer'));

export const RevealViewer = (props: { uri?: string, content: Blob | string, type?: string }) => {

    const contentString$ = usePromiseFn(async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <div className="reveal-viewport"><PromiseStateContainer promiseState={contentString$}>
        {(content) => <RevealViewerIFrame content={content} uri={props.uri}/>}
    </PromiseStateContainer></div>
}

/**
 * RevealViewer that renders the content directly in an inline react component
 */
export const RevealViewerInline = (props: { content: string, uri?: string }) => {
    return <RevealRenderer content={props.content}/>
}

/**
 * RevealViewer that uses a react portal to inject into an inline iframe
 */
export const RevealViewerPortal = (props: { content: string, uri?: string }) => {


    const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
    const mountNode = contentRef?.contentWindow?.document?.body

    return <div className="reveal-container">
        <iframe ref={setContentRef} style={{height: "100%", width: "100%"}}>
            {mountNode && createPortal(<>
                {/* <head>
                <style dangerouslySetInnerHTML={{__html: RevealCSS}}/>
                <style dangerouslySetInnerHTML={{__html: RevealThemeCSS}}/>
            </head>*/}
                <Suspense>
                    <RevealRenderer content={props.content}/>
                </Suspense>
            </>, mountNode)}
        </iframe>
    </div>

}

/**
 * RevealViewer that uses the dedicated reveal.html endpoint to render the content in an isolated browser scope
 * This avoids having a mix of the solidbench artifacts and the reveal artifacts (styles, global variables injected by various modules, ...)
 */
export const RevealViewerIFrame = (props: { content: string, uri?: string }) => {
    const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);

    // if a url is present, pass it to the reveal.html endpoint
    // this is redundant with setting the content with postmessage below, but may be needed to enable reveal Notes
    // TODO is this needed ?
    const revealPageUrl = useMemo(() => props.uri?
            new URL("/reveal.html?uri="+encodeURIComponent(props.uri), origin).toString():
            new URL("/reveal.html", origin).toString()
        , [props.uri]);

    // When the iframe is loaded, pass the potential authenticated fetch, and set the base href attribute of the iframe doc
    const onLoaded = useCallback( () => {
        if (contentRef) {
            if (contentRef.contentWindow) {
                contentRef.contentWindow.fetch = (url, request) => {
                    // TODO pass the authenticated fetch
                    return fetch(url, request);
                }

                // set the base href - this is required to be able to resolve hrefs relatively to the markdown files
                if (contentRef.contentDocument && props.uri) {
                    const base = contentRef.contentDocument.createElement("base");
                    base.setAttribute("href", props.uri);

                    // TODO Temporarily disabled
                    //contentRef.contentDocument.getElementsByTagName("head")[0].appendChild(base);
                }

            }

            // send the content using postMessage
            contentRef.contentWindow?.postMessage({content: props.content, type: "reveal-content"}, revealPageUrl);
        }
    }, [contentRef?.contentWindow, props.content, props.uri])

    return <iframe onLoad={onLoaded}
                   ref={setContentRef}
                   style={{height: "100%", width: "100%", margin: 0}}
                   src={revealPageUrl} />

}

export default RevealViewer;