'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Train, X, Check } from 'lucide-react';
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
  placeholder = 'Search station or city...',
}: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display text when value changes externally
  useEffect(() => {
    const matched = MAJOR_STATIONS_CATALOG.find(
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
    // If the input already contains the full formatted name "Name (CODE)", search with empty to show top hubs
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

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center bg-slate-900/90 rounded-xl px-3 py-2 border transition-all ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700/50 hover:border-slate-600'
        }`}
      >
        <span className="text-xs font-bold text-slate-400 uppercase w-12 tracking-wider flex items-center gap-1">
          <Train className="w-3 h-3 text-emerald-400" />
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
          className="w-full bg-transparent text-white font-medium focus:outline-none text-sm placeholder-slate-500 truncate"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md max-h-80 flex flex-col">
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{inputValue ? 'Matching Stations' : 'Popular Railway Hubs'}</span>
            <span className="text-slate-500 font-mono text-[10px]">Type code or city name</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-800/40">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isSelected = item.code.toUpperCase() === value.toUpperCase();
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={`${item.code}-${idx}`}
                    onMouseDown={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-emerald-950/40 text-emerald-200'
                        : isSelected
                        ? 'bg-slate-800/60 text-white'
                        : 'hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                          {item.name}
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {item.city}, {item.country === 'IN' ? 'India' : item.country}
                          {item.is_major_hub && (
                            <span className="ml-1.5 text-[10px] text-emerald-400 font-medium">· Major Hub</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-md shadow-sm">
                        {item.code}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-300 font-medium">No station found for &quot;{inputValue}&quot;</p>
                <p className="text-xs text-slate-500 mt-1">Try searching by city (e.g. Mumbai, Delhi) or code (e.g. NDLS, ET)</p>
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {MAJOR_STATIONS_CATALOG.slice(0, 4).map((fallback) => (
                    <button
                      key={fallback.code}
                      type="button"
                      onMouseDown={() => handleSelect(fallback)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700 transition-colors"
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
