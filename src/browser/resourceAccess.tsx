import {
    AccessModes,
    AclDataset,
    WithAcp,
    WithServerResourceInfo
} from "@inrupt/solid-client";
import {useState} from "react";
import {Button, Checkbox, FormControlLabel} from "@mui/material";
import * as React from "react";

import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {getAccessInfo} from "@hilats/solid-utils";



// ACP - ACR
export const UniversalAccessMetadata = (props: { resourceInfo: WithServerResourceInfo, resourceUrl: string, fetch?: typeof fetch }) => {

    const accessInfo$ = usePromiseFn(
        async () => {
            const accInfo = getAccessInfo(props.resourceInfo, {fetch: props.fetch});
            return accInfo;
        },
        [props.resourceInfo, props.fetch]
    )

    return (
        <div>
            <PromiseStateContainer promiseState={accessInfo$}>
                {(accessInfo: {
                    acl?: {
                        resourceAcl?: AclDataset;
                        fallbackAcl?: AclDataset;
                    };
                    acr?: WithAcp;
                    universal?: Record<string, AccessModes>;
                }) => <>
                    {accessInfo.acl ? <AclAccessForm acl={accessInfo.acl}/> : null}
                    {accessInfo.acr ? <AcrAccessForm acr={accessInfo.acr.internal_acp.acr}/> : null}
                    {accessInfo.universal ? <UniversalAccessForm accessModes={accessInfo.universal}/> : null}
                </>
                }
            </PromiseStateContainer>
        </div>
    );
};


export const UniversalAccessForm = (props: { accessModes: Record<string, AccessModes> }) => {

    return (
        <div>
            {JSON.stringify(props.accessModes)}
        </div>
    );
};


export const AclAccessForm = (props: { acl: {
        resourceAcl?: AclDataset;
        fallbackAcl?: AclDataset;
    } }) => {

    return (
        <div>
            {JSON.stringify(props.acl)}
        </div>
    );
};

export const AcrAccessForm = (props: { acr: Object | null }) => {

    return (
        <div>
            {JSON.stringify(props.acr)}
        </div>
    );

    /*
    return (
        <div>
            {props.acpAccess.publicAccess ?
                <div>Public : <AccessModesDisplay currentModes={props.acpAccess.publicAccess}/></div> : null}
            <div>Agents :
                {props.acpAccess.agentAccess && Object.entries(props.acpAccess.agentAccess).map(([agentUri, modes]) => <div>
                    {agentUri} : {JSON.stringify(modes)}
                </div>)}
            </div>
        </div>
    );

     */
};


export const AccessModesDisplay = (props: { currentModes: AccessModes }) => {

    const [isDirty, setIsDirty] = useState(false);
    const [modes, setModes] = useState(props.currentModes);
    setIsDirty
    return (
        <div>
            <FormControlLabel
                checked={modes.read}
                control={<Checkbox onChange={(e) => {
                    setModes({...modes, read: e.currentTarget.checked})
                }}/>}
                label="Read"
                labelPlacement="top"
            />
            <FormControlLabel
                checked={modes.write}
                control={<Checkbox/>}
                label="Write"
                labelPlacement="top"
            />
            <FormControlLabel
                checked={modes.append}
                control={<Checkbox/>}
                label="Append"
                labelPlacement="top"
            />
            <FormControlLabel
                checked={modes.controlRead}
                control={<Checkbox/>}
                label="Control Read"
                labelPlacement="top"
            />
            <FormControlLabel
                value={modes.controlWrite}
                control={<Checkbox/>}
                label="Control Write"
                labelPlacement="top"
            />

            {isDirty ? <Button>Save</Button> : null}
        </div>
    );
};
