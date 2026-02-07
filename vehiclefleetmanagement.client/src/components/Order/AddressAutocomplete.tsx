import React, { useState, useEffect, useRef } from 'react';
import styles from './AddressAutocomplete.module.css';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

interface AddressAutocompleteProps {
    value?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    onSelect?: (point: { lat: number; lng: number }, displayName: string) => void;
    triggerRecenter?: () => void;
    onClear?: () => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value = '',
    placeholder,
    onChange,
    onSelect,
    triggerRecenter,
    onClear
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [selected, setSelected] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const debouncedInputValue = useDebounce(inputValue, 500);

    const suggestionsRef = useRef<HTMLUListElement>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    // Dodaj funkcjê do poprawiania kolejnoœci numeru i nazwy ulicy
    const fixStreetNumberOrder = (displayName: string): string => {
        const parts = displayName.split(",").map(p => p.trim());
        // Jeœli mamy co najmniej dwa elementy i pierwszy element to tylko cyfry
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
            // Zamieñ kolejnoœæ pierwszych dwóch elementów i po³¹cz je spacj¹
            const newFirstPart = `${parts[1]} ${parts[0]}`;
            // Po³¹cz nowy pierwszy element z reszt¹ (jeœli istnieje)
            return [newFirstPart, ...parts.slice(2)].join(", ");
        }
        return displayName;
    };

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (debouncedInputValue.length > 3 && !selected) {
            fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(
                    debouncedInputValue
                )}`
            )
                .then((response) => response.json())
                .then((data) => {
                    const uniqueSuggestions = data.filter(
                        (item: any, index: number, self: any[]) =>
                            index === self.findIndex((t) => t.display_name === item.display_name)
                    );
                    setSuggestions(uniqueSuggestions);
                    setSelectedIndex(-1);
                    setShowSuggestions(true);
                })
                .catch((error) => console.error('B³¹d pobierania sugestii:', error));
        } else {
            setSuggestions([]);
        }
    }, [debouncedInputValue, selected]);

    useEffect(() => {
        if (suggestionsRef.current && selectedIndex >= 0) {
            const selectedElement = suggestionsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [selectedIndex]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (onChange) onChange(newValue);
        setSelected(false);
        setShowSuggestions(true);
        if (newValue === '') {
            setSuggestions([]);
            if (onClear) onClear();
        }
    };

    const handleInputFocus = () => {
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (suggestion: any) => {
        // Pobierz oryginalny display_name
        const rawDisplayName = suggestion.display_name;
        // Zamieñ kolejnoœæ, jeœli to konieczne
        const displayName = fixStreetNumberOrder(rawDisplayName);

        setInputValue(displayName);
        setSuggestions([]);
        setSelected(true);
        setSelectedIndex(-1);
        setShowSuggestions(false);
        if (onSelect) {
            onSelect(
                { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) },
                displayName
            );
        }
        if (triggerRecenter) {
            triggerRecenter();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prevIndex) => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSuggestionClick(suggestions[selectedIndex]);
            } else if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
            }
            e.currentTarget.blur();
        }
    };

    return (
        <div className={styles.container} ref={componentRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                className={styles.input}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul ref={suggestionsRef} className={styles.suggestionsList}>
                    {suggestions.slice(0, 4).map((s, index) => (
                        <li
                            key={s.place_id}
                            onClick={() => handleSuggestionClick(s)}
                            className={`${styles.suggestionItem} ${index === selectedIndex ? styles.active : ''}`}
                        >
                            {fixStreetNumberOrder(s.display_name)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AddressAutocomplete;