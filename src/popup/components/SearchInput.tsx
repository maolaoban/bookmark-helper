import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = '搜索书签...',
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步外部值
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 处理输入变化（带防抖）
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // 清除之前的定时器
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // 300ms 防抖
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [onChange]
  );

  // 清理
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="search-box">
      <svg
        className="search-icon"
        viewBox="0 0 1024 1024"
        width="20"
        height="20"
      >
        <path
          d="M832 981.333333a21.333333 21.333333 0 0 1-11.333333-3.24l-330-206.266666-330 206.266666a21.333333 21.333333 0 0 1-32.666667-18.093333V181.333333a53.393333 53.393333 0 0 1 53.333333-53.333333h618.666667a53.393333 53.393333 0 0 1 53.333333 53.333333v778.666667a21.333333 21.333333 0 0 1-21.333333 21.333333z"
          fill="#707070"
        />
      </svg>
      <input
        type="text"
        className="search-input"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus
      />
      {localValue && (
        <button
          className="clear-button"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
        >
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m205.8 481.4L590.2 673c-8.8 11.4-23.6 18.4-38.2 18.4H472c-14.6 0-29.4-7-38.2-18.4L306 545.4c-8.8-11.4-8.8-28.2 0-39.6l127.6-127.6c8.8-11.4 23.6-18.4 38.2-18.4H600c14.6 0 29.4 7 38.2 18.4l127.6 127.6c8.8 11.4 8.8 28.2 0 39.6z"
              fill="#707070"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchInput;