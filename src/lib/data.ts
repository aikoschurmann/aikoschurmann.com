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
const rawCourseLessonModules = import.meta.glob('/src/routes/courses/*/*/*/+page.md', {
  query: '?raw',
  import: 'default',
  eager: true
});
const rawCourseMetaModules = import.meta.glob('/src/routes/courses/*/course.json', {
  import: 'default',
  eager: true
});
const rawSectionMetaModules = import.meta.glob('/src/routes/courses/*/*/section.json', {
  import: 'default',
  eager: true
});
const rawModules = { ...rawBlogModules, ...rawCourseLessonModules };

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {} as Record<string, unknown>;

  const meta: Record<string, unknown> = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) continue;

    const key = pair[1];
    let value = pair[2].trim();

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

  // Code examples matter for reading time, but they are typically scanned faster than prose.
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
  level?: string;
  tag?: string;
};

type SectionMeta = {
  title?: string;
  description?: string;
};

function asObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function normalizeCourseMeta(value: unknown): CourseMeta {
  const obj = asObject(value);
  if (!obj) return {};

  return {
    title: typeof obj.title === 'string' ? obj.title : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    level: typeof obj.level === 'string' ? obj.level : undefined,
    tag: typeof obj.tag === 'string' ? obj.tag : undefined
  };
}

function normalizeSectionMeta(value: unknown): SectionMeta {
  const obj = asObject(value);
  if (!obj) return {};

  return {
    title: typeof obj.title === 'string' ? obj.title : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined
  };
}

const courseMetaBySlug = new Map<string, CourseMeta>();
for (const [path, value] of Object.entries(rawCourseMetaModules)) {
  const match = path.match(/\/src\/routes\/courses\/([^/]+)\/course\.json$/);
  if (!match) continue;

  courseMetaBySlug.set(match[1], normalizeCourseMeta(value));
}

const sectionMetaByKey = new Map<string, SectionMeta>();
for (const [path, value] of Object.entries(rawSectionMetaModules)) {
  const match = path.match(/\/src\/routes\/courses\/([^/]+)\/([^/]+)\/section\.json$/);
  if (!match) continue;

  sectionMetaByKey.set(`${match[1]}/${match[2]}`, normalizeSectionMeta(value));
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
  if (segments.length !== 4 || segments[0] !== 'courses') return undefined;

  const courseSlug = segments[1];
  const section = parseOrderedSegment(segments[2]);
  const lesson = parseOrderedSegment(segments[3]);

  return {
    courseSlug,
    courseTitle: slugToTitle(courseSlug),
    courseSectionSegment: segments[2],
    courseSectionSlug: section.slug,
    courseSectionTitle: section.title,
    courseSectionOrder: section.order,
    courseLessonSlug: lesson.slug,
    courseLessonTitle: lesson.title,
    courseLessonOrder: lesson.order
  };
}

