import { useContext, createContext, type JSX } from "react";
import { clsx } from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";

const DrawerContext = createContext("drawer-context");

type DrawerProps = {
  drawerId: string;
} & JSX.IntrinsicElements["div"];

export const Drawer = ({ drawerId, children, ...rest }: DrawerProps) => {
  return (
    <DrawerContext.Provider value={drawerId}>
      <div className={clsx("drawer w-fit md:invisible md:hidden")} {...rest}>
        <input id={drawerId} type="checkbox" className="drawer-toggle" />
        {children}
      </div>
    </DrawerContext.Provider>
  );
};

type ToggleProps = Omit<JSX.IntrinsicElements["label"], "htmlFor">;

Drawer.Toggle = ({ children, ...rest }: ToggleProps) => {
  const drawerId = useContext(DrawerContext);
  return (
    <label htmlFor={drawerId} aria-label="open sidebar" {...rest}>
      {children}
    </label>
  );
};

type SidebarProps = JSX.IntrinsicElements["div"];

Drawer.SideBar = ({ className, children, ...rest }: SidebarProps) => {
  return (
    <aside className={clsx("drawer-side", className)} {...rest}>
      {children}
    </aside>
  );
};

type OverlayProps = Omit<JSX.IntrinsicElements["label"], "htmlFor">;

Drawer.Overlay = ({ className, children, ...rest }: OverlayProps) => {
  const drawerId = useContext(DrawerContext);
  return (
    <label
      htmlFor={drawerId}
      aria-label="close sidebar"
      className={clsx("drawer-overlay", className)}
      {...rest}
    >
      {children}
    </label>
  );
};

type ContentProps = JSX.IntrinsicElements["div"];

Drawer.Content = ({ className, children, ...rest }: ContentProps) => {
  return (
    <div
      className={clsx(
        sprinkles({ backgroundColor: "base300" }),
        "min-h-full",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
