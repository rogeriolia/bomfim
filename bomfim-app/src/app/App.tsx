import { BrowserRouter } from "react-router";
import { RouteProvider } from "@/providers/router-provider";
import { AppRoutes } from "./router";
import { AppProvider } from "./store";

export default function App() {
    return (
        <BrowserRouter>
            <RouteProvider>
                <AppProvider>
                    <AppRoutes />
                </AppProvider>
            </RouteProvider>
        </BrowserRouter>
    );
}
