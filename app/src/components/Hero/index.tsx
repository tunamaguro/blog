import type { FunctionComponent, ReactNode } from "react";

import { SocialIcons } from "./SocialIcons";

type Props = {
  author: string;
  children?: ReactNode;
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
        <div>プログラムを書く魚類です</div>
        <div className="flex flex-row gap-x-2">
          <SocialIcons className="p-0 grid items-center justify-center h-9 w-9 md:h-12 md:w-12" />
        </div>
      </div>
    </div>
  </div>
);
