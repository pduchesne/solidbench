import * as React from "react";
import {FC, useCallback, useContext, useMemo, useState} from "react";
import {GlobalWorkerOptions} from 'pdfjs-dist';
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

GlobalWorkerOptions.workerSrc = PdfjsWorker;

import {TabContext, TabList, TabPanel} from '@mui/lab';

import {Receipt, ReceiptWithRetailer} from "./model";
import {RetailStorage} from "./storage";
import {useSession} from "@inrupt/solid-ui-react";
import {AppContext} from "../../appContext";
import {ErrorBoundary, PromiseContainer} from "@hilats/react-utils";
import {ColruytPanel} from "./retailers/colruyt/ImportPanel";
import Dropzone from "react-dropzone";
import classNames from "classnames";
import {AmazonPanel} from "./retailers/amazon/ImportPanel";
import {DelhaizePanel} from "./retailers/delhaize/ImportPanel";
import ExpensesChart from "./components/ExpensesChart";
import ItemsTable from "./components/ItemsTable";
import ReceiptsTable from "./components/ReceiptsTable";
import Overview from "./components/Overview";
import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import Tab from "@mui/material/Tab/Tab";
import Select from "@mui/material/Select/Select";
import OutlinedInput from "@mui/material/OutlinedInput/OutlinedInput";
import MenuItem from "@mui/material/MenuItem/MenuItem";
import Box from "@mui/material/Box/Box";
import Chip from "@mui/material/Chip/Chip";

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


export const RetailDashboardRoutes = () => {

    const {search} = useLocation();

    return <Routes>
        <Route path="/:panelId/*" element={<RetailDashboard />} />
        <Route path="*" element={<Navigate to={"overview"+decodeURIComponent(search)} replace={true} />} />
    </Routes>
}

export const RetailDashboard = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    const retailStorage = useMemo(() => appContext.podUrl ? new RetailStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => retailStorage?.fetchPreferences(), [retailStorage]);


    const [upload, setUpload] = useState<{ retailer: string, blob: Blob } | { retailer?: undefined }>({});
    const UploadComp = upload.retailer && RETAILERS[upload.retailer].comp;

    const importCallback = useCallback((receipts: Receipt[]) => {
        (upload.retailer && retailStorage) && retailStorage.saveHistory(upload.retailer, receipts);
    }, [retailStorage, upload.retailer]);

    return <div className="retail">
        <div className="hFlow dataproviders">
            {Object.entries(RETAILERS).map(([retailer, config]) => {
                return <div key={retailer}
                            className={classNames('providerCard', {'selected': upload.retailer == retailer})}>
                    {config.label}
                    <FileDrop onData={(blob) => setUpload({retailer, blob})}/>
                </div>
            })}
        </div>
        {UploadComp ?
            /* *Display retailer importer */
            <div className="uploader"><UploadComp blob={upload.blob} onImport={importCallback}/></div> :

            /* Display currenty history*/
            <ErrorBoundary>
                {retailStorage ? <ShoppingDashboardContainer retailStorage={retailStorage}/> : null}
            </ErrorBoundary>
        }
    </div>
}


export const FileDrop = (props: { onData: (blob: Blob) => void }) => {

    return <>
        <Dropzone onDrop={acceptedFiles => props.onData(acceptedFiles[0])}>
            {({getRootProps, getInputProps}) => (
                <section>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                </section>
            )}
        </Dropzone>
    </>
}


export const ShoppingDashboardContainer = (props: { retailStorage: RetailStorage }) => {


    // TODO const history$ = useMemo(async () => selectedRetailers.length ? Promise.all(selectedRetailers.map(retailer => props.retailStorage.fetchHistory(retailer))) : [] as Receipt[][], [props.retailStorage, selectedRetailers]);
    const histories$ = useMemo(async () => {
            const retailers = await props.retailStorage.listRetailers();
            const histories = await props.retailStorage.fetchHistories(retailers)
                .then(receiptMap => Object.entries(receiptMap).reduce<ReceiptWithRetailer[]>((result, [retailer, receipts]) => {
                    result.push(...receipts.map<ReceiptWithRetailer>(r => ({...r, retailer})));
                    return result;
                }, []))

            return [retailers, histories] as [string[], ReceiptWithRetailer[]];
        },
        [props.retailStorage]);

    return <PromiseContainer promise={histories$}>{([retailers, histories]) => retailers ?
            <ShoppingDashboard receipts={histories} retailers={retailers}/> :
            <div>No retailer history found</div>}
        </PromiseContainer>

}


export const ShoppingDashboard = (props: { receipts: Array<ReceiptWithRetailer>, retailers: string[] }) => {

    const navigate = useNavigate();
    let { panelId } = useParams();
    const tab = panelId || 'overview';

    //const [tab, setTab] = useState('overview');

    const [selectedRetailers, setSelectedRetailers] = useState<string[]>(props.retailers);

    const receipts = useMemo(() => {
        return props.receipts.filter(r => selectedRetailers.indexOf(r.retailer) >= 0);
    }, [props.receipts, selectedRetailers])

    return <>
        <Box className="vFlow">
            <TabContext value={tab}>
                <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                    <TabList style={{display: 'inline-flex'}} onChange={(e, value) => navigate('../'+value)} aria-label="lab API tabs example">
                        <Tab label="Overview" value="overview"/>
                        <Tab label="Receipts" value="receipts"/>
                        <Tab label="Frequent Items" value="frequent"/>
                        <Tab label="Expenses" value="expenses"/>
                    </TabList>
                    <Select
                        sx={{'& .MuiSelect-select': {padding: "5px 6px"}}}
                        style={{margin: '5px', float: 'inline-end'}}
                        multiple
                        value={selectedRetailers}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(evt) => {
                            setSelectedRetailers(typeof evt.target.value === 'string' ? evt.target.value.split(',') : evt.target.value);
                            evt.stopPropagation();
                        }}
                        input={<OutlinedInput id="select-multiple-chip" label="Retailer"/>}
                        renderValue={(selected) => (
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                {selectedRetailers.map((value) => (
                                    <Chip key={value} label={value}/>
                                ))}
                            </Box>
                        )}
                    >
                        {props.retailers.map((name) => (
                            <MenuItem
                                key={name}
                                value={name}
                            >
                                {name}
                            </MenuItem>
                        ))}
                    </Select>

                </Box>
                <TabPanel value="overview" className='vFlow'><Overview receipts={receipts}/></TabPanel>
                <TabPanel value="receipts" className='vFlow'><ReceiptsTable receipts={receipts}/></TabPanel>
                <TabPanel value="frequent" className='vFlow'><ItemsTable receipts={receipts}/></TabPanel>
                <TabPanel value="expenses" className='vFlow'><ExpensesChart receipts={receipts}/></TabPanel>
            </TabContext>
        </Box></>

}


