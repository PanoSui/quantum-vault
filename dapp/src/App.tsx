import {BrowserRouter, Routes, Route} from "react-router";
import {Toaster} from "sonner";
import {HomePage} from "@/pages/HomePage";
import {Layout} from "@/components/layout/Layout";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout/>}>
                        <Route index element={<HomePage/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster richColors/>
        </>
    );
}

export default App;
