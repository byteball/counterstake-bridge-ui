import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import { selectDirections } from "store/directionsSlice";

export const useMoveToAssistant = (assistants) => {
    const location = useLocation();
    const directions = useSelector(selectDirections);
    const [currentAssistant, setCurrentAssistant] = useState();

    const goToAssistant = (assistant_aa) => {
        if (assistant_aa) {
            if (location.hash) {
                const assistant = document.getElementById(assistant_aa);

                if (assistant) {
                    assistant.scrollIntoView({ behavior: "smooth", block: "center" });
                    assistant.style.boxShadow = "0px 0px 21px -2px #1A91FF";
                    assistant.style.border = "none";
                }
            }
        }
    }

    const clearGoToAssistant = (assistant_aa) => {
        const assistant = document.getElementById(assistant_aa);
        
        if (assistant) {
            assistant.style.boxShadow = "none";
            assistant.style.border = "1px solid #303030";
        }
    }

    useEffect(() => {
        if (assistants.length > 0 && Object.keys(directions).length > 0) {
            if (location.hash) {
                const assistant = location.hash.slice(1);
                if (assistant) {
                    setCurrentAssistant(assistant);
                    goToAssistant(assistant);
                }
            } else if (currentAssistant) {
                clearGoToAssistant(currentAssistant);
                setCurrentAssistant(undefined);
            }
        }

        return () => {
            clearGoToAssistant(currentAssistant);
        }
    }, [location.hash, currentAssistant, assistants]);
}
