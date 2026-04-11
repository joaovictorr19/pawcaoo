import React from "react";

export default function CloudyBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      {/* Blue sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-white" />

      {/* Soft cloud blobs using existing animate-blob utility */}
      <div className="absolute -top-10 -left-16 w-[60vw] h-[30vw] bg-white/70 rounded-[8rem] blur-3xl animate-blob" style={{ animationDelay: '0s' }} />
      <div className="absolute top-10 right-[-10%] w-[55vw] h-[28vw] bg-white/60 rounded-[7rem] blur-3xl animate-blob" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[35%] left-[10%] w-[45vw] h-[22vw] bg-white/55 rounded-[6rem] blur-2xl animate-blob" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[50%] right-[5%] w-[40vw] h-[20vw] bg-white/50 rounded-[6rem] blur-2xl animate-blob" style={{ animationDelay: '4.5s' }} />

      {/* Subtle horizon tint */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}