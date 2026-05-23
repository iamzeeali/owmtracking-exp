import React from "react";
import spinner from "./spinner.gif";

export default function Spinner() {
  return (
    <div className='my-5'>
      <img
        src={spinner}
        alt='Loading...'
        style={{ width: "200px", margin: "auto", display: "block" }}
      />
    </div>
  );
}
