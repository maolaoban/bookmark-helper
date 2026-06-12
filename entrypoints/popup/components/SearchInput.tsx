import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "搜索书签...",
  disabled = false,
}) => {
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.searchBox}>
      <svg className={styles.searchIcon} viewBox="0 0 1024 1024" width="20" height="20">
        <path
          d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z"
          fill="#707070"
        />
      </svg>
      <input
        type="text"
        className={styles.searchInput}
        value={localValue}
        onChange={handleChange}
        placeholder={disabled ? "索引构建中，请稍候..." : placeholder}
        autoFocus
        disabled={disabled}
      />
    </div>
  );
};

export default SearchInput;
