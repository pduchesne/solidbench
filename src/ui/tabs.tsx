import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import React from "react";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export type TabDescriptor<T extends Record<string, any>> = {
    label: string,
    Comp: React.FC<T>
}

export default function BasicTabs<T extends Record<string, any>>(props: { tabs: TabDescriptor<T>[], tabProps: T }) {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{width: '100%'}}>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    {props.tabs.map((t, idx) => <Tab key={idx} label={t.label} {...a11yProps(idx)} />)}
                </Tabs>
            </Box>
            {props.tabs.map((t, idx) => {
                const Comp: React.FC<T> = t.Comp;
                return (
                    <CustomTabPanel value={value} index={idx}>
                        <Comp {...props.tabProps}/>
                    </CustomTabPanel>
                )
            })
            }
        </Box>
    );
}