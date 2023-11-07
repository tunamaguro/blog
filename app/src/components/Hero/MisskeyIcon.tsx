import misskeyIcon from "./misskey-icon.svg?url";

type Props = JSX.IntrinsicElements["img"];

export const MisskeyIcon = (props: Props) => (
  <img src={misskeyIcon} alt="Misskey" {...props} />
);
