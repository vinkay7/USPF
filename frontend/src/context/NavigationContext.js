import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const NavigationProvider = ({ children }) => {
    const [showNavigationSplash, setShowNavigationSplash] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const navigateWithSplash = (navigationPath, navigationCallback) => {
        // Set the pending navigation
        setPendingNavigation({
            path: navigationPath,
            callback: navigationCallback
        });
        
        // Show the splash screen
        setShowNavigationSplash(true);
        
        // Hide splash screen after 2 seconds (shorter than initial splash)
        setTimeout(() => {
            setShowNavigationSplash(false);
            // Execute the navigation after splash completes
            if (navigationCallback) {
                navigationCallback();
            }
            setPendingNavigation(null);
        }, 2000);
    };

    const value = {
        showNavigationSplash,
        setShowNavigationSplash,
        navigateWithSplash,
        pendingNavigation
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};