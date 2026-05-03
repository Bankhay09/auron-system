"use client";

/* eslint-disable @next/next/no-img-element */

type ArchitectSpriteProps = {
  size?: "small" | "medium" | "large";
  contained?: boolean;
  className?: string;
};

export function ArchitectSprite(_props: ArchitectSpriteProps) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      width: "100%"
    }}>
      <img
        src="/sprites/architect-idle.png"
        alt="Arquiteto"
        style={{
          width: "100%",
          maxWidth: "120px",
          height: "auto",
          objectFit: "contain"
        }}
      />
    </div>
  );
}
