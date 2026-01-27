import React from "react";
import Image from "next/image";

export default function FormHeader() {
  return (
    <div className="w-full rounded-t-lg overflow-hidden">
      <div className="relative w-full h-auto">
        <Image
          src="/images/form.jpg"
          alt="MP Board Class 12 - Arivihan Copy Checking"
          width={1600}
          height={400}
          className="w-full h-auto object-cover"
          priority
        />
      </div>
    </div>
  );
}
