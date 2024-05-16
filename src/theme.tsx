import * as React from "react";
import {AppContext} from "./appContext";
import {useContext, useEffect} from "react";
import createTheme, { Theme } from "@mui/material/styles/createTheme";
import ThemeProvider from "@mui/material/styles/ThemeProvider";



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

    useEffect( () => {
        if (ctx.theme == 'dark') {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }

    }, [theme])

    return <ThemeProvider
        theme={theme}>
        {props.children}
    </ThemeProvider>
}