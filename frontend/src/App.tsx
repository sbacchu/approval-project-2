import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Dashboard from '@/pages/Dashboard';
import ImportDetail from '@/pages/ImportDetail';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="min-h-screen bg-background text-foreground flex flex-col">
                    <Navbar />

                    <main className="container mx-auto p-4 flex-1 py-8">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/imports/:id" element={<ImportDetail />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
