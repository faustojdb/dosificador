import React from 'react';

// Componente switch estilo iOS
const Switch = ({ checked, onChange, onColor = '#2563EB', offColor = '#D1D5DB' }) => {
  return (
    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
      <input
        type="checkbox"
        name="toggle"
        id="toggle"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <label
        htmlFor="toggle"
        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        style={{ backgroundColor: checked ? onColor : offColor }}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white border-2 border-transparent transform transition-transform duration-300 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
          style={{
            margin: '2px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
        ></span>
      </label>
    </div>
  );
};

export default Switch;