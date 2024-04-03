import * as React from "react";
import {createTheme, Theme, ThemeProvider} from "@mui/material";
import {AppContext} from "./appContext";
import {useContext} from "react";


const THEMES: Record<string, Theme> = {
    'dark': createTheme({
        palette: {
            mode: 'dark',
        },
    }),
    'light': createTheme({
        palette: {
            primary: {
                //light?: string;
                main: "#1976d2",
                //dark?: string;
                contrastText: "#F0F0F0"
            },
            secondary: {
                //light?: string;
                main: "#237777",
                //dark?: string;
                contrastText: "#F0F0F0"
            },
        },
    })
}

export const AppThemeProvider = (props: { children?: React.ReactNode }) => {

    const ctx = useContext(AppContext);

    const theme= ctx.theme ? THEMES[ctx.theme] : THEMES.light;

    return <ThemeProvider
        theme={theme}>
        {props.children}
    </ThemeProvider>
}