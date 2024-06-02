import clsx from "clsx";
import { GithubOutlineIcon } from "../Icons/GithubOutlineIcon";
import { MisskeyIcon } from "../Icons/MisskeyIcon";
import { RssIcon } from "../Icons/RssIcon";
import { TwitterOutlineIcon } from "../Icons/TwitterOutlineIcon";

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

export const SocialIcons = ({ className, height = 24, width = 24 }: Props) => {
  return (
    <>
      <a
        href="https://twitter.com/tsu7magu6"
        aria-label="tunamaguroのTwitter"
        className={clsx("btn btn-ghost ", className)}
      >
        <TwitterOutlineIcon width={width} height={height} />
      </a>
      <a
        href="https://github.com/tunamaguro"
        aria-label="tunamaguroのGithubプロフィール"
        className={clsx("btn btn-ghost ", className)}
      >
        <GithubOutlineIcon width={width} height={height} />
      </a>
      <a
        className={clsx("btn btn-ghost ", className)}
        href="https://misskey.tunamaguro.dev/@tunamaguro"
        aria-label="tunamaguroのMisskey"
      >
        <MisskeyIcon fill="currentColor" width={width} height={height} />
      </a>
      <a
        className={clsx("btn btn-ghost ", className)}
        href="/rss.xml"
        aria-label="tunamaguroのMisskey"
      >
        <RssIcon width={width} height={height} />
      </a>
    </>
  );
};
