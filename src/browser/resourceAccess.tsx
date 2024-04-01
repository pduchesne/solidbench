import {AccessModes, WithServerResourceInfo} from "@inrupt/solid-client";
import * as React from "react";
import {useState} from "react";
import {Button, Checkbox, FormControlLabel} from "@mui/material";

import {PromiseStateContainer} from "@hilats/react-utils";
import {UniversalAccessForm, useUniversalAccess} from "./access_universal";
import {AclAccessForm, useAclAccess} from "./access_acl";
import {AcrAccessForm, useAcrAccess} from "./access_acr";


// ACP - ACR
export const UniversalAccessMetadata = (props: {
    resourceInfo: WithServerResourceInfo,
    resourceUrl: string,
    onUpdate: () => void,
    fetch?: typeof fetch
}) => {
    const universalAccess = useUniversalAccess(props.resourceUrl, props.fetch);

    const aclAccess = useAclAccess(props.resourceUrl, props.fetch);
    const acrAccess = useAcrAccess(props.resourceUrl, props.fetch);

    return (
        <div>
            <PromiseStateContainer promiseState={universalAccess.access$}>
                {(accessInfo) => <UniversalAccessForm public={accessInfo.pub} accessModes={accessInfo.agents}
                                                      onChangePublic={(access) => universalAccess.setPublic(access)}
                                                      onChange={(entity, access) => universalAccess.setAccessModes(entity, access)}/>
                }
            </PromiseStateContainer>
            <PromiseStateContainer promiseState={aclAccess.resInfo$}>
                {(resInfo) =>
                    resInfo ? <AclAccessForm resInfo={resInfo} onChangePublic={(access) => aclAccess.setPublic(access)}
                                   onChange={(entity, access) => aclAccess.setAccessModes(entity, access)}/> : null

                }
            </PromiseStateContainer>
            <PromiseStateContainer promiseState={acrAccess.resInfo$}>
                {(resInfo) => <>
                    <AcrAccessForm resInfo={resInfo}
                                   onChangePublic={(access) => acrAccess.setPublic(access)}
                                   onChange={(entity, access) => acrAccess.setAccessModes(entity, access)} />
                </>
                }
            </PromiseStateContainer>
        </div>
    );
};



export const AccessModesDisplay = (props: {
    currentModes: AccessModes
}) => {

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
