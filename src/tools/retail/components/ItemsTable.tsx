import {ItemWithHistory, Receipt} from "../model";
import {useContext, useEffect, useMemo, useRef} from "react";
import {AppContext} from "../../../appContext";
import * as React from "react";
import {FrequencyBar} from "./Overview";
import {Route, Routes, useLocation, useParams} from "react-router-dom";
import ReactEcharts, { EChartsOption, OptionSourceData } from "../../../ui/echarts";
import {usePersistentQueryNavigate} from "../../../ui/hooks";

import classNames from "classnames";
import {getEcoscore, getNutriscore} from "../off";

export const ItemsTableRoutes = (props: { receipts: Array<Receipt> }) => {
    return <Routes>
        <Route path="/:itemId" element={<ItemsTable {...props} />} />
        <Route path="*" element={<ItemsTable {...props} />} />
    </Routes>
}

export const ItemsTable = (props: { receipts: Array<Receipt> }) => {
    const { state } = useLocation();
    const { noscroll } = state || {};

    let { itemId } = useParams();
    const navigate = usePersistentQueryNavigate();

    const [items, sortedReceipts] = useMemo(() => {
        const items: Record<string, ItemWithHistory> = {};
        props.receipts.forEach(r => {
            r.items?.forEach(i => {
                if (i.article.vendorId in items) {
                    items[i.article.vendorId].history.push({...i, receiptId: r.id, date: r.date});
                } else {
                    items[i.article.vendorId] = {
                        id: i.article.vendorId,
                        label: i.article.label,
                        gtin: i.article.gtin,
                        history: [{...i, receiptId: r.id, date: r.date}]
                    }
                }
            })
        });

        return [
            Object.values(items).sort((i1, i2) => i2.history.length - i1.history.length),
            props.receipts.sort((r1, r2) => r1.date.localeCompare(r2.date))
        ]
    }, [props.receipts]);

    //const [selectedItem, setSelectedItem] = useState(items[0].id);
    const selectedItem = items.find(i => i.id == itemId);
    function setSelectedItem(id: string) {id && navigate((itemId? '../' : '') + encodeURIComponent(id), {state: {noscroll: true}})};

    const selectedRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!noscroll && selectedRef.current)
            selectedRef.current.scrollIntoView({behavior: 'smooth'})
    }, [!noscroll && selectedRef.current]);
    return <div className='itemsTable'>
        <div className='itemsList'>
            {items.map((i, idx) =>
                <div key={i.id} onClick={() => setSelectedItem(i.id)}
                     className={classNames({selected: selectedItem?.id == i.id, actionableItem: true})}
                     ref={selectedItem?.id == i.id ? selectedRef : undefined}>
                    <FrequencyBar width='3em' freq={i.history.length} maxFreq={items[0].history.length}/>
                    <span style={{width: "1em", display: 'inline-block'}}>{i.gtin ? <img src="/images/logos/open-food-facts.svg"/> : null}</span>
                    {i.label}
                </div>)}
        </div>
        {selectedItem ? <ItemDetails item={selectedItem} dateRange={[sortedReceipts[0].date, sortedReceipts[props.receipts.length - 1].date]}/> : null}

    </div>
}


function ItemDetails(props:{item: ItemWithHistory, dateRange: [string, string]}) {

    const navigate = usePersistentQueryNavigate();

    const ctx = useContext(AppContext);
    const {item, dateRange} = props;

    const chartOptions = useMemo(() => {
        const options: EChartsOption = {
            legend: {},
            tooltip: {
                trigger: 'axis',
            },
            dataset: {
                dimensions: ['date', 'quantity', 'unitPrice'],
                source: item.history as OptionSourceData
            },
            xAxis: {
                type: 'time',
                min: dateRange[0],
                max: dateRange[1]
                //boundaryGap: false
            },
            yAxis: [{
                name: 'Quantity',
                type: 'value',
                position: 'left',
                //boundaryGap: [0, '100%']
            },
                {
                    name: 'Unit Price',
                    type: 'value',
                    position: 'right',
                    //boundaryGap: [0, '100%'],
                    axisLabel: {
                        formatter: '{value}€'
                    }
                }],
            series: [
                {
                    tooltip: {},
                    yAxisIndex: 1,
                    name: 'Unit Price',
                    type: 'line',
                    //smooth: true,
                    symbol: 'none',
                    //data: item.history.map(h => [h.date, h.unitPrice])
                    dimensions: [
                        'date',
                        'unitPrice'
                    ]
                },
                {
                    id: 'purchases',
                    name: 'Purchases',
                    type: 'bar',
                    yAxisIndex: 0,
                    //data: item.history.map(h => [h.date, h.quantity])
                    dimensions: [
                        'date',
                        'quantity'
                    ]
                }
            ]
        };

        return options;
    }, [item]);

    const eventHandlers = useMemo(() => ({
        'click': (evt: any) => {
            if (evt.seriesId == 'purchases') {
                navigate('../../receipts/'+encodeURIComponent(evt.value.receiptId))
            }
            //console.log(JSON.stringify(evt, getCircularReplacer()));
        }
    }), []);

    const nutriscore = getNutriscore(item.gtin);
    const ecoscore = getEcoscore(item.gtin);

    return <div className='itemsDetails'>
        <h2>{item.label}</h2>
        <div>
            <table style={{display: "inline-block"}}>
                <tbody>
                <tr>
                    <td>Vendor Id</td>
                    <td><a href={'https://www.colruyt.be/fr/produits/' + item.id} target='_blank'>{item.id}</a></td>
                </tr>
                {item.gtin ?
                    <tr>
                        <td>GTIN</td>
                        <td><a href={'https://openfoodfacts.org/product/' + item.gtin} target='_blank'>{item.gtin}</a>
                        </td>
                    </tr> : null}
                </tbody>
            </table>
            {(nutriscore && nutriscore != 'not-applicable') ? <img style={{height: "2.5em", margin: "0px 10px"}} src={'/images/logos/Nutri-score-' + nutriscore.toUpperCase() + '.svg'}/> : null}
            {(ecoscore && ecoscore != 'not-applicable')? <img style={{height: "2.5em", margin: "0px 10px"}} src={'/images/logos/ecoscore-' + ecoscore.toLowerCase() + '.svg'}/> : null}
        </div>
        <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions} onEvents={eventHandlers}/>
    </div>
}

export default ItemsTableRoutes;