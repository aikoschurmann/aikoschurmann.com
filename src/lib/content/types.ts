export type TagStyle = {
  color: string;
  bg: string;
};

export type RawProject = {
  title: string;
  url: string;
  github: string;
  thumb: string;
  description: string;
  tags: string[];
  showOnHome: boolean;
  research: Array<{ title: string; url: string }>;
};
