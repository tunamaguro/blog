import type { PropsWithChildren } from "react";

/**
 * GitHub user avatar image
 */
const iconImage = "https://avatars.githubusercontent.com/u/79092292?v=4";

export function Ogp({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "48px",
        backgroundColor: "rgb(32 37 46)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "rgb(42 48 60)",
          padding: "36px",
          borderRadius: "24px",
          color: "rgb(255 255 255)",
        }}
      >
        <div
          style={{
            fontSize: "60px",
            fontWeight: "700",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            fontSize: "36px",
          }}
        >
          <img src={iconImage} width={36} height={36} />
          <div>tunamaguro's blog</div>
        </div>
      </div>
    </div>
  );
}

export const Wrapper = ({ children }: PropsWithChildren) => (
  <div
    style={{
      width: "800px",
      height: "400px",
    }}
  >
    {children}
  </div>
);
