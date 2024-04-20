import {Receipt, ReceiptItem} from "../model";
import {useContext, useMemo} from "react";
import {AppContext} from "../../../appContext";
import {EChartsOption} from "echarts";
import ReactEcharts from "echarts-for-react";
import * as React from "react";
import {FrequencyBar} from "./Overview";
import {Route, Routes, useParams} from "react-router-dom";
import {useNavigate} from "react-router";

type ItemWithHistory = {
    id: string,
    label: string,
    ean?: string,
    history: ReceiptItem[]
}


export const ItemsTableRoutes = (props: { receipts: Array<Receipt> }) => {
    return <Routes>
        <Route path="/:itemId" element={<ItemsTable {...props} />} />
        <Route path="*" element={<ItemsTable {...props} />} />
    </Routes>
}


export const ItemsTable = (props: { receipts: Array<Receipt> }) => {
    let { itemId } = useParams();
    const navigate = useNavigate();

    const [items, sortedReceipts] = useMemo(() => {
        const items: Record<string, ItemWithHistory> = {};
        props.receipts.forEach(r => {
            r.items?.forEach(i => {
                if (i.article.vendorId in items) {
                    items[i.article.vendorId].history.push(i);
                } else {
                    items[i.article.vendorId] = {
                        id: i.article.vendorId,
                        label: i.article.label,
                        ean: i.article.ean,
                        history: [i]
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
    function setSelectedItem(id: string) {id && navigate((itemId? '../' : '') + id)};

    return <div className='itemsTable'>
        <div className='itemsList'>
            {items.map((i, idx) =>
                <div key={i.id} onClick={() => setSelectedItem(i.id)} className={selectedItem?.id == i.id ? "selected" : undefined}>
                    <FrequencyBar width='3em' freq={i.history.length} maxFreq={items[0].history.length}/>
                    {i.label} {i.ean ? 'EAN' : null}
                </div>)}
        </div>
        {selectedItem ? <ItemDetails item={selectedItem} dateRange={[sortedReceipts[0].date, sortedReceipts[props.receipts.length - 1].date]}/> : null}

    </div>
}


function ItemDetails(props:{item: ItemWithHistory, dateRange: [string, string]}) {

    const ctx = useContext(AppContext);
    const {item, dateRange} = props;

    const chartOptions = useMemo(() => {
        const options: EChartsOption = {
            legend: {},
            tooltip: {
                trigger: 'axis',
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
                    data: item.history.map(h => [h.date, h.unitPrice])
                },
                {
                    name: 'Purchases',
                    type: 'bar',
                    yAxisIndex: 0,
                    data: item.history.map(h => [h.date, h.quantity])
                }
            ]
        };

        return options;
    }, [item]);



    return <div className='itemsDetails'>
        <h2><a href={'https://www.colruyt.be/fr/produits/' + item.id}>{item.label}</a></h2>
        <table>
            <tbody>
            <tr>
                <td>Vendor Id</td>
                <td><a href={'https://www.colruyt.be/fr/produits/' + item.id}>{item.id}</a></td>
            </tr>
            <tr>
                <td>EAN</td>
                <td><a href={'https://www.colruyt.be/fr/produits/' + item.id}>{item.ean || null}</a></td>
            </tr>
            </tbody>
        </table>
        <ReactEcharts theme={ctx.theme == 'dark' ? 'dark' : undefined} option={chartOptions}/>
    </div>
}

export default ItemsTableRoutes;