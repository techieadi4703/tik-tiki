'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Train, X, Check, Building2, Plane, Bus, Compass } from 'lucide-react';
import { LocationItem } from '../types';
import { searchLocations, MAJOR_STATIONS_CATALOG } from '../lib/api';

interface StationAutocompleteProps {
  label: string; // 'From' | 'To'
  value: string; // Current station code (e.g. 'ET')
  onChange: (code: string, name: string) => void;
  placeholder?: string;
}

export function StationAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Search city, railway code, or airport...',
}: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display text when value changes externally
  useEffect(() => {
    const matched = (MAJOR_STATIONS_CATALOG as LocationItem[]).find(
      (s) => s.code.toUpperCase() === value.toUpperCase()
    );
    if (matched) {
      setInputValue(`${matched.name} (${matched.code})`);
    } else if (value) {
      setInputValue(value);
    }
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when dropdown is open
  const loadSuggestions = async (query: string) => {
    const results = await searchLocations(query);
    setSuggestions(results);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (inputValue.includes('(') && inputValue.includes(')')) {
      loadSuggestions('');
    } else {
      loadSuggestions(inputValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    loadSuggestions(val);
  };

  const handleSelect = (item: LocationItem) => {
    setInputValue(`${item.name} (${item.code})`);
    onChange(item.code, item.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange('', '');
    loadSuggestions('');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'city_hub':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'airport':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'bus_terminal':
        return <Bus className="w-4 h-4 text-amber-600" />;
      default:
        return <Train className="w-4 h-4 text-[#1a365d]" />;
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'city_hub':
        return (
          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
            City Area Hub
          </span>
        );
      case 'airport':
        return (
          <span className="text-[10px] font-black uppercase text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
            Airport
          </span>
        );
      case 'bus_terminal':
        return (
          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            Bus Stand
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            Rail Station
          </span>
        );
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center bg-slate-50 rounded-xl px-3 py-2 border transition-all ${
          isOpen ? 'border-blue-600 ring-2 ring-blue-100 bg-white' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-2.5 pr-2.5 border-r border-slate-200 select-none">
          <Train className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          {label}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-slate-900 font-semibold focus:outline-none text-sm placeholder-slate-400 truncate pl-0.5"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-96 flex flex-col">
          <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>{inputValue ? 'Matching Transit Hubs' : 'Major Metropolitan Hubs & Stations'}</span>
            <span className="text-slate-400 font-mono text-[10px]">Type City, Station, or Airport</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isSelected = item.code.toUpperCase() === value.toUpperCase();
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={`${item.code}-${idx}`}
                    onMouseDown={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-900'
                        : isSelected
                        ? 'bg-blue-100/60 text-blue-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                        {renderTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          {renderTypeBadge(item.type)}
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>

                        {item.subtitle ? (
                          <div className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                            {item.subtitle}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {item.city}, {item.country === 'IN' ? 'India' : item.country}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 text-right">
                      <span className="text-xs font-mono font-black bg-slate-100 text-[#1a365d] border border-slate-300 px-2 py-0.5 rounded-md shadow-sm block">
                        {item.code}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-700 font-medium">No transit location found for &quot;{inputValue}&quot;</p>
                <p className="text-xs text-slate-500 mt-1">Try searching by city (e.g. Mumbai, Delhi, Varanasi) or code (e.g. CSMT, BOM, PRYJ)</p>
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {(MAJOR_STATIONS_CATALOG as LocationItem[]).slice(0, 5).map((fallback) => (
                    <button
                      key={fallback.code}
                      type="button"
                      onMouseDown={() => handleSelect(fallback)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 transition-colors font-medium"
                    >
                      {fallback.city} ({fallback.code})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
