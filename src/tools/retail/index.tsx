import * as React from "react";
import {ReactNode, useContext, useMemo, useState} from "react";
import {GlobalWorkerOptions} from 'pdfjs-dist';
// @ts-ignore
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

GlobalWorkerOptions.workerSrc = PdfjsWorker;

import TabContext from "@mui/lab/TabContext/TabContext";
import TabList from "@mui/lab/TabList/TabList";
import TabPanel from "@mui/lab/TabPanel/TabPanel";

import {ReceiptWithRetailer} from "./model";
import {MemoryReceiptsStorage, PodRetailStorage} from "./storage";
import {AppContext} from "../../appContext";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import ExpensesChart from "./components/ExpensesChart";
import ItemsTable from "./components/ItemsTable";
import ReceiptsTable from "./components/ReceiptsTable";
import Overview from "./components/Overview";
import {Navigate, Route, Routes, useLocation, useParams, useSearchParams} from "react-router-dom";
import Tab from "@mui/material/Tab/Tab";
import Select from "@mui/material/Select/Select";
import OutlinedInput from "@mui/material/OutlinedInput/OutlinedInput";
import MenuItem from "@mui/material/MenuItem/MenuItem";
import Box from "@mui/material/Box/Box";
import Chip from "@mui/material/Chip/Chip";
import {usePersistentQueryNavigate} from "../../ui/hooks";
import Import from "./components/Import";
import {useFixedSolidSession} from "../../solid/SessionProvider";

export const RetailDashboardRoutes = () => {

    const {search} = useLocation();

    return <Routes>
        <Route path="/:panelId/*" element={<ShoppingDashboard/>}/>
        <Route path="*" element={<Navigate to={"overview" + decodeURIComponent(search)} replace={true}/>}/>
    </Routes>
}

// This is necessary to embed regular DOM elements
const RemoveDomProps = (props: { children: ReactNode }) => <>{props.children}</>;

export const ShoppingDashboard = (props: {}) => {

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const podStorage = useMemo(
        () => appContext.podUrl ? new PodRetailStorage(appContext.podUrl, {fetch}) : undefined,
        [appContext.podUrl, fetch]);

    const [params] = useSearchParams();
    const externalInputs = params.getAll('input');

    const memoryStorage = useMemo(
        () => externalInputs?.length ? new MemoryReceiptsStorage({uris: externalInputs}) : undefined,
        // must concat array to have a constant value across renderings
        [externalInputs.join(',')]);

    //const preferences$ = useMemo(() => retailStorage?.fetchPreferences(), [retailStorage]);

    const receiptsStorage = memoryStorage || podStorage;

    const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);

    // TODO const history$ = useMemo(async () => selectedRetailers.length ? Promise.all(selectedRetailers.map(retailer => props.retailStorage.fetchHistory(retailer))) : [] as Receipt[][], [props.retailStorage, selectedRetailers]);
    const histories$ = usePromiseFn(async () => {
            if (receiptsStorage) {
                const retailers = await receiptsStorage.listRetailers();
                setSelectedRetailers(retailers);

                if (retailers?.length) {
                    const histories = await receiptsStorage.fetchHistories(retailers)
                        .then(receiptMap => Object.entries(receiptMap).reduce<ReceiptWithRetailer[]>((result, [retailer, receipts]) => {
                            result.push(...receipts.map<ReceiptWithRetailer>(r => ({...r, retailer})));
                            return result;
                        }, []))

                    return [retailers, histories] as [string[], ReceiptWithRetailer[]];
                } else {
                    return [[], []] as [string[], ReceiptWithRetailer[]];
                }
            } else {
                return undefined;
            }
        },
        [receiptsStorage]);


    const navigate = usePersistentQueryNavigate();
    let {panelId} = useParams();
    const tab = ((panelId == 'import' || histories$.result) && panelId) || 'overview';

    //const [tab, setTab] = useState('overview');

    const receipts = useMemo(() => {
        return histories$.result && histories$.result[1].filter(r => selectedRetailers.indexOf(r.retailer) >= 0)
    }, [histories$.result, selectedRetailers])

    return <>
        <Box className="retail">
            <TabContext value={tab}>
                <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                    <TabList style={{flex: '1 1 100%'}} onChange={(e, value) => navigate('../' + value)}>
                        <Tab label="Overview" value="overview"/>
                        <Tab label="Receipts" value="receipts" disabled={!receipts}/>
                        <Tab label="Frequent Items" value="frequent" disabled={!receipts}/>
                        <Tab label="Expenses" value="expenses" disabled={!receipts}/>
                        <Tab label="Import" value="import"/>
                        <RemoveDomProps>
                            <>
                                <div style={{flex: 1}}></div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        disabled={!histories$.result}
                                        sx={{'& .MuiSelect-select': {padding: "5px 6px"}}}
                                        style={{margin: '5px', float: 'inline-end'}}
                                        multiple
                                        value={selectedRetailers}
                                        onChange={(evt) => {
                                            setSelectedRetailers(typeof evt.target.value === 'string' ? evt.target.value.split(',') : evt.target.value);
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
                                        {histories$.result ? histories$.result[0].map((name) => (
                                            <MenuItem
                                                key={name}
                                                value={name}
                                            >
                                                {name}
                                            </MenuItem>
                                        )) : null}
                                    </Select>
                                </div>
                            </>
                        </RemoveDomProps>
                    </TabList>

                </Box>
                <TabPanel value="overview" className='vFlow'>
                    <PromiseStateContainer promiseState={histories$}>
                        {(history) => (history && history[0].length) ?
                            <Overview receipts={history[1]}/> :
                            (podStorage ? <div className="paddedPanel">
                                No retail data has been found in your pod. Use the Import tool to bring your
                                personal retail data into your pod, or find it yourself using the pod browser.
                            </div> : <div className="paddedPanel">
                                Please log in to your pod to view the retail data in your pod, or use the Import
                                tool to import and view some retailer data. (it will not be persisted unless you log
                                in to your pod though)
                            </div>)}
                    </PromiseStateContainer>

                </TabPanel>
                {receipts ?
                    <TabPanel value="receipts" className='vFlow'><ReceiptsTable receipts={receipts}/></TabPanel> : null}
                {receipts ?
                    <TabPanel value="frequent" className='vFlow'><ItemsTable receipts={receipts}/></TabPanel> : null}
                {receipts ?
                    <TabPanel value="expenses" className='vFlow'><ExpensesChart receipts={receipts}/></TabPanel> : null}
                <TabPanel value="import" className='vFlow'><Import/></TabPanel>
            </TabContext>
        </Box></>

}

export default RetailDashboardRoutes;
