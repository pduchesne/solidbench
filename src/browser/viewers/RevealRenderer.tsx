import React, {useEffect, useRef, useState } from "react";
//import "reveal.js/dist/reveal.css";
//import "reveal.js/dist/theme/black.css";

//@ts-ignore
import RevealCSS from "!!raw-loader!reveal.js/dist/reveal.css";
//@ts-ignore
import RevealThemeCSS from "!!raw-loader!reveal.js/dist/theme/solarized.css";

import Reveal from 'reveal.js';

//@ts-ignore
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.js';
//@ts-ignore
import RevealNotes from 'reveal.js/plugin/notes/notes.js';

import {loadFront} from 'yaml-front-matter';
import {PromiseStateContainer} from "@hilats/react-utils";
import {usePromiseFn} from "@hilats/react-utils/dist/cjs/promises";



const RevealRenderer = (props: { content: string, uri?: string }) => {

    const deckDivRef = useRef<HTMLDivElement>(null);
    const deckRef = useRef<Reveal.Api | null>(null);

    const {__content : mdString, ...yamlOptions} = loadFront(props.content.replace(/^\uFEFF/, ''));
    const {revealOptions, ...slideOptions} = yamlOptions;

    const theme = slideOptions.theme || 'black';

    const styleSheets$ = usePromiseFn(async () => {
        //@ts-ignore
        const themeCss = (await import("!!raw-loader!reveal.js/dist/theme/"+theme+".css")).default;
        const customCssUri = slideOptions.css && new URL(slideOptions.css, props.uri).toString();
        const customCss = customCssUri ? (await fetch(customCssUri).then(r => r.text())) : undefined;
        return [themeCss, customCss];
    }, [theme, slideOptions.css])

    useEffect(() => {
        if (!deckDivRef.current) return;

        // Prevents double initialization in strict mode
        if (deckRef.current) return;

        deckRef.current = new Reveal(deckDivRef.current, {
            plugins: [RevealMarkdown, RevealNotes],
            transition: "slide",
            embedded: true,
            controls: true,
            progress: true,
            markdown: {
                smartypants: true
            },
            ...revealOptions,
            // other config options
        });

        deckRef.current.initialize().then(() => {
            // good place for event handlers and plugin setups
        });

        return () => {
            try {
                if (deckRef.current) {
                    deckRef.current.destroy();
                    deckRef.current = null;
                }
            } catch (e) {
                console.warn("Reveal.js destroy call failed.");
            }
        };
    }, [deckDivRef.current, styleSheets$.status]);

    //TODO use slideOptions
    slideOptions;

    return <PromiseStateContainer promiseState={styleSheets$}>
        {(styleSheets) => {

            if (props.uri) {
                const bt = window.document.createElement("base");
                bt.setAttribute("href", props.uri);
                window.document.getElementsByTagName("head")[0].appendChild(bt);
            }

            return (
            <div className="reveal" ref={deckDivRef}>
                <style dangerouslySetInnerHTML={{__html: RevealCSS}}/>
                {styleSheets.map(css => css ? <style dangerouslySetInnerHTML={{__html: css}}/> : null)}

                <div className="slides">
                    <section data-markdown={""}
                             data-separator="^---"
                             data-separator-vertical="^--"
                             data-background-image={revealOptions['background-image']}
                    >
                        <script type="text/template" dangerouslySetInnerHTML={{__html: mdString}}/>
                    </section>
                </div>
            </div>
        )} }
    </PromiseStateContainer>
}


export const RevealRendererUrl = (props: { uri: string}) => {

    // WARN : this uses a plain fetch - it will not work on resources requiring authentication
    const contentString$ = usePromiseFn(async () => {
        return fetch(props.uri).then(r => r.text())
    }, [props.uri]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) => <RevealRenderer content={content}/>}
    </PromiseStateContainer>
}

export const RevealIframeContent = (props: {}) => {

    const [content, setContent] = useState<string>();

    // check for a uri param
    const params = new URLSearchParams(window.location.search)
    const uri = params.get('uri') || undefined;

    function onReceivedMessage(event: MessageEvent) {
        // see notes on checking the data type
        if (event.data?.type == 'reveal-content')
            setContent(event.data.content);
    }

    // Listen for a {content: string, type: 'reveal-content'} event that will set the reveal.markdown content
    useEffect(function () {
        window.addEventListener("message", onReceivedMessage);

        return function () {
            window.removeEventListener("message", onReceivedMessage);
        };
    });

    // if the content has been set with a postMessage, use it
    // otherwise fallback on the provided uri, if any, and use the RevealRendererUrl to fetch and render the content
    return content ? <RevealRenderer content={content} uri={uri}/> :
        uri ? <RevealRendererUrl uri={uri}/> :
        <span>"Loading content"</span>;
}

export default RevealRenderer;