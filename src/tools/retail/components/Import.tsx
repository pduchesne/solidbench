import React, {FC, useCallback, useContext, useMemo, useState} from "react";
import {Receipt, VendorArticle} from "../model";
import { ColruytPanel } from "../retailers/colruyt/ImportPanel";
import { DelhaizePanel } from "../retailers/delhaize/ImportPanel";
import { AmazonPanel } from "../retailers/amazon/ImportPanel";
import {toast} from "react-toastify";
import {PodRetailStorage} from "../storage";
import {AppContext} from "../../../appContext";
import {useFixedSolidSession} from "../../../solid/SessionProvider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccordionDetails from "@mui/material/AccordionDetails";
import Dropzone from "react-dropzone";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Box from "@mui/material/Box/Box";
import {FormattedDate} from "./Overview";
import Button from "@mui/material/Button/Button";
import {ReceiptsTable} from "./ReceiptsTable";

/**
 * Import UI components for specific retailers
 */
const RETAILERS: Record<string, {
    label: string,
    comp: FC<{ onImport: (receipts: Receipt[]) => void }>
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

export const FileDrop = (props: { text?: string, onData: (blob: Blob) => void }) => {
    return <>
        <Dropzone onDrop={acceptedFiles => props.onData(acceptedFiles[0])}>
            {({getRootProps, getInputProps}) => (
                <div {...getRootProps()} className="filedrop">
                    <input {...getInputProps()} />
                    <p style={{textAlign: 'center'}}>
                        <UploadFileIcon style={{fontSize: '4em'}}/><br/>
                        {props.text || "Drop file or click here"}
                    </p>
                </div>
            )}
        </Dropzone>
    </>
}

export function getUniqueItems(receipts: Receipt[]) {
    const items: Record<string, VendorArticle> = {};

    receipts.forEach(r => {
        r.items.forEach(i => {
            if (!(i.article.vendorId in items)) {
                items[i.article.vendorId] = i.article
            }
        })
    })

    return items;
}

export const ImportResult = (props: { receipts: Receipt[], onImport: (receipts: Receipt[]) => void }) => {

    const uniqueItems = useMemo(() => getUniqueItems(props.receipts), [
        props.receipts
    ])

    const [receiptId, setReceiptId] = useState<string>();

    return <Box className="vFlow">
        <div>
            Imported {props.receipts.length} receipts, containing {Object.keys(uniqueItems).length} unique articles, from <FormattedDate isoDate={props.receipts[0].date}/> to <FormattedDate
            isoDate={props.receipts[props.receipts.length - 1].date}/>.
            <Button onClick={() => props.onImport(props.receipts)}>Save receipts in my Pod</Button>
        </div>
        <ReceiptsTable receipts={props.receipts} receiptId={receiptId} onChange={setReceiptId}/>
    </Box>
}

const ImportPanel = (props: {}) => {

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const [expanded, setExpanded] = React.useState<string | undefined>(Object.keys(RETAILERS)[0]);

    const retailStorage = useMemo(() => {
            if (appContext.podUrl) {
                return new PodRetailStorage(appContext.podUrl, {fetch});
            } else
                return undefined;
        },
        [appContext.podUrl, fetch]);

    const importCallback = useCallback((receipts: Receipt[]) => {
        if (expanded) {
            if (retailStorage) {
                const response$ = retailStorage.saveHistory(receipts, expanded);
                toast.promise(response$, {
                    pending: "Saving receipts data"
                })
            } else {
                toast.warn("Please log in to your Pod to be able to save data");
            }
        }

    }, [retailStorage, expanded]);

    const handleSectionChange = (value?: string) => setExpanded(value == expanded ? undefined : value);

    return <div className="dataproviders">
        {Object.entries(RETAILERS).map(([retailer, config]) => {
            return <Accordion expanded={expanded === retailer} onChange={() => handleSectionChange(retailer)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><h3>{config.label}</h3></AccordionSummary>
                <AccordionDetails>
                    <config.comp onImport={importCallback}/>
                </AccordionDetails>
            </Accordion>
        })}
    </div>


    /*
                return <div key={retailer}
                        className={classNames('providerCard', {'selected': upload.retailer == retailer})}>
                {config.label}
                <FileDrop onData={(blob) => setUpload({retailer, blob})}/>
            </div>

    return <div>
        <div className="hFlow dataproviders">

        </div>

        {UploadComp ? <div className="uploader"><UploadComp blob={upload.blob} onImport={importCallback}/></div> : null}
    </div>
    */

}

export default ImportPanel;