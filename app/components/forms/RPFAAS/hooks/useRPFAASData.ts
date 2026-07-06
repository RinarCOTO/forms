import { useState, useEffect, useCallback } from 'react';
import {
    DEFAULT_RPFAAS_FORM_DATA,
    createRPFAASDataFromServer,
    createRPFAASDataFromStorage,
    type RPFAASServerData,
} from "../utils/rpfaasDataHelpers";

export const useRPFAASData = (serverData?: RPFAASServerData) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [formData, setFormData] = useState(DEFAULT_RPFAAS_FORM_DATA);

    const loadDataFromServer = useCallback((d: RPFAASServerData) => {
        try {
            setFormData(createRPFAASDataFromServer(d));
            setIsLoaded(true);
        } catch (e) {
            console.error("Error loading RPFAAS data from server", e);
        }
    }, []);

    const loadDataFromStorage = useCallback(() => {
        try {
            setFormData(createRPFAASDataFromStorage(localStorage, window.location.search));
            setIsLoaded(true);
        } catch (e) {
            console.error("Error loading RPFAAS data", e);
        }
    }, []);

    useEffect(() => {
        if (serverData) {
            queueMicrotask(() => loadDataFromServer(serverData));
            return;
        }
        queueMicrotask(loadDataFromStorage);
        const onStorage = () => loadDataFromStorage();
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [serverData, loadDataFromServer, loadDataFromStorage]);

    return { ...formData, isLoaded };
};
