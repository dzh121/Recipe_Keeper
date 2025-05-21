"use client";
import { useEffect, useState } from "react";

const FloatingKofi = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 9999,
      }}
    >
      <a
        title="Support me on Ko-fi.com"
        href="https://ko-fi.com/dzh121"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#72a4f2",
          color: "#fff",
          borderRadius: "9999px",
          padding: isMobile ? "10px" : "10px 14px",
          fontWeight: 600,
          fontSize: isMobile ? "14px" : "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,.25)",
        }}
      >
        <img
          src="https://storage.ko-fi.com/cdn/cup-border.png"
          alt="Ko-fi cup"
          style={{
            width: isMobile ? 22 : 24,
            marginRight: isMobile ? 0 : 8,
          }}
        />
        {!isMobile && "Support me"}
      </a>
    </div>
  );
};

export default FloatingKofi;
