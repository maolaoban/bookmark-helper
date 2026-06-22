import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchInputInner = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      disabled = false,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const finalPlaceholder = placeholder || t('searchPlaceholder');
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
          onChange(newValue);
        }, 300);
      },
      [onChange],
    );

    const handleClear = useCallback(() => {
      setLocalValue("");
      onChange("");
      if (ref && typeof ref === "object" && ref.current) {
        ref.current.focus();
      }
    }, [onChange, ref]);

    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return (
      <div className={styles.searchBox}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={ref}
          type="text"
          className={styles.searchInput}
          value={localValue}
          onChange={handleChange}
          placeholder={disabled ? t('searchDisabled') : finalPlaceholder}
          autoFocus
          disabled={disabled}
        />
        {localValue && (
          <button className={styles.clearButton} onClick={handleClear} type="button" aria-label={t('clearSearch')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

SearchInputInner.displayName = "SearchInput";

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => (
  <SearchInputInner {...props} ref={ref} />
));
SearchInput.displayName = "SearchInput";

export default SearchInput;