// Map over raw markdown files to generate the dynamic list.
export const thoughts = Object.entries(rawModules).map(([path, raw]) => {
  const url = path.replace('/src/routes', '').replace('/+page.md', '');
  const rawContent = raw as string;
  const meta = parseFrontmatter(rawContent);
  const courseMeta = getCoursePathMeta(url);
  const isBlogPost = url.startsWith('/blog/');
  const readingStats = getReadingStats(rawContent);

  const tagName = getMetaString(meta, 'tag') || 'RESEARCH';
  const title = getMetaString(meta, 'title') || 'Untitled Thought';
  const description = getMetaString(meta, 'description') || '';
  const date = getMetaString(meta, 'date') || '';
  const showOnHome = meta.showOnHome !== false;
  const showInBlog = isBlogPost ? meta.showInBlog !== false : false;

  return {
    title,
    url,
    description,
    date,
    readTime: `${readingStats.readMinutes} MIN READ`,
    readMinutes: readingStats.readMinutes,
    readWordCount: readingStats.effectiveWords,
    tag: getTagData(tagName),
    showOnHome,
    showInBlog,
    courseSlug: courseMeta?.courseSlug,
    courseSectionSegment: courseMeta?.courseSectionSegment,
    courseSectionTitle: courseMeta?.courseSectionTitle,
    courseSectionOrder: courseMeta?.courseSectionOrder,
    courseLessonOrder: courseMeta?.courseLessonOrder,
    courseChapterTitle: getMetaString(meta, 'chapterTitle') || courseMeta?.courseLessonTitle
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// Posts stay addressable for courses even when excluded from blog listings.
export const blogThoughts = thoughts.filter((thought) => thought.showInBlog);

export type Thought = (typeof thoughts)[number];

export type CoursePost = Thought & {
  part: number;
  partInSection: number;
  sectionIndex: number;
  sectionTitle: string;
  chapterTitle?: string;
};

export type CourseSection = {
  index: number;
  title: string;
  description?: string;
  posts: CoursePost[];
  postCount: number;
  totalReadMinutes: number;
};

export type Course = {
  slug: string;
  title: string;
  description: string;
  level: string;
  tag: string;
  sections: CourseSection[];
  posts: CoursePost[];
  postCount: number;
  totalReadMinutes: number;
};

type CourseSourcePost = Thought & {
  courseSlug: string;
};

function isCourseSourcePost(thought: Thought): thought is CourseSourcePost {
  return typeof thought.courseSlug === 'string' && thought.courseSlug.length > 0;
}

function compareCoursePosts(a: CourseSourcePost, b: CourseSourcePost): number {
  const aSectionOrder = a.courseSectionOrder ?? Number.MAX_SAFE_INTEGER;
  const bSectionOrder = b.courseSectionOrder ?? Number.MAX_SAFE_INTEGER;
  if (aSectionOrder !== bSectionOrder) return aSectionOrder - bSectionOrder;

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
    const level = slug.includes('101') ? 'BEGINNER TO INTERMEDIATE' : 'INTERMEDIATE';
    const courseTag = courseMeta?.tag || 'COMPILERS';

    const sectionMap = new Map<
      string,
      {
        title: string;
        order: number;
        description?: string;
        posts: CourseSourcePost[];
      }
    >();

    for (const post of sortedPosts) {
      const sectionKeyRaw = post.courseSectionSegment ? `${slug}/${post.courseSectionSegment}` : undefined;
      const sectionMeta = sectionKeyRaw ? sectionMetaByKey.get(sectionKeyRaw) : undefined;
      const sectionTitle = sectionMeta?.title || post.courseSectionTitle || 'Course';
      const sectionOrder = post.courseSectionOrder ?? 999;
      const sectionKey = `${String(sectionOrder).padStart(3, '0')}:${sectionTitle}`;
      const existing = sectionMap.get(sectionKey);

      if (existing) {
        existing.posts.push(post);
      } else {
        sectionMap.set(sectionKey, {
          title: sectionTitle,
          order: sectionOrder,
          description: sectionMeta?.description,
          posts: [post]
        });
      }
    }

    let globalPart = 0;
    const sections: CourseSection[] = Array.from(sectionMap.values())
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map((section, sectionIndex) => {
        const sectionPosts = [...section.posts]
          .sort(compareCoursePosts)
          .map((post, index) => {
            globalPart += 1;
            return {
              ...post,
              part: globalPart,
              partInSection: index + 1,
              sectionIndex: sectionIndex + 1,
              sectionTitle: section.title,
              chapterTitle: post.courseChapterTitle
            };
          });

        const sectionWordCount = sectionPosts.reduce((sum, post) => sum + post.readWordCount, 0);
        const sectionReadMinutes = Math.max(1, Math.ceil(sectionWordCount / 225));

        return {
          index: sectionIndex + 1,
          title: section.title,
          description: section.description,
          posts: sectionPosts,
          postCount: sectionPosts.length,
          totalReadMinutes: sectionReadMinutes
        };
      });

    const posts = sections.flatMap((section) => section.posts);
    const totalWordCount = posts.reduce((sum, post) => sum + post.readWordCount, 0);
    const totalReadMinutes = Math.max(1, Math.ceil(totalWordCount / 225));
    const description =
      courseMeta?.description ||
      `A structured track with ${posts.length} lessons across ${sections.length} sections.`;

    return {
      slug,
      title,
      description,
      level: courseMeta?.level || level,
      tag: courseTag,
      sections,
      posts,
      postCount: posts.length,
      totalReadMinutes
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}