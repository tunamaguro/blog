import type { FunctionComponent } from "react";

import MaguroImage from "@/assets/maguro.png";
import { MisskeyIcon } from "@/components/Icons/MisskeyIcon";
import { TwitterOutlineIcon } from "@/components/Icons/TwitterOutlineIcon";
import { GithubOutlineIcon } from "@/components/Icons/GithubOutlineIcon";

type Props = {
  author: string;
};

export const Hero: FunctionComponent<Props> = ({ author }) => (
  <div className="container mx-auto">
    <h1 className="text-2xl font-bold border-b-4 border-base-content py-4">
      <span className="hidden md:inline">{author}のブログへ</span>
      <span>ようこそ👋</span>
    </h1>
    <div className="flex py-4 gap-8">
      <div className="avatar">
        <div className="w-30 h-auto md:w-40 p-3 rounded-full bg-base-200">
          <img
            alt="tsunamaguro icon"
            src={MaguroImage.src}
            className="transform rotate-45 md:translate-y-6 !h-24"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 justify-center">
        <div className="text-2xl font-bold">{author}</div>
        <div>コードを書かないと死にます</div>
        <div className="flex flex-row gap-4 text-3xl">
          <a
            href="https://twitter.com/tsu7magu6"
            aria-label="tunamaguroのTwitter"
            className="grid justify-center items-center h-8 w-8"
          >
            <TwitterOutlineIcon />
          </a>
          <a
            href="https://github.com/tunamaguro"
            aria-label="tunamaguroのGithubプロフィール"
            className="grid justify-center items-center h-8 w-8"
          >
            <GithubOutlineIcon />
          </a>
          <a
            className="grid justify-center items-center h-8 w-8"
            href="https://misskey.tunamaguro.dev/@tunamaguro"
            aria-label="tunamaguroのMisskey"
          >
            <MisskeyIcon fill="currentColor" width={24} height={24} />
          </a>
        </div>
      </div>
    </div>
  </div>
);
