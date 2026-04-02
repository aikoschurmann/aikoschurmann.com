import { error } from '@sveltejs/kit';
import { getCourseBySlug } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const course = getCourseBySlug(params.slug);
  if (!course) {
    throw error(404, 'Course not found');
  }

  return { course };
};
