import type { FunctionComponent, ReactNode } from "react";

import { MisskeyIcon } from "@/components/Icons/MisskeyIcon";
import { TwitterOutlineIcon } from "@/components/Icons/TwitterOutlineIcon";
import { GithubOutlineIcon } from "@/components/Icons/GithubOutlineIcon";

type Props = {
  author: string;
  children?: ReactNode
};

export const Hero: FunctionComponent<Props> = ({ author, children }) => (
  <div className="container mx-auto">
    <h1 className="text-2xl font-bold border-b-4 border-base-content py-4">
      <span className="hidden md:inline">{author}のブログへ</span>
      <span>ようこそ👋</span>
    </h1>
    <div className="flex py-4 gap-8">
      <div className="avatar items-center">
        <div className="w-28 md:w-40 rounded-full bg-base-200 rotate-45 p-2 md:p-4">
          {children}
        </div>
      </div>
      <div className="flex flex-col gap-2 justify-center">
        <div className="text-2xl font-bold">{author}</div>
        <div>コードを書かないと死にます</div>
        <div className="flex flex-row gap-x-2 text-3xl">
          <a
            href="https://twitter.com/tsu7magu6"
            aria-label="tunamaguroのTwitter"
            className="grid justify-center items-center btn btn-square btn-ghost"
          >
            <TwitterOutlineIcon />
          </a>
          <a
            href="https://github.com/tunamaguro"
            aria-label="tunamaguroのGithubプロフィール"
            className="grid justify-center items-center btn btn-square btn-ghost"
          >
            <GithubOutlineIcon />
          </a>
          <a
            className="grid justify-center items-center btn btn-square btn-ghost"
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
