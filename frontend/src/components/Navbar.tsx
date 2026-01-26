import { Link, useLocation } from 'react-router-dom';
import UserSelector from './UserSelector';
import { cn } from '../lib/utils';
import { FileBarChart, Home, Building } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <nav className="border-b bg-background sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="font-bold text-xl flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                            <FileBarChart className="h-5 w-5" />
                        </div>
                        <span>DataApproval</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/imports"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                                isActive('/imports') ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Home className="h-4 w-4" />
                            Economic Data
                        </Link>

                        <span
                            className={cn(
                                "text-sm font-medium transition-colors cursor-not-allowed opacity-50 flex items-center gap-2 text-muted-foreground"
                            )}
                            title="Coming Soon"
                        >
                            <Building className="h-4 w-4" />
                            Housing Data (Soon)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <UserSelector />
                </div>
            </div>
        </nav>
    );
}
