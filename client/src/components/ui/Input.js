import React from "react";

const Input = (props) => {
  return (
    <input
      type={props.type}
      className={props.className}
      placeholder={props.placeholder}
      required={props.required}
      value={props.value}
      name={props.name}
      onChange={props.onChange}
      autoFocus={props.autoFocus}
      readOnly={props.readOnly}
    />
  );
};

export default Input;
