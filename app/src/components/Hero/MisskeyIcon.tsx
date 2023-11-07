import misskeyIcon from "./misskey-icon.svg";

type Props = JSX.IntrinsicElements["img"];

export const MisskeyIcon = (props: Props) => (
  <img src={misskeyIcon.src} alt="Misskey" {...props} />
);
