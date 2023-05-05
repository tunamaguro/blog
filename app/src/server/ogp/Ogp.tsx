export function Ogp({
  title,
  iconImage,
}: {
  title: string;
  iconImage: string;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        backgroundColor: "rgb(42 48 60)",
        padding: 48,
        border: "48px solid rgb(32 37 46)",
        color: "rgb(255 255 255)",
      }}
    >
      <div
        style={{
          fontSize: "48px",
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
          color: "rgb(166 173 187)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "36px",
            height: "36px",
            borderRadius: "9999px",
            padding: "4px",
            marginRight: "12px",

            backgroundColor: "rgb(32 37 46)",
            fontSize: "36px",
          }}
        >
          <img
            src={iconImage}
            width={36}
            height={36}
            style={{
              objectFit: "contain",
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <span>tunamaguro's blog</span>
      </div>
    </div>
  );
}
