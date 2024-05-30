import React, {FC, useCallback, useContext, useMemo, useState} from "react";
import classNames from "classnames";
import {FileDrop} from "../index";
import { Receipt } from "../model";
import { ColruytPanel } from "../retailers/colruyt/ImportPanel";
import { DelhaizePanel } from "../retailers/delhaize/ImportPanel";
import { AmazonPanel } from "../retailers/amazon/ImportPanel";
import {toast} from "react-toastify";
import {PodRetailStorage} from "../storage";
import {useSession} from "@inrupt/solid-ui-react";
import {AppContext} from "../../../appContext";

/**
 * Import UI components for specific retailers
 */
const RETAILERS: Record<string, {
    label: string,
    comp: FC<{ blob: Blob, onImport: (receipts: Receipt[]) => void }>
}> = {
    colruyt: {
        label: "Colruyt",
        comp: ColruytPanel
    },
    delhaize: {
        label: "Delhaize",
        comp: DelhaizePanel
    },
    amazon: {
        label: "Amazon",
        comp: AmazonPanel
    }
}

const ImportPanel = (props:{}) => {
    const [upload, setUpload] = useState<{ retailer: string, blob: Blob } | { retailer?: undefined }>({});
    const UploadComp = upload.retailer && RETAILERS[upload.retailer].comp;

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    const retailStorage = useMemo(() => {
            if (appContext.podUrl) {
                return new PodRetailStorage(appContext.podUrl, {fetch});
            } else
                return undefined;
        },
        [appContext.podUrl, fetch]);

    const importCallback = useCallback((receipts: Receipt[]) => {
        if (upload.retailer && retailStorage) {
            const response$ = retailStorage.saveHistory(receipts, upload.retailer);
            toast.promise(response$, {
                pending: "Saving receipts data"
            })
        }

    }, [retailStorage, upload.retailer]);


    return <div>
        <div className="hFlow dataproviders">
            {Object.entries(RETAILERS).map(([retailer, config]) => {
                return <div key={retailer}
                            className={classNames('providerCard', {'selected': upload.retailer == retailer})}>
                    {config.label}
                    <FileDrop onData={(blob) => setUpload({retailer, blob})}/>
                </div>
            })}
        </div>

        {UploadComp ? <div className="uploader"><UploadComp blob={upload.blob} onImport={importCallback}/></div> : null}
    </div>
}

export default ImportPanel;