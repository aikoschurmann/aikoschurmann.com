import { projectEntries } from './content/projects';
import { tagColors } from './content/tags';

export function getTagData(name: string) {
  const style = tagColors[name];
  if (style) {
    return { name, style: `color: ${style.color}; background: ${style.bg};` };
  }

  return { name, style: 'color: var(--fg-muted); background: rgba(255, 255, 255, 0.05);' };
}

export const projects = projectEntries.map((project) => ({
  ...project,
  tags: project.tags.map(getTagData)
}));

// Import raw markdown text for both frontmatter metadata and word-count calculation.
const rawBlogModules = import.meta.glob('/src/routes/blog/*/+page.md', {
  query: '?raw',
  import: 'default',
  eager: true
});
const rawCourseLessonModules = import.meta.glob('/src/routes/courses/*/*/+page.md', {
  query: '?raw',
  import: 'default',
  eager: true
});
const courseModules = import.meta.glob('/src/routes/courses/*/course.md', {
  eager: true
});
const rawModules = { ...rawBlogModules, ...rawCourseLessonModules };

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {} as Record<string, unknown>;

  const meta: Record<string, unknown> = {};
  const lines = match[1].split('\n');

  let currentArrayKey: string | null = null;

  for (const line of lines) {
    const arrayItemMatch = line.match(/^\s*-\s*['"]?(.*?)['"]?\s*$/);
    if (arrayItemMatch && currentArrayKey) {
      (meta[currentArrayKey] as string[]).push(arrayItemMatch[1].trim());
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) {
      currentArrayKey = null;
      continue;
    }

    const key = pair[1];
    let value = pair[2].trim();

    if (value === '') {
      meta[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      meta[key] = true;
      continue;
    } else if (value === 'false') {
      meta[key] = false;
      continue;
    }

    meta[key] = value;
  }

  return meta;
}

function getMetaString(meta: Record<string, unknown>, key: string): string | undefined {
  const value = meta[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
  
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function getReadingStats(rawContent: string) {
  const contentWithoutFrontmatter = rawContent.replace(/^---[\s\S]*?---\n?/, '');
  const codeBlocks = contentWithoutFrontmatter.match(/```[\s\S]*?```/g) || [];

  const proseSource = contentWithoutFrontmatter
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/`([^`]+)`/g, ' $1 ')
    .replace(/[#*_>\[\]{}()|~`]/g, ' ')
    .replace(/[.,;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const codeSource = codeBlocks
    .map((block) => block.replace(/^```[^\n]*\n?/, '').replace(/```$/, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const proseWords = countWords(proseSource);
  const codeWords = countWords(codeSource);

  const effectiveWords = proseWords + Math.round(codeWords * 0.35);
  const readMinutes = Math.max(1, Math.ceil(effectiveWords / 225));

  return { effectiveWords, readMinutes };
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

type CourseMeta = {
  title?: string;
  description?: string;
  tags?: string[];
  component?: any;
};

function asObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function normalizeCourseMeta(value: unknown): CourseMeta {
  const obj = asObject(value);
  if (!obj) return {};

  let tags: string[] | undefined;
  if (Array.isArray(obj.tags)) {
    tags = obj.tags.filter((t) => typeof t === 'string') as string[];
  } else if (typeof obj.tag === 'string') {
    tags = [obj.tag];
  }

  return {
    title: typeof obj.title === 'string' ? obj.title : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    tags
  };
}

const courseMetaBySlug = new Map<string, CourseMeta>();
for (const [path, module] of Object.entries(courseModules)) {
  const match = path.match(/\/src\/routes\/courses\/([^/]+)\/course\.md$/);
  if (!match) continue;

  const m = module as any;
  const meta = normalizeCourseMeta(m.metadata);
  meta.component = m.default;
  courseMetaBySlug.set(match[1], meta);
}

function parseOrderedSegment(segment: string) {
  const match = segment.match(/^(\d+)-(.+)$/);
  if (!match) {
    return {
      order: Number.MAX_SAFE_INTEGER,
      slug: segment,
      title: slugToTitle(segment)
    };
  }

  return {
    order: Number.parseInt(match[1], 10),
    slug: match[2],
    title: slugToTitle(match[2])
  };
}

function getCoursePathMeta(url: string) {
  const segments = url.split('/').filter(Boolean);
  if (segments[0] !== 'courses' || segments.length < 3) return undefined;

  const courseSlug = segments[1];
  const lesson = parseOrderedSegment(segments[2]);

  return {
    courseSlug,
    courseTitle: slugToTitle(courseSlug),
    courseLessonSlug: lesson.slug,
    courseLessonTitle: lesson.title,
    courseLessonOrder: lesson.order
  };
}

export const thoughts = Object.entries(rawModules).map(([path, raw]) => {
  const url = path.replace('/src/routes', '').replace('/+page.md', '');
  const rawContent = raw as string;
  const meta = parseFrontmatter(rawContent);
  const courseMeta = getCoursePathMeta(url);
  const isBlogPost = url.startsWith('/blog/');
  const readingStats = getReadingStats(rawContent);

  let rawTags: string[] = [];
  if (Array.isArray(meta.tags)) {
    rawTags = meta.tags.filter((t) => typeof t === 'string') as string[];
  } else if (typeof meta.tag === 'string') {
    rawTags = [meta.tag];
  } else {
    const singleTag = getMetaString(meta, 'tag');
    rawTags = singleTag ? [singleTag] : ['RESEARCH'];
  }

  const title = getMetaString(meta, 'title') || 'Untitled Thought';
  const description = getMetaString(meta, 'description') || '';
  const date = getMetaString(meta, 'date') || '';
  const showOnHome = meta.showOnHome !== false;
  const showInBlog = isBlogPost ? meta.showInBlog !== false : false;
  const showInCourse = meta.showInCourse !== false;

  return {
    title,
    url,
    description,
    date,
    readTime: `${readingStats.readMinutes} MIN READ`,
    readMinutes: readingStats.readMinutes,
    readWordCount: readingStats.effectiveWords,
    tags: rawTags.map(getTagData),
    showOnHome,
    showInBlog,
    showInCourse,
    courseSlug: courseMeta?.courseSlug,
    courseLessonOrder: courseMeta?.courseLessonOrder,
    courseChapterTitle: getMetaString(meta, 'chapterTitle') || courseMeta?.courseLessonTitle
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const blogThoughts = thoughts.filter((thought) => thought.showInBlog);

export type Thought = (typeof thoughts)[number];

export type CoursePost = Thought & {
  part: number;
  chapterTitle?: string;
};

export type Course = {
  slug: string;
  title: string;
  description: string;
  tags: ReturnType<typeof getTagData>[];
  posts: CoursePost[];
  postCount: number;
  totalReadMinutes: number;
  component?: any;
};

type CourseSourcePost = Thought & {
  courseSlug: string;
};

function isCourseSourcePost(thought: Thought): thought is CourseSourcePost {
  return typeof thought.courseSlug === 'string' && thought.courseSlug.length > 0 && thought.showInCourse !== false;
}

function compareCoursePosts(a: CourseSourcePost, b: CourseSourcePost): number {
  const aLessonOrder = a.courseLessonOrder ?? Number.MAX_SAFE_INTEGER;
  const bLessonOrder = b.courseLessonOrder ?? Number.MAX_SAFE_INTEGER;
  if (aLessonOrder !== bLessonOrder) return aLessonOrder - bLessonOrder;

  const aDate = new Date(a.date).getTime();
  const bDate = new Date(b.date).getTime();
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && aDate !== bDate) {
    return aDate - bDate;
  }

  return a.title.localeCompare(b.title);
}

const courseBuckets = new Map<string, CourseSourcePost[]>();

for (const thought of thoughts) {
  if (!isCourseSourcePost(thought)) continue;

  const existing = courseBuckets.get(thought.courseSlug) || [];
  existing.push(thought);
  courseBuckets.set(thought.courseSlug, existing);
}

export const courses: Course[] = Array.from(courseBuckets.entries())
  .map(([slug, sourcePosts]) => {
    const sortedPosts = [...sourcePosts].sort(compareCoursePosts);
    const courseMeta = courseMetaBySlug.get(slug);

    const title = courseMeta?.title || slugToTitle(slug);
    
    const rawTags = courseMeta?.tags && courseMeta.tags.length > 0 ? courseMeta.tags : ['COMPILERS'];
    const courseTags = rawTags.map(getTagData);

    let globalPart = 0;
    const posts = sortedPosts.map(post => {
      globalPart += 1;
      return {
        ...post,
        part: globalPart,
        chapterTitle: post.courseChapterTitle
      }
    });

    const totalWordCount = posts.reduce((sum, post) => sum + post.readWordCount, 0);
    const totalReadMinutes = Math.max(1, Math.ceil(totalWordCount / 225));
    const description =
      courseMeta?.description ||
      `A structured track with ${posts.length} lessons.`;

    return {
      slug,
      title,
      description,
      tags: courseTags,
      posts,
      postCount: posts.length,
      totalReadMinutes,
      component: courseMeta?.component
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}
