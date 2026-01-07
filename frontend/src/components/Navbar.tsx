import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === path ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700';
        }
        return location.pathname.startsWith(path) ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700';
    };

    return (
        <nav className="bg-white border-b border-gray-200 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-xl text-indigo-600">Tech Playground</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/')}`}
                            >
                                Company
                            </Link>
                            <Link
                                to="/areas"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/areas')}`}
                            >
                                Areas
                            </Link>
                            <Link
                                to="/employees"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/employees')}`}
                            >
                                Employees
                            </Link>
                            <Link
                                to="/eda"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/eda')}`}
                            >
                                EDA
                            </Link>
                            <Link
                                to="/sentiment"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/sentiment')}`}
                            >
                                Sentiment
                            </Link>
                            <Link
                                to="/reports"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/reports')}`}
                            >
                                Reports
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
