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
        src="/sprites/architect-reference.png?v=force-visual-replace"
        alt="Arquiteto"
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "auto",
          objectFit: "contain",
          border: "3px solid red"
        }}
      />
    </div>
  );
}
